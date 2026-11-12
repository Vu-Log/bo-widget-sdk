# @vulog/bo-widget-sdk

Framework-agnostic client for widgets embedded in the Vulog back office (BO), as a Web Component or in an iframe.

- **One API for both modes.** `connect()` finds how the widget runs and returns the same client: your widget code does not change between a Web Component and an iframe.
- **Nothing imported** by the main entry (`zod` is only loaded by `/manifest`), so it fits any stack: React, Svelte, Lit, Vue or plain JavaScript.
- **Authenticated `fetch`** to the Vulog APIs, with token caching and renewal when needed.
- **Manifest validation** (`@vulog/bo-widget-sdk/manifest`) with the rules applied on publication.

> Using an AI coding agent? Point it to [`AGENTS.md`](./AGENTS.md), shipped in the package: the API contract, its rules and pitfalls, in one page.

## Install

```bash
npm install @vulog/bo-widget-sdk@next
```

## Quick start

### Web Component

The widget's `index.js` exports a class that extends `HTMLElement`. The BO registers it under its own tag and injects its API into the element before inserting it: call `connect(this)` from `connectedCallback`.

```ts
import { connect, type BoClient } from '@vulog/bo-widget-sdk';

export default class FleetReport extends HTMLElement {
  private bo?: BoClient;

  async connectedCallback() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    this.bo = await connect(this);
    const { fleetId } = await this.bo.getContext();
    const response = await this.bo.authFetch(`fleetmanager/public/fleets/${fleetId}/vehicles`);
    root.textContent = `${(await response.json()).length} vehicles`;
  }

  disconnectedCallback() {
    this.bo?.disconnect();
  }
}
```

- Export the class, **never call `customElements.define`**: the BO picks the tag.
- Keep styles in the Shadow DOM, never in `document.head`.

### iframe

The widget's `index.html` runs in an iframe of the BO. Call `connect()` without element: the client opens a channel with the BO.

```ts
import { connect } from '@vulog/bo-widget-sdk';

const bo = await connect();
const { locale } = await bo.getContext();
render(locale);
bo.on('localeChanged', ({ locale }) => render(locale));
```

## API

`connect(element?, options?)` resolves with a `BoClient`:

| Member                                         | Permission      | Result                                                                                                                                  |
| ---------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`                                         |                 | `'webcomponent'` or `'iframe'`                                                                                                          |
| `protocolVersion`                              |                 | Protocol version served by the BO                                                                                                       |
| `grantedPermissions`                           |                 | Permissions granted (iframe), `null` for a Web Component                                                                                |
| `getContext()`                                 |                 | `{ fleetId, host, locale, timezone, currency, boVersion, basename }`                                                                    |
| `getCurrentUser()`                             |                 | The connected user: names, email, roles, fleets                                                                                         |
| `getSettings()`                                |                 | Settings of the widget installation                                                                                                     |
| `getTheme()`                                   |                 | `{ palette, typography, mode }` of the BO (MUI shape)                                                                                   |
| `getApiInfo()`                                 | `apiInfo`       | `{ baseUrl, apiKey }` of the Vulog API                                                                                                  |
| `getAccessToken()`                             | `accessToken`   | `{ accessToken, expiresAt }` (ms since the epoch, or `null`)                                                                            |
| `navigate({ path })`                           | `navigate`      | Navigates the BO: `/app/...` is a BO route, `details/1` is relative to the widget's view                                                |
| `notify({ message, severity? })`               | `notify`        | Shows a BO snackbar (`success`, `info`, `warning`, `error`)                                                                             |
| `resize({ height })`                           |                 | Asks for a height in pixels, or `null` (iframe only; a Web Component already fills the content zone)                                    |
| `on(name, listener)`                           |                 | Listens to `localeChanged`, `fleetChanged`, `userChanged`, `themeChanged`, `routeChanged`; returns a function that removes the listener |
| `off(name, listener)`                          |                 | Removes a listener                                                                                                                      |
| `authFetch(input, init?)`                      | see below       | `fetch` with the Vulog authentication                                                                                                   |
| `log.debug/info/warn/error(message, context?)` |                 | Sends a log to the BO, see below                                                                                                        |
| `storage.collection(name)`                     | `storage`       | The widget's data, see below                                                                                                            |
| `sharedStorage.collection(name)`               | `sharedStorage` | The data shared by the publisher's widgets on the host, see below                                                                       |
| `disconnect()`                                 |                 | Stops listening; pending and later requests reject with `DISCONNECTED`, in both modes                                                   |

Permissions are declared in the widget manifest (`widget.json`). In an iframe, a request without its permission rejects with `FORBIDDEN`; the storage does so in both modes.

### `authFetch`

```ts
// GET https://<api host>/boapi/proxy/fleetmanager/public/fleets/{fleetId}/vehicles
const response = await bo.authFetch(`fleetmanager/public/fleets/${fleetId}/vehicles?page=0`);
const vehicles = await response.json();
```

Paths are relative to `baseUrl`, the BO admin API, which already ends with `/boapi/proxy/`: write `fleetmanager/public/fleets/...`, never `boapi/proxy/fleetmanager/public/fleets/...`. In the Vulog API reference, a route may declare its own server (`…/boapi/proxy/fleetmanager/public` for `GET /fleets/{fleetId}/vehicles`): pass the part of that server after `/boapi/proxy/`, then the route. The BO service worker only adds the token to URLs under that prefix, so other Vulog APIs (such as `/apiv5/`) are not authenticated this way.

| Input                                                                                        | Headers added                                                                                              | Permissions                                |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Path relative to the BO admin API (`fleetmanager/public/fleets/...`), or URL under `baseUrl` | `X-API-Key`, plus `Authorization: Bearer` in an iframe (as a Web Component, the BO service worker adds it) | `apiInfo`, plus `accessToken` in an iframe |
| Any other absolute URL (your own backend)                                                    | `Authorization: Bearer` only, never the API key                                                            | `accessToken`                              |

When the SDK adds the token, it keeps it in cache while its expiry is known, renews it on the next call once it expires within a minute, shares one request between concurrent calls, and retries a `401` once with a new token. A `ReadableStream` body cannot be sent twice: its `401` is returned without retry, so prefer a string, `Blob` or `FormData` body. A Vulog API call as a Web Component is not retried: the BO service worker owns its token.

To tell a Vulog URL from a third-party one, the SDK asks for the API info once; without the `apiInfo` permission, every absolute URL is a third-party API. The user's token goes to **any** absolute URL outside `baseUrl`: only pass URLs of backends you own, never an origin built from a setting or a user input, and use `fetch` for a URL that must not receive it.

A relative path is resolved under `baseUrl`, leading `/` ignored; one that resolves outside it (`../admin` when `baseUrl` has a path) is refused with a `TypeError`, and so is a `Request` object (pass a string or a `URL`). `authFetch` also rejects with what `fetch` rejects with (network `TypeError`, `AbortError`).

### Logs

```ts
bo.log.warn('Export failed', { status: response.status });
```

`bo.log.debug`, `info`, `warn` and `error` return nothing and never throw. The BO keeps `warn` and `error`, and `debug` and `info` while the debug mode of the installation is on. `console.log` is never relayed. The message is cut at 2048 characters; an `Error` in the context keeps its name, message and stack (cut); a context bigger than 3 KB as JSON, deeper than 5 levels or not serializable becomes `{ truncated: true, reason }`; a repeated log is sent at once, then at most once every 10 s with `context.repeated`. In an iframe, uncaught errors and unhandled rejections are sent as `error` logs. Never log personal data or secrets.

### Storage

```ts
const prefs = bo.storage.collection<{ list: string[] }>('prefs');
await prefs.set('columns', { list: ['plate', 'status'] }); // creates or replaces
const doc = await prefs.get('columns'); // { id, value, version, … } or null

