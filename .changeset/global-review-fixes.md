---
'@vulog/bo-widget-vite': patch
'@vulog/bo-widget-cli': patch
'@vulog/create-bo-widget': patch
---

Fixes from the global review.

- Fake back office, token mode: the pasted token is no longer written in the module of the page, which Vite serves to any page of `localhost` (another project in dev could read it). As in login mode, `getAccessToken` asks the dev server for it on `/__bo-widget/token`, which only answers the pages of this dev server, on `localhost`, never cached; once the token has expired, it answers `401 no-token` with the reason.
- `bo-widget validate` and `pack`: a manifest whose `icon` is not in the zip is refused (`manifest-invalid`), as the back office does. A missing entry file and a missing icon are reported together, entry first.
- New projects: the templates depend on the current versions of the `@vulog` packages (they allowed versions older than what their README describes, without `--login` or `BO_WIDGET_HOST`). `npm run version-packages` now keeps them up to date at each release.
