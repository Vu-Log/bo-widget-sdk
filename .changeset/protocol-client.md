---
'@vulog/bo-widget-sdk': minor
---

Add the protocol client: `connect()` returns the same typed API as a Web Component (injected `vulogBo`) and in an iframe (`postMessage` handshake and `MessagePort`), with `BoError` errors, back office events and `authFetch` (API key, cached and renewed token, one retry on `401`). Add the `@vulog/bo-widget-sdk/manifest` entry with the `widget.json` schemas (`widgetManifestSchema`, `publishedWidgetManifestSchema`), and an `AGENTS.md` guide for AI coding agents. Remove the `SDK_PACKAGE_NAME` placeholder.
