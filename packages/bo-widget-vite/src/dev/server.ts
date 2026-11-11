import { createHash } from 'node:crypto';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { BoContext, BoCurrentUser, BoSettings } from '@vulog/bo-widget-sdk';
import type { WidgetManifest } from '@vulog/bo-widget-sdk/manifest';
import type { Logger, ViteDevServer } from 'vite';
import { fetchBoApi, fetchFailure, fetchFailureCode, parseBoHost } from './boConf.js';
import { jwtExpiresAt } from './jwt.js';
import {
  WIDGET_LOG_EVENT,
  WIDGET_LOG_LEVELS,
  type FakeBoAuth,
  type FakeBoConfig,
  type WidgetLogEntry,
} from './host.js';
import type { TokenSource } from './login/session.js';
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

/**
 * Path the fake back office reads its token from, in token and login modes: the pasted token, or
 * the latest token of the session.
 */
export const FAKE_TOKEN_PATH = `${FAKE_BO_PATH}token`;

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

/**
 * Settings of the login mode: the API URL and key from the conf of `BO_WIDGET_HOST`; the token
 * comes from the session the user opens in the Chrome of login mode.
 */
export interface LoginModeEnv {
  /** Canonical `URL.href` of the API base URL, ending with `/`. */
  readonly apiUrl: string;
  readonly apiKey: string;
  /** `BO_WIDGET_HOST`, the back office the user logs in to. */
  readonly host: string;
}

/** Mode of the fake back office, with the environment of the token or login mode. */
export type ResolvedDevMode =
  | {
      readonly mode: 'mock';
      /** `BO_WIDGET_HOST`, if set, for `getContext().host`. */
      readonly host?: string;
    }
  | { readonly mode: 'token'; readonly env: TokenModeEnv }
  | { readonly mode: 'login'; readonly env: LoginModeEnv };

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
      'Fake back office in token mode: set BO_WIDGET_TOKEN (in .env.local, the shell or with bo-widget dev --token -), or log in with bo-widget dev --login. Copy it from the back office of BO_WIDGET_HOST.',
    );
  }
  const { apiUrl, apiKey } = await hostApi(host, env, options);
  return { token, apiUrl, apiKey, host };
};

/** API URL and key from the conf of `host`, with a warning when the API variables are set too. */
const hostApi = async (
  host: string,
  env: Record<string, string | undefined>,
  options: ResolveDevModeOptions,
): Promise<{ apiUrl: string; apiKey: string }> => {
  const overridden = ['BO_WIDGET_API_URL', 'BO_WIDGET_API_KEY'].filter((name) => env[name]?.trim());
  if (overridden.length > 0) {
    options.warn?.(
      `[bo-widget] ${overridden.join(' and ')} ignored: BO_WIDGET_HOST is set, the API URL and key come from the conf of ${host}.`,
    );
  }
  return fetchBoApi(host, options.fetch);
};

/** Login-mode environment: `BO_WIDGET_HOST` is required, `BO_WIDGET_TOKEN` ignored. */
const loginEnv = async (
  host: string | undefined,
  env: Record<string, string | undefined>,
  options: ResolveDevModeOptions,
): Promise<LoginModeEnv> => {
  if (!host) {
    throw new Error(
      'Fake back office in login mode: set BO_WIDGET_HOST (in .env.local or the shell) to the host of the back office to log in to, e.g. BO_WIDGET_HOST=bo.example.com.',
    );
  }
  if (env.BO_WIDGET_TOKEN?.trim()) {
    options.warn?.(
      '[bo-widget] BO_WIDGET_TOKEN ignored: in login mode, the token comes from your session in the Chrome of bo-widget.',
    );
  }
  const { apiUrl, apiKey } = await hostApi(host, env, options);
  return { apiUrl, apiKey, host };
};

