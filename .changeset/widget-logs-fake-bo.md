---
'@vulog/bo-widget-vite': minor
---

Fake back office: serves `bo.log` (`vulogBo.log` for a Web Component, the `log` request on the port of an iframe). Like the back office, the port answers `INVALID_PAYLOAD` for an unknown level or a blank message; as a Web Component, `vulogBo.log` never throws and the refusal only shows in the log panel. Each widget log shows in the log panel of the page, the browser console and the terminal of the dev server, where control characters are removed so that a widget cannot drive the terminal.
