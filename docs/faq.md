---
description: Practical answers - styles missing or leaking, customElements.define, 401, CORS, version refused on publication, iframe or Web Component, MUI versions, Vue and Svelte without a dedicated package.
---

# FAQ

## My styles are missing in the widget

The styles ended up outside the shadow root. A CSS file imported as a regular module is emitted by Vite next to `index.js` and loaded in the BO page, where it does not reach the Shadow DOM. Import it with `?inline` and insert it in the shadow root, or let your framework do it: `.ce.vue` files in Vue, `<style>` of a Svelte custom element, `static styles` in Lit, `toCustomElement` for MUI. See [Layout and isolation](./guide/layout-and-isolation#styles-never-in-document-head).

A dialog, menu or tooltip without styles is rendered on `document.body`: see [Overlays stay in the shadow root](./guide/layout-and-isolation#overlays-stay-in-the-shadow-root).

## My styles leak into the back office, or the BO styles change my widget

Something inserts styles into `document.head`: a library, or code of the widget. Keep every style in the shadow root. BO selectors do not match inside a shadow root; only inherited properties, such as `font-family`, and CSS variables cross it.

## Why is `customElements.define` refused?

The BO registers the class under a tag it chooses. The widget exports its class and never registers it, nor any other custom element globally. `@vulog/bo-widget-vite` warns at build time, and `bo-widget validate` warns (`custom-element-define`), when a `.js` file of a Web Component calls `customElements.define(`, dependencies included. It is a warning, not an error: check where the call comes from. In tests, registering the class is expected.

## `authFetch` answers `401`

The session is lost, or the token expired. Show a message, never retry in a loop: when the SDK adds the token itself (iframe, or a third-party URL), it has already retried once with a new token. In the fake back office in token mode, the pasted token has expired: paste a new one and restart. See [Calling Vulog APIs](./guide/calling-vulog-apis#_401).

## `authFetch` rejects with `FORBIDDEN`

In an iframe, the manifest lacks a permission: `apiInfo` for a Vulog API, plus `accessToken`. Add it to `permissions` in `widget.config.ts`.

## My Vulog API call gets `404` in `npm run dev`

In mock mode, the fake BO only answers the keys of `dev.responses`. The `404` says which key to add, also logged in the terminal: method in capitals, path without leading `/` nor query. See [Mock the API in dev](./guide/calling-vulog-apis#mock-the-api-in-dev).

## My third-party API call fails with a CORS error

`authFetch` to an absolute URL is a plain `fetch` from the browser, with an `Authorization: Bearer` header. Your backend must answer the CORS preflight: allow the origin the widget runs on (the BO origin for a Web Component, the widget's origin in an iframe) and the `Authorization` header. This is a setting of your backend, not of the SDK.

## The BO refuses my version on publication

The version must be greater than the versions already published, and a semantic version without build metadata (`1.2.0`, `1.2.0-beta.1`, not `v1.2.0` nor `1.2.0+build.7`). Raise the `version` of `package.json`, which is the version of `widget.json`, then `npm run build`. See [Publish the next version](./guide/getting-started#publish-the-next-version).

## The BO refuses my widget id

The id must belong to your namespace: only the BO checks it, on publication. Locally, the id must be lowercase letters and digits joined by single hyphens, 63 characters at most. It is the `name` of `package.json`, without its scope, unless `id` is set in `widget.config.ts`.

## `bo-widget validate` exits with code `2`

Without argument, it checks the only `.zip` of the current folder: there is none, or several (one per version built). Give the file: `npx bo-widget validate my-widget-0.1.1.zip`.

## Web Component or iframe?

Web Component, by default and in every template: the widget fills the content zone, its MUI dialogs cover the whole page, and the BO service worker authenticates the Vulog API calls. Choose an iframe when the widget needs a document of its own. See [Web Component or iframe](./guide/web-component-or-iframe).

## Can I use MUI 5 or 6?

No. `@vulog/bo-widget-react` needs MUI 7.3.6 or later (7 or 9). Earlier versions trap the focus of a dialog outside a shadow root, so its text fields cannot be typed in.

## Can I use the React or MUI of the back office?

No. Each widget bundles its own framework and libraries, and shares nothing with the BO, whatever their versions.

## Is there a package for Vue or Svelte?

No, and none is needed. `@vulog/bo-widget-sdk` works with any stack. The `vue` template gets the element with `useHost()` (Vue 3.5) and the `svelte` template with `$host()` (Svelte 5), then calls `connect(element)`. See the [Vue](./examples/vue) and [Svelte](./examples/svelte) examples.

## My widget is blank in the BO, with no error

The BO only sees the errors thrown synchronously when it inserts the element. A failed `connect` or request after that is invisible to it: show it in the widget, as every template does with a `role="alert"` area, and check the browser console.

## `getSettings` rejects with `reason: 'not-installed'`

The widget is not installed, so it has no settings. Fall back to defaults:

```ts
import { BoError } from '@vulog/bo-widget-sdk';

let settings = {};
try {
  settings = await bo.getSettings();
} catch (error) {
  if (!(error instanceof BoError && error.reason === 'not-installed')) throw error;
}
```

## A request rejects with `UNKNOWN_TYPE`

The BO does not serve this request: it is older than the SDK. Degrade gracefully, for instance by hiding the feature. See the [protocol changelog](./protocol-changelog).

## Where do I put an API key or a secret?

Not in the widget: its bundle is public, and so are its settings. Keep secrets in your backend, and call it with `authFetch` and the Vulog token.

## Which Node.js version do I need?

Node.js 20 (20.19 or later), or 22.12 or later, with npm (the `engines` of the published packages). The widget itself runs in the browser.
