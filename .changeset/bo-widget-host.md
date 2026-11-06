---
'@vulog/bo-widget-vite': minor
---

Fake back office: `BO_WIDGET_HOST` (the host of a back office) replaces `BO_WIDGET_API_URL` and `BO_WIDGET_API_KEY` in token mode. At startup, the dev server reads the API URL and key from the anonymous conf of that back office, as the back office does, keeping only the `https:` origin of `url.baseUrl` (`{origin}/boapi/proxy/`). An unreadable conf or a missing field stops `vite` with a message that names the host and the field, never a value. `BO_WIDGET_HOST` takes precedence over the two variables, with a warning, and `getContext().host` returns it. The log of the fake back office now masks the API key too.
