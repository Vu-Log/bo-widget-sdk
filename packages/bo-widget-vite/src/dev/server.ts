import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { BoContext, BoCurrentUser, BoSettings } from '@vulog/bo-widget-sdk';
import type { WidgetManifest } from '@vulog/bo-widget-sdk/manifest';
import type { Logger, ViteDevServer } from 'vite';
import type { FakeBoConfig } from './host.js';
import type { FakeBoMode, WidgetDevOptions } from './options.js';

/** Path the fake back office is served on. */
export const FAKE_BO_PATH = '/__bo-widget/';

/** URL of the module that starts the fake back office in the page. */
export const FAKE_BO_MODULE_URL = `${FAKE_BO_PATH}fake-bo.js`;

/** Path of the local Vulog API: `baseUrl` of `getApiInfo` in the fake back office. */
export const FAKE_API_PATH = `${FAKE_BO_PATH}api/boapi/proxy/`;

/** Publisher segment of the fake back office in the tag hash (the back office uses the publisher's namespace). */
const DEV_CLIENT = 'dev';

/** Settings of the token mode, read from the Vite env files or the shell. */
export interface TokenModeEnv {
  /** The access token, without `Bearer ` prefix. */
  readonly token: string;
  /** Canonical `URL.href` of the API base URL, ending with `/`, without query nor hash. */
  readonly apiUrl: string;
  readonly apiKey: string;
}

/** Mode of the fake back office, with the environment of the token mode. */
export type ResolvedDevMode =
  { readonly mode: 'mock' } | { readonly mode: 'token'; readonly env: TokenModeEnv };

/**
 * Tag of a widget as the back office computes it: `widget-` and the first 12 hex characters of
 * `sha256("{publisher}/{widgetId}@{version}")`.
 */
export const widgetTag = (client: string, id: string, version: string): string =>
  `widget-${createHash('sha256').update(`${client}/${id}@${version}`).digest('hex').slice(0, 12)}`;

/** Expiry of a JWT (`exp` × 1000), `null` when the token is not a readable JWT or has no `exp`. */
export const jwtExpiresAt = (token: string): number | null => {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: unknown;
    };
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
};

/** Parses `BO_WIDGET_API_URL` into its canonical form, the prefix every proxied URL must start with. */
const canonicalApiUrl = (value: string): string => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Fake back office: BO_WIDGET_API_URL is not a valid URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(
      `Fake back office: BO_WIDGET_API_URL must be an http(s) URL, not ${url.protocol}`,
    );
  }
  if (url.search || url.hash) {
    throw new Error('Fake back office: BO_WIDGET_API_URL must have no query nor hash');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
};

/**
 * Picks the mode of the fake back office and, in token mode, checks its environment.
 *
 * @param requested - `dev.mode` of the widget configuration, if any.
 * @param env - Variables prefixed with `BO_WIDGET_`.
 * @returns `mock`, or `token` with the token (without `Bearer ` prefix), the canonical API base
 * URL and the API key.
 * @throws {Error} For an unknown `dev.mode`, and in token mode when `BO_WIDGET_TOKEN`,
 * `BO_WIDGET_API_URL` or `BO_WIDGET_API_KEY` is missing, or `BO_WIDGET_API_URL` is not an http(s)
 * URL without query nor hash.
 */
export const resolveDevMode = (
  requested: FakeBoMode | undefined,
  env: Record<string, string | undefined>,
): ResolvedDevMode => {
  const mode = requested ?? (env.BO_WIDGET_TOKEN ? 'token' : 'mock');
  if (mode === 'mock') return { mode };
  if (mode !== 'token') throw new Error(`Fake back office: unknown dev.mode "${String(mode)}"`);
  const missing = ['BO_WIDGET_TOKEN', 'BO_WIDGET_API_URL', 'BO_WIDGET_API_KEY'].filter(
    (name) => !env[name],
  );
  if (missing.length > 0) {
    throw new Error(
      `Fake back office in token mode: set ${missing.join(', ')} (in .env.local or the shell). ` +
        'Copy the token, the API base URL and the API key from the back office of a dev environment.',
    );
  }
  return {
    mode,
    env: {
      token: (env.BO_WIDGET_TOKEN as string).trim().replace(/^Bearer\s+/i, ''),
      apiUrl: canonicalApiUrl(env.BO_WIDGET_API_URL as string),
      apiKey: env.BO_WIDGET_API_KEY as string,
    },
  };
};

