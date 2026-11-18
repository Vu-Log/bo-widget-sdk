---
'@vulog/bo-widget-vite': minor
---

A Web Component build is now minified fully, whitespace included, with Vite 8: the plugin sets `build.rolldownOptions.output.minify: true`, since library mode keeps the whitespace of an ES build, even with `build.minify`, for the bundlers of a library's users, and a widget is never bundled again (about a quarter smaller, an eighth gzipped, on the React template). `build.minify: false`, another minifier (`'terser'`, `'esbuild'`) or an `output.minify` of the project is kept as it is. An iframe build and Vite 7 are unchanged.
