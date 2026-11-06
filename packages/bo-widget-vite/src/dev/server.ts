import { createHash } from 'node:crypto';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { BoContext, BoCurrentUser, BoSettings } from '@vulog/bo-widget-sdk';
import type { WidgetManifest } from '@vulog/bo-widget-sdk/manifest';
import type { Logger, ViteDevServer } from 'vite';
import { fetchBoApi, fetchFailure, fetchFailureCode, parseBoHost } from './boConf.js';
import type { FakeBoConfig } from './host.js';
import type { FakeBoMode, WidgetDevOptions } from './options.js';

/**
 * Default `basename` of the fake back office: the path of its page, so that a router with this
 * basename matches the page URL, and its sub-routes are served on reload.
 */
export const FAKE_BO_BASENAME = '/__bo-widget';

/** Path the fake back office is served on. */
export const FAKE_BO_PATH = `${FAKE_BO_BASENAME}/`;

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
  /**
   * `BO_WIDGET_HOST`, when the API URL and key come from the conf of that back office: the logs
   * then name the host instead of these values.
   */
  readonly host?: string;
}

/** Mode of the fake back office, with the environment of the token mode. */
export type ResolvedDevMode =
  | {
      readonly mode: 'mock';
      /** `BO_WIDGET_HOST`, if set, for `getContext().host`. */
      readonly host?: string;
    }
  | { readonly mode: 'token'; readonly env: TokenModeEnv };

/** Dependencies of {@link resolveDevMode}. */
export interface ResolveDevModeOptions {
  /** `fetch`, replaced in tests. */
  readonly fetch?: typeof fetch;
  /** Logs a warning in the terminal; warnings are dropped when it is omitted. */
  readonly warn?: (message: string) => void;
  /**
   * Never calls the network (tests): the mode and `BO_WIDGET_HOST` are still checked and the host
   * kept, but token mode falls back to mock mode, with a warning.
   */
  readonly offline?: boolean;
}

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
    throw new Error(`Fake back office: BO_WIDGET_API_URL is not a valid URL: "${value}"`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(
      `Fake back office: BO_WIDGET_API_URL must be an http(s) URL, not ${url.protocol}`,
    );
  }
  if (url.username || url.password) {
    throw new Error('Fake back office: BO_WIDGET_API_URL must not contain credentials');
  }
  if (url.search || url.hash) {
    throw new Error('Fake back office: BO_WIDGET_API_URL must have no query nor hash');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
};

/** Token-mode environment of `BO_WIDGET_HOST`: the API base URL and key from its conf. */
const hostTokenEnv = async (
  host: string,
  token: string,
  env: Record<string, string | undefined>,
  options: ResolveDevModeOptions,
): Promise<TokenModeEnv> => {
  if (!token) {
    throw new Error(
      'Fake back office in token mode: set BO_WIDGET_TOKEN (in .env.local, the shell or with bo-widget dev --token -). Copy it from the back office of BO_WIDGET_HOST.',
    );
  }
  const overridden = ['BO_WIDGET_API_URL', 'BO_WIDGET_API_KEY'].filter((name) => env[name]?.trim());
  if (overridden.length > 0) {
    options.warn?.(
      `[bo-widget] ${overridden.join(' and ')} ignored: BO_WIDGET_HOST is set, the API URL and key come from the conf of ${host}.`,
    );
  }
  const { apiUrl, apiKey } = await fetchBoApi(host, options.fetch);
  return { token, apiUrl, apiKey, host };
};

/**
 * Picks the mode of the fake back office and, in token mode, checks its environment.
 *
 * In token mode with `BO_WIDGET_HOST`, the API base URL and key come from the anonymous conf of
 * that back office (see {@link fetchBoApi}), over `BO_WIDGET_API_URL` and `BO_WIDGET_API_KEY`
 * (a warning tells when they are set too). In mock mode, `BO_WIDGET_HOST` only sets the host of
 * the context, without any call.
 *
 * @param requested - `dev.mode` of the widget configuration, if any.
 * @param env - Variables prefixed with `BO_WIDGET_`.
 * @param options - `fetch` and the warning logger.
 * @returns `mock` (with the host, if any), or `token` with the token (without `Bearer ` prefix),
 * the canonical API base URL, the API key and the host, if any. Always `mock` with `offline`.
 * @throws {Error} For an unknown `dev.mode` or an invalid `BO_WIDGET_HOST`; in token mode when
 * `BO_WIDGET_TOKEN` is missing; with `BO_WIDGET_HOST`, when the conf cannot be read or lacks a
 * field; without it, when `BO_WIDGET_API_URL` or `BO_WIDGET_API_KEY` is missing, or
 * `BO_WIDGET_API_URL` is not an http(s) URL without credentials, query nor hash.
 */
