---
'@vulog/create-bo-widget': patch
'@vulog/bo-widget-cli': patch
---

Token mode: the READMEs of the templates set `BO_WIDGET_HOST` in `.env.local` instead of copying the API URL and key from the back office, and the help of `bo-widget dev` notes that `--api-url` and `--api-key` are ignored when `BO_WIDGET_HOST` is set.
