# @vulog/bo-widget-sdk

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
