---
'@vulog/bo-widget-vite': patch
'@vulog/bo-widget-cli': patch
'@vulog/create-bo-widget': patch
---

Fixes from the global review.

- Fake back office, token mode: the pasted token is no longer written in the module of the page, which Vite serves to any page of `localhost` (another project in dev could read it). As in login mode, `getAccessToken` asks the dev server for it on `/__bo-widget/token`, which only answers the pages of this dev server, on `localhost`, never cached; once the token has expired, it answers `401 no-token` with the reason.
- Fake back office, token and login modes: `/__bo-widget/token` also checks that the request comes from this machine (`403 not-local` for a client of the network that sends `Host: localhost`). In an iframe, the fake back office only serves the `hello` of a page of the dev server, and its page and the widget page send `Content-Security-Policy: frame-ancestors 'self'`: a site that framed them could navigate the widget frame to its own page and ask for the token.
- `bo-widget validate` and `pack`: a manifest whose `icon` is not in the zip is refused (`manifest-invalid`), as the back office does. A missing entry file and a missing icon are reported together, entry first.
- New projects: the templates depend on the current versions of the `@vulog` packages (they allowed versions older than what their README describes, without `--login` or `BO_WIDGET_HOST`). `npm run version-packages` now keeps them up to date at each release, and fails when they change while `@vulog/create-bo-widget` has no changeset.
