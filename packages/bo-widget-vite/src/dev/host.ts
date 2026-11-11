/**
 * The fake back office that `vite` serves in dev: it displays the widget the way the back office
 * does, as a Web Component (class registered under a `widget-{hash}` tag, API injected as
 * `vulogBo`) or in an iframe (`hello` / `welcome` handshake and `MessagePort`), and answers its
 * requests with the dev fixtures.
 *
 * Runs in the browser. It imports nothing at runtime (type imports only): what it needs from Node
 * comes in {@link FakeBoConfig}.
 *
 * @packageDocumentation
 */
import type {
  BoAccessToken,
  BoApiInfo,
  BoContext,
  BoCurrentUser,
  BoEventMap,
  BoEventName,
  BoLogContext,
  BoLogLevel,
  BoNavigatePayload,
  BoNotifyPayload,
  BoNotifySeverity,
  BoResizePayload,
  BoSettings,
  BoTheme,
} from '@vulog/bo-widget-sdk';
import type { WidgetManifest, WidgetPermission } from '@vulog/bo-widget-sdk/manifest';
import type { ResolvedDevMode } from './server.js';

/**
 * Where the fake back office gets its access token from: the fake token of mock mode, or the dev
 * server at each `getAccessToken` (token and login modes). A real token is never written in the
 * page or its modules: only the pages of the dev server, on `localhost`, can read it.
 */
export type FakeBoAuth =
  { readonly kind: 'mock' } | { readonly kind: 'server'; readonly tokenPath: string };

/** Access token of mock mode: no JWT, no API accepts it. */
export const MOCK_ACCESS_TOKEN = 'mock-access-token';

/** What the dev server passes to the fake back office (JSON). */
export interface FakeBoConfig {
  /**
   * `token`: the token pasted in `BO_WIDGET_TOKEN`; `login`: the token of the session the user
   * opened in the Chrome of `bo-widget dev --login`. Both are read from the dev server.
   */
  mode: ResolvedDevMode['mode'];
  runtime: WidgetManifest['runtime']['type'];
  protocolVersion: number;
  widget: { id: string; name: string; version: string; permissions: readonly WidgetPermission[] };
  /** Tag the Web Component is registered under. */
  tag: string;
  /** URL of the widget page (iframe). */
  widgetUrl: string;
  context: BoContext;
  user: BoCurrentUser;
  settings: BoSettings;
  /** Path of the local API proxy, `baseUrl` of `getApiInfo` once resolved against the page. */
  apiPath: string;
  apiKey: string;
  auth: FakeBoAuth;
}

/** What the fake back office shows: requests log, snackbars, route and iframe height. */
export interface FakeBoUi {
  log(message: string, level?: 'info' | 'warning' | 'error'): void;
  notify(message: string, severity: BoNotifySeverity): void;
  /**
   * Shows the route `navigate` resolved. A route of the widget's view (`inView`) is also pushed
   * to the history, so that a reload opens it again; a route outside it is only shown, with a
   * warning in the log.
   */
  navigate(route: string, inView: boolean): void;
  resize(height: number | null): void;
  /** Shows a log of the widget (`bo.log`, or an uncaught error the SDK sent). */
  widgetLog(entry: WidgetLogEntry): void;
}

/** A log of the widget, as the fake back office receives it. */
export interface WidgetLogEntry {
  level: BoLogLevel;
  message: string;
  context?: BoLogContext;
}

/**
 * Shows a log of the widget in the terminal of the dev server: the page sends it on the Vite HMR
 * channel, under {@link WIDGET_LOG_EVENT}.
 */
export type WidgetLogTerminal = (entry: WidgetLogEntry) => void;

/** Name of the Vite HMR event a widget log is sent to the dev server with. */
export const WIDGET_LOG_EVENT = 'bo-widget:log';

/** Levels a widget log may have, as the back office accepts them. */
export const WIDGET_LOG_LEVELS: readonly BoLogLevel[] = ['debug', 'info', 'warn', 'error'];

