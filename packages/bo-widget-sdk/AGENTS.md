# @vulog/bo-widget-sdk: guide for AI coding agents

You are writing or changing a **Vulog back office (BO) widget**: a page the BO shows in its menu, as a Web Component or in an iframe. This package is the only way the widget talks to the BO. Read this page before writing widget code; the types in `dist/index.d.ts` hold the full TSDoc.

## Facts to rely on

- Entry points: `@vulog/bo-widget-sdk` (protocol client, no dependency) and `@vulog/bo-widget-sdk/manifest` (Zod schemas of `widget.json`).
- `connect(element?, options?)` returns a `BoClient` with **the same API in both modes**. Write the widget once.
- Web Component: `connect(this)` inside `connectedCallback`. iframe: `connect()` without argument.
- All requests are async and reject with `BoError` (`code`, `reason`, `status`), never with another error type, except `authFetch`, which may also reject with what `fetch` rejects with (`TypeError` on network failure, `AbortError` on abort) and with a `TypeError` for an input it refuses (a `Request` object, a path outside `baseUrl`).
- Events: `on(name, listener)` returns the unsubscribe function. Names: `localeChanged`, `fleetChanged`, `userChanged`, `themeChanged`, `routeChanged`. The initial state is **not** pushed: read it first with `getContext` (locale, fleet), `getCurrentUser` and `getTheme`. No getter gives the current route: `getContext().basename` is the widget's view, then follow `routeChanged`.
- Permissions (`accessToken`, `apiInfo`, `navigate`, `notify`, `storage`, `sharedStorage`) come from the `permissions` of `widget.json`. In an iframe, a missing permission rejects with `FORBIDDEN`; as a Web Component, they are declarative, except `storage` and `sharedStorage`, which reject with `FORBIDDEN` in both modes.

## Rules

1. **Web Component: export the class, never call `customElements.define`**, and never register other custom elements globally. The BO registers the class under a tag it chooses. Do not assume the tag name: use `this`.
2. Mount the UI in `connectedCallback`, clean up everything in `disconnectedCallback`: call `bo.disconnect()`, remove listeners and timers, unmount the framework root. `connectedCallback` can run again when the element is moved: reuse `this.shadowRoot`, and expect `disconnectedCallback` to run before `connect()` resolves.
3. Keep styles in the Shadow DOM (`this.shadowRoot ?? this.attachShadow({ mode: 'open' })`). Never inject CSS into `document.head`.
4. Call Vulog APIs with `bo.authFetch('<service>/...')`, a path relative to `baseUrl`, the BO admin API, which already ends with `/boapi/proxy/`: never prefix the path with `boapi/proxy/`. In the Vulog API reference (swagger), a route may declare its own server, such as `https://java-{region}.vulog.com/boapi/proxy/fleetmanager/public` for `GET /fleets/{fleetId}/vehicles`: the path to pass is the part of that server after `/boapi/proxy/`, followed by the route, here ``bo.authFetch(`fleetmanager/public/fleets/${fleetId}/vehicles?page=0`)`` (paginated, at most 2000 vehicles per page). The BO service worker only adds the token under `/boapi/proxy/`: other Vulog APIs (`/apiv5/`) are not covered. Do not build URLs from `getApiInfo()` by hand, do not add `Authorization` or `X-API-Key` yourself, and do not call `getAccessToken()` for Vulog APIs.
5. Use `getAccessToken()` or `authFetch(absoluteUrl)` only for a third-party backend that expects the Vulog token. The widget needs the `accessToken` permission.
6. Navigate with `bo.navigate({ path })`, never with `window.location` or `history`: `'/app/...'` is a BO route under the current fleet, `'details/1'` is relative to the widget's view.
7. Show feedback with `bo.notify({ message, severity })` (`success`, `info`, `warning`, `error`).
8. Use `getCurrentUser()` to know who is connected. Never decode the token.
9. Handle a `401` from `authFetch` (session lost) by showing a message, never by retrying in a loop. When the SDK adds the token itself (iframe, or a third-party URL), it has already retried once with a new token.
10. Keep secrets out of the widget bundle: it is public. Settings needing a secret belong to your backend.
11. Log with `bo.log.warn(message, context?)` and `bo.log.error(...)` (`debug` and `info` are kept only while the debug mode of the installation is on). `console.log` never reaches the BO. Never put personal data, tokens or secrets in a message or a context; keep the context small (3 KB of JSON at most, otherwise it becomes `{ truncated: true, reason }`); pass a caught error as `{ error }`, its name, message and stack (cut) are kept. In an iframe, uncaught errors are sent for you.
12. Keep the widget's data with `bo.storage.collection<T>(name)` (permission `storage`) or `bo.sharedStorage` (permission `sharedStorage`, shared by the publisher's widgets on the host: prefix collection names with your domain, `planning-stations`). Methods: `get(id)` (`null` when absent), `set(id, value, { ifVersion?, ttlSeconds? })`, `add(value, { ttlSeconds? })`, `update(id, patch, { ifVersion?, ttlSeconds? })` (first-level merge), `delete(id)`, `list({ limit?, cursor? })` and `query({ where, limit?, cursor? })` (`{ items, nextCursor }`, read until `nextCursor` is `null`), `clear()`. A value is a JSON object of 64 KB at most (`{ value: 42 }` for a scalar, ISO strings for dates). Branch on `error.reason`: `version-conflict` and `already-exists` (`ifVersion`; `ifVersion: 0` creates only if absent, a lock with `ttlSeconds`), `not-found`, `quota-exceeded`, `rate-limited` (wait, never retry in a loop). Never store secrets or needless personal data: every user of the host can read it.

