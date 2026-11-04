---
description: Call the Vulog admin API with authFetch and a path relative to /boapi/proxy/, derive that path from the Vulog API reference, paginate, call a third-party API, handle 401.
---

# Calling Vulog APIs

`bo.authFetch` is `fetch` with the Vulog authentication. Give it a path relative to the BO admin API:

```ts
const { fleetId } = await bo.getContext();
const response = await bo.authFetch(`fleetmanager/public/fleets/${fleetId}/vehicles?page=0`);
const vehicles = await response.json();
```

The widget needs the `apiInfo` permission, plus `accessToken` in an iframe. See [Permissions](./permissions).

## The path is relative to `/boapi/proxy/`

`authFetch` resolves the path against `baseUrl`, the URL of the BO admin API, which already ends with `/boapi/proxy/`. So:

- write `fleetmanager/public/fleets/...`, **never** `boapi/proxy/fleetmanager/public/fleets/...`;
- do not build URLs from `getApiInfo()` by hand;
- do not add `Authorization` or `X-API-Key` yourself, and do not call `getAccessToken()` for a Vulog API.

What `authFetch` adds:

| Mode          | Headers                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Web Component | `X-API-Key`. The BO service worker adds `Authorization: Bearer` to the calls under `/boapi/proxy/`       |
| iframe        | `X-API-Key` and `Authorization: Bearer`, with a token the SDK caches, renews and retries once on a `401` |

The BO service worker only covers `/boapi/proxy/`: the other Vulog APIs, such as `/apiv5/`, are not authenticated this way.

A leading `/` is ignored. A path that resolves outside `baseUrl` (`../admin`) is refused with a `TypeError`, and so is a `Request` object: pass a string or a `URL`.

## Find the path in the Vulog API reference

The public Vulog API reference (swagger) is at [vulog-doc-api.web.app](https://vulog-doc-api.web.app/). A route may declare its own server. For example, `GET /fleets/{fleetId}/vehicles` declares the server:

```text
https://java-{region}.vulog.com/boapi/proxy/fleetmanager/public
```

The path to pass to `authFetch` is **the part of that server after `/boapi/proxy/`, followed by the route**:

| Server after `/boapi/proxy/` | Route                        | `authFetch` path                                 |
| ---------------------------- | ---------------------------- | ------------------------------------------------ |
| `fleetmanager/public`        | `/fleets/{fleetId}/vehicles` | `fleetmanager/public/fleets/${fleetId}/vehicles` |

Never guess an endpoint. AI coding agents can use the `aima-api` skill, which lists the admin endpoints a widget can call with the path to pass to `authFetch`. See [AI coding agents](../ai-agents#skills).

## Pagination

`GET /fleets/{fleetId}/vehicles` is paginated, with at most 2000 vehicles per page. Read the pages until one is empty:

```ts
import type { BoClient } from '@vulog/bo-widget-sdk';

const MAX_PAGES = 100;

async function fetchAllVehicles(bo: BoClient, fleetId: string): Promise<unknown[]> {
  const vehicles: unknown[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await bo.authFetch(
      `fleetmanager/public/fleets/${fleetId}/vehicles?page=${page}`,
    );
    if (!response.ok) throw new Error(`Vehicles: HTTP ${response.status}`);
    const items = (await response.json()) as unknown[];
    if (items.length === 0) break;
    vehicles.push(...items);
  }
  return vehicles;
}
```

`MAX_PAGES` bounds the loop. In mock mode, the fake BO answers by method and path, without the query: every page gets the same answer, so the loop only stops at `MAX_PAGES`. Test the pagination with a stubbed `fetch` (see [Testing](./testing)), or in token mode.

Pass an `AbortSignal` in `init` to cancel the calls when the widget is removed:

```ts
const controller = new AbortController();
await bo.authFetch(`fleetmanager/public/fleets/${fleetId}/vehicles?page=0`, {
  signal: controller.signal,
});
// in disconnectedCallback or on unmount
controller.abort();
```

## Handle errors

`authFetch` resolves with the `Response`, whatever its status: check `response.ok`. It rejects with:

- a `BoError` from the BO: `FORBIDDEN` (missing permission, iframe), `INTERNAL` with `reason: 'no-token'` (session expired), `DISCONNECTED` after `disconnect()`;
- a `TypeError` on a network failure, or for an input it refuses;
- an `AbortError` when the signal aborts.

### `401`

A `401` means the session is lost. Show a message, **never retry in a loop**. When the SDK adds the token itself (iframe, or a third-party URL), it has already retried once with a new token. As a Web Component, the BO service worker owns the token of the Vulog API calls, and the SDK does not retry them.

```ts
const response = await bo.authFetch(`fleetmanager/public/fleets/${fleetId}/vehicles?page=0`);
if (response.status === 401) {
  showError('Your session has expired. Reload the back office and sign in again.');
  return;
}
```

## Third-party APIs

For your own backend, which expects the Vulog token, pass an absolute URL:

```ts
const response = await bo.authFetch('https://api.example.com/reports');
```

| Input                                                     | Headers added                                   | Permission                                 |
| --------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Path relative to the BO admin API, or URL under `baseUrl` | `X-API-Key`, plus `Authorization` in an iframe  | `apiInfo`, plus `accessToken` in an iframe |
| Any other absolute URL                                    | `Authorization: Bearer` only, never the API key | `accessToken`                              |

The SDK caches the token while its expiry is known, renews it once it expires within a minute, shares one request between concurrent calls, and retries a `401` once. A `ReadableStream` body cannot be sent twice: its `401` is returned without retry, so prefer a string, a `Blob` or `FormData`.

To tell a Vulog URL from a third-party one, the SDK asks for the API info once. Without the `apiInfo` permission, every absolute URL is a third-party API.

The call leaves the browser from the widget's page, so your backend must accept it cross-origin: see [the FAQ](../faq#my-third-party-api-call-fails-with-a-cors-error).

`getAccessToken()` returns `{ accessToken, expiresAt }` when you need the token itself, for a client that does not take a `fetch` function. Never decode it to read the user: use `getCurrentUser()`.

## Mock the API in dev

In `npm run dev` (mock mode), the fake BO answers the Vulog API calls with `dev.responses` of `widget.config.ts`. The key is the method in capitals and the path, URL-decoded, without leading `/` nor query:

```ts
export default defineWidgetConfig({
  name: 'Fleet report',
  permissions: ['apiInfo'],
  dev: {
    context: { fleetId: 'FLEET-1' },
    responses: {
      'GET fleetmanager/public/fleets/FLEET-1/vehicles': [{ id: 'v1' }],
    },
  },
});
```

The answer is a `200` with that JSON. Any other call gets a `404` that says which key to add, also logged in the terminal. To call a real environment, use the token mode: see [Getting started](./getting-started#develop-against-a-real-api).

The full rules of `authFetch` are in the [SDK README](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-sdk#authfetch).
