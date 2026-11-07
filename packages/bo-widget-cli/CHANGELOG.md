# @vulog/bo-widget-cli

## 0.1.0-next.3

### Patch Changes

- 6ceee8a: Fixes from the global review.
  
  - Fake back office, token mode: the pasted token is no longer written in the module of the page, which Vite serves to any page of `localhost` (another project in dev could read it). As in login mode, `getAccessToken` asks the dev server for it on `/__bo-widget/token`, which only answers the pages of this dev server, on `localhost`, never cached; once the token has expired, it answers `401 no-token` with the reason.
  - Fake back office, token and login modes: `/__bo-widget/token` also checks that the request comes from this machine (`403 not-local` for a client of the network that sends `Host: localhost`). In an iframe, the fake back office only serves the `hello` of a page of the dev server, and its page and the widget page send `Content-Security-Policy: frame-ancestors 'self'`: a site that framed them could navigate the widget frame to its own page and ask for the token.
  - `bo-widget validate` and `pack`: a manifest whose `icon` is not in the zip is refused (`manifest-invalid`), as the back office does. A missing entry file and a missing icon are reported together, entry first.
  - New projects: the templates depend on the current versions of the `@vulog` packages (they allowed versions older than what their README describes, without `--login` or `BO_WIDGET_HOST`). `npm run version-packages` now keeps them up to date at each release, and fails when they change while `@vulog/create-bo-widget` has no changeset.

## 0.1.0-next.2

### Minor Changes

- f34adcc: Fake back office: login mode. `bo-widget dev --login` (`BO_WIDGET_LOGIN=1`, with `BO_WIDGET_HOST`) opens the back office in a dedicated Chrome (its own profile, kept in `node_modules/.cache/bo-widget/chrome-profile`, DevTools port on `127.0.0.1:9333` only, `BO_WIDGET_DEBUG_PORT` and `BO_WIDGET_CHROME` to change them). The user logs in there; the dev server then asks the auth service worker of the back office for the token of that session, through the Chrome DevTools Protocol, renewing it as long as the session lasts, and opens the fake back office in a tab of the same Chrome. The proxy and `getAccessToken` always get the latest token, which is kept in memory only and never logged. A logout or a closed tab is seen within about 30 seconds, a closed Chrome at once, and told once in the terminal: the calls then get `401 no-token` with the reason, without reaching the API, and `getAccessToken` rejects with `no-token`. A worker or a Chrome that does not answer for a while (a tab paused in the debugger) keeps the token still valid, with one warning. Login mode refuses `server.host`, answers `403` for another host than `localhost` (DNS rebinding, even with `server.allowedHosts`), needs Node.js 22 or later, and stays in mock mode in the `test` mode of Vitest. The README explains how to let a coding agent drive the fake back office in that Chrome (Chrome DevTools MCP server), and the rules it must follow. The log of the fake back office now masks the whole access token. `bo-widget dev --login` cannot be combined with `--token`. The templates mention `--login`.

### Patch Changes

- d4bfb9a: Token mode: the READMEs of the templates set `BO_WIDGET_HOST` in `.env.local` instead of copying the API URL and key from the back office, and the help of `bo-widget dev` notes that `--api-url` and `--api-key` are ignored when `BO_WIDGET_HOST` is set.
- Updated dependencies [5e6195d]
  - @vulog/bo-widget-sdk@0.1.0-next.5

## 0.1.0-next.1

### Patch Changes

- a9a88f8: `bo-widget validate` without argument no longer fails when the folder holds the zips of several versions: it validates the one of the version in `package.json` (`{id}-{version}.zip`).
- Updated dependencies [a9a88f8]
  - @vulog/bo-widget-sdk@0.1.0-next.3

## 0.1.0-next.0

### Minor Changes

- 0c9060a: Add the `@vulog/bo-widget-cli` package and its `bo-widget` command: `validate` checks a widget zip with the rules applied on publication (size, zip bombs, paths, extensions, `widget.json`, entry, `customElements.define` warning), `pack` zips a build into a reproducible `{id}-{version}.zip` after the same checks, and `dev --token` runs the Vite dev server with the fake back office in token mode. `validateWidgetArchive`, `packWidget` and `createZip` are also exported for scripts.

### Patch Changes

- 58a8226: Keep the `bo-widget` executable in the published package: npm 11 dropped a `bin` path starting with `./` on publish.