/**
 * Problems of a token-mode token worth telling at startup: not a readable JWT (its expiry is then
 * unknown), or already expired.
 */
export const tokenWarnings = (token: string, now = Date.now()): string[] => {
  const expiresAt = jwtExpiresAt(token);
  if (expiresAt === null) {
    return ['BO_WIDGET_TOKEN is not a JWT with an expiry: check that it was pasted whole.'];
  }
  if (expiresAt <= now) {
    return [
      `BO_WIDGET_TOKEN expired at ${new Date(expiresAt).toISOString()}: paste a new one and restart vite.`,
    ];
  }
  return [];
};

const DEV_FLEET = 'DEV-FLEET';

/** Builds what the page of the fake back office receives. */
export const fakeBoConfig = (
  manifest: WidgetManifest,
  dev: WidgetDevOptions,
  resolved: ResolvedDevMode,
): FakeBoConfig => {
  const context: BoContext = {
    fleetId: DEV_FLEET,
    host: 'localhost',
    locale: 'en',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    boVersion: manifest.protocol.minBoVersion ?? '1.86.0',
    basename: `/widgets/${manifest.id}`,
    ...dev.context,
  };
  const user: BoCurrentUser = {
    id: 'dev-user',
    userName: 'dev',
    firstName: 'Dev',
    lastName: 'User',
    fullName: 'Dev User',
    email: 'dev@example.com',
    currentFleetId: context.fleetId,
    originalFleetId: context.fleetId,
    roles: ['manager'],
    fleets: context.fleetId ? [{ fleetId: context.fleetId, profile: 'manager' }] : [],
    isFranchiseOperator: false,
    ...dev.user,
  };
  const defaults: BoSettings = Object.fromEntries(
    manifest.settings
      .filter((setting) => setting.default !== undefined)
      .map((setting) => [setting.key, setting.default]),
  );
  const token = resolved.mode === 'token' ? resolved.env.token : 'mock-access-token';
  return {
    mode: resolved.mode,
    runtime: manifest.runtime.type,
    protocolVersion: manifest.protocol.version,
    widget: {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      permissions: [...manifest.permissions],
    },
    tag: widgetTag(DEV_CLIENT, manifest.id, manifest.version),
    widgetUrl: '/',
    context,
    user,
    settings: { ...defaults, ...dev.settings },
    apiPath: FAKE_API_PATH,
    apiKey: resolved.mode === 'token' ? resolved.env.apiKey : 'mock-api-key',
    accessToken: token,
    expiresAt: resolved.mode === 'token' ? jwtExpiresAt(token) : null,
  };
};

/**
 * Source of the module that starts the fake back office. The widget entry is imported lazily, so
 * that the page is up to show an error thrown while the entry loads.
 */
export const fakeBoModule = (
  hostModule: string,
  config: FakeBoConfig,
  entry: string | null,
): string =>
  [
    `import { startFakeBo } from ${JSON.stringify(hostModule)};`,
    `startFakeBo(${JSON.stringify(config)}${entry ? `, () => import(${JSON.stringify(entry)})` : ''});`,
  ].join('\n');

const FAKE_BO_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fake back office</title>
  </head>
  <body>
    <script type="module" src="${FAKE_BO_MODULE_URL}"></script>
  </body>