/** Codes of the errors the back office API throws, which the SDK turns into `reason`. */
export type WidgetHostErrorCode = 'invalid-payload' | 'no-token';

/** Error the back office API throws, with the codes of the real one. */
export class WidgetHostError extends Error {
  readonly code: WidgetHostErrorCode;
  readonly status: number | null;

  constructor(code: WidgetHostErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = 'WidgetHostError';
    this.code = code;
    this.status = Number.isInteger(status) ? status : null;
  }
}

type Listener = (data: unknown) => void;
type Handler = (payload: unknown) => unknown;
type HandlerName =
  | 'getContext'
  | 'getCurrentUser'
  | 'getSettings'
  | 'getApiInfo'
  | 'getAccessToken'
  | 'getTheme'
  | 'navigate'
  | 'notify'
  | 'resize'
  | 'log';

/** Permission each request needs; the others are always served. */
const REQUIRED_PERMISSION: Partial<Record<HandlerName, WidgetPermission>> = {
  getApiInfo: 'apiInfo',
  getAccessToken: 'accessToken',
  navigate: 'navigate',
  notify: 'notify',
};

const NOTIFY_SEVERITIES: readonly BoNotifySeverity[] = ['success', 'info', 'warning', 'error'];

const THEMES: Record<'light' | 'dark', BoTheme> = {
  light: {
    mode: 'light',
    palette: {
      mode: 'light',
      primary: { main: '#1565c0' },
      background: { default: '#f5f5f5', paper: '#ffffff' },
      text: { primary: '#212121' },
    },
    typography: { fontFamily: 'Roboto, Helvetica, Arial, sans-serif', fontSize: 14 },
  },
  dark: {
    mode: 'dark',
    palette: {
      mode: 'dark',
      primary: { main: '#90caf9' },
      background: { default: '#121212', paper: '#1e1e1e' },
      text: { primary: '#ffffff' },
    },
    typography: { fontFamily: 'Roboto, Helvetica, Arial, sans-serif', fontSize: 14 },
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const invalidPayload = (message: string): WidgetHostError =>
  new WidgetHostError('invalid-payload', message);

/** Origin to resolve the routes against: only their path, query and hash are kept. */
const ROUTE_ORIGIN = 'http://fake-bo.invalid';

/**
 * Resolves a `navigate` path like the back office, without its fleet prefix: `/…` is kept from
 * the root, otherwise the path is resolved like a relative URL under the widget's view (`..` may
 * leave it). Query and hash are kept, and the result is the full route.
 */
export const resolveRoute = (basename: string, path: string): string => {
  const url = new URL(path, `${ROUTE_ORIGIN}${basename.replace(/\/+$/, '')}/`);
  return `${url.pathname}${url.search}${url.hash}`;
};

/**
 * True when a route is the widget's view or one of its sub-routes. Every route is in the view of
 * the root basename (`/`). Both are compared URL-encoded, as `location.pathname` is.
 */
export const isInView = (basename: string, route: string): boolean => {
  const base = new URL(`${basename.replace(/\/+$/, '')}/`, ROUTE_ORIGIN).pathname.slice(0, -1);
  const { pathname } = new URL(route, ROUTE_ORIGIN);
  return base === '' || pathname === base || pathname.startsWith(`${base}/`);
};

/** A route as `routeChanged` pushes it. */
const routeEvent = (route: string): BoEventMap['routeChanged'] => {
  const { pathname, search, hash } = new URL(route, ROUTE_ORIGIN);
  return { pathname, search, hash };
};

/**
 * Longer than the dev server may wait for Chrome before answering: four CDP commands, one of
 * 20 s and three of 5 s.
 */
const SESSION_TOKEN_TIMEOUT_MS = 45_000;

/**
 * Token and login modes: the token the dev server answers, the pasted one or the latest of the
 * session.
 *
 * @throws {WidgetHostError} `no-token`, with the reason the dev server gives (expired token, no
 * session, Chrome closed…), or when it does not answer, answers late or answers something else
 * than a token.
 */
const serverToken = async (path: string): Promise<BoAccessToken> => {
  let response: Response;
  try {
    response = await fetch(path, {
      cache: 'no-store',
      signal: AbortSignal.timeout(SESSION_TOKEN_TIMEOUT_MS),
    });
  } catch (error) {
    throw new WidgetHostError(
      'no-token',
      (error as Error).name === 'TimeoutError'
        ? 'The dev server is still waiting for the tab of the back office in Chrome: see the terminal.'
        : 'The dev server does not answer: is vite still running? See the terminal.',
    );
  }
  const body = (await response.json().catch(() => null)) as
    (Partial<BoAccessToken> & { message?: unknown }) | null;
  if (!response.ok) {
    const reason =
      typeof body?.message === 'string'
        ? body.message
        : `The dev server answered ${response.status}`;
    throw new WidgetHostError('no-token', `${reason} (see the terminal)`, response.status);
  }
  if (typeof body?.accessToken !== 'string' || !body.accessToken) {
    throw new WidgetHostError('no-token', 'The dev server answered no token: see the terminal');
  }
  return {
    accessToken: body.accessToken,
    expiresAt: typeof body.expiresAt === 'number' ? body.expiresAt : null,
  };
};

/** JSON of a result for the log, with the access token and the API key masked: the log is on screen. */
const forLog = (value: unknown): string => {
  try {
    return (
      JSON.stringify(value, (key, item: unknown) => {
        if (typeof item !== 'string') return item;
        return key === 'accessToken' || key === 'apiKey' ? '…' : item;
      }) ?? String(value)
    );
  } catch {
    // Circular, or a BigInt: both can be posted on a port.
    return String(value);
  }
};

/**
 * Reads a `log` request like the back office does: `{ level, message, context? }`.
 *
 * @throws {WidgetHostError} `invalid-payload` when `level` is unknown or `message` is not a
 * non-blank string.
 */
export const parseWidgetLog = (payload: unknown): WidgetLogEntry => {
  const { level, message, context } = (isRecord(payload) ? payload : {}) as Partial<WidgetLogEntry>;
  if (!WIDGET_LOG_LEVELS.includes(level as BoLogLevel)) {
    throw invalidPayload(`log: level must be one of ${WIDGET_LOG_LEVELS.join(', ')}`);
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw invalidPayload('log: message must be a non-blank string');
  }
  return context === undefined
    ? { level: level as BoLogLevel, message }
    : { level: level as BoLogLevel, message, context };
};

/**
 * The state and the requests of the fake back office, without the page around it.
 *
 * @param config - Fixtures and widget identity from the dev server.
 * @param ui - What the page shows.
 * @returns The API to inject into a Web Component, the server of an iframe port, and the events
 * the page pushes.
 */
export const createFakeBackOffice = (config: FakeBoConfig, ui: FakeBoUi) => {
  const listeners = new Map<string, Set<Listener>>();
  const ports = new Set<MessagePort>();
  const context: BoContext = structuredClone(config.context);
  let themeMode: 'light' | 'dark' = 'light';

  const handlers: Record<HandlerName, Handler> = {
    getContext: () => structuredClone(context),
    getCurrentUser: () => structuredClone(config.user),
    getSettings: () => structuredClone(config.settings),
    getApiInfo: (): BoApiInfo => ({
      baseUrl: new URL(config.apiPath, globalThis.location.href).href,
      apiKey: config.apiKey,
    }),
    getAccessToken: (): BoAccessToken | Promise<BoAccessToken> =>
      config.auth.kind === 'server'
        ? serverToken(config.auth.tokenPath)
        : { accessToken: MOCK_ACCESS_TOKEN, expiresAt: null },
    getTheme: () => structuredClone(THEMES[themeMode]),
    navigate: (payload) => {
      const path = (payload as BoNavigatePayload | undefined)?.path;
      if (typeof path !== 'string' || !path.trim()) {
        throw invalidPayload('navigate: path must be a non-empty string');
      }
      // Browsers read `\` as `/`: `\\host` is another host too.
      if (/^[a-z][a-z0-9+.-]*:/i.test(path) || /^[\\/]{2}/.test(path)) {
        throw invalidPayload(`navigate: ${path} is not a back office route`);
      }
      const route = resolveRoute(context.basename, path);
      const inView = isInView(context.basename, route);
      ui.navigate(route, inView);
      if (inView) emit('routeChanged', routeEvent(route));
      return { path: route };
    },
    notify: (payload) => {
      const { message, severity } = (payload ?? {}) as BoNotifyPayload;
      if (typeof message !== 'string' || !message.trim()) {
        throw invalidPayload('notify: message must be a non-empty string');
      }
      if (severity != null && !NOTIFY_SEVERITIES.includes(severity)) {
        throw invalidPayload(`notify: unknown severity ${String(severity)}`);
      }
      ui.notify(message, severity ?? 'info');
      return null;
    },
    resize: (payload) => {
      const height = (payload as BoResizePayload | undefined)?.height;
      if (
        height !== null &&
        (typeof height !== 'number' || !Number.isFinite(height) || height <= 0)
      ) {
        throw invalidPayload('resize: height must be a positive number of pixels or null');
      }
      ui.resize(height);
      return { height };
    },
    log: (payload) => {
      ui.widgetLog(parseWidgetLog(payload));
      return null;
    },
  };

  const missingPermission = (type: HandlerName): WidgetPermission | null => {
    const permission = REQUIRED_PERMISSION[type];
    return permission && !config.widget.permissions.includes(permission) ? permission : null;
  };

  /** Pushes an event to the Web Component listeners and to the iframe port. */
  const emit = <K extends BoEventName>(name: K, data: BoEventMap[K]): void => {
    ui.log(`event ${name} ${JSON.stringify(data)}`);
    for (const listener of [...(listeners.get(name) ?? [])]) {
      try {
        listener(structuredClone(data));
      } catch (error) {
        ui.log(`listener of ${name} failed: ${String(error)}`, 'error');
        console.error(error);
      }
    }
    for (const port of ports) port.postMessage({ type: 'event', name, data });
  };

  /**
   * The API injected into the Web Component as `vulogBo`. Permissions are only declarative for a
   * Web Component, as in the back office: a request the manifest does not allow is served, with a
   * warning in the log, since it would be refused in an iframe.
   */
  const createHostApi = () => {
    const call =
      (type: Exclude<HandlerName, 'resize' | 'log'>) =>
      async (payload?: unknown): Promise<unknown> => {
        const permission = missingPermission(type);
        if (permission) {
          ui.log(
            `${type} needs the "${permission}" permission, missing from the manifest`,
            'warning',
          );
        }
        try {
          const result = await handlers[type](payload);
          ui.log(`${type} → ${forLog(result)}`);
          return result;
        } catch (error) {
          ui.log(`${type} failed: ${(error as Error).message}`, 'error');
          throw error;
        }
      };
    /** `vulogBo.log`: never throws nor waits, like the back office. */
    const log: Readonly<Record<BoLogLevel, (message: unknown, context?: unknown) => void>> =
      Object.freeze(
        Object.fromEntries(
          WIDGET_LOG_LEVELS.map((level) => [
            level,
            (message: unknown, context?: unknown) => {
              try {
                handlers.log({ level, message, context });
              } catch (error) {
                ui.log(`log refused: ${(error as Error).message}`, 'warning');
              }
            },
          ]),
        ) as Record<BoLogLevel, (message: unknown, context?: unknown) => void>,
      );
    return Object.freeze({
      protocolVersion: config.protocolVersion,
      log,
      getContext: call('getContext'),
      getCurrentUser: call('getCurrentUser'),
      getSettings: call('getSettings'),
      getApiInfo: call('getApiInfo'),
      getAccessToken: call('getAccessToken'),
      getTheme: call('getTheme'),
      navigate: call('navigate'),
      notify: call('notify'),
      on(name: string, listener: Listener) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name)?.add(listener);
      },
      off(name: string, listener: Listener) {
        listeners.get(name)?.delete(listener);
      },
    });
  };

  /** Answers a request received on the iframe port, with the envelope of the protocol. */
  const answer = async (type: unknown, payload: unknown): Promise<Record<string, unknown>> => {
    if (typeof type !== 'string' || !Object.hasOwn(handlers, type)) {
      return {
        ok: false,
        error: { code: 'UNKNOWN_TYPE', message: `Unknown request ${String(type)}` },
      };
    }
    const permission = missingPermission(type as HandlerName);
    if (permission) {
      return {
        ok: false,
        error: { code: 'FORBIDDEN', message: `${type} needs the "${permission}" permission` },
      };
    }
    try {
      return { ok: true, result: await handlers[type as HandlerName](payload) };
    } catch (error) {
      if (error instanceof WidgetHostError) {
        return {
          ok: false,
          error:
            error.code === 'invalid-payload'
              ? { code: 'INVALID_PAYLOAD', message: error.message }
              : {
                  code: 'INTERNAL',
                  reason: error.code,
                  status: error.status,
                  message: error.message,
                },
        };
      }
      // A bug of the fake back office itself: keep its stack in the console.
      console.error(error);
      return { ok: false, error: { code: 'INTERNAL', message: String(error) } };
    }
  };

  /**
   * Serves the port of an iframe `hello`: answers `welcome`, then each `{ id, type, payload }`
   * with `{ id, ok, result | error }`, and pushes the events on it.
   *
   * @returns A function that closes the port.
   */
  const servePort = (port: MessagePort): (() => void) => {
    ports.add(port);
    port.onmessage = async (event: MessageEvent) => {
      const message: unknown = event.data;
      if (!isRecord(message) || !('id' in message)) {
        ui.log(`ignored a message without id: ${forLog(message)}`, 'warning');
        return;
      }
      const response = await answer(message.type, message.payload);
      // A log is already shown by `widgetLog`; only its refusal is worth a line.
      if (message.type !== 'log' || !response.ok)
        ui.log(
          `${String(message.type)} → ${forLog(response.ok ? response.result : response.error)}`,
          response.ok ? 'info' : 'error',
        );
      if (ports.has(port)) port.postMessage({ id: message.id, ...response });
    };
    port.onmessageerror = () => ui.log('a message from the widget could not be read', 'error');
    port.postMessage({
      type: 'welcome',
      protocolVersion: config.protocolVersion,
      grantedPermissions: [...config.widget.permissions],
    });
    return () => {
      ports.delete(port);
      port.close();
    };
  };

  return {
    createHostApi,
    servePort,
    emit,
    setLocale(locale: string) {
      context.locale = locale;
      emit('localeChanged', { locale });
    },
    /**
     * Pushes the route of the page after a move in the history (back or forward). A route outside
     * the widget's view is not pushed, with a warning: the back office would leave the widget.
     */
    routeChanged() {
      const { pathname, search, hash } = globalThis.location;
      if (!isInView(context.basename, pathname)) {
        ui.log(
          `${pathname} is outside the widget's view: no routeChanged, the back office would leave the widget`,
          'warning',
        );
        return;
      }
      emit('routeChanged', { pathname, search, hash });
    },
    toggleTheme() {
      themeMode = themeMode === 'light' ? 'dark' : 'light';
      emit('themeChanged', structuredClone(THEMES[themeMode]));
      return themeMode;
    },
  };
};

