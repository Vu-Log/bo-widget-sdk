---
'@vulog/bo-widget-vite': minor
---

Fake back office: serve the sub-routes of its page, so that a widget router reloads and opens deep links, and default the `basename` to `/__bo-widget`, the path of that page (it was `/widgets/<id>`, which no router could match). `navigate` to a route of the widget view now pushes it to the history and pushes `routeChanged`, as back and forward do; a route outside the view warns in the log. The locale defaults to `en_GB` and the bar offers the BO locales (`en_GB`, `fr_FR`…) instead of bare languages.
