import { BoError, fromWireError, type WireError } from './errors.js';
import {
  PROTOCOL_VERSION,
  type BoEventListener,
  type BoEventName,
  type BoRequests,
  type BoStorageSpace,
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
  type: string;
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

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/**
 * Opens the channel of an iframe widget: posts `hello` with a `MessagePort` to the back office,
 * waits for `welcome`, then sends each request `{ id, type, payload }` on the port and matches the
 * answers `{ id, ok, result | error }` by `id`. Events `{ type: 'event', name, data }` are
 * dispatched to the listeners added with `on`. A log is a `log` request whose answer is not waited
 * for.
 *
 * When the back office closes its end of the port (widget removed), pending and later requests
 * reject with `DISCONNECTED` and no event is delivered any more. A browser without the `close`
 * event of `MessagePort` only notices it through the request timeout.
 *
 * @returns The transport, once the back office answered `welcome`.
 * @throws {BoError} `TIMEOUT` when no answer comes in `handshakeTimeout` ms, `INTERNAL` with
 * reason `invalid-welcome` for a malformed `welcome`, `DISCONNECTED` when the port closes first, or
 * the error the back office answers instead of `welcome`.
 */
export const openPortTransport = (options: PortTransportOptions): Promise<BoTransport> => {
  const { port1: port, port2 } = new MessageChannel();
  const pending = new Map<string, Pending>();
  const listeners = new Map<string, Set<Listener>>();
  let nextId = 0;
  let closed = false;
  let handshakeDone = false;
  // Set while the handshake is pending, so that `close` can reject it.
  let rejectHandshake: ((error: BoError) => void) | null = null;
  // Set while the handshake is pending: rejects it and closes the port.
  let failHandshake: ((error: BoError) => void) | null = null;

  const rejectPending = (error: (type: string) => BoError): void => {
    for (const { type, reject, timer } of pending.values()) {
      clearTimeout(timer);
      reject(error(type));
    }
    pending.clear();
  };

  const close = (why = 'the connection to the back office is closed'): void => {
    if (closed) return;
    closed = true;
    port.removeEventListener('message', onMessage);
    port.removeEventListener('messageerror', onMessageError);
    port.removeEventListener('close', onPortClose);
    port.close();
    rejectPending((type) => new BoError('DISCONNECTED', `${type}: ${why}`));
    listeners.clear();
    rejectHandshake?.(new BoError('DISCONNECTED', `hello: ${why}`));
    rejectHandshake = null;
  };

  function onPortClose(): void {
    close('the back office closed the connection');
  }

  // A message that cannot be deserialized has no readable id or type: it may be the welcome, any
  // pending answer, or an event, so the handshake or every pending request is rejected.
  function onMessageError(): void {
    if (!handshakeDone) {
      failHandshake?.(
        new BoError('INTERNAL', 'hello: unreadable answer from the back office', {
          reason: 'messageerror',
        }),
      );
      return;
    }
    rejectPending(
      (type) =>
        new BoError('INTERNAL', `${type}: unreadable answer from the back office`, {
          reason: 'messageerror',
        }),
    );
  }

  const dispatchEvent = (name: unknown, data: unknown): void => {
    if (typeof name !== 'string') return;
    for (const listener of [...(listeners.get(name) ?? [])]) {
      // A listener may disconnect the widget: the next ones must not run.
      if (closed) return;
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
    if (message.ok === true) {
      request.resolve(message.result as never);
    } else if (message.ok === false && isRecord(message.error)) {
      request.reject(fromWireError(message.error as WireError, request.type));
    } else {
      request.reject(
        new BoError('INTERNAL', `${request.type}: malformed answer from the back office`, {
          reason: 'malformed-answer',
        }),
      );
    }
  };

  // Replaced by the handshake below.
  let onHandshake: (message: Record<string, unknown>) => void = () => {};

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
    (type: keyof BoRequests | 'log' | BoStorageSpace) =>
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
        pending.set(id, { type, resolve, reject, timer });
        try {
          port.postMessage(payload === undefined ? { id, type } : { id, type, payload });
        } catch (error) {
          pending.delete(id);
          clearTimeout(timer);
          // A payload that cannot be cloned (a function, a DOM node) is the widget's mistake.
          const code = (error as Error)?.name === 'DataCloneError' ? 'INVALID_PAYLOAD' : 'INTERNAL';
          reject(new BoError(code, `${type}: cannot send the request`, { cause: error }));
        }
      });

  return new Promise<BoTransport>((resolve, reject) => {
    const timer = setTimeout(() => {
      rejectHandshake = null;
      close();
      reject(
        new BoError(
          'TIMEOUT',
          `No answer from the back office in ${options.handshakeTimeout} ms: is the widget displayed by the back office?`,
        ),
      );
    }, options.handshakeTimeout);
    rejectHandshake = (error) => {
      clearTimeout(timer);
      reject(error);
    };

    const fail = (error: BoError): void => {
      rejectHandshake = null;
      failHandshake = null;
      clearTimeout(timer);
      close();
      reject(error);
    };

    failHandshake = fail;

    onHandshake = (message) => {
      if (message.type === 'error') {
        fail(fromWireError(isRecord(message.error) ? message.error : undefined, 'hello'));
        return;
      }
      if (message.type !== 'welcome') return;
      if (
        typeof message.protocolVersion !== 'number' ||
        !isStringArray(message.grantedPermissions)
      ) {
        fail(
          new BoError(
            'INTERNAL',
            'hello: malformed welcome from the back office (protocolVersion or grantedPermissions)',
            { reason: 'invalid-welcome' },
          ),
        );
        return;
      }
      rejectHandshake = null;
      failHandshake = null;
      clearTimeout(timer);
      handshakeDone = true;
      // Answered `null` by the back office: nothing to wait for. A rejection (older back office
      // without `log`, timeout, closed channel) is dropped: logging must not break the widget.
      const sendLog = request('log');
      const sendStorage = { storage: request('storage'), sharedStorage: request('sharedStorage') };
      resolve({
        mode: 'iframe',
        protocolVersion: message.protocolVersion,
        grantedPermissions: Object.freeze([...message.grantedPermissions]),
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
        log(level, message, context) {
          if (closed) return;
          sendLog(context === undefined ? { level, message } : { level, message, context }).catch(
            () => {},
          );
        },
        // `{ op, collection, id?, value?, options? }`, answered with the result of the operation.
        storage: (space, storageRequest) => sendStorage[space](storageRequest),
        close: () => close(),
      });
    };

    port.addEventListener('message', onMessage);
    port.addEventListener('messageerror', onMessageError);
    port.addEventListener('close', onPortClose);
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
      fail(
        new BoError('DISCONNECTED', 'Cannot post the handshake to the back office', {
          cause: error,
        }),
      );
    }
  });
};