const STYLES = `
  :root { color-scheme: light; font-family: Roboto, Helvetica, Arial, sans-serif; }
  body { margin: 0; height: 100vh; display: grid; grid-template-rows: auto 1fr auto; background: #f5f5f5; color: #212121; }
  .bo-bar { display: flex; gap: 12px; align-items: center; padding: 8px 16px; background: #1565c0; color: #fff; font-size: 14px; }
  .bo-bar strong { margin-right: auto; }
  .bo-badge { padding: 2px 8px; border-radius: 10px; background: rgba(255,255,255,.2); }
  .bo-route { font-family: monospace; opacity: .85; }
  .bo-content { position: relative; overflow: auto; min-height: 0; }
  .bo-content > * { display: block; width: 100%; height: 100%; border: 0; }
  .bo-error { padding: 16px; color: #b71c1c; font-family: monospace; white-space: pre-wrap; }
  .bo-log { max-height: 30vh; overflow: auto; margin: 0; padding: 8px 16px; background: #212121; color: #e0e0e0; font: 12px monospace; }
  .bo-log .warning { color: #ffb74d; } .bo-log .error { color: #ef9a9a; }
  .bo-toasts { position: fixed; right: 16px; bottom: 16px; display: grid; gap: 8px; }
  .bo-toast { padding: 10px 16px; border-radius: 4px; color: #fff; background: #323232; box-shadow: 0 2px 6px rgba(0,0,0,.3); }
  .bo-toast.success { background: #2e7d32; } .bo-toast.warning { background: #ed6c02; } .bo-toast.error { background: #d32f2f; }
`;

