---
name: bo-widget
description: Create, change, test or publish a Vulog back office (BO) widget -- a page added to the Vulog back office menu, built as a Web Component or an iframe with @vulog/bo-widget-sdk (React + MUI, Svelte, Vue, Lit or plain TypeScript). Use it when a project depends on @vulog/bo-widget-sdk, has a widget.config.ts or a widget.json, or when asked to build a widget for the Vulog back office.
---

# Vulog back office widgets

A BO widget is a page the Vulog back office shows in its menu. The BO loads the widget's bundle, registers its default export (an element class) under a tag of its own, gives it an API (`vulogBo`) and inserts it in its content zone; in iframe mode it loads `index.html` and talks to it with `postMessage`. `@vulog/bo-widget-sdk` hides both transports behind `connect()`.

## Start

- **New widget**: `npm create @vulog/bo-widget@next <widget-id> -- --template <react-mui | svelte | vue | lit | vanilla>` (without `--template`, React + MUI; the template is asked only when the folder is not given either). The id is kebab-case, 63 characters at most. Then `npm install`, `npm run dev`.
- **Existing widget**: read its `AGENTS.md` (every generated project has one), then `node_modules/@vulog/bo-widget-sdk/AGENTS.md`, the contract versioned with the installed SDK. It overrides anything you remember about other widget systems.

## Rules that are easy to get wrong

1. Export the element class; **never** call `customElements.define` (the BO chooses the tag) and never register other elements globally.
2. `connect(this)` (`$host()` in Svelte 5, `useHost()` in Vue 3.5, `toCustomElement(App)` in React) when the element is connected; on removal, remove listeners and timers and call `bo.disconnect()`.
3. Everything stays in the shadow root: styles, dialogs, menus, tooltips (MUI portals are handled by `@vulog/bo-widget-react`; Vue `Teleport` and Vuetify overlays must target the shadow root). Nothing in `document.head`.
4. Fill the content zone: `:host` at 100 %, column root, only the main area scrolls. Never `100vh` / `100vw`.
5. The initial state is not pushed: read `getContext()`, `getCurrentUser()`, `getTheme()`, then follow `localeChanged`, `fleetChanged`, `themeChanged`, `userChanged`, `routeChanged`.
6. Vulog API: `bo.authFetch('<service path>/<route>')`, relative to `.../boapi/proxy/`, with the `apiInfo` permission. Never add `Authorization` or `X-API-Key`, never prefix with `boapi/proxy/`. Find endpoints with the `aima-api` skill (next to this one); never guess one.
7. `bo.navigate({ path })` and `bo.notify({ message, severity })`, never `window.location`, `history` or `alert`. Each needs its permission in `widget.config.ts`.
8. Every request rejects with `BoError` (`code`, `reason`, `status`); a `401` from `authFetch` is shown to the user, never retried in a loop.
9. The bundle is public: no secret, key or token in the code or in `widget.config.ts`.

## Check and publish

`npm test`, then `npm run build` (type-check, `dist/`, `<id>-<version>.zip`), then `npx bo-widget validate <zip>`. Publishing is done by a BO user: **Configuration > Widgets > Publish a version**, drop the zip. Each publication needs a higher `version` in `package.json`.

## Documentation

<https://vu-log.github.io/bo-widget-sdk/> -- getting started, manifest, protocol, permissions, examples per technology. `llms-full.txt` holds the whole site in one file.
