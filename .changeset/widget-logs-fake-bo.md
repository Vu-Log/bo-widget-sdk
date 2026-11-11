---
'@vulog/bo-widget-vite': minor
---

Fake back office: serves `bo.log` (`vulogBo.log` for a Web Component, the `log` request on the port of an iframe, refused with `INVALID_PAYLOAD` like the back office does for an unknown level or a blank message). Each widget log shows in the log panel of the page, the browser console and the terminal of the dev server, where control characters are removed so that a widget cannot drive the terminal.
