# @vulog/bo-widget-sdk: guide for AI coding agents

You are writing or changing a **Vulog back office (BO) widget**: a page the BO shows in its menu, as a Web Component or in an iframe. This package is the only way the widget talks to the BO. Read this page before writing widget code; the types in `dist/index.d.ts` hold the full TSDoc.

## Facts to rely on

- Entry points: `@vulog/bo-widget-sdk` (protocol client, no dependency) and `@vulog/bo-widget-sdk/manifest` (Zod schemas of `widget.json`).
- `connect(element?, options?)` returns a `BoClient` with **the same API in both modes**. Write the widget once.
- Web Component: `connect(this)` inside `connectedCallback`. iframe: `connect()` without argument.
- All requests are async and reject with `BoError` (`code`, `reason`, `status`), never with another error type, except `authFetch`, which may also reject with the `TypeError` of `fetch` (network) or of a path outside `baseUrl`.
- Events: `on(name, listener)` returns the unsubscribe function. Names: `localeChanged`, `fleetChanged`, `userChanged`, `themeChanged`, `routeChanged`. The initial state is **not** pushed: read it with the getters first.
- Permissions (`accessToken`, `apiInfo`, `navigate`, `notify`) come from the `permissions` of `widget.json`. In an iframe, a missing permission rejects with `FORBIDDEN`; as a Web Component, they are declarative.

## Rules

1. **Web Component: export the class, never call `customElements.define`**, and never register other custom elements globally. The BO registers the class under a tag it computes (`widget-` + hash). Do not assume the tag name: use `this`.
2. Mount the UI in `connectedCallback`, clean up everything in `disconnectedCallback`: call `bo.disconnect()`, remove listeners and timers, unmount the framework root.
3. Keep styles in the Shadow DOM (`this.attachShadow({ mode: 'open' })`). Never inject CSS into `document.head`.
4. Call Vulog APIs with `bo.authFetch('api/v1/...')`, a path relative to the API base URL. Do not build URLs from `getApiInfo()` by hand, do not add `Authorization` or `X-API-Key` yourself, and do not call `getAccessToken()` for Vulog APIs.
5. Use `getAccessToken()` or `authFetch(absoluteUrl)` only for a third-party backend that expects the Vulog token. The widget needs the `accessToken` permission.
6. Navigate with `bo.navigate({ path })`, never with `window.location` or `history`: `'/app/...'` is a BO route under the current fleet, `'details/1'` is relative to the widget's view.
7. Show feedback with `bo.notify({ message, severity })` (`success`, `info`, `warning`, `error`).
8. Use `getCurrentUser()` to know who is connected. Never decode the token.
9. Handle a `401` from `authFetch` (session lost) by showing a message, not by retrying in a loop: the SDK already retried once.
10. Keep secrets out of the widget bundle: it is public. Settings needing a secret belong to your backend.

## Error handling

```ts
import { BoError } from '@vulog/bo-widget-sdk';

try {
  await bo.navigate({ path: 'details/1' });
} catch (error) {
  if (!(error instanceof BoError)) throw error;
  switch (error.code) {
    case 'FORBIDDEN': // add the permission to widget.json
    case 'INVALID_PAYLOAD': // fix the payload
    case 'INTERNAL': // error.reason: 'no-token' | 'not-installed' | 'disposed' | server code
    case 'UNKNOWN_TYPE': // older BO: degrade gracefully
    case 'TIMEOUT':
    case 'DISCONNECTED':
  }
}
```

`reason: 'disposed'` means the widget was removed while a request was pending: ignore it.

## Minimal widgets

Web Component (`index.js`):

```ts
import { connect, type BoClient } from '@vulog/bo-widget-sdk';

export default class extends HTMLElement {
  private bo?: BoClient;
  private stop?: () => void;

  async connectedCallback() {
    const root = this.attachShadow({ mode: 'open' });
    this.bo = await connect(this);
    const render = (locale: string | null) => (root.textContent = `Locale: ${locale}`);
    render((await this.bo.getContext()).locale);
    this.stop = this.bo.on('localeChanged', ({ locale }) => render(locale));
  }

  disconnectedCallback() {
    this.stop?.();
    this.bo?.disconnect();
  }
}
```

iframe (`index.html` loading a module):

```ts
import { connect } from '@vulog/bo-widget-sdk';

const bo = await connect(null, { widgetId: 'fleet-report' });
const { fleetId } = await bo.getContext();
const vehicles = await (await bo.authFetch(`api/v1/fleets/${fleetId}/vehicles`)).json();
await bo.resize({ height: document.body.scrollHeight });
```

## Manifest (`widget.json`)

Validate before publishing:

```ts
import { publishedWidgetManifestSchema } from '@vulog/bo-widget-sdk/manifest';

const result = publishedWidgetManifestSchema.safeParse(manifest);
```

Shape: `manifestVersion: 1`, `id` (kebab-case, ≤ 63), `name`, `version` (semver without `+build`), `runtime` (`{ type: 'webcomponent', entry: 'index.js' }` or `{ type: 'iframe', entry: 'index.html' }`), `protocol: { version: 2 }`, and optionally `description` (Markdown, ≤ 2000), `author`, `icon` (path inside the bundle), `menu`, `permissions`, `settings` (`{ key, type: 'string' | 'url' | 'number' | 'boolean', required?, label?, default? }`). Unknown fields are errors.

## Testing a widget

Pass a fake injected API to `connect`: any object with `getContext` and `on` methods is used as the BO.

```ts
const bo = await connect({
  vulogBo: { protocolVersion: 2, getContext: async () => context, on() {}, off() {} /* … */ },
});
```
