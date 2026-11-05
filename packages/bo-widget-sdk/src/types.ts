/** Version of the back office protocol this SDK speaks. */
export const PROTOCOL_VERSION = 2;

/** How the widget runs in the back office. */
export type BoMode = 'webcomponent' | 'iframe';

/** A permission a widget declares in its manifest. */
export type BoPermission = 'accessToken' | 'apiInfo' | 'navigate' | 'notify';

/** Context of the back office page the widget is displayed in (`getContext`). */
export interface BoContext {
  fleetId: string | null;
  host: string | null;
  /**
   * Language of the back office, as `language_COUNTRY` with an underscore: `en_GB` (the BO default),
   * `fr_FR`, `de_DE`… Not a BCP 47 tag: `Intl` refuses `en_GB`, so replace the underscore first
   * (`locale.replace('_', '-')`).
   */
  locale: string | null;
  timezone: string | null;
  currency: string | null;
  /** Version of the back office. */
  boVersion: string;
  /** Path of the widget's view in the back office router: its sub-routes start there. */
  basename: string;
}

/** A fleet the connected user has access to, with their profile in it. */
export interface BoUserFleet {
  fleetId: string;
  profile: string | null;
}

/** The connected user, as the back office shows it (`getCurrentUser`). Never the raw token. */
export interface BoCurrentUser {
  id: string | null;
  userName: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  currentFleetId: string | null;
  originalFleetId: string | null;
  roles: string[];
  fleets: BoUserFleet[];
  /** True when the user has access to several fleets. */
  isFranchiseOperator: boolean;
}

/** Theme of the back office (`getTheme`), in the shape of a MUI theme. */
export interface BoTheme {
  palette: Record<string, unknown>;
  typography: Record<string, unknown>;
  mode: 'light' | 'dark' | (string & {});
}

/** What a widget needs to call the Vulog APIs (`getApiInfo`, permission `apiInfo`). */
export interface BoApiInfo {
  /** Absolute URL every Vulog API path is relative to. */
  baseUrl: string;
  /** Value of the `X-API-Key` header. */
  apiKey: string;
}

/** Access token of the connected user (`getAccessToken`, permission `accessToken`). */
export interface BoAccessToken {
  accessToken: string;
  /** Expiry in milliseconds since the epoch, `null` when unknown. */
  expiresAt: number | null;
}

/** Settings of the widget installation, keyed by the setting keys of the manifest. */
export type BoSettings = Record<string, unknown>;

/** Payload of `navigate`. */
export interface BoNavigatePayload {
  /**
   * A back office route under the fleet when it starts with `/` (`/app/vehicles/123`), otherwise
   * a path relative to the widget's view (`details/1`).
   */
  path: string;
}

/** Severity of a `notify` snackbar. */
export type BoNotifySeverity = 'success' | 'info' | 'warning' | 'error';

/** Payload of `notify`. */
export interface BoNotifyPayload {
  message: string;
  /** `info` when absent. */
  severity?: BoNotifySeverity | null;
}

/** Payload of `resize`. */
export interface BoResizePayload {
  /** Height in pixels, or `null` to fill the content zone again. */
  height: number | null;
}

/** Data of each event the back office pushes to the widget. */
export interface BoEventMap {
  /** The new language, in the format of {@link BoContext.locale} (`en_GB`). */
  localeChanged: { locale: string | null };
  fleetChanged: { fleetId: string | null };
  userChanged: BoCurrentUser;
  themeChanged: BoTheme;
  routeChanged: { pathname: string; search: string; hash: string };
}

/** Name of an event the back office pushes. */
export type BoEventName = keyof BoEventMap;

/** Listener of a back office event. */
export type BoEventListener<K extends BoEventName> = (data: BoEventMap[K]) => void;

/**
 * Requests of the protocol, with their payload and result. Both transports serve them, so a
 * widget's code is the same as a Web Component and in an iframe.
 */