const tickets = bo.sharedStorage.collection<{ status: string }>('planning-tickets');
const { id } = await tickets.add({ status: 'open' });
await tickets.update(id, { status: 'closed' }, { ifVersion: 1 });
const open = await tickets.query({ where: { status: 'open' }, limit: 50 }); // { items, nextCursor }

// Lock: created only if absent, freed after 5 minutes
await bo.sharedStorage
  .collection('planning-locks')
  .set('vehicle-V1', { by: user.id }, { ifVersion: 0, ttlSeconds: 300 });
```

A collection has `get`, `set`, `add`, `update` (first-level merge), `delete`, `list({ limit?, cursor? })`, `query({ where, limit?, cursor? })` and `clear()`. A value is a JSON object of 64 KB at most. A refusal rejects with `FORBIDDEN` (permission missing, in both modes), `INVALID_PAYLOAD` (name, id, value or option refused by the BO) or `INTERNAL` with the server code as `reason` and its `status` (`version-conflict`, `already-exists`, `not-found`, `value-too-large`, `quota-exceeded`, `rate-limited`, `invalid-cursor`). Every user of the BO host can read the data: never store secrets. See [Storing data](https://vu-log.github.io/bo-widget-sdk/guide/storage).

### Errors

Every request rejects with a `BoError`, the same way in both modes:

| `code`            | Meaning                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `FORBIDDEN`       | The manifest does not declare the permission                                                                                        |
| `INVALID_PAYLOAD` | The BO refused the payload (external URL to `navigate`, empty message…)                                                             |
| `INTERNAL`        | The request failed in the BO; see `reason` (`no-token`: session expired, `not-installed`, `disposed`: widget removed…) and `status` |
| `UNKNOWN_TYPE`    | The BO does not serve this request (older BO)                                                                                       |
| `TIMEOUT`         | No answer in time                                                                                                                   |
| `DISCONNECTED`    | Closed connection, or not displayed by the BO                                                                                       |

```ts
import { BoError } from '@vulog/bo-widget-sdk';

try {
  settings = await bo.getSettings();
} catch (error) {
  if (error instanceof BoError && error.reason === 'not-installed') settings = {};
  else throw error;
}
```

### Options of `connect` (iframe)

| Option                      | Default |                                                                                                                           |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `targetOrigin`              | `'*'`   | Origin of the BO the handshake is posted to. Set it when you know it, so that no other page framing the widget can answer |
| `handshakeTimeout`          | `10000` | ms to wait for the BO                                                                                                     |
| `requestTimeout`            | `30000` | ms to wait for each answer                                                                                                |
| `widgetId`, `widgetVersion` |         | Sent in the handshake, for diagnostics                                                                                    |

## Manifest validation

```ts
import { publishedWidgetManifestSchema } from '@vulog/bo-widget-sdk/manifest';

const result = publishedWidgetManifestSchema.safeParse(JSON.parse(manifestText));
if (!result.success) console.error(result.error.issues);
```

`publishedWidgetManifestSchema` applies the rules checked on publication; `widgetManifestSchema` reads any manifest already published. This entry depends on [`zod`](https://zod.dev); the main entry does not.

## License

[MIT](./LICENSE)
