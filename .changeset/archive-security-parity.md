---
'@vulog/bo-widget-cli': minor
---

`validate` and `pack` now apply the three archive rules the BO added on publication, with the same codes and messages, so a zip they accept is not refused by the BO:

- `unsafe-svg`: an SVG with active content (`<script>`, `<foreignObject>` and similar elements, `on*` attributes, a link or CSS `url()` other than `#id` or a base64 PNG/JPEG/GIF/WEBP, entities, not UTF-8, over 5 MB). Export a plain SVG, for example with SVGO.
- `content-mismatch`: a file whose content does not match its extension (a `png`, `jpg`, `webp` or `woff2` without its signature, a text file that is not UTF-8 or holds NUL, a `json` or `map` that is not JSON; an empty text file is accepted).
- `webcomponent-html`: an `.html` file in a Web Component widget, which is loaded from `index.js` only.

The BO's code scan warnings (hosts loaded, `eval`, secrets, source maps…) are not run by the CLI: they never block a publication.
