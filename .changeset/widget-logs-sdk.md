---
'@vulog/bo-widget-sdk': minor
---

Widget logs: `bo.log.debug/info/warn/error(message, context?)` sends a log to the back office, which forwards it to Vulog for the administrators of the widget. The methods return nothing and never throw. The message is cut at 2048 characters; the context is copied as JSON, and one bigger than 3 KB, deeper than 5 levels or not serializable becomes `{ truncated: true }`. The same log repeated within 10 s is sent once, then once more with `context.repeated`. In an iframe, uncaught errors and unhandled rejections are sent as `error` logs until `disconnect`. `console.log` is never relayed. New types: `BoLogger`, `BoLogLevel`, `BoLogContext`.
