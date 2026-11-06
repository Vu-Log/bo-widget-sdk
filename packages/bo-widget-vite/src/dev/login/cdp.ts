/**
 * Minimal Chrome DevTools Protocol client: JSON-RPC over the WebSocket of the browser target,
 * with flat sessions (`sessionId`). Only what login mode needs: commands and the end of the
 * connection; events are ignored.
 *
 * @packageDocumentation
 */

/** Options of one CDP command. */
export interface CdpSendOptions {
  /** Session of an attached target (flat mode), for the commands of that target. */
  readonly sessionId?: string;
  /** How long to wait for the answer (ms); {@link CDP_TIMEOUT_MS} by default. */
  readonly timeoutMs?: number;
}

/** Default wait for the answer of a CDP command (ms). */
export const CDP_TIMEOUT_MS = 5_000;

/** A CDP connection to a browser. */
export interface CdpConnection {
  /**
   * Sends a command and waits for its result. The result is not checked: `T` is what the caller
   * expects from Chrome.
   *
   * @param method - CDP method (`Target.getTargets`).
   * @param params - Its parameters.
   * @param options - Target session and timeout.
   * @throws {Error} When CDP answers an error, does not answer in time (a tab paused in the
   * debugger, or showing a dialog), or the connection is closed or closes before the answer.
   */
  send<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
    options?: CdpSendOptions,
  ): Promise<T>;
  /** Calls `listener` once, when the connection closes (Chrome closed, or {@link close}). */
  onClose(listener: () => void): void;
  /** Whether the connection is closed. */
  readonly closed: boolean;
  /** Closes the connection; the commands waiting for an answer fail. */
  close(): void;
}

/** The part of the WHATWG `WebSocket` the client uses. */
export interface CdpSocket {
  send(data: string): void;
  close(): void;
  addEventListener(type: 'open' | 'close' | 'error', listener: () => void): void;
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
}

/** Builds a WebSocket: the global one of Node.js ≥ 22, replaced in tests. */
export type CdpSocketFactory = (url: string) => CdpSocket;

interface Pending {
  resolve(value: unknown): void;
  reject(error: Error): void;
}

const defaultFactory: CdpSocketFactory = (url) => {
  if (typeof globalThis.WebSocket !== 'function') {
    throw new Error(
      'Fake back office in login mode: needs Node.js 22 or later (global WebSocket).',
    );
  }
  return new globalThis.WebSocket(url) as unknown as CdpSocket;
};

/**
 * Opens a CDP connection.
 *
 * @param url - `webSocketDebuggerUrl` of the browser (`ws://127.0.0.1:{port}/devtools/browser/…`).
 * @param factory - Builds the WebSocket; the global `WebSocket` by default.
 * @returns The connection, once open.
 * @throws {Error} When the WebSocket cannot be opened, or without a global `WebSocket`.
 */
export const connectCdp = (
  url: string,
  factory: CdpSocketFactory = defaultFactory,
): Promise<CdpConnection> =>
  new Promise((resolveOpen, rejectOpen) => {
    const socket = factory(url);
    const pending = new Map<number, Pending>();
    const closeListeners: (() => void)[] = [];
    let nextId = 1;
    let open = false;
    let closed = false;

    const finish = (): void => {
      if (closed) return;
      closed = true;
      for (const { reject } of [...pending.values()]) reject(new Error('CDP connection closed'));
      if (!open) rejectOpen(new Error(`cannot connect to the Chrome DevTools of ${url}`));
      for (const listener of closeListeners.splice(0)) listener();
    };

    const connection: CdpConnection = {
      send<T>(method: string, params: Record<string, unknown> = {}, options: CdpSendOptions = {}) {
        if (closed) return Promise.reject(new Error('CDP connection closed'));
        const id = nextId++;
        const { sessionId, timeoutMs = CDP_TIMEOUT_MS } = options;
        return new Promise<T>((resolve, reject) => {
          const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`CDP ${method} timed out after ${timeoutMs / 1000} s`));
          }, timeoutMs);
          const settle =
            <A extends unknown[]>(done: (...args: A) => void) =>
            (...args: A) => {
              clearTimeout(timer);
              pending.delete(id);
              done(...args);
            };
          pending.set(id, {
            resolve: settle(resolve as (value: unknown) => void),
            reject: settle(reject),
          });
          try {
            socket.send(
              JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }),
            );
          } catch (error) {
            pending.get(id)?.reject(error as Error);
          }
        });
      },
      onClose(listener) {
        if (closed) listener();
        else closeListeners.push(listener);
      },
      get closed() {
        return closed;
      },
      close() {
        socket.close();
        finish();
      },
    };

    socket.addEventListener('open', () => {
      open = true;
      resolveOpen(connection);
    });
    socket.addEventListener('error', finish);
    socket.addEventListener('close', finish);
    socket.addEventListener('message', ({ data }) => {
      let message: { id?: unknown; result?: unknown; error?: { message?: unknown } };
      try {
        message = JSON.parse(String(data)) as typeof message;
      } catch {
        // Chrome only sends JSON: anything else answers no command.
        return;
      }
      // Events (no id) and late answers to timed-out commands are not waited for.
      if (typeof message.id !== 'number') return;
      const waiting = pending.get(message.id);
      if (!waiting) return;
      if (message.error) {
        waiting.reject(new Error(`CDP error: ${String(message.error.message ?? 'unknown')}`));
      } else {
        waiting.resolve(message.result);
      }
    });
  });
