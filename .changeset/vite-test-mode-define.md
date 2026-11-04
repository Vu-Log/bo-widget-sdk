---
'@vulog/bo-widget-vite': patch
---

Fewer false `customElements.define` warnings: none under Vitest (dev server in the `test` mode), whose tests register the widget class to mount it; and none for the fake back office of the dev server when the plugin is installed from npm (Vite then adds a version query to the module).
