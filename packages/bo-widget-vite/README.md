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

The fake BO displays the widget as the BO does: a Web Component registered under a `widget-{hash}` tag with its API injected as `vulogBo`, or an iframe with the `postMessage` handshake. It answers every request of the protocol, and its bar pushes `localeChanged` and `themeChanged`, with the locales in the BO format (`en_GB`, `fr_FR`…). A log at the bottom shows each request and its answer, and `notify` shows a snackbar.

Its context defaults to the fleet `DEV-FLEET`, the locale `en_GB`, the host `BO_WIDGET_HOST` (`localhost` without it) and the `basename` `/__bo-widget`, the path of its page, so that a widget router matches it. As in the BO, the page is served on every sub-route (`/__bo-widget/stations/1`): a reload or a deep link opens the same screen of a Web Component (an iframe widget page stays on its own URL). `navigate` to a route of the widget's view pushes it to the history and pushes `routeChanged`, as do back and forward; a route outside the view is only shown in the bar, with a warning, since the BO would leave the widget. A `dev.context.basename` must start with `/`, and the dev server warns when it is outside `/__bo-widget`. The fake BO warns too on a locale that is not `language_COUNTRY`.

In an iframe, the fake BO only serves the `hello` of a page of this dev server, and its pages and the widget page can only be framed by this dev server (`Content-Security-Policy: frame-ancestors 'self'`): another site that framed them could otherwise navigate the widget frame to its own page and ask for the token. As in the BO, permissions are enforced in an iframe only (`FORBIDDEN`); for a Web Component, a request the manifest does not allow is served, with a warning in the log. In an iframe, `authFetch` needs `accessToken` as well as `apiInfo`, since the SDK adds the token itself.

Errors the widget throws (loading the entry, constructor, `connectedCallback`, rejected promises) show in the log too, and in the browser console.

`getApiInfo` returns a `baseUrl` on the dev server (`http://localhost:5173/__bo-widget/api/boapi/proxy/`), so `authFetch` calls it: in mock mode it answers the static responses, in token and login modes it forwards to the real API, as the BO service worker does. It only answers the pages it serves: a call from another origin gets `403`.

### Mock mode (default)

A fake token, and static answers for the Vulog API calls: a `200` with the JSON of the key `"<METHOD> <path>"`, the method in capitals and the path URL-decoded, without leading `/` nor query. Any other call gets a `404` that says which key to add, also logged in the terminal.

```ts
defineWidgetConfig({
  name: 'Fleet report',
  dev: {
    context: { fleetId: 'FLEET-1', locale: 'fr_FR' }, // getContext
    user: { roles: ['fleetagent'] }, // getCurrentUser
    settings: { currency: 'CAD' }, // getSettings, over the setting defaults
    responses: {
      'GET fleetmanager/public/fleets/FLEET-1/vehicles': [{ id: 'v1' }],
    },
  },
});
```

### Token mode

The Vulog API calls go to a real dev environment. Put the host of its BO and a token of your session in that BO into `.env.local` (never commit it):

```bash
BO_WIDGET_HOST=bo.example.com
BO_WIDGET_TOKEN=eyJ…
```

Or keep the host in `.env.local` and pass the short-lived token through the standard input, with [`@vulog/bo-widget-cli`](../bo-widget-cli/): `pbpaste | npx bo-widget dev --token -`.

At startup, the dev server reads the API base URL and the API key from the anonymous conf of that BO, as the BO itself does (`https://{host}/fe-api/anonymous/bo/{host}/conf`, fields `url.baseUrl` and `X-API-Key`). The BO must be served over `https:`. The dev server keeps only the origin of `url.baseUrl`, which must be `https:` too, and calls `{origin}/boapi/proxy/`. When the conf cannot be read or lacks a field, `vite` stops with a message that names the host and the field; the values of the conf are never logged. `getContext().host` returns this host, as in the BO (in mock mode too, where the conf is not read); `dev.context.host` still overrides it.

Without `BO_WIDGET_HOST`, copy the API base URL and the API key from the BO instead:

```bash
BO_WIDGET_API_URL=https://…/boapi/proxy/
BO_WIDGET_API_KEY=…
```

`BO_WIDGET_HOST` takes precedence over these two variables: `vite` warns when they are set too, and ignores them. In the `test` mode of Vitest, the fake BO always stays in mock mode, so that a test run never reads the conf of a BO: the mode and `BO_WIDGET_HOST` are still checked, the host kept, and `vite` warns when token mode was asked for.

The mode switches to `token` when `BO_WIDGET_TOKEN` is set; `dev.mode: 'token'` forces it, and `vite` then fails to start without the token and either `BO_WIDGET_HOST` or both `BO_WIDGET_API_URL` and `BO_WIDGET_API_KEY`. `dev.responses` are ignored in this mode. The dev server forwards each call to the API and adds `Authorization: Bearer` when the widget did not; the API key reaches the API through `getApiInfo`, as `authFetch` sends it. The user stays the `dev` fixture, and so does the context, apart from its host.

`vite` warns at startup when the token is not a JWT or already expired. Once it expires, the API answers `401` (logged with a hint) and `getAccessToken` rejects (`INTERNAL`, reason `no-token`): paste a new one and restart `vite`. The access token and the API key are masked in the log of the fake BO. The token is never written in the page or its modules (Vite serves them to any page of `localhost`): `getAccessToken` asks the dev server for it on `/__bo-widget/token`, which only answers the pages of this dev server, on `localhost`, as in login mode.