/** Whether `BO_WIDGET_LOGIN` asks for login mode (`bo-widget dev --login` sets it to `1`). */
export const isLoginRequested = (env: Record<string, string | undefined>): boolean =>
  ['1', 'true'].includes((env.BO_WIDGET_LOGIN ?? '').trim().toLowerCase());

/**
 * Picks the mode of the fake back office and, in token mode, checks its environment.
 *
 * In token mode with `BO_WIDGET_HOST`, the API base URL and key come from the anonymous conf of
 * that back office (see {@link fetchBoApi}), over `BO_WIDGET_API_URL` and `BO_WIDGET_API_KEY`
 * (a warning tells when they are set too). In mock mode, `BO_WIDGET_HOST` only sets the host of
 * the context, without any call. `BO_WIDGET_LOGIN` (`bo-widget dev --login`) asks for login mode,
 * over `dev.mode` and `BO_WIDGET_TOKEN`: the API URL and key come from the conf of
 * `BO_WIDGET_HOST`, and the token from the session the user opens in Chrome.
 *
 * @param requested - `dev.mode` of the widget configuration, if any.
 * @param env - Variables prefixed with `BO_WIDGET_`.
 * @param options - `fetch` and the warning logger.
 * @returns `mock` (with the host, if any), `token` with the token (without `Bearer ` prefix),
 * the canonical API base URL, the API key and the host, if any, or `login` with the API base URL,
 * the API key and the host. Always `mock` with `offline`.
 * @throws {Error} For an unknown `dev.mode` or an invalid `BO_WIDGET_HOST`; in token mode when
 * `BO_WIDGET_TOKEN` is missing; in login mode when `BO_WIDGET_HOST` is missing; with `BO_WIDGET_HOST`, when the conf cannot be read or lacks a
 * field; without it, when `BO_WIDGET_API_URL` or `BO_WIDGET_API_KEY` is missing, or
 * `BO_WIDGET_API_URL` is not an http(s) URL without credentials, query nor hash.
 */
export const resolveDevMode = async (
  requested: FakeBoMode | undefined,
  env: Record<string, string | undefined>,
  options: ResolveDevModeOptions = {},
): Promise<ResolvedDevMode> => {
  if (requested !== undefined && requested !== 'mock' && requested !== 'token') {
    throw new Error(`Fake back office: unknown dev.mode "${String(requested)}"`);
  }
  const login = isLoginRequested(env);
  if (login && requested !== undefined) {
    options.warn?.(`[bo-widget] dev.mode "${requested}" ignored: bo-widget dev --login is used.`);
  }
  const mode = login ? 'login' : (requested ?? (env.BO_WIDGET_TOKEN ? 'token' : 'mock'));
  const rawHost = (env.BO_WIDGET_HOST ?? '').trim();
  const host = rawHost ? parseBoHost(rawHost) : undefined;
  if (mode !== 'mock' && options.offline) {
    options.warn?.(
      `[bo-widget] Test mode: the fake back office stays in mock mode, without ${mode} mode nor any call to a back office conf.`,
    );
  }
  if (mode === 'mock' || options.offline) return host ? { mode: 'mock', host } : { mode: 'mock' };
  if (mode === 'login') return { mode, env: await loginEnv(host, env, options) };
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
  const host = resolved.mode === 'mock' ? resolved.host : resolved.env.host;
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
    apiKey: resolved.mode === 'mock' ? 'mock-api-key' : resolved.env.apiKey,
    auth: pageAuth(resolved),
  };
};

/** Where the page of the fake back office gets its token from. */
const pageAuth = (resolved: ResolvedDevMode): FakeBoAuth => {
  switch (resolved.mode) {
    case 'mock':
      return { kind: 'mock' };
    case 'token':
    case 'login':
      // Never in the module of the page, which any page of localhost may read (CORS of Vite): the
      // page asks the dev server at each `getAccessToken`, which only answers its own pages.
      return { kind: 'server', tokenPath: FAKE_TOKEN_PATH };
  }
};

