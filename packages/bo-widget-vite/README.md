# @vulog/bo-widget-vite

Vite plugin to build widgets for the Vulog back office (BO), as a Web Component or in an iframe.

- **`widget.json` generated and validated** from your widget configuration and `package.json`, with the rules applied on publication: an invalid configuration fails `vite` and `vite build`.
- **The bundle the BO loads**: `index.js` (ES module whose default export is the element class) or `index.html`, with `base: './'`.
- **A warning on `customElements.define`**, once per module, dependencies included: the BO registers your class under its own tag. Not under Vitest (dev server in the `test` mode), whose tests register the widget to mount it.
- **A fake BO in dev**: `vite` displays the widget the way the BO does, with mock data or against a real Vulog API.

## Install

```bash
npm install --save-dev vite @vulog/bo-widget-vite@next
npm install @vulog/bo-widget-sdk@next
```

Requires Vite 7 or 8, and Node.js `^20.19` or `>=22.12` (those of Vite).

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
  private bo?: Promise<BoClient>;

  async connectedCallback() {
    // Kept as a promise: the element may be removed before `connect` resolves.
    this.bo = connect(this);
    const { fleetId } = await (await this.bo).getContext();
    (this.shadowRoot ?? this.attachShadow({ mode: 'open' })).textContent = `Fleet ${fleetId}`;
  }

  disconnectedCallback() {
    void this.bo?.then((bo) => bo.disconnect());
  }
}
```

- `vite` serves the fake BO on `http://localhost:5173/__bo-widget/` and prints its URL. For a Web Component, `/` redirects there; for an iframe, `/` is the widget page the fake BO displays.
- `vite build` writes `dist/` with `index.js` and `widget.json`. `npx bo-widget pack` ([`@vulog/bo-widget-cli`](../bo-widget-cli/)) zips it into `{id}-{version}.zip`, checked with the rules applied on publication; publish that zip in the BO, Configuration > Widgets.

## Configuration

| Field          | Default                            | Description                                                                                                                                                        |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`         | required                           | Name shown to the BO admins.                                                                                                                                       |
| `id`           | `package.json` name, without scope | Kebab-case id, 63 characters at most.                                                                                                                              |
| `description`  | `package.json` description         | What the widget does, in Markdown: not blank, 2 000 characters at most.                                                                                            |
| `author`       | `package.json` author              | `{ name, email? }`.                                                                                                                                                |
| `icon`         | none                               | Path of the icon in the bundle; put the file in `public/`. The build fails if absent.                                                                              |
| `runtime`      | `webcomponent`                     | `webcomponent` builds `entry` as `index.js`; `iframe` builds `index.html`.                                                                                         |
| `entry`        | `src/main.ts`                      | Web Component only: module whose default export is the element class.                                                                                              |
| `minBoVersion` | none                               | Oldest BO version the widget works with.                                                                                                                           |
| `menu`         | none                               | `{ defaultSection?, defaultTarget?, defaultPosition?, defaultRoles?, label? }`.                                                                                    |
| `permissions`  | `[]`                               | `accessToken`, `apiInfo`, `navigate`, `notify`.                                                                                                                    |
| `settings`     | `[]`                               | `{ key, type, required?, label?, default? }`, `type` among `string`, `url`, `number`, `boolean` and `default` of that type. Filled in at installation. No secrets. |
| `dev`          | `{}`                               | Fake BO options, see below.                                                                                                                                        |

The `version` of `widget.json` is always the `package.json` version. An unknown field is an error, inside `dev` too, so a typo cannot be silently dropped. `buildManifest(config, packageJson)` is exported to build the manifest outside Vite; it throws a `BoWidgetConfigError` whose `issues` list each problem with its path, and say when the value came from `package.json`.

The plugin sets `base: './'` (and warns if you set another one) and, for a Web Component, `build.lib` and `process.env.NODE_ENV` (library mode leaves it, but the widget bundles its dependencies, which read it). CSS imported as a regular file is emitted next to `index.js`, outside the Shadow DOM: import your styles inline (`?inline`) or let your framework inject them in the shadow root.

## Fake back office

The fake BO displays the widget as the BO does: a Web Component registered under a `widget-{hash}` tag with its API injected as `vulogBo`, or an iframe with the `postMessage` handshake. It answers every request of the protocol, and its bar pushes `localeChanged` and `themeChanged`. A log at the bottom shows each request and its answer, and `notify` shows a snackbar.

As in the BO, permissions are enforced in an iframe only (`FORBIDDEN`); for a Web Component, a request the manifest does not allow is served, with a warning in the log. In an iframe, `authFetch` needs `accessToken` as well as `apiInfo`, since the SDK adds the token itself.

Errors the widget throws (loading the entry, constructor, `connectedCallback`, rejected promises) show in the log too, and in the browser console.

`getApiInfo` returns a `baseUrl` on the dev server (`http://localhost:5173/__bo-widget/api/boapi/proxy/`), so `authFetch` calls it: in mock mode it answers the static responses, in token mode it forwards to the real API, as the BO service worker does. It only answers the pages it serves: a call from another origin gets `403`.

### Mock mode (default)

A fake token, and static answers for the Vulog API calls: a `200` with the JSON of the key `"<METHOD> <path>"`, the method in capitals and the path URL-decoded, without leading `/` nor query. Any other call gets a `404` that says which key to add, also logged in the terminal.

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

Or keep the API URL and key in `.env.local` and pass the short-lived token through the standard input, with [`@vulog/bo-widget-cli`](../bo-widget-cli/): `pbpaste | npx bo-widget dev --token -`.

The mode switches to `token` when `BO_WIDGET_TOKEN` is set; `dev.mode: 'token'` forces it, and `vite` then fails to start without the three variables. `dev.responses` are ignored in this mode. The dev server forwards each call to `BO_WIDGET_API_URL` and adds `Authorization: Bearer` when the widget did not; the API key reaches the API through `getApiInfo`, as `authFetch` sends it. Context and user stay the `dev` fixtures.

`vite` warns at startup when the token is not a JWT or already expired. Once it expires, the API answers `401` (logged with a hint) and `getAccessToken` rejects (`INTERNAL`, reason `no-token`): paste a new one and restart `vite`. The access token is masked in the log of the fake BO.

Keep the dev server on `localhost` in token mode: with `server.host`, anyone on your network could call the API with your token through it (the plugin warns).

## License

[MIT](./LICENSE)
