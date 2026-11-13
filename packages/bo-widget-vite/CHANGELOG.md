# @vulog/bo-widget-vite

## 0.1.0-next.6

### Minor Changes

- 89f8513: Fake back office: serves `bo.storage` and `bo.sharedStorage` from memory (`vulogBo.storage` / `vulogBo.sharedStorage` for a Web Component, the `storage` and `sharedStorage` requests on the port of an iframe), as two separate spaces, with the checks of the back office (collection and id names, JSON values of 64 KB at most, options, `where`) and the answers of the Vulog server (`ifVersion`, `ttlSeconds` expiry, pages in id order with their cursor, default quotas). Their permissions are enforced in both modes, as in the back office. A **Clear storage** button in the bar empties both spaces. `widget.config.ts` accepts the `storage` and `sharedStorage` permissions.

### Patch Changes

- Updated dependencies [89f8513]
  - @vulog/bo-widget-sdk@0.1.0-next.7

## 0.1.0-next.5

### Minor Changes

- ca30a01: Fake back office: serves `bo.log` (`vulogBo.log` for a Web Component, the `log` request on the port of an iframe). Like the back office, the port answers `INVALID_PAYLOAD` for an unknown level or a blank message; as a Web Component, `vulogBo.log` never throws and the refusal only shows in the log panel. Each widget log shows in the log panel of the page, the browser console and the terminal of the dev server, where control characters are removed so that a widget cannot drive the terminal.

### Patch Changes

- Updated dependencies [ca30a01]
  - @vulog/bo-widget-sdk@0.1.0-next.6

## 0.1.0-next.4

### Patch Changes

- 6ceee8a: Fixes from the global review.
  
  - Fake back office, token mode: the pasted token is no longer written in the module of the page, which Vite serves to any page of `localhost` (another project in dev could read it). As in login mode, `getAccessToken` asks the dev server for it on `/__bo-widget/token`, which only answers the pages of this dev server, on `localhost`, never cached; once the token has expired, it answers `401 no-token` with the reason.
  - Fake back office, token and login modes: `/__bo-widget/token` also checks that the request comes from this machine (`403 not-local` for a client of the network that sends `Host: localhost`). In an iframe, the fake back office only serves the `hello` of a page of the dev server, and its page and the widget page send `Content-Security-Policy: frame-ancestors 'self'`: a site that framed them could navigate the widget frame to its own page and ask for the token.
  - `bo-widget validate` and `pack`: a manifest whose `icon` is not in the zip is refused (`manifest-invalid`), as the back office does. A missing entry file and a missing icon are reported together, entry first.
  - New projects: the templates depend on the current versions of the `@vulog` packages (they allowed versions older than what their README describes, without `--login` or `BO_WIDGET_HOST`). `npm run version-packages` now keeps them up to date at each release, and fails when they change while `@vulog/create-bo-widget` has no changeset.

## 0.1.0-next.3

### Minor Changes

- f34adcc: Fake back office: login mode. `bo-widget dev --login` (`BO_WIDGET_LOGIN=1`, with `BO_WIDGET_HOST`) opens the back office in a dedicated Chrome (its own profile, kept in `node_modules/.cache/bo-widget/chrome-profile`, DevTools port on `127.0.0.1:9333` only, `BO_WIDGET_DEBUG_PORT` and `BO_WIDGET_CHROME` to change them). The user logs in there; the dev server then asks the auth service worker of the back office for the token of that session, through the Chrome DevTools Protocol, renewing it as long as the session lasts, and opens the fake back office in a tab of the same Chrome. The proxy and `getAccessToken` always get the latest token, which is kept in memory only and never logged. A logout or a closed tab is seen within about 30 seconds, a closed Chrome at once, and told once in the terminal: the calls then get `401 no-token` with the reason, without reaching the API, and `getAccessToken` rejects with `no-token`. A worker or a Chrome that does not answer for a while (a tab paused in the debugger) keeps the token still valid, with one warning. Login mode refuses `server.host`, answers `403` for another host than `localhost` (DNS rebinding, even with `server.allowedHosts`), needs Node.js 22 or later, and stays in mock mode in the `test` mode of Vitest. The README explains how to let a coding agent drive the fake back office in that Chrome (Chrome DevTools MCP server), and the rules it must follow. The log of the fake back office now masks the whole access token. `bo-widget dev --login` cannot be combined with `--token`. The templates mention `--login`.
- d4bfb9a: Fake back office: in token mode, `BO_WIDGET_HOST` (the host of a back office) can replace `BO_WIDGET_API_URL` and `BO_WIDGET_API_KEY`, which still work without it. At startup, the dev server reads the API URL and key from the anonymous conf of that back office, as the back office does, keeping only the `https:` origin of `url.baseUrl` (`{origin}/boapi/proxy/`). An unreadable conf or a missing field stops `vite` with a message that names the host and the field, never a value. `BO_WIDGET_HOST` takes precedence over the two variables, with a warning, and `getContext().host` returns it in both modes, unless `dev.context.host` is set. The `test` mode (Vitest) always stays in mock mode, with a warning when token mode was asked for, without reading any conf. The log of the fake back office now masks the API key too.

### Patch Changes

- 5e6195d: Fake back office: in token mode, `vite` warns at startup when `server.allowedHosts` is `true`, since a page that rebinds its domain to the developer's machine (DNS rebinding) could then call the Vulog API with the token through the dev server.
- Updated dependencies [5e6195d]
  - @vulog/bo-widget-sdk@0.1.0-next.5

## 0.1.0-next.2

### Minor Changes

- 2fe97a0: Fake back office: serve the sub-routes of its page, so that a widget router reloads and opens deep links, and default the `basename` to `/__bo-widget`, the path of that page (it was `/widgets/<id>`, which no router could match). `navigate` to a route of the widget view now pushes it to the history and pushes `routeChanged`, as back and forward do; a route outside the view warns in the log. The locale defaults to `en_GB` and the bar offers the BO locales (`en_GB`, `fr_FR`…) instead of bare languages.

### Patch Changes

- Updated dependencies [2fe97a0]
  - @vulog/bo-widget-sdk@0.1.0-next.4

## 0.1.0-next.1

### Patch Changes

- cdcb479: Fewer false `customElements.define` warnings: none under Vitest (dev server in the `test` mode), whose tests register the widget class to mount it; and none for the fake back office of the dev server when the plugin is installed from npm (Vite then adds a version query to the module).

## 0.1.0-next.0

### Minor Changes

- 14cd80a: Add the `@vulog/bo-widget-vite` Vite plugin: `boWidget()` generates `widget.json` from `widget.config.ts` and `package.json` and validates it with the publication rules, forces `base: './'`, builds `index.js` (ES module whose default export is the element class) or `index.html`, warns on `customElements.define`, and serves a fake back office in dev (mock mode, or token mode against a real Vulog API).
