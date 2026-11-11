---
description: connect, the requests of BoClient, the events, the initial state, disconnect and the BoError codes of the widget protocol.
---

# The protocol

A widget talks to the BO only through `@vulog/bo-widget-sdk`. `connect()` returns a `BoClient`, the same in both modes: write the widget once, run it as a Web Component or in an iframe.

```bash
npm install @vulog/bo-widget-sdk@next
```

## `connect`

```ts
import { connect } from '@vulog/bo-widget-sdk';

// Web Component: in connectedCallback, pass the element.
const bo = await connect(this);

// iframe: no element.
const bo = await connect();
```

- **Web Component.** The BO sets its API on the element (`element.vulogBo`) before inserting it. `connect(this)` wraps that API.
- **iframe.** `connect()` posts a `hello` message with a `MessagePort` to the parent window, waits for `welcome`, then exchanges requests and events on that port.

`connect` rejects with a `BoError`: `DISCONNECTED` when the widget is not displayed by a BO (no `vulogBo`, not in an iframe), `TIMEOUT` when the BO does not answer the handshake. Options of the iframe channel: `targetOrigin`, `handshakeTimeout` (10 000 ms), `requestTimeout` (30 000 ms), `widgetId` and `widgetVersion` (informative). See the [SDK README](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-sdk#options-of-connect-iframe).

## Requests

Every request is async.

| Request                          | Permission                                     | Result                                                                                                           |
| -------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `getContext()`                   |                                                | `{ fleetId, host, locale, timezone, currency, boVersion, basename }`                                             |
| `getCurrentUser()`               |                                                | The connected user: `fullName`, names, `email`, `roles`, `fleets`, `currentFleetId`…                             |
| `getSettings()`                  |                                                | The settings of the widget installation                                                                          |
| `getTheme()`                     |                                                | `{ palette, typography, mode }` of the BO, in the shape of a MUI theme                                           |
| `getApiInfo()`                   | `apiInfo`                                      | `{ baseUrl, apiKey }` of the Vulog API                                                                           |
| `getAccessToken()`               | `accessToken`                                  | `{ accessToken, expiresAt }`, `expiresAt` in ms since the epoch or `null`                                        |
| `navigate({ path })`             | `navigate`                                     | Navigates the BO: `/app/...` is a BO route under the current fleet, `details/1` is relative to the widget's view |
| `notify({ message, severity? })` | `notify`                                       | Shows a BO snackbar: `success`, `info` (default), `warning` or `error`                                           |
| `resize({ height })`             |                                                | Asks for a height in pixels, or `null` (iframe only)                                                             |
| `log.warn(message, context?)`    |                                                | Sends a log to the BO, see [Logs](#logs); also `log.debug`, `log.info` and `log.error`                           |
| `authFetch(input, init?)`        | see [Calling Vulog APIs](./calling-vulog-apis) | `fetch` with the Vulog authentication                                                                            |

`getCurrentUser()` is the way to know who is connected. Never decode the token.

The client also exposes `mode` (`'webcomponent'` or `'iframe'`), `protocolVersion` (the version the BO serves) and `grantedPermissions` (iframe; `null` for a Web Component).

## Events

```ts
const stop = bo.on('fleetChanged', ({ fleetId }) => render(fleetId));
// later
stop();
```

`on(name, listener)` returns the function that removes the listener. `off(name, listener)` does the same.

| Event           | Data                            |
| --------------- | ------------------------------- |
| `localeChanged` | `{ locale }`                    |
| `fleetChanged`  | `{ fleetId }`                   |
| `userChanged`   | The user, as `getCurrentUser()` |
| `themeChanged`  | The theme, as `getTheme()`      |
| `routeChanged`  | `{ pathname, search, hash }`    |

`locale` is the language of the BO as `language_COUNTRY`, with an underscore: `en_GB` (the BO default), `fr_FR`, `de_DE`… It is not a BCP 47 tag, and `Intl` throws a `RangeError` on `en_GB`: replace the underscore before formatting (`locale.replace('_', '-')`).

## The initial state is not pushed

Events only tell what changes. Read the current state first, then listen:

```ts
const { locale, fleetId, basename } = await bo.getContext();
const user = await bo.getCurrentUser();
const theme = await bo.getTheme();
bo.on('localeChanged', ({ locale }) => setLocale(locale));
```

No request gives the current route: `getContext().basename` is the path of the widget's view in the BO router, then follow `routeChanged`.

## Logs

```ts
bo.log.warn('Export failed', { status: response.status });
bo.log.error('Cannot read the vehicles', { fleetId });
```

`bo.log.debug`, `info`, `warn` and `error` take `(message, context?)`. They return nothing and never throw: the BO filters, caps and sends the logs to Vulog in batches, and the widget's administrators read them in the BO. Only `warn` and `error` are kept by default; `debug` and `info` are kept while the debug mode of the widget installation is on.

- `console.log` (and the other `console` methods) is never relayed: use `bo.log`.
- The message is a string, cut at 2048 characters; a blank one is sent as `(empty message)`, so that its context is kept.
- The context is copied as JSON, and an `Error` in it keeps its `name`, `message` and stack (cut at 1500 characters) (`bo.log.error('Export failed', { error })`). A context that is not an object (an array, a string…), bigger than 3 KB, deeper than 5 levels, circular or not serializable becomes `{ truncated: true, reason }`, `reason` being `not-an-object`, `not-serializable`, `too-big` or `too-deep`.
- The same log is sent at once, then at most once every 10 s while it repeats (and on `disconnect`), with `context.repeated`, the number of repeats since the last send. `repeated`, `truncated` and `reason` are reserved keys of the context.
- In an iframe, the errors nobody catches (`error` and `unhandledrejection` of the window) are sent as `error` logs, with their stack, until `disconnect`. As a Web Component, the SDK captures nothing: the BO catches the errors it can attribute to the widget.
- **Never put personal data or secrets in a log**: the platform cannot check what the context holds.

On the port, a log is the request `{ id, type: 'log', payload: { level, message, context? } }`, without permission, answered `null`. A BO without logs answers `UNKNOWN_TYPE`, which the SDK drops. In the fake back office (`bo-widget dev`), the logs show in its log panel, the browser console and the terminal of the dev server.

## `disconnect`

```ts
disconnectedCallback() {
  this.bo?.disconnect();
}
```

`disconnect()` removes the listeners. Pending and later requests, `authFetch` included, reject with `DISCONNECTED`, in both modes; repeated logs still counted are sent, then logs are dropped. Call it when the widget is removed: in `disconnectedCallback` for a Web Component, on unmount in a framework.

`connectedCallback` can run again when the element is moved, and `disconnectedCallback` can run before `connect()` resolves. Keep the promise of `connect`, so that cleanup can wait for it:

```ts
#bo?: Promise<BoClient>;

connectedCallback() {
  this.#bo = connect(this);
}

disconnectedCallback() {
  void this.#bo?.then((bo) => bo.disconnect(), () => undefined);
  this.#bo = undefined;
}
```

The svelte, vue, lit and vanilla templates do this; with React, `toCustomElement` does it for you. See [Examples](../examples/vanilla).

## Errors

Every request rejects with a `BoError`, never another error type, the same way in both modes. `authFetch` may also reject with what `fetch` rejects with (`TypeError` on a network failure, `AbortError`), and with a `TypeError` for an input it refuses.

A `BoError` has a `code`, a `reason` (or `null`) and an HTTP `status` (or `null`).

| `code`            | Meaning                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `FORBIDDEN`       | The manifest does not declare the permission (iframe)                                          |
| `INVALID_PAYLOAD` | The BO refused the payload: external URL to `navigate`, empty `notify` message, invalid height |
| `INTERNAL`        | The request failed in the BO: see `reason` and `status`                                        |
| `UNKNOWN_TYPE`    | The BO does not serve this request (older BO)                                                  |
| `TIMEOUT`         | No answer in time                                                                              |
| `DISCONNECTED`    | Closed connection, or not displayed by the BO                                                  |

Known `reason` values:

| `reason`                                                                                                       | Meaning                                            |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `no-token`                                                                                                     | Session expired: no access token                   |
| `not-installed`                                                                                                | The widget is not installed, so it has no settings |
| `disposed`                                                                                                     | The widget was removed from the page               |
| `ERR_NETWORK`, or another code                                                                                 | A transport or server error                        |
| `invalid-welcome`, `invalid-host-api`, `invalid-api-info`, `invalid-token`, `malformed-answer`, `messageerror` | The BO answered something unexpected               |

A wire code the SDK does not know becomes `INTERNAL`, with that code as `reason`.

```ts
import { BoError } from '@vulog/bo-widget-sdk';

try {
  await bo.navigate({ path: 'details/1' });
} catch (error) {
  if (!(error instanceof BoError)) throw error;
  switch (error.code) {
    case 'FORBIDDEN': // add the permission to widget.config.ts
    case 'INVALID_PAYLOAD': // fix the payload
    case 'INTERNAL': // error.reason: 'no-token' | 'not-installed' | 'disposed' | server code
    case 'UNKNOWN_TYPE': // older BO: degrade gracefully
    case 'TIMEOUT':
    case 'DISCONNECTED':
  }
}
```

`reason: 'disposed'`, or `DISCONNECTED` after your own `disconnect()`, means the widget was removed while a request was pending: ignore it.

## Same API in both modes

| Behavior                           | Web Component                                                   | iframe                   |
| ---------------------------------- | --------------------------------------------------------------- | ------------------------ |
| `connect`                          | `connect(this)`                                                 | `connect()`              |
| Missing permission                 | Served (permissions are declarative)                            | `FORBIDDEN`              |
| `resize`                           | Resolves `{ height: null }`: the element fills the content zone | Asks the BO for a height |
| `authFetch` to a Vulog API         | The BO service worker adds the token                            | The SDK adds the token   |
| Request an older BO does not serve | `UNKNOWN_TYPE`                                                  | `UNKNOWN_TYPE`           |
| After `disconnect()`               | `DISCONNECTED`                                                  | `DISCONNECTED`           |

The full API and its TSDoc are in the [SDK README](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-sdk#api) and in `dist/index.d.ts` of the package.
