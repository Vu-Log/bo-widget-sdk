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
  /** Time to wait for the back office to answer the iframe handshake, in ms. Defaults to 10 000. */
  handshakeTimeout?: number;
  /** Time to wait for the answer to a request in an iframe, in ms. Defaults to 30 000. */
  requestTimeout?: number;
}

const DEFAULT_HANDSHAKE_TIMEOUT = 10_000;
const DEFAULT_REQUEST_TIMEOUT = 30_000;

const toClient = (transport: BoTransport): BoClient => {
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
    authFetch: createAuthFetch(transport),
    disconnect: () => transport.close(),
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
 * @param element - The widget's custom element, or nothing in an iframe.
 * @param options - Handshake options (iframe only).
 * @returns The connected client.
 * @throws {BoError} `DISCONNECTED` when the widget is neither given the injected API nor in an
 * iframe, `TIMEOUT` when the back office does not answer the handshake, or the error it answers.
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
 *     const response = await this.bo.authFetch(`api/v1/fleets/${fleetId}/vehicles`);
 *     this.attachShadow({ mode: 'open' }).textContent = `${(await response.json()).length} vehicles`;
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
  const injected = (element as { vulogBo?: unknown } | null | undefined)?.vulogBo;
  if (isInjectedHostApi(injected)) return toClient(createInjectedTransport(injected));

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
    handshakeTimeout: options.handshakeTimeout ?? DEFAULT_HANDSHAKE_TIMEOUT,
    requestTimeout: options.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT,
  });
  return toClient(transport);
};