/** Locales of the bar, in the format of the back office (`language_COUNTRY`). */
const BO_LOCALES = ['en_GB', 'fr_FR', 'es_ES', 'de_DE', 'it_IT'];

/** The `language_COUNTRY` format of the back office locales. */
const BO_LOCALE_FORMAT = /^[a-z]{2,3}_[A-Z]{2}$/;

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] => Object.assign(document.createElement(tag), props);

/** Class of a widget log line in the log panel. */
const LOG_LINE_CLASS: Record<BoLogLevel, 'info' | 'warning' | 'error'> = {
  debug: 'info',
  info: 'info',
  warn: 'warning',
  error: 'error',
};

/** A widget log as one line: `widget warn: message {"status":500}`. */
export const formatWidgetLog = ({ level, message, context }: WidgetLogEntry): string =>
  context === undefined
    ? `widget ${level}: ${message}`
    : `widget ${level}: ${message} ${forLog(context)}`;

/**
 * Builds the page of the fake back office (bar, content zone, log, snackbars) and returns its parts.
 *
 * @param terminal - Shows the widget logs in the terminal of the dev server too.
 */
const createPage = (config: FakeBoConfig, terminal?: WidgetLogTerminal) => {
  document.title = `${config.widget.name} · fake back office`;
  document.head.append(element('style', { textContent: STYLES }));

  const route = element('span', {
    className: 'bo-route',
    textContent: `${location.pathname}${location.search}${location.hash}`,
  });
  const locale = element('select', { title: 'Locale (localeChanged)' });
  const initialLocale = config.context.locale ?? 'en_GB';
  const locales = BO_LOCALES.includes(initialLocale) ? BO_LOCALES : [initialLocale, ...BO_LOCALES];
  for (const value of locales) {
    locale.append(element('option', { value, textContent: value }));
  }
  locale.value = initialLocale;
  const theme = element('button', { type: 'button', textContent: 'Theme: light' });
  const bar = element('header', { className: 'bo-bar' });
  bar.append(
    element('strong', {
      textContent: `${config.widget.name} ${config.widget.version} (${config.runtime})`,
    }),
    route,
    element('span', { className: 'bo-badge', textContent: `${config.mode} mode` }),
    locale,
    theme,
  );
  const content = element('main', { className: 'bo-content' });
  const log = element('pre', { className: 'bo-log' });
  const toasts = element('div', { className: 'bo-toasts' });
  document.body.replaceChildren(bar, content, log, toasts);

  const ui: FakeBoUi = {
    log(message, level = 'info') {
      const line = element('div', { className: level, textContent: message });
      log.append(line);
      line.scrollIntoView({ block: 'nearest' });
    },
    notify(message, severity) {
      const toast = element('div', { className: `bo-toast ${severity}`, textContent: message });
      toasts.append(toast);
      setTimeout(() => toast.remove(), 4000);
    },
    navigate(path, inView) {
      route.textContent = path;
      if (inView) {
        history.pushState(null, '', path);
        return;
      }
      ui.log(
        `${path} is outside the widget's view: no routeChanged, the back office would leave the widget`,
        'warning',
      );
    },
    resize(height) {
      const frame = content.querySelector('iframe');
      if (frame) frame.style.height = height === null ? '100%' : `${height}px`;
    },
    widgetLog(entry) {
      ui.log(formatWidgetLog(entry), LOG_LINE_CLASS[entry.level]);
      const args = entry.context === undefined ? [] : [entry.context];
      console[entry.level](`[widget] ${entry.message}`, ...args);
      try {
        terminal?.(entry);
      } catch (error) {
        // The HMR channel is closed (dev server stopped): the page and the console still show it.
        console.warn('[bo-widget] cannot show the log in the terminal', error);
      }
    },
  };
  /** Shows an error in the content zone and the log. */
  const fail = (message: string): void => {
    content.append(element('div', { className: 'bo-error', textContent: message }));
    ui.log(message, 'error');
  };
  /** Shows the route of the page, after a move in the history. */
  const showRoute = (): void => {
    route.textContent = `${location.pathname}${location.search}${location.hash}`;
  };
  return { ui, fail, content, locale, theme, showRoute };
};

