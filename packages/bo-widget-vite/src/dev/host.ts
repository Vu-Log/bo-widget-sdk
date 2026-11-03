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
  BoNavigatePayload,
  BoNotifyPayload,
  BoNotifySeverity,
  BoResizePayload,
  BoSettings,
  BoTheme,
} from '@vulog/bo-widget-sdk';
import type { WidgetManifest, WidgetPermission } from '@vulog/bo-widget-sdk/manifest';
import type { FakeBoMode } from './options.js';

/** What the dev server passes to the fake back office (JSON). */
export interface FakeBoConfig {
  mode: FakeBoMode;
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
  accessToken: string;
  /** Expiry of `accessToken` in ms since the epoch, `null` when unknown. */
  expiresAt: number | null;
}

/** What the fake back office shows: requests log, snackbars, route and iframe height. */
export interface FakeBoUi {
  log(message: string, level?: 'info' | 'warning' | 'error'): void;
  notify(message: string, severity: BoNotifySeverity): void;
  navigate(path: string): void;
  resize(height: number | null): void;
}

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
  | 'resize';

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

/** Resolves a `navigate` path the way the back office does: `/…` under the fleet, otherwise under the widget's view. */
const resolveRoute = (basename: string, path: string): string =>
  path.startsWith('/') ? path : `${basename.replace(/\/+$/, '')}/${path}`;

/** JSON of a result for the log, with the access token masked: the log is on screen. */
const forLog = (value: unknown): string =>
  JSON.stringify(value, (key, item: unknown) =>
    key === 'accessToken' && typeof item === 'string' ? `${item.slice(0, 6)}…` : item,
  );

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
    getAccessToken: (): BoAccessToken => {
      if (config.expiresAt !== null && config.expiresAt <= Date.now()) {
        throw new WidgetHostError(
          'no-token',
          'The dev token expired: paste a new one in BO_WIDGET_TOKEN and restart vite',
        );
      }
      return { accessToken: config.accessToken, expiresAt: config.expiresAt };
    },
    getTheme: () => structuredClone(THEMES[themeMode]),
    navigate: (payload) => {
      const path = (payload as BoNavigatePayload | undefined)?.path;
      if (typeof path !== 'string' || !path.trim()) {
        throw invalidPayload('navigate: path must be a non-empty string');
      }
      if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) {
        throw invalidPayload(`navigate: ${path} is not a back office route`);
      }
      const route = resolveRoute(context.basename, path);
      ui.navigate(route);
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
      (type: Exclude<HandlerName, 'resize'>) =>
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
    return Object.freeze({
      protocolVersion: config.protocolVersion,
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
        ui.log(`ignored a message without id: ${JSON.stringify(message)}`, 'warning');
        return;
      }
      const response = await answer(message.type, message.payload);
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

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] => Object.assign(document.createElement(tag), props);

/** Builds the page of the fake back office (bar, content zone, log, snackbars) and returns its parts. */
const createPage = (config: FakeBoConfig) => {
  document.title = `${config.widget.name} · fake back office`;
  document.head.append(element('style', { textContent: STYLES }));

  const route = element('span', { className: 'bo-route', textContent: config.context.basename });
  const locale = element('select', { title: 'Locale (localeChanged)' });
  for (const value of ['en', 'fr', 'es', 'de', 'it']) {
    locale.append(element('option', { value, textContent: value }));
  }
  locale.value = config.context.locale ?? 'en';
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
    navigate(path) {
      route.textContent = path;
    },
    resize(height) {
      const frame = content.querySelector('iframe');
      if (frame) frame.style.height = height === null ? '100%' : `${height}px`;
    },
  };
  /** Shows an error in the content zone and the log. */
  const fail = (message: string): void => {
    content.append(element('div', { className: 'bo-error', textContent: message }));
    ui.log(message, 'error');
  };
  return { ui, fail, content, locale, theme };
};

const isElementClass = (value: unknown): value is CustomElementConstructor =>
  typeof value === 'function' && value.prototype instanceof HTMLElement;

/** Loads the widget entry module (`import()` of the entry, from the dev server). */
export type WidgetLoader = () => Promise<{ default?: unknown }>;

/** Displays an iframe widget and serves the port of each `hello` its page posts. */
const startIframe = (
  config: FakeBoConfig,
  page: ReturnType<typeof createPage>,
  backOffice: ReturnType<typeof createFakeBackOffice>,
): void => {
  const { ui, content } = page;
  const frame = element('iframe', { src: config.widgetUrl, title: config.widget.name });
  let closePort: (() => void) | null = null;
  globalThis.addEventListener('message', (event: MessageEvent) => {
    const data: unknown = event.data;
    // A page left behind (removed iframe) no longer answers.
    if (!frame.isConnected || event.source !== frame.contentWindow) return;
    if (!isRecord(data) || data.protocol !== 'vulog-bo') {
      return;
    }
    if (data.type !== 'hello') return;
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
    page.fail(`${name}: the entry failed to load: ${String(error)}`);
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
 * throws later (constructor, `connectedCallback`, rejected promises) are shown in the log too.
 *
 * @param config - Fixtures and widget identity from the dev server.
 * @param load - Loads the widget entry, whose default export is the element class (Web Component
 * only).
 * @returns Once the widget is displayed, or its error shown.
 */
export const startFakeBo = async (config: FakeBoConfig, load?: WidgetLoader): Promise<void> => {
  const page = createPage(config);
  const backOffice = createFakeBackOffice(config, page.ui);
  page.locale.addEventListener('change', () => backOffice.setLocale(page.locale.value));
  page.theme.addEventListener('click', () => {
    page.theme.textContent = `Theme: ${backOffice.toggleTheme()}`;
  });
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
