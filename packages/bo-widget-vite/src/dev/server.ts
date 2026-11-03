import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { BoContext, BoCurrentUser, BoSettings } from '@vulog/bo-widget-sdk';
import type { WidgetManifest } from '@vulog/bo-widget-sdk/manifest';
import type { ViteDevServer } from 'vite';
import type { FakeBoConfig } from './host.js';
import type { FakeBoMode, WidgetDevOptions } from './options.js';

/** Path the fake back office is served on. */
export const FAKE_BO_PATH = '/__bo-widget/';

/** URL of the module that starts the fake back office in the page. */
export const FAKE_BO_MODULE_URL = `${FAKE_BO_PATH}fake-bo.js`;

/** Path of the local Vulog API: `baseUrl` of `getApiInfo` in the fake back office. */
export const FAKE_API_PATH = `${FAKE_BO_PATH}api/boapi/proxy/`;

/** Client segment of the fake back office in the tag hash (the real back office uses the client namespace). */
const DEV_CLIENT = 'dev';

/** Settings of the token mode, read from the environment (`.env.local` or the shell). */
export interface TokenModeEnv {
  token: string;
  apiUrl: string;
  apiKey: string;
}

/**
 * Tag of a widget as the back office computes it: `widget-` and the first 12 hex characters of
 * `sha256("{client}/{widgetId}@{version}")`.
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

/**
 * Picks the mode of the fake back office and, in token mode, checks its environment.
 *
 * @param env - Variables prefixed with `BO_WIDGET_`.
 * @throws {Error} In token mode, when `BO_WIDGET_TOKEN`, `BO_WIDGET_API_URL` or
 * `BO_WIDGET_API_KEY` is missing, or `BO_WIDGET_API_URL` is not an http(s) URL.
 */
export const resolveDevMode = (
  requested: FakeBoMode | undefined,
  env: Record<string, string | undefined>,
): { mode: 'mock' } | { mode: 'token'; env: TokenModeEnv } => {
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
  const apiUrl = env.BO_WIDGET_API_URL as string;
  let protocol: string;
  try {
    protocol = new URL(apiUrl).protocol;
  } catch {
    protocol = '';
  }
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`Fake back office: BO_WIDGET_API_URL must be an http(s) URL`);
  }
  return {
    mode,
    env: {
      token: env.BO_WIDGET_TOKEN as string,
      apiUrl: apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`,
      apiKey: env.BO_WIDGET_API_KEY as string,
    },
  };
};

const DEV_FLEET = 'DEV-FLEET';

/** Builds what the page of the fake back office receives. */
export const fakeBoConfig = (
  manifest: WidgetManifest,
  dev: WidgetDevOptions,
  resolved: ReturnType<typeof resolveDevMode>,
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

/** Source of the module that starts the fake back office. */
export const fakeBoModule = (
  hostModule: string,
  config: FakeBoConfig,
  entry: string | null,
): string =>
  [
    `import { startFakeBo } from ${JSON.stringify(hostModule)};`,
    entry ? `import Widget from ${JSON.stringify(entry)};` : '',
    `startFakeBo(${JSON.stringify(config)}${entry ? ', Widget' : ''});`,
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

// Hop-by-hop headers, and those `fetch` recomputes or that make no sense upstream.
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
// `fetch` already decoded the body, so its encoding and length no longer apply.
const SKIPPED_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-encoding',
  'content-length',
]);

/**
 * Forwards a call of the local API to the real Vulog API, adding `Authorization: Bearer` when the
 * widget did not, as the back office service worker does for a Web Component.
 */
const proxyToApi = async (
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  search: string,
  env: TokenModeEnv,
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
    sendJson(res, 502, {
      error: 'proxy-failed',
      message: `Cannot reach ${target.origin}: ${(error as Error).message}`,
    });
    return;
  }
  res.statusCode = response.status;
  response.headers.forEach((value, name) => {
    if (!SKIPPED_RESPONSE_HEADERS.has(name)) res.setHeader(name, value);
  });
  if (!response.body) {
    res.end();
    return;
  }
  Readable.fromWeb(response.body as never).pipe(res);
};

/** Answers a call of the local API with the `responses` of the mock mode. */
const answerMock = (
  res: ServerResponse,
  method: string,
  path: string,
  responses: Record<string, unknown>,
): void => {
  const key = `${method} ${path}`;
  if (Object.hasOwn(responses, key)) {
    sendJson(res, 200, responses[key]);
    return;
  }
  sendJson(res, 404, {
    error: 'mock-not-found',
    message: `Fake back office (mock mode): no response for "${key}". Add it to dev.responses in the widget configuration.`,
  });
};

/** What {@link installFakeBo} needs. */
export interface FakeBoServerOptions {
  runtime: 'webcomponent' | 'iframe';
  responses: Record<string, unknown>;
  resolved: ReturnType<typeof resolveDevMode>;
}

/**
 * Serves the fake back office on {@link FAKE_BO_PATH} and the local Vulog API under
 * {@link FAKE_API_PATH}: mock responses, or the real API in token mode. As a Web Component, `/`
 * redirects to the fake back office; in an iframe, `/` stays the widget page it displays.
 */
export const installFakeBo = (server: ViteDevServer, options: FakeBoServerOptions): void => {
  const { logger } = server.config;
  const host = server.config.server.host;
  if (
    options.resolved.mode === 'token' &&
    (host === true ||
      (typeof host === 'string' && !['localhost', '127.0.0.1', '::1'].includes(host)))
  ) {
    logger.warn(
      'Fake back office in token mode with server.host set: anyone on the network can call the Vulog API with your token through this server.',
    );
  }

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
    const path = decodeURIComponent(pathname.slice(FAKE_API_PATH.length));
    if (options.resolved.mode === 'mock') {
      answerMock(res, req.method ?? 'GET', path, options.responses);
      return;
    }
    proxyToApi(
      req,
      res,
      pathname.slice(FAKE_API_PATH.length),
      url.search,
      options.resolved.env,
    ).catch(next);
  });

  const printUrls = server.printUrls.bind(server);
  server.printUrls = () => {
    printUrls();
    const base = server.resolvedUrls?.local[0] ?? '/';
    logger.info(
      `  ➜  Fake back office (${options.resolved.mode} mode): ${new URL(FAKE_BO_PATH, base).href}`,
    );
  };
};
