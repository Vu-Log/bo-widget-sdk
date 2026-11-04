---
'@vulog/bo-widget-vite': minor
---

Add the `@vulog/bo-widget-vite` Vite plugin: `boWidget()` generates `widget.json` from `widget.config.ts` and `package.json` and validates it with the publication rules, forces `base: './'`, builds `index.js` (ES module whose default export is the element class) or `index.html`, warns on `customElements.define`, and serves a fake back office in dev (mock mode, or token mode against a real Vulog API).
