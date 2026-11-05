# @vulog/bo-widget-vite

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
