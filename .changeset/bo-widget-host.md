---
'@vulog/bo-widget-vite': minor
---

Fake back office: in token mode, `BO_WIDGET_HOST` (the host of a back office) can replace `BO_WIDGET_API_URL` and `BO_WIDGET_API_KEY`, which still work without it. At startup, the dev server reads the API URL and key from the anonymous conf of that back office, as the back office does, keeping only the `https:` origin of `url.baseUrl` (`{origin}/boapi/proxy/`). An unreadable conf or a missing field stops `vite` with a message that names the host and the field, never a value. `BO_WIDGET_HOST` takes precedence over the two variables, with a warning, and `getContext().host` returns it in both modes, unless `dev.context.host` is set. The `test` mode (Vitest) always stays in mock mode, without reading any conf. The log of the fake back office now masks the API key too.
