---
'@vulog/bo-widget-vite': patch
---

Fake back office: in token mode, `vite` warns at startup when `server.allowedHosts` is `true`, since a page that rebinds its domain to the developer's machine (DNS rebinding) could then call the Vulog API with the token through the dev server.
