---
'@vulog/create-bo-widget': patch
---

New projects depend on the version of `@vulog/bo-widget-vite` that minifies the Web Component build fully, and their `AGENTS.md` asks to load heavy or rarely used UI as chunks, with a literal `import()`, a loading state and a Retry (see the new Code splitting guide).