/**
 * Source of the module that starts the fake back office. The widget entry is imported lazily, so
 * that the page is up to show an error thrown while the entry loads. The widget logs are sent to
 * the dev server on the HMR channel, to show them in the terminal.
 */
export const fakeBoModule = (
  hostModule: string,
  config: FakeBoConfig,
  entry: string | null,
): string =>
  [
    `import { startFakeBo } from ${JSON.stringify(hostModule)};`,
    `const terminal = (entry) => import.meta.hot?.send(${JSON.stringify(WIDGET_LOG_EVENT)}, entry);`,
    `startFakeBo(${JSON.stringify(config)}, ${entry ? `() => import(${JSON.stringify(entry)})` : 'undefined'}, terminal).catch((error) => {`,
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

/** Longest widget log line printed in the terminal. */
export const MAX_TERMINAL_LOG_LENGTH = 4000;

/**
 * Control characters, ANSI escape sequences included: a widget must not drive the terminal
 * (colors, cursor moves, a fake prompt). Line feeds (`\n`) are kept; `\r` and tabs are removed.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f]/g;

/**
 * Prints a widget log the page sent on the HMR channel, as `[bo-widget] widget warn: …`, with the
 * logger of Vite: `warn` and `error` at their level, `debug` and `info` as `info`. A message that
 * is not a widget log (another page of localhost may send anything on the channel) is ignored.
 *
 * @param logger - Logger of the Vite dev server.
 * @param data - What the page sent.
 */
export const printWidgetLog = (logger: Logger, data: unknown): void => {
  if (typeof data !== 'object' || data === null) return;
  const { level, message, context } = data as Partial<WidgetLogEntry>;
  if (!WIDGET_LOG_LEVELS.includes(level as WidgetLogEntry['level'])) return;
  if (typeof message !== 'string') return;
  let details = '';
  if (context !== undefined) {
    try {
      details = ` ${JSON.stringify(context)}`;
    } catch {
      details = ' [context not serializable]';
    }
  }
  let line = `${message}${details}`.replace(CONTROL_CHARACTERS, '');
  if (line.length > MAX_TERMINAL_LOG_LENGTH)
    line = `${line.slice(0, MAX_TERMINAL_LOG_LENGTH - 1)}…`;
  const text = `[bo-widget] widget ${String(level)}: ${line}`;
  if (level === 'error') logger.error(text, { timestamp: true });
  else if (level === 'warn') logger.warn(text, { timestamp: true });
  else logger.info(text, { timestamp: true });
};

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
 * nor HTTP/2 pseudo-headers (`:method`, `:path`…), with `Authorization: Bearer` when absent and
 * a token is given.
 */
export const forwardedHeaders = (incoming: IncomingHttpHeaders, token: string | null): Headers => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming)) {
    if (value === undefined || name.startsWith(':') || SKIPPED_REQUEST_HEADERS.has(name)) continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  if (token !== null && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${token}`);
  }
  return headers;
};

/**
 * Forwards a call of the local API to the real Vulog API, adding `Authorization: Bearer` when the
 * widget did not, as the back office service worker does for a Web Component. Answers itself
 * `400 outside-api` for a path that leaves the API base URL, and `502 proxy-failed` when the API
 * cannot be reached; a response that breaks while streaming closes the connection, with a log.
 * In login mode, a call without `Authorization` while there is no session gets `401 no-token`
 * without reaching the API, and a `401` of the API makes the session forget its token.
 */
const proxyToApi = async (
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  search: string,
  auth: ProxyAuth,
  logger: Logger,
  warnOnce: (key: string, message: string) => void,
): Promise<void> => {
  const { env } = auth;
  const target = new URL(`${path}${search}`, env.apiUrl);
  // With BO_WIDGET_HOST, the API origin comes from the conf of the back office: name the host.
  const api = env.host ? `the API of ${env.host}` : 'BO_WIDGET_API_URL';
  if (!target.href.startsWith(env.apiUrl)) {
    warnOnce(`outside ${path}`, `[bo-widget] ${path} is outside ${api}: not forwarded.`);
    sendJson(res, 400, { error: 'outside-api', message: `${path} is outside the API base URL` });
    return;
  }
  const method = req.method ?? 'GET';
  const fromWidget = req.headers.authorization;
  let token: string | null = null;
  if (fromWidget === undefined) {
    token = auth.kind === 'static' ? auth.env.token : await auth.session.token();
  }
  if (auth.kind === 'session' && token === null && fromWidget === undefined) {
    sendJson(res, 401, {
      error: 'no-token',
      message: `No token: ${auth.session.noTokenReason()}.`,
    });
    return;
  }
  const headers = forwardedHeaders(req.headers, token);
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
  if (response.status === 401 && auth.kind === 'session') {
    const refused = token ?? bearerToken(fromWidget);
    if (refused === null) {
      warnOnce(
        '401 not bearer',
        `[bo-widget] ${method} ${target.pathname}: the API refused the Authorization header the widget sent (401), which is not a Bearer token.`,
      );
    } else {
      auth.session.invalidate(refused);
      // Once per refused token: the key is a digest, never logged.
      warnOnce(
        `401 ${createHash('sha256').update(refused).digest('hex')}`,
        `[bo-widget] ${method} ${target.pathname}: the API refused the token of your session (401). If it keeps failing, log out and in again in the Chrome of bo-widget.`,
      );
    }
  } else if (response.status === 401) {
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

/** A page request: `GET` or `HEAD` accepting HTML. */
const isPageRequest = (req: Pick<IncomingMessage, 'method' | 'headers'>): boolean => {
  const method = req.method ?? 'GET';
  return (
    (method === 'GET' || method === 'HEAD') && (req.headers.accept ?? '').includes('text/html')
  );
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
  return isPageRequest(req);
};

/** What {@link FAKE_TOKEN_PATH} answers from: the pasted token, or the session of login mode. */
type PageTokenSource = Pick<TokenSource, 'token' | 'noTokenReason'>;

/**
 * Token mode: the token pasted in `BO_WIDGET_TOKEN`, as long as it has not expired.
 *
 * @param token - `BO_WIDGET_TOKEN`.
 * @param now - Current time in ms; replaced in tests.
 * @returns A source that gives the token, or `null` once its `exp` has passed.
 */
export const pastedTokenSource = (token: string, now: () => number = Date.now): PageTokenSource => {
  const expiresAt = jwtExpiresAt(token);
  const expired = (): boolean => expiresAt !== null && expiresAt <= now();
  return {
    token: () => Promise.resolve(expired() ? null : token),
    noTokenReason: () =>
      expired()
        ? 'the dev token expired, paste a new one in BO_WIDGET_TOKEN and restart vite'
        : 'no dev token',
  };
};

/**
 * Token and login modes: answers the token to the pages of this dev server, never cached:
 * `{ accessToken, expiresAt }`, or `401 no-token` with the reason. A method other than `GET` gets
 * `405`; a `GET` from another origin gets `403 cross-site`; one for another host than `localhost`
 * (DNS rebinding), or from another machine (a `Host: localhost` sent over the network when
 * `server.host` exposes the dev server), `403 not-local`.
 *
 * @internal Exported for the tests.
 */
export const answerToken = async (
  req: IncomingMessage,
  res: ServerResponse,
  session: PageTokenSource,
): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'method-not-allowed', message: 'Only GET' });
    return;
  }
  if (isCrossSite(req)) {
    sendJson(res, 403, {
      error: 'cross-site',
      message: 'The token is only given to the pages of this dev server, on localhost.',
    });
    return;
  }
  if (!isFromThisMachine(req)) {
    sendJson(res, 403, {
      error: 'not-local',
      message: 'The token is only given on localhost, to a browser of this machine.',
    });
    return;
  }
  const token = await session.token();
  if (token === null) {
    sendJson(res, 401, { error: 'no-token', message: `No token: ${session.noTokenReason()}.` });
    return;
  }
  sendJson(res, 200, { accessToken: token, expiresAt: jwtExpiresAt(token) });
};

/** How the proxy authenticates the calls it forwards. */
type ProxyAuth =
  | { readonly kind: 'static'; readonly env: TokenModeEnv }
  | { readonly kind: 'session'; readonly env: LoginModeEnv; readonly session: TokenSource };

/** What {@link installFakeBo} needs: the session comes with login mode, and only with it. */
export type FakeBoServerOptions = {
  readonly runtime: WidgetManifest['runtime']['type'];
  /** `dev.responses`, answered in mock mode only. */
  readonly responses: Readonly<Record<string, unknown>>;
} & (
  | {
      readonly resolved: Extract<ResolvedDevMode, { mode: 'login' }>;
      /** The session the token comes from. */
      readonly session: TokenSource;
    }
  | { readonly resolved: Exclude<ResolvedDevMode, { mode: 'login' }>; readonly session?: never }
);

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1'];

/**
 * Whether the request names this machine in its `Host` (or `:authority`): a page whose domain
 * was rebound to 127.0.0.1 names its own, and Vite only checks it with `server.allowedHosts`.
 */
export const isLocalRequest = (req: Pick<IncomingMessage, 'headers'>): boolean => {
  const host = req.headers.host ?? req.headers[':authority'];
  if (typeof host !== 'string') return false;
  try {
    const { hostname } = new URL(`http://${host}`);
    return LOOPBACK_HOSTS.includes(hostname.replace(/^\[|\]$/g, ''));
  } catch {
    return false;
  }
};

