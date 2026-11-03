import { BoError, fromWireError, type WireError } from './errors.js';
import {
  PROTOCOL_VERSION,
  type BoEventListener,
  type BoEventName,
  type BoRequests,
  type BoTransport,
} from './types.js';

/** Window the `hello` is posted to: the back office, parent of the widget's iframe. */
export interface HelloTarget {
  postMessage(message: unknown, targetOrigin: string, transfer: Transferable[]): void;
}

/** Options of {@link openPortTransport}. */
export interface PortTransportOptions {
  target: HelloTarget;
  targetOrigin: string;
  widgetId: string | null;
  widgetVersion: string | null;
  handshakeTimeout: number;
  requestTimeout: number;
}

interface Pending {
  resolve: (result: never) => void;
  reject: (error: BoError) => void;
  timer: ReturnType<typeof setTimeout>;
}

type Listener = (data: unknown) => void;

/** Rethrows `error` outside the current call stack: a failing listener must not stop the others. */
const reportListenerError = (error: unknown): void => {
  queueMicrotask(() => {
    throw error;
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Opens the channel of an iframe widget: posts `hello` with a `MessagePort` to the back office,
 * waits for `welcome`, then sends each request `{ id, type, payload }` on the port and matches the
 * answers `{ id, ok, result | error }` by `id`. Events `{ type: 'event', name, data }` are
 * dispatched to the listeners added with `on`.
 *
 * @returns The transport, once the back office answered `welcome`.
 * @throws {BoError} `TIMEOUT` when no answer comes in `handshakeTimeout` ms, or the error the back
 * office answers instead of `welcome`.
 */
export const openPortTransport = (options: PortTransportOptions): Promise<BoTransport> => {
  const { port1: port, port2 } = new MessageChannel();
  const pending = new Map<string, Pending>();
  const listeners = new Map<string, Set<Listener>>();
  let nextId = 0;
  let closed = false;

  const close = (): void => {
    if (closed) return;
    closed = true;
    port.removeEventListener('message', onMessage);
    port.close();
    for (const { reject, timer } of pending.values()) {
      clearTimeout(timer);
      reject(new BoError('DISCONNECTED', 'The connection to the back office is closed'));
    }
    pending.clear();
    listeners.clear();
  };

  const dispatchEvent = (name: unknown, data: unknown): void => {
    if (typeof name !== 'string') return;
    for (const listener of [...(listeners.get(name) ?? [])]) {
      try {
        listener(data);
      } catch (error) {
        reportListenerError(error);
      }
    }
  };

  const settle = (message: Record<string, unknown>): void => {
    const id = String(message.id);
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id);
    clearTimeout(request.timer);
    if (message.ok === true) request.resolve(message.result as never);
    else request.reject(fromWireError(message.error as WireError | undefined, 'Request'));
  };

  // Replaced once `welcome` is received.
  let onHandshake: (message: Record<string, unknown>) => void = () => {};
  let handshakeDone = false;

  function onMessage(event: MessageEvent): void {
    const message: unknown = event.data;
    if (!isRecord(message)) return;
    if (!handshakeDone) {
      onHandshake(message);
      return;
    }
    if (message.type === 'event') dispatchEvent(message.name, message.data);
    else if ('id' in message) settle(message);
  }

  const request =
    (type: keyof BoRequests) =>
    (payload?: unknown): Promise<never> =>
      new Promise((resolve, reject) => {
        if (closed) {
          reject(
            new BoError('DISCONNECTED', `${type}: the connection to the back office is closed`),
          );
          return;
        }
        const id = String(++nextId);
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(
            new BoError(
              'TIMEOUT',
              `${type}: no answer from the back office in ${options.requestTimeout} ms`,
            ),
          );
        }, options.requestTimeout);
        pending.set(id, { resolve, reject, timer });
        try {
          port.postMessage(payload === undefined ? { id, type } : { id, type, payload });
        } catch (error) {
          pending.delete(id);
          clearTimeout(timer);
          reject(new BoError('INTERNAL', `${type}: cannot send the request`, { cause: error }));
        }
      });

  return new Promise<BoTransport>((resolve, reject) => {
    const timer = setTimeout(() => {
      close();
      reject(
        new BoError(
          'TIMEOUT',
          `No answer from the back office in ${options.handshakeTimeout} ms: is the widget displayed by the back office?`,
        ),
      );
    }, options.handshakeTimeout);

    onHandshake = (message) => {
      if (message.type === 'error') {
        clearTimeout(timer);
        close();
        reject(fromWireError(message.error as WireError | undefined, 'hello'));
        return;
      }
      if (message.type !== 'welcome') return;
      clearTimeout(timer);
      handshakeDone = true;
      const granted = Array.isArray(message.grantedPermissions)
        ? message.grantedPermissions.filter((item): item is string => typeof item === 'string')
        : [];
      resolve({
        mode: 'iframe',
        protocolVersion:
          typeof message.protocolVersion === 'number' ? message.protocolVersion : PROTOCOL_VERSION,
        grantedPermissions: Object.freeze(granted),
        getContext: request('getContext'),
        getCurrentUser: request('getCurrentUser'),
        getSettings: request('getSettings'),
        getApiInfo: request('getApiInfo'),
        getAccessToken: request('getAccessToken'),
        getTheme: request('getTheme'),
        navigate: request('navigate'),
        notify: request('notify'),
        resize: request('resize'),
        on<K extends BoEventName>(name: K, listener: BoEventListener<K>) {
          if (closed) return;
          if (!listeners.has(name)) listeners.set(name, new Set());
          listeners.get(name)?.add(listener as Listener);
        },
        off<K extends BoEventName>(name: K, listener: BoEventListener<K>) {
          listeners.get(name)?.delete(listener as Listener);
        },
        close,
      });
    };

    port.addEventListener('message', onMessage);
    port.start();
    try {
      options.target.postMessage(
        {
          protocol: 'vulog-bo',
          version: PROTOCOL_VERSION,
          type: 'hello',
          widgetId: options.widgetId,
          widgetVersion: options.widgetVersion,
        },
        options.targetOrigin,
        [port2],
      );
    } catch (error) {
      clearTimeout(timer);
      close();
      reject(
        new BoError('DISCONNECTED', 'Cannot post the handshake to the back office', {
          cause: error,
        }),
      );
    }
  });
};
