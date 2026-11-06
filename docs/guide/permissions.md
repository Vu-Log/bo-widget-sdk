---
description: The four widget permissions (accessToken, apiInfo, navigate, notify), what each unlocks, and how they behave in an iframe and as a Web Component.
---

# Permissions

A widget declares the requests it needs in the `permissions` of its manifest, set in `widget.config.ts`:

```ts
export default defineWidgetConfig({
  name: 'Fleet report',
  permissions: ['apiInfo', 'notify'],
});
```

Requests not listed below need no permission: `getContext`, `getCurrentUser`, `getSettings`, `getTheme`, `resize`, the events and `disconnect`.

| Permission    | Unlocks                                          | Needed for                                                                                                     |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `apiInfo`     | `getApiInfo()`: `{ baseUrl, apiKey }`            | `authFetch` to the Vulog admin API, in both modes                                                              |
| `accessToken` | `getAccessToken()`: `{ accessToken, expiresAt }` | `authFetch` to the Vulog admin API **in an iframe**, and `authFetch` or `getAccessToken` for a third-party API |
| `navigate`    | `navigate({ path })`                             | Moving the BO to another route                                                                                 |
| `notify`      | `notify({ message, severity })`                  | Showing a BO snackbar                                                                                          |

Declare only what the widget uses. Each permission appears once: a duplicate is an error.

## In an iframe: enforced

The BO grants the permissions of the manifest in the handshake, and `bo.grantedPermissions` lists them. A request without its permission rejects with `BoError` code `FORBIDDEN`.

`authFetch` to a Vulog API needs both `apiInfo` and `accessToken` in an iframe: the SDK adds the `Authorization` header itself, so it needs the token.

## As a Web Component: declarative

`bo.grantedPermissions` is `null`, and a request is not refused for a missing permission: permissions are declarative. Declare them anyway: they are part of the manifest the BO stores, and the widget keeps working if it moves to an iframe.

`authFetch` to a Vulog API needs `apiInfo` only: the BO service worker adds the `Authorization` header.

The fake back office follows the same rules: it enforces permissions in an iframe only. For a Web Component, it serves a request the manifest does not allow and logs a warning, so that you notice the missing permission before publishing.

## Use them well

- **`accessToken`**: only for a third-party backend that expects the Vulog token. `authFetch` sends that token to any absolute URL outside the Vulog API, so call only backends you own (see [Third-party APIs](./calling-vulog-apis#third-party-apis)). Never call `getAccessToken()` for the Vulog APIs, and never decode the token: use `getCurrentUser()`.
- **`apiInfo`**: never build URLs from `getApiInfo()` by hand, and never add `Authorization` or `X-API-Key` yourself. Call `authFetch` with a path. See [Calling Vulog APIs](./calling-vulog-apis).
- **`navigate`**: never move the BO with `window.location` or `history`. See [UI guidelines](./ui-guidelines#navigation).
- **`notify`**: show feedback in the BO snackbar rather than a custom toast. See [UI guidelines](./ui-guidelines#feedback).
