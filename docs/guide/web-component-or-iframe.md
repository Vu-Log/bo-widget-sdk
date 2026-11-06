---
description: How to choose between a Web Component and an iframe for a BO widget, the contract of each mode, and what the back office does in each.
---

# Web Component or iframe

The BO runs a widget in one of two modes, set by `runtime` in `widget.config.ts`. The SDK gives the same API in both, so the choice is about integration, not code.

## How to choose

| Choose                      | When                                                                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web Component** (default) | The widget should feel like a page of the BO: it fills the content zone, opens dialogs over the whole page, and follows the BO theme. Every template of `npm create @vulog/bo-widget` is a Web Component. |
| **iframe**                  | The widget needs a document of its own: an existing web app, a library that assumes it owns `document`, or code you do not want to adapt to the Shadow DOM. Permissions are then enforced.                |

## Web Component

```ts
// widget.config.ts
export default defineWidgetConfig({ name: 'Fleet report' }); // runtime: 'webcomponent' by default
```

The contract:

- `index.js` is an ES module whose **default export is the element class**, a subclass of `HTMLElement`. `vite build` builds it from `entry` (`src/main.ts` by default).
- **Never call `customElements.define`**, and never register other custom elements globally. The BO registers the class under a tag it chooses: do not assume the tag name, use `this`.
- `connect(this)` in `connectedCallback`, `bo.disconnect()` in `disconnectedCallback`.
- Styles stay in the shadow root. See [Layout and isolation](./layout-and-isolation).

What the BO does:

1. Loads `index.js` and registers its default export under a tag of its own.
2. Sets its API on the element, as `vulogBo`, before inserting it.
3. Inserts the element in its content zone. The element fills that zone.
4. Removes the element when the user leaves the widget, which runs `disconnectedCallback`.

The BO only sees the errors thrown synchronously when it inserts the element. Show the others in the widget: every template has an error state.

As a Web Component, permissions are declarative, and the BO service worker adds the token to the Vulog API calls.

`@vulog/bo-widget-vite` warns at build time, and `bo-widget validate` at packing, when a `.js` file of the bundle calls `customElements.define(`, dependencies included.

## iframe

```ts
// widget.config.ts
export default defineWidgetConfig({ name: 'Fleet report', runtime: 'iframe' });
```

The contract:

- The entry is `index.html`, at the Vite root (the project folder), which loads your module. `entry` does not apply: remove it.
- `connect()` without element. Pass `widgetId` for diagnostics, and `targetOrigin` when you know the origin of the BO (see below).
- No Shadow DOM: the iframe isolates the widget, so global styles and `document.head` are fine there.
- `bo.resize({ height })` asks the BO for a height in pixels; `{ height: null }` fills the content zone again.

```ts
import { connect } from '@vulog/bo-widget-sdk';

const bo = await connect(null, { widgetId: 'fleet-report' });
const { locale } = await bo.getContext();
render(locale);
bo.on('localeChanged', ({ locale }) => render(locale));
await bo.resize({ height: document.body.scrollHeight });
```

With React, `renderIframeWidget(App)` of `@vulog/bo-widget-react` renders `App` into `#root` and connects. See its [README](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-react#iframe).

What the BO does:

1. Loads `index.html` in an iframe of its content zone.
2. Answers the `hello` handshake of `connect()` with `welcome`, the protocol version and the granted permissions, then serves the requests on a `MessagePort`.
3. Enforces the permissions: a request without its permission rejects with `FORBIDDEN`.

In an iframe, `authFetch` adds the token itself, so a Vulog API call needs `accessToken` as well as `apiInfo`.

### Who can frame the widget

`connect()` posts its handshake to the parent window. Without `targetOrigin`, it goes to any origin (`'*'`): a page of another site that frames your `index.html` can answer it and play the BO. It gets no Vulog token, since it answers `getAccessToken` itself, but it controls the context, the settings and the theme, and receives what the widget sends to the URLs it chose.

- Pass `targetOrigin` when the widget is displayed by a single BO, for example from a constant of your build: `connect(null, { targetOrigin: 'https://bo.example.com' })`.
- Serve `index.html` with a `Content-Security-Policy: frame-ancestors` header that lists the BOs allowed to display it. It works whatever the number of BOs, and the browser refuses to render the widget anywhere else.

## In the fake back office

`npm run dev` displays the widget in both modes the way the BO does: a Web Component registered under a `widget-{hash}` tag with its API injected as `vulogBo`, or an iframe with the `postMessage` handshake. For a Web Component, `/` redirects to the fake BO, `/__bo-widget/`. For an iframe, `/` is the widget page the fake BO displays.
