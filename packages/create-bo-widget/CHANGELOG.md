# @vulog/create-bo-widget

## 0.1.0-next.3

### Patch Changes

- f34adcc: Fake back office: login mode. `bo-widget dev --login` (`BO_WIDGET_LOGIN=1`, with `BO_WIDGET_HOST`) opens the back office in a dedicated Chrome (its own profile, kept in `node_modules/.cache/bo-widget/chrome-profile`, DevTools port on `127.0.0.1:9333` only, `BO_WIDGET_DEBUG_PORT` and `BO_WIDGET_CHROME` to change them). The user logs in there; the dev server then asks the auth service worker of the back office for the token of that session, through the Chrome DevTools Protocol, renewing it as long as the session lasts, and opens the fake back office in a tab of the same Chrome. The proxy and `getAccessToken` always get the latest token, which is kept in memory only and never logged. A logout or a closed tab is seen within about 30 seconds, a closed Chrome at once, and told once in the terminal: the calls then get `401 no-token` with the reason, without reaching the API, and `getAccessToken` rejects with `no-token`. A worker or a Chrome that does not answer for a while (a tab paused in the debugger) keeps the token still valid, with one warning. Login mode refuses `server.host`, answers `403` for another host than `localhost` (DNS rebinding, even with `server.allowedHosts`), needs Node.js 22 or later, and stays in mock mode in the `test` mode of Vitest. The README explains how to let a coding agent drive the fake back office in that Chrome (Chrome DevTools MCP server), and the rules it must follow. The log of the fake back office now masks the whole access token. `bo-widget dev --login` cannot be combined with `--token`. The templates mention `--login`.
- d4bfb9a: Token mode: the READMEs of the templates set `BO_WIDGET_HOST` in `.env.local` instead of copying the API URL and key from the back office, and the help of `bo-widget dev` notes that `--api-url` and `--api-key` are ignored when `BO_WIDGET_HOST` is set.
- 5e6195d: The GitHub workflow of the generated projects pins its actions by commit SHA, and a `.github/dependabot.yml` keeps them up to date.

## 0.1.0-next.2

### Patch Changes

- 2fe97a0: Use the BO locale format, `en_GB`, in the `dev.context` and the tests of the templates.

## 0.1.0-next.1

### Patch Changes

- a9a88f8: Every generated project now has an `AGENTS.md` for AI coding agents (commands, rules of its technology, how to find a Vulog API endpoint) and a `CLAUDE.md` that imports it for Claude Code.

## 0.1.0-next.0

### Minor Changes

- cdcb479: First version: `npm create @vulog/bo-widget` creates the project of a widget from the `react-mui` (default), `svelte`, `vue`, `lit` or `vanilla` template, with tests, an example CI for GitHub and GitLab that keeps the zip, and a README.