export const resolveDevMode = async (
  requested: FakeBoMode | undefined,
  env: Record<string, string | undefined>,
  options: ResolveDevModeOptions = {},
): Promise<ResolvedDevMode> => {
  const mode = requested ?? (env.BO_WIDGET_TOKEN ? 'token' : 'mock');
  if (mode !== 'mock' && mode !== 'token') {
    throw new Error(`Fake back office: unknown dev.mode "${String(mode)}"`);
  }
  const rawHost = (env.BO_WIDGET_HOST ?? '').trim();
  const host = rawHost ? parseBoHost(rawHost) : undefined;
  if (mode === 'token' && options.offline) {
    options.warn?.(
      '[bo-widget] Test mode: the fake back office stays in mock mode, without token mode nor any call to a back office conf.',
    );
  }
  if (mode === 'mock' || options.offline) return host ? { mode: 'mock', host } : { mode: 'mock' };
  const token = (env.BO_WIDGET_TOKEN ?? '').trim().replace(/^Bearer(?:\s+|$)/i, '');
  if (host) return { mode, env: await hostTokenEnv(host, token, env, options) };
  const apiKey = (env.BO_WIDGET_API_KEY ?? '').trim();
  const apiUrl = (env.BO_WIDGET_API_URL ?? '').trim();
  const values: Record<string, string> = {
    BO_WIDGET_TOKEN: token,
    BO_WIDGET_API_URL: apiUrl,
    BO_WIDGET_API_KEY: apiKey,
  };
  const missing = Object.keys(values).filter((name) => !values[name]);
  if (missing.length > 0) {
    throw new Error(
      `Fake back office in token mode: set ${missing.join(', ')} (in .env.local or the shell). ` +
        'Copy the token, the API base URL and the API key from the back office of a dev environment.',
    );
  }
  return {
    mode,
    env: { token, apiUrl: canonicalApiUrl(apiUrl), apiKey },
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
  const host = resolved.mode === 'token' ? resolved.env.host : resolved.host;
  const context: BoContext = {
    fleetId: DEV_FLEET,
    host: host ?? 'localhost',
    locale: 'en_GB',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    boVersion: manifest.protocol.minBoVersion ?? '1.86.0',
    basename: FAKE_BO_BASENAME,
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
    `startFakeBo(${JSON.stringify(config)}${entry ? `, () => import(${JSON.stringify(entry)})` : ''}).catch((error) => {`,
    '  console.error(error);',
    '  document.body.textContent = `Fake back office failed to start: ${error}`;',
    '});',
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
    'proxy-connection',
    'upgrade',
    'transfer-encoding',
    'content-encoding',
    'content-length',
    'set-cookie',
  ].includes(name) || name.startsWith('access-control-');

/**
 * True when the call comes from a page of another origin: the proxy adds the developer's token, so
 * only the fake back office and the widget page, both served by this server, may use it.
 */
export const isCrossSite = (req: Pick<IncomingMessage, 'headers'>): boolean => {
  // Set by every current browser, and not settable by a page.
  const site = req.headers['sec-fetch-site'];
  if (site !== undefined) return site !== 'same-origin' && site !== 'none';
  const { origin } = req.headers;
  // HTTP/2 (`server.https`) has no `Host` header, only `:authority`.
  const host = req.headers.host ?? req.headers[':authority'];
  if (origin === undefined) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
};

/**
 * Headers of a call forwarded to the API: the browser's, without hop-by-hop ones, cookies, origin
 * nor HTTP/2 pseudo-headers (`:method`, `:path`…), with `Authorization: Bearer` when absent.
 */
export const forwardedHeaders = (incoming: IncomingHttpHeaders, token: string): Headers => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming)) {
    if (value === undefined || name.startsWith(':') || SKIPPED_REQUEST_HEADERS.has(name)) continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  if (!headers.has('authorization')) headers.set('authorization', `Bearer ${token}`);
  return headers;
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
  warnOnce: (key: string, message: string) => void,
): Promise<void> => {
  const target = new URL(`${path}${search}`, env.apiUrl);
  // With BO_WIDGET_HOST, the API origin comes from the conf of the back office: name the host.
  const api = env.host ? `the API of ${env.host}` : 'BO_WIDGET_API_URL';
  if (!target.href.startsWith(env.apiUrl)) {
    warnOnce(`outside ${path}`, `[bo-widget] ${path} is outside ${api}: not forwarded.`);
    sendJson(res, 400, { error: 'outside-api', message: `${path} is outside the API base URL` });
    return;
  }
  const headers = forwardedHeaders(req.headers, env.token);
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
    // The browser gave up its upload: there is nobody to answer.
    if (req.destroyed) {
      res.destroy();
      return;
    }
    // With BO_WIDGET_HOST, only the code: the message of a failure may name the API origin.
    const reason = env.host ? fetchFailureCode(error) : fetchFailure(error);
    const where = env.host ? `the API of ${env.host}` : target.origin;
    logger.error(
      `[bo-widget] ${method} ${target.pathname}: cannot reach ${where} (${reason}). Check ${env.host ? 'BO_WIDGET_HOST' : 'BO_WIDGET_API_URL'} and your network.`,
    );
    sendJson(res, 502, {
      error: 'proxy-failed',
      message: `Cannot reach ${where}: ${reason}`,
    });
    return;
  }
  if (response.status === 401) {
    warnOnce(
      '401',
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
        `[bo-widget] ${method} ${target.pathname}: the API response broke off (${env.host ? fetchFailureCode(error) : fetchFailure(error)}).`,
      );
    }
    res.destroy();
  }
};

