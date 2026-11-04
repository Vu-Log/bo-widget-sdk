---
'@vulog/bo-widget-cli': minor
---

Add the `@vulog/bo-widget-cli` package and its `bo-widget` command: `validate` checks a widget zip with the rules applied on publication (size, zip bombs, paths, extensions, `widget.json`, entry, `customElements.define` warning), `pack` zips a build into a reproducible `{id}-{version}.zip` after the same checks, and `dev --token` runs the Vite dev server with the fake back office in token mode. `validateWidgetArchive`, `packWidget` and `createZip` are also exported for scripts.
