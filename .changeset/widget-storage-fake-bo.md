---
'@vulog/bo-widget-vite': minor
---

Fake back office: serves `bo.storage` and `bo.sharedStorage` from memory (`vulogBo.storage` / `vulogBo.sharedStorage` for a Web Component, the `storage` and `sharedStorage` requests on the port of an iframe), as two separate spaces, with the checks of the back office (collection and id names, JSON values of 64 KB at most, options, `where`) and the answers of the Vulog server (`ifVersion`, `ttlSeconds` expiry, pages in id order with their cursor, default quotas). Their permissions are enforced in both modes, as in the back office. A **Clear storage** button in the bar empties both spaces. `widget.config.ts` accepts the `storage` and `sharedStorage` permissions.
