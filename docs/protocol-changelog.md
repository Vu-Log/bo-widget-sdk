---
description: Versions of the widget protocol between a widget and the Vulog back office, and the compatibility rule.
---

# Protocol changelog

The protocol is the contract between a widget and the BO. Its version is separate from the versions of the npm packages.

- The SDK speaks one version: `PROTOCOL_VERSION`, exported by `@vulog/bo-widget-sdk`.
- `widget.json` declares the version the widget was built for, in `protocol.version`. `@vulog/bo-widget-vite` sets it from the SDK.
- `bo.protocolVersion` is the version the BO serves. In an iframe, the BO sends it in the handshake; as a Web Component, the injected API gives it, or the SDK assumes its own version when it does not.

## Compatibility

A BO older than the SDK may not serve a request. That request rejects with a `BoError` of code `UNKNOWN_TYPE`: **degrade gracefully**, for instance by hiding the feature, rather than failing the whole widget.

```ts
import { BoError } from '@vulog/bo-widget-sdk';

try {
  await bo.notify({ message: 'Saved', severity: 'success' });
} catch (error) {
  if (!(error instanceof BoError && error.code === 'UNKNOWN_TYPE')) throw error;
  // older BO: no snackbar
}
```

A widget that needs a minimum BO version declares it with `minBoVersion` in `widget.config.ts` (`protocol.minBoVersion` of `widget.json`).

An error code the SDK does not know, from a newer BO, becomes `INTERNAL` with that code as `reason`.

## Version 2 (current)

Version 2 is the protocol of `@vulog/bo-widget-sdk`. It defines:

- **One API in both modes.** `connect()` returns the same `BoClient` as a Web Component (API injected as `vulogBo`) and in an iframe.
- **The iframe handshake.** `connect()` posts `{ protocol: 'vulog-bo', version: 2, type: 'hello', widgetId, widgetVersion }` with a `MessagePort` to the parent window. The BO answers `welcome` with its `protocolVersion` and the `grantedPermissions`, or an `error`.
- **The envelope.** On the port, each request is `{ id, type, payload }` and each answer `{ id, ok, result | error }`, matched by `id`. An error has a `code`, a `message`, and optionally a `reason` and a `status`.
- **The requests.** `getContext`, `getCurrentUser`, `getSettings`, `getTheme`, `getApiInfo`, `getAccessToken`, `navigate`, `notify`, `resize`.
- **The events.** `{ type: 'event', name, data }` on the port: `localeChanged`, `fleetChanged`, `userChanged`, `themeChanged`, `routeChanged`. The initial state is not pushed: the widget reads it with the requests.
- **The permissions.** `accessToken`, `apiInfo`, `navigate`, `notify`, declared in `widget.json`, enforced in an iframe (`FORBIDDEN`), declarative as a Web Component.
- **The error codes.** `UNKNOWN_TYPE`, `FORBIDDEN`, `INVALID_PAYLOAD`, `INTERNAL`, `TIMEOUT`, `DISCONNECTED`, the same in both modes.

See [The protocol](./guide/protocol) for how to use it.
