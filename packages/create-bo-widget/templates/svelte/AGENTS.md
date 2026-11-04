# AGENTS.md

Instructions for AI coding agents working on **{{title}}**, a widget of the Vulog back office (BO), built with a Svelte 5 component compiled as a custom element.

## Read first

- `node_modules/@vulog/bo-widget-sdk/AGENTS.md`: the contract between a widget and the BO (`connect`, requests, events, permissions, `BoError`, `authFetch`), versioned with the installed SDK. Follow it over anything you remember about other widget systems.
- `README.md`: scripts, publication, development against a real API.
- `widget.config.ts`: the manifest (`widget.json`) is generated from it and from `package.json`. See `node_modules/@vulog/bo-widget-vite/README.md` for its fields and the fake BO.

## Commands

| Command                  | When                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `npm run dev`            | Shows the widget in a fake BO with the mock data of `widget.config.ts` (`dev`).     |
| `npm test`               | After every change (Vitest).                                                        |
| `npm run build`          | Type-checks (`svelte-check`), builds `dist/` and packs `{{name}}-<version>.zip`.    |
| `npx bo-widget validate` | Checks the zip of the current version with the rules the BO applies at publication. |

Before you say a change is done: `npm test` and `npm run build` pass.

## Rules for this project

- `svelte.config.js` compiles components as custom elements; `src/main.ts` exports `App.element`. Keep `<svelte:options customElement={{}} />` without a tag: the back office chooses it.
- Get the element with `$host()` at the top of the script, call `connect(element)` in `onMount`, and return a cleanup function from `onMount` that removes listeners and calls `bo.disconnect()`. Do not name the variable `host` (Svelte would read `$host` as a store).
- The `<style>` of the component goes into the shadow root: never add global CSS or `:global` rules aimed at the page.
- The BO registers the class under a tag it chooses: never call `customElements.define`, never register other elements globally, never assume the tag name.
- Fill the content zone: `:host` at 100 %, a column root, only the main area scrolls (`flex: 1; min-height: 0; overflow: auto`). Never use `100vh` or `100vw`.
- Keep every style in the shadow root: nothing in `document.head`.
- Read the initial state (`getContext`, `getCurrentUser`, `getTheme`), then follow the events (`localeChanged`, `fleetChanged`, `themeChanged`…): the BO does not push the initial state.
- Navigate with `bo.navigate({ path })`, show feedback with `bo.notify({ message, severity })`: never `window.location`, `history` or `alert`.
- A request needing a permission (`apiInfo`, `accessToken`, `navigate`, `notify`) needs it in `permissions` of `widget.config.ts`.
- The bundle is public: no secret, no API key, no token in the code or in `widget.config.ts`. `.env.local` holds the developer's values and is never committed.
- Errors the BO cannot see (anything after the element is inserted) are shown by the widget itself, with a loading and an error state.

## Calling the Vulog API

Use `bo.authFetch('<service path>/<route>')`, a path relative to the BO admin API (`.../boapi/proxy/`): never prefix it with `boapi/proxy/`, never add `Authorization` or `X-API-Key`. The widget needs the `apiInfo` permission.

To find an endpoint, its parameters and its response, use the **`aima-api` skill** of the SDK repository (`plugins/bo-widget/skills/aima-api` in <https://github.com/Vu-Log/bo-widget-sdk>, generated from the public API reference; a weekly job proposes an update): it gives the path to pass to `authFetch`. In Claude Code: `/plugin marketplace add Vu-Log/bo-widget-sdk`, then `/plugin install bo-widget@bo-widget-sdk`. Other agents: `npx skills add Vu-Log/bo-widget-sdk`. Never guess an endpoint: if you cannot find it, ask.

In `npm run dev` (mock mode), API calls are answered by `dev.responses` of `widget.config.ts`: add a response there for each endpoint the widget calls.

## Tests

`src/main.test.ts` mounts the element with a fake of the BO API (an object with `getContext`, `on`, `off`… set as `vulogBo`). Extend it for every behaviour you add: nominal case, `BoError` from a request, an event changing the display, cleanup on removal. Stub `fetch` for `authFetch`.

## Documentation

<https://vu-log.github.io/bo-widget-sdk/> (`llms.txt` and `llms-full.txt` for agents).
