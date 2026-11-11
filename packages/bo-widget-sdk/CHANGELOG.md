# @vulog/bo-widget-sdk

## 0.1.0-next.6

### Minor Changes

- ca30a01: Widget logs: `bo.log.debug/info/warn/error(message, context?)` sends a log to the back office, which forwards it to Vulog for the administrators of the widget. The methods return nothing and never throw. The message is cut at 2048 characters, and a blank one is sent as `(empty message)`. The context is copied as JSON (an `Error` keeps its name, message and stack (cut)); one that is not an object (an array, a string…), bigger than 3 KB, deeper than 5 levels or not serializable becomes `{ truncated: true, reason }`. A repeated log is sent at once, then at most once every 10 s with `context.repeated`. In an iframe, uncaught errors and unhandled rejections are sent as `error` logs until `disconnect`. `console.log` is never relayed. New types: `BoLogger`, `BoLogLevel`, `BoLogContext`.

## 0.1.0-next.5

### Patch Changes

- 5e6195d: `authFetch` accepts only an `http:` or `https:` `baseUrl` from `getApiInfo`: any other scheme (`file:`, `data:`, `javascript:`…) rejects with `INTERNAL`, reason `invalid-api-info`. The README warns that the user's token goes to any absolute URL outside `baseUrl`.

## 0.1.0-next.4

### Patch Changes

- 2fe97a0: Document the format of `BoContext.locale` and `localeChanged`: the BO language as `language_COUNTRY` with an underscore (`en_GB`, `fr_FR`), not a BCP 47 tag, so `Intl` needs the underscore replaced first.

## 0.1.0-next.3

### Patch Changes

- a9a88f8: `AGENTS.md` tells AI coding agents where to find the Vulog admin API endpoints a widget can call with `authFetch`: the `aima-api` skill of the SDK repository, regenerated every week.

## 0.1.0-next.2

### Minor Changes

- 0a2c137: Add the protocol client: `connect()` returns the same typed API as a Web Component (injected `vulogBo`) and in an iframe (`postMessage` handshake and `MessagePort`), with `BoError` errors, back office events and `authFetch` (API key, cached and renewed token, one retry on `401`). Add the `@vulog/bo-widget-sdk/manifest` entry with the `widget.json` schemas (`widgetManifestSchema`, `publishedWidgetManifestSchema`), and an `AGENTS.md` guide for AI coding agents. Remove the `SDK_PACKAGE_NAME` placeholder.

## 0.0.1-next.1

### Patch Changes

- 06e0461: Publish from GitHub Actions with npm trusted publishing. No change to the package content.

## 0.0.1-next.0

### Patch Changes

- 23153c3: Reserve the `@vulog/bo-widget-sdk` package with an initial skeleton (no protocol client yet).
