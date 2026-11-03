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
    const response = await this.bo.authFetch(`api/v1/fleets/${fleetId}/vehicles`);
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

| Member                           | Permission    | Result                                                                                                                                  |
| -------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`                           |               | `'webcomponent'` or `'iframe'`                                                                                                          |
| `protocolVersion`                |               | Protocol version served by the BO                                                                                                       |
| `grantedPermissions`             |               | Permissions granted (iframe), `null` for a Web Component                                                                                |
| `getContext()`                   |               | `{ fleetId, host, locale, timezone, currency, boVersion, basename }`                                                                    |
| `getCurrentUser()`               |               | The connected user: names, email, roles, fleets                                                                                         |
| `getSettings()`                  |               | Settings of the widget installation                                                                                                     |
| `getTheme()`                     |               | `{ palette, typography, mode }` of the BO (MUI shape)                                                                                   |
| `getApiInfo()`                   | `apiInfo`     | `{ baseUrl, apiKey }` of the Vulog API                                                                                                  |
| `getAccessToken()`               | `accessToken` | `{ accessToken, expiresAt }` (ms since the epoch, or `null`)                                                                            |
| `navigate({ path })`             | `navigate`    | Navigates the BO: `/app/...` is a BO route, `details/1` is relative to the widget's view                                                |
| `notify({ message, severity? })` | `notify`      | Shows a BO snackbar (`success`, `info`, `warning`, `error`)                                                                             |
| `resize({ height })`             |               | Asks for a height in pixels, or `null` (iframe only; a Web Component already fills the content zone)                                    |
| `on(name, listener)`             |               | Listens to `localeChanged`, `fleetChanged`, `userChanged`, `themeChanged`, `routeChanged`; returns a function that removes the listener |
| `off(name, listener)`            |               | Removes a listener                                                                                                                      |
| `authFetch(input, init?)`        | see below     | `fetch` with the Vulog authentication                                                                                                   |
| `disconnect()`                   |               | Stops listening; pending and later requests reject with `DISCONNECTED`, in both modes                                                   |

Permissions are declared in the widget manifest (`widget.json`). In an iframe, a request without its permission rejects with `FORBIDDEN`.

### `authFetch`

```ts
const response = await bo.authFetch(`api/v1/fleets/${fleetId}/vehicles`, { method: 'GET' });
```

| Input                                                                 | Headers added                                                                                              | Permissions                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Path relative to the Vulog API (`api/v1/...`), or URL under `baseUrl` | `X-API-Key`, plus `Authorization: Bearer` in an iframe (as a Web Component, the BO service worker adds it) | `apiInfo`, plus `accessToken` in an iframe |
| Any other absolute URL (your own backend)                             | `Authorization: Bearer` only, never the API key                                                            | `accessToken`                              |

When the SDK adds the token, it keeps it in cache while its expiry is known, renews it on the next call once it expires within a minute, shares one request between concurrent calls, and retries a `401` once with a new token. A `ReadableStream` body cannot be sent twice: its `401` is returned without retry, so prefer a string, `Blob` or `FormData` body. A Vulog API call as a Web Component is not retried: the BO service worker owns its token.

To tell a Vulog URL from a third-party one, the SDK asks for the API info once; without the `apiInfo` permission, every absolute URL is a third-party API.

A relative path is resolved under `baseUrl`, leading `/` ignored; one that resolves outside it (`../admin` when `baseUrl` has a path) is refused with a `TypeError`, and so is a `Request` object (pass a string or a `URL`). `authFetch` also rejects with what `fetch` rejects with (network `TypeError`, `AbortError`).

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
