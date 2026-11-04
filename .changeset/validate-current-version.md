---
'@vulog/bo-widget-cli': patch
---

`bo-widget validate` without argument no longer fails when the folder holds the zips of several versions: it validates the one of the version in `package.json` (`{name}-{version}.zip`).