const isElementClass = (value: unknown): value is CustomElementConstructor =>
  typeof value === 'function' && value.prototype instanceof HTMLElement;

/** Loads the widget entry module (`import()` of the entry, from the dev server). */
export type WidgetLoader = () => Promise<{ default?: unknown }>;

/** Time to wait for the `hello` of a loaded widget page before saying it is missing. */
const HELLO_WAIT_MS = 5000;

/** Displays an iframe widget and serves the port of each `hello` its page posts. */
const startIframe = (
  config: FakeBoConfig,
  page: ReturnType<typeof createPage>,
  backOffice: ReturnType<typeof createFakeBackOffice>,
): void => {
  const { ui, content } = page;
  const frame = element('iframe', { src: config.widgetUrl, title: config.widget.name });
  let closePort: (() => void) | null = null;
  let helloTimer: ReturnType<typeof setTimeout> | undefined;
  const ignored = new Set<string>();
  /** Logs once each kind of message from the widget page that is not a hello. */
  const ignore = (kind: string): void => {
    if (ignored.has(kind)) return;
    ignored.add(kind);
    ui.log(`ignored a message from the widget page: ${kind}`, 'warning');
  };
  frame.addEventListener('load', () => {
    clearTimeout(helloTimer);
    helloTimer = setTimeout(() => {
      ui.log(
        `no hello from the widget page ${HELLO_WAIT_MS / 1000} s after it loaded: does it call connect() of the SDK?`,
        'warning',
      );
    }, HELLO_WAIT_MS);
    // Same origin: the widget's own errors are shown in the log too.
    const view = frame.contentWindow;
    view?.addEventListener('error', (event: ErrorEvent) =>
      ui.log(`widget error: ${String(event.error ?? event.message)}`, 'error'),
    );
    view?.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) =>
      ui.log(`widget unhandled rejection: ${String(event.reason)}`, 'error'),
    );
  });
  globalThis.addEventListener('message', (event: MessageEvent) => {
    const data: unknown = event.data;
    // A page left behind (removed iframe) no longer answers.
    if (!frame.isConnected || event.source !== frame.contentWindow) return;
    // The widget page is served by this dev server. A page that framed the fake back office can
    // navigate the widget frame to its own origin: its hello must not get the token.
    if (event.origin !== globalThis.location.origin) {
      ignore(`message from ${event.origin || 'an opaque origin'}, not from this dev server`);
      return;
    }
    if (!isRecord(data) || data.protocol !== 'vulog-bo') {
      ignore('no protocol "vulog-bo"');
      return;
    }
    if (data.type !== 'hello') {
      ignore(
        `type ${String(data.type)} on the window: requests go on the MessagePort of the hello`,
      );
      return;
    }
    clearTimeout(helloTimer);
    const port = event.ports[0];
    if (!port) {
      ui.log('hello without MessagePort: post it in the transfer list', 'error');
      return;
    }
    if (data.version !== config.protocolVersion) {
      ui.log(
        `hello for protocol ${String(data.version)}, this back office serves ${config.protocolVersion}`,
        'error',
      );
      port.postMessage({
        type: 'error',
        error: {
          code: 'INTERNAL',
          reason: 'unsupported-version',
          message: `Unsupported protocol version ${String(data.version)}`,
        },
      });
      port.close();
      return;
    }
    // The widget page reloaded (full reload in dev): only its new port is served.
    closePort?.();
    ui.log(`hello from ${String(data.widgetId ?? config.widget.id)}`);
    closePort = backOffice.servePort(port);
  });
  content.append(frame);
};

