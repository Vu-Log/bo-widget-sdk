/** Version of the back office protocol this SDK speaks. */
export const PROTOCOL_VERSION = 2;

/** How the widget runs in the back office. */
export type BoMode = 'webcomponent' | 'iframe';

/** A permission a widget declares in its manifest. */
export type BoPermission =
  'accessToken' | 'apiInfo' | 'navigate' | 'notify' | 'storage' | 'sharedStorage';

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

/** Level of a widget log, from the most verbose to the most severe. */
export type BoLogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Free data attached to a log. Copied as JSON when the log is taken: what JSON drops (functions,
 * `undefined`) is dropped, a `Date` becomes its ISO string, an `Error` keeps its `name`,
 * `message` and stack (cut; `cause` and other properties are dropped). Never put personal data
 * in it.
 *
 * Reserved keys, set by the SDK: `repeated` (number of repeats a log stands for) and `truncated`
 * with `reason` (the context was replaced). A widget's own `repeated` key is overwritten on a
 * repeat log.
 */
export type BoLogContext = Record<string, unknown>;

/**
 * Logs of the widget, relayed to the back office, which forwards them to Vulog (`bo.log`).
 *
 * Each method takes `(message, context?)`, returns nothing and never throws: logging cannot
 * break the widget. Only `warn` and `error` are kept by default; `debug` and `info` are kept
 * while the debug mode of the widget installation is on. `console.log` is never relayed.
 */
export interface BoLogger {
  debug(message: string, context?: BoLogContext): void;
  info(message: string, context?: BoLogContext): void;
  warn(message: string, context?: BoLogContext): void;
  error(message: string, context?: BoLogContext): void;
}

/**
 * A value a widget stores: a plain JSON object, never an array nor a scalar (store a scalar as
 * `{ value: 42 }`). The back office refuses, with `INVALID_PAYLOAD`, a value larger than 64 KB as
 * UTF-8 JSON, nested deeper than 20 levels, with a `__proto__` key, an empty key or a key that
 * starts and ends with `__`, with an array directly inside an array, or holding anything that is
 * not JSON (a `Date`, a function, `NaN`…). A property set to `undefined` is dropped.
 */
export type BoStorageValue = Record<string, unknown>;

/** A stored document, as `get`, `set`, `add`, `update`, `list` and `query` answer it. */
export interface BoStorageDocument<T extends object = BoStorageValue> {
  /** Id of the document in its collection: given by the widget, or generated by `add`. */
  readonly id: string;
  readonly value: T;
  /** 1 on creation, then +1 on each write: what `ifVersion` compares to. */
  readonly version: number;
  /** ISO 8601. */
  readonly createdAt: string;
  /** Id of the user who created the document (`getCurrentUser().id`), never an email. */
  readonly createdBy: string;
  /** ISO 8601. */
  readonly updatedAt: string;
  readonly updatedBy: string;
  /** ISO 8601 date after which the document is gone; absent when it does not expire. */
  readonly expiresAt?: string;
}

/** A page of `list` or `query`, in id order. */
export interface BoStoragePage<T extends object = BoStorageValue> {
  /**
   * The documents of the page. Expired documents are left out, so a page may hold fewer than
   * `limit` documents, or none, while `nextCursor` is not `null`.
   */
  readonly items: BoStorageDocument<T>[];
  /** Pass it as `cursor` to read the next page; `null` on the last page. */
  readonly nextCursor: string | null;
}

/** Expiry of a written document. */
export interface BoStorageExpiryOptions {
  /**
   * Seconds after which the document expires, from 60 to 31 536 000 (365 days), counted from this
   * write; `null` removes the expiry. When absent, `add` and `set` write a document that does not
   * expire, and `update` keeps the expiry of the document.
   */
  ttlSeconds?: number | null;
}

/** Options of `set` and `update`. */
export interface BoStorageWriteOptions extends BoStorageExpiryOptions {
  /**
   * Writes only when the stored document has this version, otherwise rejects with `INTERNAL`,
   * reason `version-conflict` (status 409). `0` means "only if it does not exist": rejects with
   * reason `already-exists` (status 409) when it does, which makes a lock with `set`.
   */
  ifVersion?: number;
}

/** Options of `list`. */
export interface BoStorageListOptions {
  /** Documents per page, from 1 to 100. 50 when absent. */
  limit?: number;
  /** `nextCursor` of the previous page. */
  cursor?: string;
}

/** A value `where` compares a field to. */
export type BoStorageWhereValue = string | number | boolean | null;

/** Options of `query`. */
export interface BoStorageQueryOptions extends BoStorageListOptions {
  /**
   * 1 to 5 first-level fields of the value, each equal to the given value (`{ status: 'open' }`).
   * A field name is a JavaScript-like identifier; a string is 1 500 UTF-8 bytes at most.
   */
  where: Record<string, BoStorageWhereValue>;
}

/**
 * A collection of documents of a storage space (`bo.storage.collection('prefs')`).
 *
 * Every method is a request to the back office, which relays it to Vulog: nothing is cached. It
 * rejects with a {@link BoError}:
 * - `FORBIDDEN`: the manifest does not declare the permission of the space (`storage` or
 *   `sharedStorage`), in both modes;
 * - `INVALID_PAYLOAD`: the back office refused the request (collection name, id, value, options);
 * - `INTERNAL` with the server code as `reason` and the HTTP `status`: `version-conflict` and
 *   `already-exists` (409), `not-found` (404, `update` of a missing document), `value-too-large`
 *   (413), `quota-exceeded` (422), `rate-limited` (429), `invalid-cursor` (400), `not-installed`
 *   (the widget is not installed), `disposed` (the widget was removed)…
 *
 * @typeParam T - Shape of the values of the collection. It is not checked: the back office only
 * checks that a value is a JSON object.
 */