export interface BoRequests {
  getContext(): Promise<BoContext>;
  getCurrentUser(): Promise<BoCurrentUser>;
  getSettings(): Promise<BoSettings>;
  /** Requires the `apiInfo` permission. */
  getApiInfo(): Promise<BoApiInfo>;
  /** Requires the `accessToken` permission. */
  getAccessToken(): Promise<BoAccessToken>;
  getTheme(): Promise<BoTheme>;
  /** Requires the `navigate` permission. Resolves with the route asked for. */
  navigate(payload: BoNavigatePayload): Promise<{ path: string }>;
  /** Requires the `notify` permission. */
  notify(payload: BoNotifyPayload): Promise<null>;
  /**
   * Asks for a height (iframe only). Resolves with the height applied, `{ height: null }` when the
   * back office keeps the whole content zone, which is always the case for a Web Component.
   */
  resize(payload: BoResizePayload): Promise<{ height: number | null }>;
}

/**
 * A transport to the back office: the injected API of a Web Component, or the message port of an
 * iframe. Internal to the SDK.
 */
export interface BoTransport extends BoRequests {
  readonly mode: BoMode;
  readonly protocolVersion: number;
  readonly grantedPermissions: readonly string[] | null;
  on<K extends BoEventName>(name: K, listener: BoEventListener<K>): void;
  off<K extends BoEventName>(name: K, listener: BoEventListener<K>): void;
  close(): void;
}

/** Signature of {@link BoClient.authFetch}. */
export type AuthFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;

/** Connection to the back office, returned by `connect`. */
export interface BoClient extends BoRequests {
  /** How the widget runs. */
  readonly mode: BoMode;
  /** Protocol version the back office serves (this SDK's version when an injected API does not say). */
  readonly protocolVersion: number;
  /**
   * Permissions the back office grants the widget (iframe), `null` for a Web Component, whose
   * permissions are only declarative.
   */
  readonly grantedPermissions: readonly string[] | null;
  /**
   * Calls `listener` on each `name` event the back office pushes. A listener added twice is called
   * once; after `disconnect`, nothing is added.
   *
   * @returns A function that removes the listener.
   */
  on<K extends BoEventName>(name: K, listener: BoEventListener<K>): () => void;
  /** Removes a listener added with {@link BoClient.on}. */
  off<K extends BoEventName>(name: K, listener: BoEventListener<K>): void;
  /**
   * `fetch` with the Vulog authentication.
   *
   * - A relative path (`fleetmanager/public/fleets/{fleetId}/vehicles`) or a URL under `baseUrl`
   *   is a Vulog API: the
   *   URL is resolved
   *   against `baseUrl` and `X-API-Key` is added (permission `apiInfo`). In an iframe, the
   *   `Authorization: Bearer` header is added too (permission `accessToken`); a Web Component gets
   *   it from the back office service worker.
   * - Any other absolute URL is a third-party API: only the `Bearer` header is added (permission
   *   `accessToken`), never the API key. To tell them apart, the SDK asks for the API info once;
   *   without the `apiInfo` permission, every absolute URL is a third-party API.
   *
   * A relative path is resolved under `baseUrl`, leading `/` ignored; one that resolves outside it
   * is refused. Whenever the SDK adds the `Bearer` header, the token is cached while its expiry is
   * known, renewed on the next call once it expires within a minute, shared by concurrent calls,
   * and a `401` is retried once with a new token (a `ReadableStream` body cannot be sent twice:
   * its `401` is returned without retry). A Vulog API call as a Web Component is not retried: the back office
   * service worker owns its token.
   *
   * @throws {BoError} From `getApiInfo` or `getAccessToken` (`FORBIDDEN`, `INTERNAL` with reason
   * `no-token`…).
   * @throws {TypeError} When `input` is not a string or a URL, or resolves outside `baseUrl`, and
   * whatever `fetch` throws (network failure, `AbortError`).
   */
  authFetch: AuthFetch;
  /**
   * Stops listening to the back office: listeners are removed, and pending and later requests
   * reject with `DISCONNECTED`, the same way in both modes.
   */
  disconnect(): void;
}
