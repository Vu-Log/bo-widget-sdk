# @vulog/bo-widget-vite

Vite plugin to build widgets for the Vulog back office (BO), as a Web Component or in an iframe.

- **`widget.json` generated and validated** from your widget configuration and `package.json`, with the rules applied on publication: an invalid configuration fails `vite` and `vite build`.
- **The bundle the BO loads**: `index.js` (ES module whose default export is the element class) or `index.html`, with `base: './'`.
- **A warning on every `customElements.define`**: the BO registers your class under its own tag.
- **A fake BO in dev**: `vite` displays the widget the way the BO does, with mock data or against a real Vulog API.

## Install

```bash
npm install --save-dev vite @vulog/bo-widget-vite@next
npm install @vulog/bo-widget-sdk@next
```

Requires Vite 7 or 8.

## Quick start

```ts
// widget.config.ts
import { defineWidgetConfig } from '@vulog/bo-widget-vite';

export default defineWidgetConfig({
  name: 'Fleet report',
  permissions: ['apiInfo', 'notify'],
  menu: { label: { en: 'Fleet report', fr: 'Rapport de flotte' } },
  settings: [{ key: 'currency', type: 'string', default: 'EUR' }],
});
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { boWidget } from '@vulog/bo-widget-vite';
import widget from './widget.config';

export default defineConfig({ plugins: [boWidget(widget)] });
```

```ts
// src/main.ts: export the class, never register it
import { connect, type BoClient } from '@vulog/bo-widget-sdk';

export default class FleetReport extends HTMLElement {
  private bo?: BoClient;

  async connectedCallback() {
    this.bo = await connect(this);
    const { fleetId } = await this.bo.getContext();
    (this.shadowRoot ?? this.attachShadow({ mode: 'open' })).textContent = `Fleet ${fleetId}`;
  }

  disconnectedCallback() {
    this.bo?.disconnect();
  }
}
```

- `vite` serves the fake BO on `http://localhost:5173/__bo-widget/` (`/` redirects there).
- `vite build` writes `dist/` with `index.js` and `widget.json`. Zip the content of `dist/` and publish it in the BO, Configuration > Widgets.

## Configuration

| Field          | Default                            | Description                                                                           |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| `name`         | required                           | Name shown to the BO admins.                                                          |
| `id`           | `package.json` name, without scope | Kebab-case id, 63 characters at most.                                                 |
| `description`  | `package.json` description         | What the widget does, in Markdown (2 000 characters at most).                         |
| `author`       | `package.json` author              | `{ name, email? }`.                                                                   |
| `icon`         | none                               | Path of the icon in the bundle; put the file in `public/`. The build fails if absent. |
| `runtime`      | `webcomponent`                     | `webcomponent` builds `entry` as `index.js`; `iframe` builds `index.html`.            |
| `entry`        | `src/main.ts`                      | Web Component only: module whose default export is the element class.                 |
| `minBoVersion` | none                               | Oldest BO version the widget works with.                                              |
| `menu`         | none                               | `{ defaultSection?, defaultTarget?, defaultPosition?, defaultRoles?, label? }`.       |
| `permissions`  | `[]`                               | `accessToken`, `apiInfo`, `navigate`, `notify`.                                       |
| `settings`     | `[]`                               | `{ key, type, required?, label?, default? }`, filled in at installation. No secrets.  |
| `dev`          | `{}`                               | Fake BO options, see below.                                                           |

The `version` of `widget.json` is always the `package.json` version. An unknown field is an error, so a typo cannot be silently dropped. `buildManifest(config, packageJson)` is exported to build the manifest outside Vite; it throws a `BoWidgetConfigError` whose `issues` list each problem with its path.

The plugin sets `base: './'` (and warns if you set another one) and, for a Web Component, `build.lib`. CSS imported as a regular file is emitted next to `index.js`, outside the Shadow DOM: import your styles inline (`?inline`) or let your framework inject them in the shadow root.

## Fake back office

The fake BO displays the widget as the BO does: a Web Component registered under a `widget-{hash}` tag with its API injected as `vulogBo`, or an iframe with the `postMessage` handshake. It answers every request of the protocol, and its bar pushes `localeChanged` and `themeChanged`. A log at the bottom shows each request and its answer, and `notify` shows a snackbar.

As in the BO, permissions are enforced in an iframe only (`FORBIDDEN`); for a Web Component, a request the manifest does not allow is served, with a warning in the log.

`getApiInfo` returns a local `baseUrl` (`/__bo-widget/api/boapi/proxy/`), so `authFetch` calls the dev server, which plays the BO service worker.

### Mock mode (default)

A fake token, and static answers for the Vulog API calls. Any call without answer gets a `404` that says which key to add.

```ts
defineWidgetConfig({
  name: 'Fleet report',
  dev: {
    context: { fleetId: 'FLEET-1', locale: 'fr' }, // getContext
    user: { roles: ['fleetagent'] }, // getCurrentUser
    settings: { currency: 'CAD' }, // getSettings, over the setting defaults
    responses: {
      'GET fleetmanager/public/fleets/FLEET-1/vehicles': [{ id: 'v1' }],
    },
  },
});
```

### Token mode

The Vulog API calls go to a real dev environment. Copy a token, the API base URL and the API key from the BO of that environment into `.env.local` (never commit it):

```bash
BO_WIDGET_TOKEN=eyJ…
BO_WIDGET_API_URL=https://…/boapi/proxy/
BO_WIDGET_API_KEY=…
```

The mode switches to `token` when `BO_WIDGET_TOKEN` is set (or force it with `dev.mode`). The dev server forwards each call to `BO_WIDGET_API_URL` and adds `Authorization: Bearer` when the widget did not. Once the token expires, `getAccessToken` fails with `no-token`: paste a new one and restart `vite`. Context and user stay the `dev` fixtures.

Keep the dev server on `localhost` in token mode: with `server.host`, anyone on your network could call the API with your token through it (the plugin warns).

## License

[MIT](./LICENSE)