/** Registers the widget class under its tag, injects the API and displays the element. */
const startWebComponent = async (
  config: FakeBoConfig,
  page: ReturnType<typeof createPage>,
  backOffice: ReturnType<typeof createFakeBackOffice>,
  load: WidgetLoader | undefined,
): Promise<void> => {
  const name = `${config.widget.id}@${config.widget.version}`;
  let widgetClass: unknown;
  try {
    widgetClass = (await load?.())?.default;
  } catch (error) {
    page.fail(
      `${name}: the entry failed to load: ${String(error)} (the vite terminal or overlay shows the cause)`,
    );
    console.error(error);
    return;
  }
  if (!isElementClass(widgetClass)) {
    page.fail(
      `${name}: the default export of the entry is not an HTMLElement class (got ${typeof widgetClass}): export default class extends HTMLElement { … }`,
    );
    return;
  }
  try {
    if (!customElements.get(config.tag)) customElements.define(config.tag, widgetClass);
    const widget = document.createElement(config.tag) as HTMLElement & { vulogBo?: unknown };
    widget.dataset.widgetId = config.widget.id;
    widget.dataset.widgetVersion = config.widget.version;
    widget.vulogBo = backOffice.createHostApi();
    page.content.append(widget);
  } catch (error) {
    // `define` throws when the class is already registered under another tag (the widget called
    // customElements.define itself).
    page.fail(`${name}: cannot display the widget: ${String(error)}`);
    console.error(error);
  }
};