/**
 * Whether a peer address is this machine: `127.0.0.0/8`, `::1`, or an IPv4-mapped `127.x`.
 *
 * @param address - `socket.remoteAddress` of the request.
 */
export const isLoopbackAddress = (address: string | undefined): boolean => {
  if (!address) return false;
  const ipv4 = address.toLowerCase().startsWith('::ffff:')
    ? address.slice('::ffff:'.length)
    : address;
  return ipv4 === '::1' || /^127(?:\.\d{1,3}){3}$/.test(ipv4);
};

/**
 * Whether the request names this machine in its `Host` and comes from it. The `Host` alone can be
 * forged by a client of the network when `server.host` exposes the dev server.
 */
const isFromThisMachine = (req: Pick<IncomingMessage, 'headers' | 'socket'>): boolean =>
  isLocalRequest(req) && isLoopbackAddress(req.socket?.remoteAddress);

/** Header that lets only the pages of this dev server frame a page. */
const FRAME_ANCESTORS_SELF = "frame-ancestors 'self'";

/** The token of a `Bearer` `Authorization` header, `null` for another scheme. */
const bearerToken = (header: string | undefined): string | null =>
  /^Bearer\s+(\S+)$/i.exec(header ?? '')?.[1] ?? null;

/** Whether `server.host` exposes the dev server beyond this machine. */
const isExposed = (host: string | boolean | undefined): boolean =>
  host === true || (typeof host === 'string' && !LOOPBACK_HOSTS.includes(host));