Keep the dev server on `localhost` in token mode: with `server.host`, anyone on your network could call the API with your token through it (the plugin warns). Keep Vite's default `server.allowedHosts` too: with `true`, a page that rebinds its domain to your machine (DNS rebinding) could call the dev server, and so the API with your token (the plugin warns as well). `/__bo-widget/token` itself only answers a browser of this machine on `localhost`: a client of the network gets `403 not-local`, even when it sends `Host: localhost`.

### Login mode

A token lasts a few minutes: in token mode, you paste a new one and restart `vite` each time it expires. In login mode, you log in to the real BO yourself, and the dev server follows the token of that session for as long as it lasts. Set `BO_WIDGET_HOST` (in `.env.local` or the shell) and run [`@vulog/bo-widget-cli`](../bo-widget-cli/):

```bash
BO_WIDGET_HOST=bo.example.com npx bo-widget dev --login
```

1. The dev server opens `https://{host}/` in a dedicated Chrome: a profile of its own, kept between two runs in `node_modules/.cache/bo-widget/chrome-profile`, with its DevTools port on `127.0.0.1:9333` only. If a Chrome already listens on that port (when `vite` restarts itself after a config change, for instance), it is reused. `Ctrl+C` in the terminal closes it with `vite`.
2. Log in there as usual: your password, 2FA and SSO stay between you and the BO.
3. Once you are logged in, the fake BO opens in a tab of the same Chrome. The calls of the widget carry the token of your session.

The token stays in the auth service worker of the BO. Through the Chrome DevTools Protocol, the dev server asks that worker for it, in the tab of the BO: the worker answers the valid token, and renews it first when it has expired. It asks again when the token expires within a minute, after a `401` of the API, and every 30 seconds in the background, which keeps the session alive even when you never touch the BO tab. The token is kept in memory only: it is never written to the terminal, the log of the fake BO, nor any file outside the Chrome profile. `getAccessToken` reads the latest one from the dev server (`/__bo-widget/token`, which only answers the pages of the dev server, on `localhost`).

Keep the tab of the BO open. A logout or a closed BO tab is seen within about 30 seconds (a logout is confirmed by a second check), a closed Chrome at once. The terminal then says why, once, the calls get `401` (`no-token`, with the same reason) without reaching the API, and `getAccessToken` rejects with the reason `no-token`. After a logout or a closed tab, log in again in the same Chrome (reopen `https://{host}/`): the calls go through again, without restarting `vite`. After closing Chrome, restart `bo-widget dev --login`.

When the worker or Chrome does not answer for a while (a BO tab paused in the debugger, or showing a dialog), the token still valid is kept until it expires, and the terminal says so once.

Login mode needs Google Chrome and Node.js 22 or later (Chromium is found on macOS and Linux; elsewhere, set `BO_WIDGET_CHROME`). Variables:

| Variable               | Default                                        | Use                                                                          |
| ---------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `BO_WIDGET_HOST`       | (required)                                     | The BO to log in to; its conf gives the API URL and key.                     |
| `BO_WIDGET_CHROME`     | the usual install paths                        | Path of the Chrome executable.                                               |
| `BO_WIDGET_DEBUG_PORT` | `9333`                                         | DevTools port of that Chrome, on `127.0.0.1`.                                |
| `BO_WIDGET_LOGIN`      | unset (`bo-widget dev --login` sets it to `1`) | `1` or `true` switches to login mode, over `dev.mode` and `BO_WIDGET_TOKEN`. |

`vite` refuses to start in login mode with `server.host` (or `--host`): the token of your session would be served to your network. The token and the local API also answer `403 not-local` to a request for another host than `localhost`, `127.0.0.1` or `[::1]`, even with `server.allowedHosts`, so that a page whose domain points to your machine cannot read them, and to a request from another machine. In the `test` mode of Vitest, the fake BO stays in mock mode, with a warning.

### Let an agent drive the fake back office

In login mode, a coding agent can see and drive the fake BO while you change the code of the widget (HMR): connect the [Chrome DevTools MCP server](https://github.com/ChromeDevTools/chrome-devtools-mcp) to the Chrome of login mode instead of a Chrome of its own:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9333"]
    }
  }
}
```

Change `9333` when you set `BO_WIDGET_DEBUG_PORT`, and `5173` below when Vite serves on another port.

The agent then takes snapshots and screenshots of the fake BO, reads its log at the bottom of the page and the console, and clicks through the widget. That Chrome holds your session in the real BO, so give the agent these rules, for instance in the `CLAUDE.md` or `AGENTS.md` of the widget:

- Act only on the tab of the fake BO (`http://localhost:5173/__bo-widget/`): never select, read nor drive the tab of the real BO.
- Never read the authenticated network requests (no `get_network_request`): their headers carry your token. Never read `/__bo-widget/token`, nor call `getAccessToken` yourself.
- Report the status codes and messages of the API, never headers nor tokens.

The token never goes through the agent as long as it follows these rules: the agent only sees the pages, the dev server adds the token to the calls of a Web Component, and an iframe widget reads it through `getAccessToken`, which the log of the fake BO masks.

## License

[MIT](./LICENSE)