</html>
`;

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

// Hop-by-hop headers, those `fetch` recomputes, and the browser's own (cookies, origin) that must
// not leak from localhost to the API.
const SKIPPED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-length',
  'accept-encoding',
  'origin',
  'referer',
  'cookie',
]);
// `fetch` already decoded the body, so its encoding and length no longer apply; the API's CORS
// headers would let any page read what it answers through this server; cookies are set one by one.
const isSkippedResponseHeader = (name: string): boolean =>
  [
    'connection',
    'keep-alive',
    'transfer-encoding',
    'content-encoding',
    'content-length',
    'set-cookie',
  ].includes(name) || name.startsWith('access-control-');

/**
 * True when the call comes from a page of another origin: the proxy adds the developer's token, so
 * only the fake back office and the widget page, both served by this server, may use it.
 */
const isCrossSite = (req: IncomingMessage): boolean => {
  const site = req.headers['sec-fetch-site'];
  if (site !== undefined && site !== 'same-origin' && site !== 'none') return true;
  const { origin, host } = req.headers;
  if (origin === undefined) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
};

/** The reason behind a `fetch` failure: Node puts it in `cause` (`ECONNREFUSED`, `ENOTFOUND`…). */
const fetchFailure = (error: unknown): string => {
  const cause = (error as { cause?: { code?: unknown; message?: unknown } }).cause;
  if (typeof cause?.code === 'string') return cause.code;
  if (typeof cause?.message === 'string') return cause.message;
  return (error as Error).message;
};

/**
 * Forwards a call of the local API to the real Vulog API, adding `Authorization: Bearer` when the
 * widget did not, as the back office service worker does for a Web Component. Answers itself
 * `400 outside-api` for a path that leaves the API base URL, and `502 proxy-failed` when the API
 * cannot be reached; a response that breaks while streaming closes the connection, with a log.
 */
const proxyToApi = async (
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  search: string,
  env: TokenModeEnv,
  logger: Logger,
): Promise<void> => {
  const target = new URL(`${path}${search}`, env.apiUrl);
  if (!target.href.startsWith(env.apiUrl)) {
    sendJson(res, 400, { error: 'outside-api', message: `${path} is outside the API base URL` });
    return;
  }
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined || SKIPPED_REQUEST_HEADERS.has(name)) continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  if (!headers.has('authorization')) headers.set('authorization', `Bearer ${env.token}`);
  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  let response: Response;
  try {
    response = await fetch(target, {
      method,
      headers,
      redirect: 'manual',
      ...(hasBody ? { body: Readable.toWeb(req) as ReadableStream, duplex: 'half' } : {}),
    } as RequestInit);
  } catch (error) {
    const reason = fetchFailure(error);
    logger.error(
      `[bo-widget] ${method} ${target.pathname}: cannot reach ${target.origin} (${reason}). Check BO_WIDGET_API_URL and your network.`,
    );
    sendJson(res, 502, {
      error: 'proxy-failed',
      message: `Cannot reach ${target.origin}: ${reason}`,
    });
    return;
  }
  if (response.status === 401) {
    logger.warn(
      `[bo-widget] ${method} ${target.pathname}: 401 from the API. Has BO_WIDGET_TOKEN expired? Paste a new one and restart vite.`,
    );
  } else if (response.status >= 300 && response.status < 400) {
    logger.warn(
      `[bo-widget] ${method} ${target.pathname}: the API redirects (${response.status}); the browser leaves the proxy to follow it.`,
    );
  }
  res.statusCode = response.status;
  response.headers.forEach((value, name) => {
    if (!isSkippedResponseHeader(name)) res.setHeader(name, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) res.setHeader('set-cookie', cookies);
  if (!response.body) {
    res.end();
    return;
  }
  try {
    await pipeline(Readable.fromWeb(response.body as never), res);
  } catch (error) {
    // The browser left (tab closed, reload) or the API connection broke: nothing more to send.
    if (
      !res.writableFinished &&
      (error as { code?: unknown }).code !== 'ERR_STREAM_PREMATURE_CLOSE'
    ) {
      logger.error(
        `[bo-widget] ${method} ${target.pathname}: the API response broke off (${fetchFailure(error)}).`,
      );
    }
    res.destroy();
  }
};

/** What {@link installFakeBo} needs. */
export interface FakeBoServerOptions {
  readonly runtime: WidgetManifest['runtime']['type'];
  /** `dev.responses`, answered in mock mode only. */
  readonly responses: Readonly<Record<string, unknown>>;
  readonly resolved: ResolvedDevMode;
}

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1'];

/**
 * Serves the fake back office on {@link FAKE_BO_PATH} and the local Vulog API under
 * {@link FAKE_API_PATH}: mock responses, or the real API in token mode. As a Web Component, `/`
 * redirects to the fake back office; in an iframe, `/` stays the widget page it displays.
 */
export const installFakeBo = (server: ViteDevServer, options: FakeBoServerOptions): void => {
  const { logger } = server.config;
  const { resolved } = options;
  const host = server.config.server.host;
  if (resolved.mode === 'token') {
    for (const warning of tokenWarnings(resolved.env.token)) logger.warn(`[bo-widget] ${warning}`);
    if (Object.keys(options.responses).length > 0) {
      logger.warn('[bo-widget] Token mode: dev.responses are ignored, the calls go to the API.');
    }
    if (host === true || (typeof host === 'string' && !LOOPBACK_HOSTS.includes(host))) {
      logger.warn(
        '[bo-widget] Fake back office in token mode with server.host set: anyone on the network can call the Vulog API with your token through this server.',
      );
    }
  }
  const missedMocks = new Set<string>();

  const answerMock = (res: ServerResponse, method: string, path: string): void => {
    const key = `${method} ${path}`;
    if (Object.hasOwn(options.responses, key)) {
      sendJson(res, 200, options.responses[key]);
      return;
    }
    if (!missedMocks.has(key)) {
      missedMocks.add(key);
      const known = Object.keys(options.responses);
      logger.warn(
        `[bo-widget] Mock mode: no response for "${key}"${known.length > 0 && known.length <= 10 ? ` (known: ${known.join(', ')})` : ''}.`,
      );
    }
    sendJson(res, 404, {
      error: 'mock-not-found',
      message: `Fake back office (mock mode): no response for "${key}". Add it to dev.responses in the widget configuration.`,
    });
  };

  server.middlewares.use((req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const { pathname } = url;
    if (options.runtime === 'webcomponent' && (pathname === '/' || pathname === '/index.html')) {
      res.statusCode = 302;
      res.setHeader('Location', FAKE_BO_PATH);
      res.end();
      return;
    }
    if (pathname === FAKE_BO_PATH || pathname === FAKE_BO_PATH.slice(0, -1)) {
      server
        .transformIndexHtml(FAKE_BO_PATH, FAKE_BO_HTML)
        .then((html) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        })
        .catch(next);
      return;
    }
    if (!pathname.startsWith(FAKE_API_PATH)) {
      next();
      return;
    }
    if (isCrossSite(req)) {
      sendJson(res, 403, {
        error: 'cross-site',
        message: 'The local Vulog API only answers the pages of this dev server.',
      });
      return;
    }
    const rawPath = pathname.slice(FAKE_API_PATH.length);
    if (resolved.mode === 'token') {
      proxyToApi(req, res, rawPath, url.search, resolved.env, logger).catch(next);
      return;
    }
    let path: string;
    try {
      path = decodeURIComponent(rawPath);
    } catch {
      sendJson(res, 400, { error: 'malformed-path', message: `Malformed path: ${rawPath}` });
      return;
    }
    answerMock(res, req.method ?? 'GET', path);
  });

  const printUrls = server.printUrls.bind(server);
  server.printUrls = () => {
    printUrls();
    // With a specific `server.host`, Vite lists the URL under `network` only.
    const base = server.resolvedUrls?.local[0] ?? server.resolvedUrls?.network[0];
    const where = base ? new URL(FAKE_BO_PATH, base).href : FAKE_BO_PATH;
    logger.info(`  ➜  Fake back office (${resolved.mode} mode): ${where}`);
  };
};
