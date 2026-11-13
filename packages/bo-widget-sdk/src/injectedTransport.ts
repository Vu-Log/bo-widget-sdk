import { BoError, fromHostError } from './errors.js';
import {
  PROTOCOL_VERSION,
  type BoEventListener,
  type BoLogContext,
  type BoLogLevel,
  type BoEventName,
  type BoRequests,
  type BoStorageArgs,
  type BoStorageOp,
  type BoStorageRequest,
  type BoStorageSpace,
  type BoTransport,
} from './types.js';

/**
 * `vulogBo.storage` / `vulogBo.sharedStorage`: one method per operation, with the arguments of
 * {@link BoStorageArgs}. Rejects with an error whose `code` is `FORBIDDEN`, `invalid-payload`, a
 * server code (`not-found`, `version-conflict`…) or a code of the back office (`not-installed`,
 * `disposed`, `ERR_NETWORK`…). A method an older back office lacks is `UNKNOWN_TYPE`.
 */
export type InjectedStorageApi = Partial<{
  [K in BoStorageOp]: (...args: BoStorageArgs[K]) => Promise<unknown>;
}>;

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
  /** The widget's data space. Missing on an older back office: storage requests reject with `UNKNOWN_TYPE`. */
  readonly storage?: InjectedStorageApi;
  /** The shared data space of the widget's publisher. */
  readonly sharedStorage?: InjectedStorageApi;
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

/** The arguments of the `vulogBo.storage` method of a request, in the order of {@link BoStorageArgs}. */
const storageArguments = (request: BoStorageRequest): BoStorageArgs[BoStorageOp] => {
  switch (request.op) {
    case 'get':
    case 'delete':
      return [request.collection, request.id];
    case 'set':
    case 'update':
      return [request.collection, request.id, request.value, request.options];
    case 'add':
      return [request.collection, request.value, request.options];
    case 'list':
      return [request.collection, request.options];
    case 'query':
      return [request.collection, request.options];
    case 'clear':
      return [request.collection];
  }
};

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
  const pending = new Map<(error: BoError) => void, string>();
  let closed = false;

  /**
   * Calls a method of the host API: rejects with `DISCONNECTED` once closed, `UNKNOWN_TYPE` when
   * the back office does not serve it, and the host's error as a `BoError`.
   */
  const invoke = (
    request: string,
    target: object | undefined,
    method: unknown,
    args: unknown[],
  ): Promise<never> =>
    new Promise<never>((resolve, reject) => {
      if (closed) {
        reject(disconnected(request));
        return;
      }
      if (typeof method !== 'function') {
        reject(new BoError('UNKNOWN_TYPE', `${request}: not served by this back office`));
        return;
      }
      pending.set(reject, request);
      Promise.resolve()
        .then(() => (method as (...args: unknown[]) => unknown).apply(target, args))
        .then(resolve as (value: unknown) => void, (error: unknown) =>
          reject(fromHostError(error, request)),
        )
        .finally(() => pending.delete(reject));
    });

  const call =
    (request: HostRequest) =>
    (payload?: unknown): Promise<never> =>
      invoke(request, hostApi, hostApi[request], [payload]);

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
    storage(space: BoStorageSpace, request: BoStorageRequest) {
      const api = hostApi[space];
      const method = typeof api === 'object' && api !== null ? api[request.op] : undefined;
      return invoke(`${space}.${request.op}`, api, method, storageArguments(request));
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
