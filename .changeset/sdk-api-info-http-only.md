---
'@vulog/bo-widget-sdk': patch
---

`authFetch` accepts only an `http:` or `https:` `baseUrl` from `getApiInfo`: any other scheme (`file:`, `data:`, `javascript:`…) rejects with `INTERNAL`, reason `invalid-api-info`. The README warns that the user's token goes to any absolute URL outside `baseUrl`.
