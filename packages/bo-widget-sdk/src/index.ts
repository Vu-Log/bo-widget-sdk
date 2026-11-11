/**
 * Framework-agnostic client for widgets embedded in the Vulog back office, as a Web Component or
 * in an iframe. Start with {@link connect}.
 *
 * Manifest schemas live in `@vulog/bo-widget-sdk/manifest`.
 *
 * @packageDocumentation
 */
export { connect, type ConnectOptions } from './connect.js';
export { BoError, type BoErrorCode, type BoErrorDetails } from './errors.js';
export { TOKEN_REFRESH_MARGIN_MS } from './authFetch.js';
export {
  PROTOCOL_VERSION,
  type AuthFetch,
  type BoAccessToken,
  type BoApiInfo,
  type BoClient,
  type BoContext,
  type BoCurrentUser,
  type BoEventListener,
  type BoEventMap,
  type BoEventName,
  type BoLogContext,
  type BoLogger,
  type BoLogLevel,
  type BoMode,
  type BoNavigatePayload,
  type BoNotifyPayload,
  type BoNotifySeverity,
  type BoPermission,
  type BoRequests,
  type BoResizePayload,
  type BoSettings,
  type BoTheme,
  type BoUserFleet,
} from './types.js';
