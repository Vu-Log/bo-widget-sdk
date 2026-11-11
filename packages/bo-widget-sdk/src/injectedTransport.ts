import { BoError, fromHostError } from './errors.js';
import {
  PROTOCOL_VERSION,
  type BoEventListener,
  type BoLogContext,
  type BoLogLevel,
  type BoEventName,
  type BoRequests,
  type BoTransport,
} from './types.js';

/**
 * API the back office injects into a Web Component as `element.vulogBo`, before inserting it. It
 * has no `resize`: a Web Component already fills the content zone. A request an older back office
 * does not serve is missing: it rejects with `UNKNOWN_TYPE`. Without `log` (older back office), logs
 * are dropped.
 */
export interface InjectedHostApi extends Partial<Omit<BoRequests, 'resize'>> {
  readonly protocolVersion?: number;
  /** One method per level, which never waits: the back office filters, caps and sends in batches. */
  readonly log?: Partial<Record<BoLogLevel, (message: string, context?: BoLogContext) => void>>;
  on(name: string, listener: (data: unknown) => void): void;
  off(name: string, listener: (data: unknown) => void): void;
}

type HostRequest =
  | 'getContext'
  | 'getCurrentUser'
  | 'getSettings'
  | 'getApiInfo'
  | 'getAccessToken'
  | 'getTheme'
  | 'navigate'
  | 'notify';

type Listener = (data: unknown) => void;

/** Tells whether `value` looks like the API the back office injects into a Web Component. */
export const isInjectedHostApi = (value: unknown): value is InjectedHostApi => {
  if (typeof value !== 'object' || value === null) return false;
  const api = value as Record<string, unknown>;
  return (
    typeof api.getContext === 'function' &&
    typeof api.on === 'function' &&
    typeof api.off === 'function'
  );
};

/** Rethrows `error` outside the current call stack, so that the widget's code goes on. */
const reportLater = (error: unknown): void => {
  queueMicrotask(() => {
    throw error;
  });
};

const disconnected = (request: string): BoError =>
  new BoError('DISCONNECTED', `${request}: the connection to the back office is closed`);

/**
 * Wraps the API injected into a Web Component as a transport, with the behavior of the port: same
 * requests, errors converted to `BoError`, `resize` answered `{ height: null }`, a listener added
 * twice called once, and after `close` pending and new requests reject with `DISCONNECTED`, no
 * event is delivered and logs are dropped.
 */
export const createInjectedTransport = (hostApi: InjectedHostApi): BoTransport => {
  // Listeners added through this transport, so that `close` removes them from the host API.
  const listeners = new Map<string, Set<Listener>>();
  // Rejects of the requests in flight, with their name, called by `close`.
  const pending = new Map<(error: BoError) => void, HostRequest>();
  let closed = false;

  const call =
    (request: HostRequest) =>
    (payload?: unknown): Promise<never> =>
      new Promise<never>((resolve, reject) => {
        if (closed) {
          reject(disconnected(request));
          return;
        }
        const method = hostApi[request] as ((payload?: unknown) => Promise<never>) | undefined;
        if (typeof method !== 'function') {
          reject(new BoError('UNKNOWN_TYPE', `${request}: not served by this back office`));
          return;
        }
        pending.set(reject, request);
        Promise.resolve()
          .then(() => method.call(hostApi, payload))
          .then(resolve, (error: unknown) => reject(fromHostError(error, request)))
          .finally(() => pending.delete(reject));
      });

  return {
    mode: 'webcomponent',
    protocolVersion:
      typeof hostApi.protocolVersion === 'number' ? hostApi.protocolVersion : PROTOCOL_VERSION,
    grantedPermissions: null,
    getContext: call('getContext'),
    getCurrentUser: call('getCurrentUser'),
    getSettings: call('getSettings'),
    getApiInfo: call('getApiInfo'),
    getAccessToken: call('getAccessToken'),
    getTheme: call('getTheme'),
    navigate: call('navigate'),
    notify: call('notify'),
    resize: async () => {
      if (closed) throw disconnected('resize');
      return { height: null };
    },
    on<K extends BoEventName>(name: K, listener: BoEventListener<K>) {
      if (closed || listeners.get(name)?.has(listener as Listener)) return;
      hostApi.on(name, listener as Listener);
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)?.add(listener as Listener);
    },
    off<K extends BoEventName>(name: K, listener: BoEventListener<K>) {
      if (!listeners.get(name)?.delete(listener as Listener)) return;
      hostApi.off(name, listener as Listener);
    },
    log(level, message, context) {
      if (closed) return;
      const method = hostApi.log?.[level];
      if (typeof method !== 'function') return;
      try {
        method.call(hostApi.log, message, context);
      } catch (error) {
        // A back office bug: logging must not break the widget.
        reportLater(error);
      }
    },
    close() {
      if (closed) return;
      closed = true;
      for (const [reject, request] of pending) reject(disconnected(request));
      pending.clear();
      // A failing `off` (back office bug) must not keep the other listeners attached.
      for (const [name, set] of listeners) {
        for (const listener of set) {
          try {
            hostApi.off(name, listener);
          } catch (error) {
            reportLater(error);
          }
        }
      }
      listeners.clear();
    },
  };
};
