import { createAuthFetch } from './authFetch.js';
import { BoError } from './errors.js';
import { createInjectedTransport, isInjectedHostApi } from './injectedTransport.js';
import { openPortTransport } from './portTransport.js';
import type { BoClient, BoTransport } from './types.js';

/** Options of {@link connect}. */
export interface ConnectOptions {
  /** Id of the widget, sent in the iframe handshake (informative: the back office identifies the iframe itself). */
  widgetId?: string;
  /** Version of the widget, sent in the iframe handshake (informative). */
  widgetVersion?: string;
  /**
   * Origin of the back office the iframe handshake is posted to. Defaults to `'*'`, since a widget
   * usually does not know which back office displays it. Set it when it does, so that no other
   * page that would frame the widget can answer the handshake.
   */
  targetOrigin?: string;
  /** Time to wait for the back office to answer the iframe handshake, in ms. Defaults to 10 000; `Infinity` waits as long as timers allow. */
  handshakeTimeout?: number;
  /** Time to wait for the answer to a request in an iframe, in ms. Defaults to 30 000; `Infinity` waits as long as timers allow. */
  requestTimeout?: number;
}

const DEFAULT_HANDSHAKE_TIMEOUT = 10_000;
const DEFAULT_REQUEST_TIMEOUT = 30_000;
// Longest delay `setTimeout` accepts: a longer one fires at once.
const MAX_TIMEOUT = 2 ** 31 - 1;

/** Reads a timeout option: a positive number of ms, capped so that `Infinity` means "as long as possible". */
const readTimeout = (name: string, value: number | undefined, fallback: number): number => {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    throw new TypeError(`connect: ${name} must be a positive number of milliseconds`);
  }
  return Math.min(value, MAX_TIMEOUT);
};

const toClient = (transport: BoTransport): BoClient => {
  const authFetch = createAuthFetch(transport);
  let disconnected = false;
  const client: BoClient = {
    mode: transport.mode,
    protocolVersion: transport.protocolVersion,
    grantedPermissions: transport.grantedPermissions,
    getContext: () => transport.getContext(),
    getCurrentUser: () => transport.getCurrentUser(),
    getSettings: () => transport.getSettings(),
    getApiInfo: () => transport.getApiInfo(),
    getAccessToken: () => transport.getAccessToken(),
    getTheme: () => transport.getTheme(),
    navigate: (payload) => transport.navigate(payload),
    notify: (payload) => transport.notify(payload),
    resize: (payload) => transport.resize(payload),
    on(name, listener) {
      transport.on(name, listener);
      return () => transport.off(name, listener);
    },
    off: (name, listener) => transport.off(name, listener),
    // Its cache would otherwise keep sending authenticated calls after `disconnect`.
    authFetch: (input, init) =>
      disconnected
        ? Promise.reject(
            new BoError('DISCONNECTED', 'authFetch: the connection to the back office is closed'),
          )
        : authFetch(input, init),
    disconnect: () => {
      disconnected = true;
      transport.close();
    },
  };
  return Object.freeze(client);
};

/**
 * Connects a widget to the back office that displays it.
 *
 * - As a Web Component, pass the element (`this` in `connectedCallback`): the client uses the API
 *   the back office injected into it (`element.vulogBo`).
 * - In an iframe, call it without element: the client opens a channel with the back office (parent
 *   window) through `postMessage`.
 *
 * Either way, the returned client has the same API, so the widget's code is the same.
 *
 * An element without `vulogBo` inside an iframe falls back to the iframe channel.
 *
 * @param element - The widget's custom element, or nothing in an iframe.
 * @param options - Options of the iframe channel; ignored for a Web Component, but validated.
 * @returns The connected client.
 * @throws {TypeError} When a timeout option is not a positive number.
 * @throws {BoError} `DISCONNECTED` when the widget is neither given the injected API nor in an
 * iframe, or when the handshake cannot be posted or the channel closes; `INTERNAL` with reason
 * `invalid-host-api` when `element.vulogBo` is not a back office API, or `invalid-welcome` when the
 * back office answers a malformed `welcome`; `TIMEOUT` when the back office does not answer the
 * handshake; or the error the back office answers instead of `welcome`.
 *
 * @example
 * ```ts
 * import { connect, type BoClient } from '@vulog/bo-widget-sdk';
 *
 * // Export the class: the back office registers it, never call customElements.define.
 * export default class FleetReport extends HTMLElement {
 *   private bo?: BoClient;
 *
 *   async connectedCallback() {
 *     this.bo = await connect(this);
 *     const { fleetId } = await this.bo.getContext();
 *     const response = await this.bo.authFetch(`fleets/${fleetId}/vehicles`);
 *     const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
 *     root.textContent = `${(await response.json()).length} vehicles`;
 *   }
 *
 *   disconnectedCallback() {
 *     this.bo?.disconnect();
 *   }
 * }
 * ```
 */
export const connect = async (
  element?: object | null,
  options: ConnectOptions = {},
): Promise<BoClient> => {
  // Validated in both modes, so that a wrong option fails the same way wherever the widget runs.
  const handshakeTimeout = readTimeout(
    'handshakeTimeout',
    options.handshakeTimeout,
    DEFAULT_HANDSHAKE_TIMEOUT,
  );
  const requestTimeout = readTimeout(
    'requestTimeout',
    options.requestTimeout,
    DEFAULT_REQUEST_TIMEOUT,
  );
  const injected = (element as { vulogBo?: unknown } | null | undefined)?.vulogBo;
  if (isInjectedHostApi(injected)) return toClient(createInjectedTransport(injected));
  if (injected !== undefined && injected !== null) {
    throw new BoError(
      'INTERNAL',
      'element.vulogBo is not a back office API (getContext, on and off are required)',
      { reason: 'invalid-host-api' },
    );
  }

  const inIframe = typeof window !== 'undefined' && window.parent !== window;
  if (!inIframe) {
    throw new BoError(
      'DISCONNECTED',
      element
        ? 'The element has no vulogBo API: call connect(this) from connectedCallback of a widget the back office displays'
        : 'Not displayed by the back office: pass the element as a Web Component, or run in the back office iframe',
    );
  }
  const transport = await openPortTransport({
    target: window.parent,
    targetOrigin: options.targetOrigin ?? '*',
    widgetId: options.widgetId ?? null,
    widgetVersion: options.widgetVersion ?? null,
    handshakeTimeout,
    requestTimeout,
  });
  return toClient(transport);
};