/**
 * Login mode serves the token of the session: the dev server must stay on this machine.
 *
 * @param host - `server.host` of Vite.
 * @throws {Error} When `host` exposes the dev server to the network.
 */
export const assertLoginServerHost = (host: string | boolean | undefined): void => {
  if (!isExposed(host)) return;
  throw new Error(
    'Fake back office in login mode: remove server.host (or --host), the token of your session would be served to your whole network.',
  );
};

/**
 * Serves the fake back office on {@link FAKE_BO_PATH} and its sub-routes, and the local Vulog API
 * under {@link FAKE_API_PATH}: mock responses, or the real API in token and login modes. In these
 * two modes, also serves the token (pasted, or the latest of the session) on
 * {@link FAKE_TOKEN_PATH}, to the pages of this server on `localhost` only. As a Web Component, `/` redirects to the fake back office; in an iframe, `/`
 * stays the widget page it displays.
 *
 * @throws {Error} In login mode with a `server.host` that exposes the dev server to the network:
 * anyone there could read the token of the session.
 */
export const installFakeBo = (server: ViteDevServer, options: FakeBoServerOptions): void => {
  const { logger } = server.config;
  const { resolved } = options;
  const host = server.config.server.host;
  let auth: ProxyAuth | null = null;
  let pageToken: PageTokenSource | null = null;
  if (options.resolved.mode === 'login') {
    // The type pairs the session with login mode; a caller without types may still omit it.
    if (!options.session) throw new Error('Fake back office in login mode: no session to follow');
    // Already checked before Chrome is launched; checked again for any other caller.
    assertLoginServerHost(host);
    if (Object.keys(options.responses).length > 0) {
      logger.warn('[bo-widget] Login mode: dev.responses are ignored, the calls go to the API.');
    }
    auth = { kind: 'session', env: options.resolved.env, session: options.session };
    pageToken = options.session;
  }
  if (resolved.mode === 'token') {
    auth = { kind: 'static', env: resolved.env };
    pageToken = pastedTokenSource(resolved.env.token);
    for (const warning of tokenWarnings(resolved.env.token)) logger.warn(`[bo-widget] ${warning}`);
    if (Object.keys(options.responses).length > 0) {
      logger.warn('[bo-widget] Token mode: dev.responses are ignored, the calls go to the API.');
    }
    if (isExposed(host)) {
      logger.warn(
        '[bo-widget] Fake back office in token mode with server.host set: anyone on the network can call the Vulog API with your token through this server.',
      );
    }
    if (server.config.server.allowedHosts === true) {
      logger.warn(
        '[bo-widget] Fake back office in token mode with server.allowedHosts: true: a page that rebinds its domain to this machine (DNS rebinding) could call the Vulog API with your token through this server. Remove allowedHosts: true, or list your hosts.',
      );
    }
  }
  server.ws.on(WIDGET_LOG_EVENT, (data: unknown) => printWidgetLog(logger, data));
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
    // Another site that framed these pages could navigate the widget frame to its own page and
    // take its place in the hello: only the pages of this dev server may frame them.
    if (options.runtime === 'iframe' && !pathname.startsWith(FAKE_BO_PATH) && isPageRequest(req)) {
      res.setHeader('Content-Security-Policy', FRAME_ANCESTORS_SELF);
    }
    if (pathname === FAKE_TOKEN_PATH && pageToken) {
      answerToken(req, res, pageToken).catch(next);
      return;
    }
    if (isFakeBoPage(req, pathname)) {
      server
        .transformIndexHtml(pathname, FAKE_BO_HTML)
        .then((html) => {
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Content-Security-Policy', FRAME_ANCESTORS_SELF);
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
    if (auth?.kind === 'session' && !isFromThisMachine(req)) {
      warnOnce(
        `not local ${String(req.headers.host)}`,
        '[bo-widget] Login mode: refused a call of the local Vulog API for another host than localhost.',
      );
      sendJson(res, 403, {
        error: 'not-local',
        message: 'In login mode, the local Vulog API only answers on localhost.',
      });
      return;
    }
    const rawPath = pathname.slice(FAKE_API_PATH.length);
    if (auth) {
      proxyToApi(req, res, rawPath, url.search, auth, logger, warnOnce).catch(next);
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
      resolved.mode !== 'mock' && resolved.env.host ? `, API of ${resolved.env.host}` : '';
    logger.info(`  ➜  Fake back office (${resolved.mode} mode${api}): ${where}`);
  };
};