## Finding a Vulog API endpoint

Never guess an endpoint. The `aima-api` skill of the SDK repository (`plugins/bo-widget/skills/aima-api` in <https://github.com/Vu-Log/bo-widget-sdk>) lists the admin endpoints a widget can call, with their parameters, bodies and response schemas, and the path to pass to `authFetch`. It is generated from the public Vulog API reference, and a weekly job proposes an update. Install it in Claude Code with `/plugin marketplace add Vu-Log/bo-widget-sdk` then `/plugin install bo-widget@bo-widget-sdk`, or in another agent with `npx skills add Vu-Log/bo-widget-sdk`. Without it, read the reference at <https://vulog-doc-api.web.app/>.

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
    case 'INTERNAL': // error.reason: 'no-token' | 'not-installed' | 'disposed' | server code ('version-conflict'…)
    case 'UNKNOWN_TYPE': // older BO: degrade gracefully
    case 'TIMEOUT':
    case 'DISCONNECTED':
  }
}
```

`reason: 'disposed'` (or `DISCONNECTED` after your own `disconnect()`) means the widget was removed while a request was pending: ignore it.

## Minimal widgets

Web Component (`index.js`):

```ts
import { connect, type BoClient } from '@vulog/bo-widget-sdk';

export default class extends HTMLElement {
  private bo?: BoClient;
  private stop?: () => void;

  async connectedCallback() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
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
const vehicles = await (
  await bo.authFetch(`fleetmanager/public/fleets/${fleetId}/vehicles?page=0`)
).json();
await bo.resize({ height: document.body.scrollHeight });
```

## Manifest (`widget.json`)

Validate before publishing:

```ts
import { publishedWidgetManifestSchema } from '@vulog/bo-widget-sdk/manifest';

const result = publishedWidgetManifestSchema.safeParse(manifest);
```

Shape: `manifestVersion: 1`, `id` (kebab-case, ≤ 63), `name`, `version` (semver without `+build`), `runtime` (`{ type: 'webcomponent', entry: 'index.js' }` or `{ type: 'iframe', entry: 'index.html' }`), `protocol: { version: 2 }`, and optionally `description` (Markdown, ≤ 2000), `author` (`{ name, email? }`), `icon` (path inside the bundle), `menu` (`{ defaultSection?, defaultTarget?, defaultPosition?: 'before' | 'after', defaultRoles?: string[], label? }`), `permissions`, `settings` (`{ key, type: 'string' | 'url' | 'number' | 'boolean', required?, label?, default? }`). Every `label` is a record per locale (`{ en: 'Fleet report', fr: 'Rapport de flotte' }`), never a string. Unknown fields are errors.

## Testing a widget

Pass a fake injected API to `connect`: any object with `getContext`, `on` and `off` methods is used as the BO, in `mode: 'webcomponent'`. Then:

- a request the fake does not define rejects with `UNKNOWN_TYPE`;
- Vulog API calls of `authFetch` get no `Authorization` header (the BO service worker adds it), so stub `fetch`;
- `resize` resolves `{ height: null }`;
- keep the listeners to emit events.

```ts
import { connect } from '@vulog/bo-widget-sdk';

const listeners = new Map<string, Set<(data: unknown) => void>>();
const bo = await connect({
  vulogBo: {
    protocolVersion: 2,
    getContext: async () => context,
    getApiInfo: async () => ({ baseUrl: 'https://api.example.com/boapi/proxy/', apiKey: 'test' }),
    on: (name: string, listener: (data: unknown) => void) =>
      listeners.set(name, (listeners.get(name) ?? new Set()).add(listener)),
    off: (name: string, listener: (data: unknown) => void) => listeners.get(name)?.delete(listener),
  },
});
const emit = (name: string, data: unknown) => listeners.get(name)?.forEach((l) => l(data));
```
