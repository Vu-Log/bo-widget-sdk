# @vulog/bo-widget-cli

Command line of the widgets of the Vulog back office (BO): `bo-widget`.

- **`bo-widget validate`** checks a widget zip with the rules the BO applies when you publish it, so you find every problem before the upload.
- **`bo-widget pack`** zips your build into `{id}-{version}.zip`, the archive to publish, after the same checks.
- **`bo-widget dev --token`** runs the Vite dev server with the fake BO against a real Vulog API, with a token pasted from its BO.

There is no publish command: you publish the zip in the BO, Configuration > Widgets.

## Install

```bash
npm install --save-dev @vulog/bo-widget-cli@next
```

Requires Node.js `^20.19` or `>=22.12`. `dev` also needs `vite` and [`@vulog/bo-widget-vite`](../bo-widget-vite/) in the project.

## Commands

### `bo-widget pack [dir] [--out-dir <dir>]`

Zips the **content** of `dir` (default: `dist`), so that `widget.json` is at the root of the zip, into `{id}-{version}.zip` in `--out-dir` (default: the current folder). The id and version come from `widget.json`.

The archive is checked as `validate` does before it is written: when the BO would refuse it, nothing is written, the errors are printed and the command exits with `1`. `.DS_Store` files are left out. The zip is reproducible (files in path order, fixed dates): the same build gives the same bytes, so you can check with its sha256 that the zip published in production is the one tested in dev.

```jsonc
// package.json
"scripts": {
  "build": "vite build && bo-widget pack"
}
```

### `bo-widget validate [zip]`

Checks a zip; without argument, the only `.zip` of the current folder. Prints each error and warning with its code, and exits with `1` when there is an error, `0` otherwise (warnings do not block publication).

| Code                    | Type    | Cause                                                                                                                             |
| ----------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `archive-too-large`     | error   | Archive above 10 MB                                                                                                               |
| `invalid-archive`       | error   | Not a zip, or a zip that cannot be read safely: ZIP64, multi-part, encrypted, method other than stored/deflate, CRC or size wrong |
| `too-many-files`        | error   | More than 1000 entries, folders and macOS files included                                                                          |
| `zip-bomb`              | error   | More than 50 MB once decompressed                                                                                                 |
| `unsafe-path`           | error   | A character outside `A-Z a-z 0-9 . _ - /`, a leading `/`, an empty, `.` or `..` segment                                           |
| `duplicate-path`        | error   | The same path twice                                                                                                               |
| `forbidden-extension`   | error   | Extension other than `js mjs css html json svg png jpg webp woff2 map` (lowercase; `jpeg` is refused)                             |
| `manifest-missing`      | error   | No `widget.json` at the root (the message says where it is when the folder itself was zipped)                                     |
| `manifest-invalid`      | error   | `widget.json` is not valid JSON, or breaks a rule of the manifest (one error per field)                                           |
| `entry-missing`         | error   | The file of `runtime.entry` is not in the zip                                                                                     |
| `custom-element-define` | warning | A `.js` or `.mjs` of a Web Component calls `customElements.define(`: the BO registers your class itself                           |

Structural errors (`archive-too-large`, `invalid-archive`, `too-many-files`, `zip-bomb`) stop the check; the others are all reported at once. `__MACOSX/` and `.DS_Store` are ignored.

What only the BO knows is checked at publication only: that the widget id belongs to your namespace, and that the version is greater than the versions already published.

### `bo-widget dev [--token <jwt>] [--api-url <url>] [--api-key <key>] [-- <vite args>]`

Runs the `vite` of the project with the `BO_WIDGET_TOKEN`, `BO_WIDGET_API_URL` and `BO_WIDGET_API_KEY` variables given, which switch the fake BO of `@vulog/bo-widget-vite` to token mode (see its README). An option left out keeps the value of the environment or of `.env.local`. Without `--token`, the fake BO stays in mock mode, unless `BO_WIDGET_TOKEN` is set elsewhere.

`--token -` reads the token from the standard input, so that it does not stay in your shell history:

```bash
# API URL and key in .env.local, token copied from the BO of the dev environment
pbpaste | npx bo-widget dev --token -
npx bo-widget dev --token - -- --port 4000   # arguments after -- go to vite
```

The exit code is the one of `vite`.

### Exit codes

`0` success, `1` failure (archive refused, file not found…), `2` wrong command line.

## In scripts

```ts
import { readFile } from 'node:fs/promises';
import { packWidget, validateWidgetArchive } from '@vulog/bo-widget-cli';

const result = await packWidget({ dir: 'dist', outDir: 'release' });
if (!result.ok) throw new Error(result.errors.map((error) => error.message).join('\n'));

const check = validateWidgetArchive(await readFile('release/fleet-report-1.2.0.zip'));
```

- `validateWidgetArchive(archive, limits?)` returns `{ ok: true, manifest, files, warnings }` or `{ ok: false, errors, warnings }`; each issue has a stable `code`, an English `message` and, when it is about a file, its `path`. It throws a `TypeError` for an invalid `limits` override.
- `packWidget({ dir, outDir })` returns `{ ok: true, file, manifest, warnings }` or `{ ok: false, errors, warnings }`, and throws when `dir` cannot be read or holds a symbolic link.
- `createZip(files)` writes a plain, reproducible zip.

## License

MIT