/**
 * True for a request of the fake back office page: its path, or a page request (`GET` or `HEAD`
 * accepting HTML) of a sub-route, which a widget router reloads. Its module and the local API are
 * not pages.
 */
export const isFakeBoPage = (
  req: Pick<IncomingMessage, 'method' | 'headers'>,
  pathname: string,
): boolean => {
  if (pathname === FAKE_BO_PATH || pathname === FAKE_BO_BASENAME) return true;
  if (!pathname.startsWith(FAKE_BO_PATH) || pathname === FAKE_BO_MODULE_URL) return false;
  if (pathname.startsWith(FAKE_API_PATH)) return false;
  const method = req.method ?? 'GET';
  return (
    (method === 'GET' || method === 'HEAD') && (req.headers.accept ?? '').includes('text/html')
  );
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
 * Serves the fake back office on {@link FAKE_BO_PATH} and its sub-routes, and the local Vulog API
 * under {@link FAKE_API_PATH}: mock responses, or the real API in token mode. As a Web Component, `/`
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
    if (server.config.server.allowedHosts === true) {
      logger.warn(
        '[bo-widget] Fake back office in token mode with server.allowedHosts: true: a page that rebinds its domain to this machine (DNS rebinding) can call the Vulog API with your token through this server.',
      );
    }
  }
  const warned = new Set<string>();
  /** Logs a warning the first time only, so that a polling widget does not flood the terminal. */
  const warnOnce = (key: string, message: string): void => {
    if (warned.has(key)) return;
    warned.add(key);
    logger.warn(message);
  };

  const answerMock = (res: ServerResponse, method: string, path: string): void => {
    const key = `${method} ${path}`;
    if (Object.hasOwn(options.responses, key)) {
      sendJson(res, 200, options.responses[key]);
      return;
    }
    const known = Object.keys(options.responses);
    warnOnce(
      `mock ${key}`,
      `[bo-widget] Mock mode: no response for "${key}"${known.length > 0 && known.length <= 10 ? ` (known: ${known.join(', ')})` : ''}.`,
    );
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
    if (isFakeBoPage(req, pathname)) {
      server
        .transformIndexHtml(pathname, FAKE_BO_HTML)
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
      const from = req.headers.origin ?? req.headers['sec-fetch-site'] ?? 'unknown';
      warnOnce(
        `cross-site ${String(from)}`,
        `[bo-widget] Refused a call of the local Vulog API from another origin (${String(from)}).`,
      );
      sendJson(res, 403, {
        error: 'cross-site',
        message: 'The local Vulog API only answers the pages of this dev server.',
      });
      return;
    }
    const rawPath = pathname.slice(FAKE_API_PATH.length);
    if (resolved.mode === 'token') {
      proxyToApi(req, res, rawPath, url.search, resolved.env, logger, warnOnce).catch(next);
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
    const api =
      resolved.mode === 'token' && resolved.env.host ? `, API of ${resolved.env.host}` : '';
    logger.info(`  ➜  Fake back office (${resolved.mode} mode${api}): ${where}`);
  };
};