export interface BoStorageCollection<T extends object = BoStorageValue> {
  /** Name of the collection. */
  readonly name: string;
  /** The document, or `null` when it does not exist or expired. */
  get(id: string): Promise<BoStorageDocument<T> | null>;
  /** Creates or replaces the document. */
  set(id: string, value: T, options?: BoStorageWriteOptions): Promise<BoStorageDocument<T>>;
  /** Creates a document under an id the server generates. */
  add(value: T, options?: BoStorageExpiryOptions): Promise<BoStorageDocument<T>>;
  /**
   * Merges the first-level fields of `patch` into the stored value (a field set to `null` is kept
   * as `null`). Rejects with reason `not-found` when the document does not exist.
   */
  update(
    id: string,
    patch: Partial<T>,
    options?: BoStorageWriteOptions,
  ): Promise<BoStorageDocument<T>>;
  /** Deletes the document; resolves even when it does not exist. */
  delete(id: string): Promise<void>;
  /** A page of the documents, in id order. */
  list(options?: BoStorageListOptions): Promise<BoStoragePage<T>>;
  /** A page of the documents whose fields equal `where`, in id order. */
  query(options: BoStorageQueryOptions): Promise<BoStoragePage<T>>;
  /** Deletes every document of the collection. */
  clear(): Promise<{ deletedDocs: number }>;
}

/**
 * A storage space: `bo.storage` (the widget's own space, permission `storage`) or
 * `bo.sharedStorage` (the space shared by the widgets of the same publisher on the back office
 * host, permission `sharedStorage`).
 */
export interface BoStorage {
  /**
   * A collection of the space, created on its first write. Nothing is sent until a method is
   * called, and the name is checked then.
   *
   * @param name - `^[a-z0-9][a-z0-9_-]{0,63}$`. In the shared space, prefix it with your domain
   * (`planning-stations`) to avoid collisions with other widgets.
   */
  collection<T extends object = BoStorageValue>(name: string): BoStorageCollection<T>;
}

/** Name of a storage space, as the request type of the protocol. */
export type BoStorageSpace = 'storage' | 'sharedStorage';

/** Operation of a storage request. */
export type BoStorageOp = 'get' | 'set' | 'add' | 'update' | 'delete' | 'list' | 'query' | 'clear';

/**
 * A storage request, as the `payload` of a `storage` or `sharedStorage` request on the port.
 * Internal to the SDK.
 */
export interface BoStorageRequest {
  op: BoStorageOp;
  collection: string;
  /** For `get`, `set`, `update` and `delete`. */
  id?: string;
  /** For `set`, `add` and `update`. */
  value?: unknown;
  options?: BoStorageWriteOptions | BoStorageQueryOptions | BoStorageListOptions;
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
  /**
   * Sends one log, already capped by the client. Never throws nor rejects; does nothing once
   * closed.
   */
  log(level: BoLogLevel, message: string, context: BoLogContext | undefined): void;
  /**
   * Sends a storage request to a space and resolves with what the back office answers, unchecked.
   * Rejects with a {@link BoError}.
   */
  storage(space: BoStorageSpace, request: BoStorageRequest): Promise<unknown>;
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
   * Logs of the widget, relayed to the back office: `bo.log.warn('Export failed', { status })`.
   *
   * - The message is turned into a string, cut at 2048 characters with `…`; a blank one is sent
   *   as `(empty message)`, so that its context is kept.
   * - The context is copied as JSON. One that is not an object (an array, a string…), bigger
   *   than 3 KB once serialized, deeper than 5 levels, circular or not serializable is replaced
   *   by `{ truncated: true, reason }`.
   * - The same log (level, message and context) is sent at once, then at most once every 10 s
   *   while it repeats (and on `disconnect`), with `context.repeated`, the number of repeats
   *   since the last send.
   * - In an iframe, errors nobody catches (`error` and `unhandledrejection` of the window) are
   *   sent as `error` logs too. As a Web Component, the SDK captures nothing: the back office
   *   catches the errors it can attribute to the widget.
   *
   * After `disconnect`, logs are dropped.
   */
  readonly log: BoLogger;
  /**
   * The widget's own data space (permission `storage`), on the back office host: documents in
   * collections, read and written by id.
   *
   * @example
   * ```ts
   * const prefs = bo.storage.collection<{ columns: string[] }>('prefs');
   * await prefs.set('table', { columns: ['plate', 'status'] });
   * const doc = await prefs.get('table'); // { id, value, version, … } or null
   * ```
   *
   * Never store secrets: any user of the back office host can read the data of a widget
   * installed on it. Without the permission, each call rejects with `FORBIDDEN`, in both modes.
   */
  readonly storage: BoStorage;
  /**
   * The data space shared by the widgets of the same publisher on the back office host
   * (permission `sharedStorage`). Same API as {@link BoClient.storage}. Collection names and ids
   * are free: prefix them with your domain (`planning-stations`) to avoid collisions.
   */
  readonly sharedStorage: BoStorage;
  /**
   * Stops listening to the back office: listeners are removed, and pending and later requests
   * reject with `DISCONNECTED`, the same way in both modes. Repeated logs still waiting are sent
   * first.
   */
  disconnect(): void;
}