/**
 * Starts the fake back office on the current page and displays the widget. Errors the widget
 * throws later (constructor, `connectedCallback`, rejected promises, or those of its iframe page)
 * are shown in the log too.
 *
 * @param config - Fixtures and widget identity from the dev server.
 * @param load - Loads the widget entry, whose default export is the element class (Web Component
 * only).
 * @param terminal - Shows the widget logs in the terminal of the dev server too.
 * @returns Once the widget is displayed, or its error shown.
 */
export const startFakeBo = async (
  config: FakeBoConfig,
  load?: WidgetLoader,
  terminal?: WidgetLogTerminal,
): Promise<void> => {
  const page = createPage(config, terminal);
  const backOffice = createFakeBackOffice(config, page.ui);
  page.locale.addEventListener('change', () => backOffice.setLocale(page.locale.value));
  page.theme.addEventListener('click', () => {
    page.theme.textContent = `Theme: ${backOffice.toggleTheme()}`;
  });
  globalThis.addEventListener('popstate', () => {
    page.showRoute();
    backOffice.routeChanged();
  });
  const { basename, locale } = config.context;
  if (locale !== null && !BO_LOCALE_FORMAT.test(locale)) {
    page.ui.log(
      `the locale ${locale} is not in the format of the back office, language_COUNTRY (en_GB, fr_FR…)`,
      'warning',
    );
  }
  if (!isInView(basename, location.pathname)) {
    page.ui.log(
      `the page ${location.pathname} is outside the basename ${basename}: a router with this basename matches nothing. Keep the default basename, /__bo-widget.`,
      'warning',
    );
  }
  globalThis.addEventListener('error', (event: ErrorEvent) =>
    page.ui.log(`uncaught error: ${String(event.error ?? event.message)}`, 'error'),
  );
  globalThis.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) =>
    page.ui.log(`unhandled rejection: ${String(event.reason)}`, 'error'),
  );

  if (config.runtime === 'iframe') {
    startIframe(config, page, backOffice);
    return;
  }
  await startWebComponent(config, page, backOffice, load);
};
