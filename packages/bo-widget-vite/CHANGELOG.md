# @vulog/bo-widget-vite

## 0.1.0-next.1

### Patch Changes

- cdcb479: Fewer false `customElements.define` warnings: none under Vitest (dev server in the `test` mode), whose tests register the widget class to mount it; and none for the fake back office of the dev server when the plugin is installed from npm (Vite then adds a version query to the module).

## 0.1.0-next.0

### Minor Changes

- 14cd80a: Add the `@vulog/bo-widget-vite` Vite plugin: `boWidget()` generates `widget.json` from `widget.config.ts` and `package.json` and validates it with the publication rules, forces `base: './'`, builds `index.js` (ES module whose default export is the element class) or `index.html`, warns on `customElements.define`, and serves a fake back office in dev (mock mode, or token mode against a real Vulog API).
