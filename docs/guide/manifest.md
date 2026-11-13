---
description: The fields of widget.json, how @vulog/bo-widget-vite generates it from widget.config.ts and package.json, and the rules checked on publication.
---

# The manifest (`widget.json`)

Every widget zip holds a `widget.json` at its root. It tells the BO what the widget is (id, name, version), how to run it (Web Component or iframe), what it needs (permissions, settings) and where to put it in the menu.

You do not write it by hand: `@vulog/bo-widget-vite` generates it at build time from `widget.config.ts` and `package.json`, and checks it.

## Fields

| Field             | Required | Value                                                                                                                                          |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifestVersion` | yes      | `1`                                                                                                                                            |
| `id`              | yes      | Lowercase letters and digits joined by single hyphens (`fleet-report`), 63 characters at most                                                  |
| `name`            | yes      | Name shown to the BO admins, not blank                                                                                                         |
| `version`         | yes      | [Semantic version](https://semver.org) without build metadata: `1.4.2`, `2.0.0-beta.1`; not `v1.4.2` nor `1.4.2+build.7`                       |
| `runtime`         | yes      | `{ "type": "webcomponent", "entry": "index.js" }` or `{ "type": "iframe", "entry": "index.html" }`, no other entry                             |
| `protocol`        | yes      | `{ "version": 2 }`, plus `minBoVersion` (a semantic version), the oldest BO version the widget works with                                      |
| `description`     | no       | What the widget does, in Markdown: not blank, 2000 characters at most                                                                          |
| `author`          | no       | `{ "name": "…", "email": "…" }`, `email` optional                                                                                              |
| `icon`            | no       | Path of a file of the bundle (`icon.svg`, `assets/logo.png`): letters, digits, `.`, `_`, `-` and `/`, no `.` or `..` segment                   |
| `menu`            | no       | Default menu entry, see below                                                                                                                  |
| `permissions`     | no       | Array of `accessToken`, `apiInfo`, `navigate`, `notify`, `storage`, `sharedStorage`, each once. Default `[]`. See [Permissions](./permissions) |
| `settings`        | no       | Installation settings, see below. Default `[]`                                                                                                 |

Objects are strict: **an unknown field is an error**, at any level, so that a typo such as `permisions` cannot silently become an empty list.

### `menu`

| Field             | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| `defaultSection`  | Section of the menu, not blank                           |
| `defaultTarget`   | Entry the widget is placed next to, not blank            |
| `defaultPosition` | `before` or `after` the target                           |
| `defaultRoles`    | BO role names that see the entry; empty means every role |
| `label`           | Label per locale                                         |

These are defaults for the menu entry the BO creates when the widget is installed.

Every `label` is a record, never a plain string, keyed by language (`en`) or by exact BO locale (`fr_FR`, the `language_COUNTRY` format of [`getContext().locale`](./protocol#requests)):

```json
{ "en": "Fleet report", "fr": "Rapport de flotte" }
```

The menu entry shows the label of the exact BO locale, then of its language, then `en`, then the widget `name`.

### `settings`

Settings are values the admin fills in when installing the widget. The widget reads them with `getSettings()`.

| Field      | Value                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `key`      | An identifier (letters, digits, `_`, not starting with a digit), unique; `__proto__`, `constructor` and `prototype` are reserved |
| `type`     | `string`, `url` (absolute `http:` or `https:` URL), `number` or `boolean`                                                        |
| `required` | Default `false`                                                                                                                  |
| `label`    | Label per locale                                                                                                                 |
| `default`  | A value of the setting's `type`                                                                                                  |

Settings are stored by the BO and readable by the widget code, which runs in the browser: **never put a secret in a setting**. A setting that needs a secret belongs to your backend.

### Example

```json
{
  "manifestVersion": 1,
  "id": "fleet-report",
  "name": "Fleet report",
  "description": "Vehicles of the current fleet, by status.",
  "version": "1.2.0",
  "author": { "name": "Example Corp", "email": "dev@example.com" },
  "runtime": { "type": "webcomponent", "entry": "index.js" },
  "protocol": { "version": 2 },
  "menu": {
    "defaultRoles": [],
    "label": { "en": "Fleet report", "fr": "Rapport de flotte" }
  },
  "permissions": ["apiInfo", "notify"],
  "settings": [{ "key": "currency", "type": "string", "required": false, "default": "EUR" }]
}
```

## Generated from `widget.config.ts` and `package.json`

```ts
// widget.config.ts
import { defineWidgetConfig } from '@vulog/bo-widget-vite';

export default defineWidgetConfig({
  name: 'Fleet report',
  permissions: ['apiInfo', 'notify'],
  menu: { label: { en: 'Fleet report', fr: 'Rapport de flotte' } },
  settings: [{ key: 'currency', type: 'string', default: 'EUR' }],
});
```

| Field of `widget.json`                            | Comes from                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `id`                                              | `id` of the config, or the `name` of `package.json` without its scope                |
| `version`                                         | Always the `version` of `package.json`                                               |
| `description`                                     | `description` of the config, or of `package.json`                                    |
| `author`                                          | `author` of the config, or of `package.json` (`"Name <email>"` or `{ name, email }`) |
| `runtime`                                         | `runtime` of the config: `webcomponent` (default) or `iframe`                        |
| `protocol`                                        | The protocol version of the SDK, and `minBoVersion` of the config                    |
| `name`, `icon`, `menu`, `permissions`, `settings` | The same fields of the config                                                        |

The config also has fields that are not in `widget.json`:

- `entry`: the source module whose default export is the element class, `src/main.ts` by default (Web Component only; the React template sets `src/main.tsx`). An iframe widget is built from `index.html`.
- `dev`: the data of the fake back office (see [Getting started](./getting-started#develop-against-a-real-api)).

For an `icon`, put the file in `public/`: the build fails if it is not in the bundle.

The plugin validates the manifest with the rules applied on publication. An invalid configuration fails `vite` and `vite build`, with one line per problem and its path. When the value came from `package.json`, the message says so, for instance `version (from package.json): Must be a semantic version…`. An unknown key of the config, inside `dev` too, is an error.

All the fields of the config are in the [README of `@vulog/bo-widget-vite`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-vite#configuration).

## Checked on publication

The rules are checked three times before the BO stores the widget:

1. **At build time**, by `@vulog/bo-widget-vite`: the manifest.
2. **When packing**, by `bo-widget pack`, and on demand by `bo-widget validate`: the manifest and the zip (size, files, paths, entry). See the codes in the [README of `@vulog/bo-widget-cli`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-cli#bo-widget-validate-zip).
3. **On publication**, by the BO: the same rules, plus what only the BO knows, that the id belongs to your namespace and that the version is greater than the versions already published.

The zip rules, in short: 10 MB at most, 50 MB once decompressed, 1000 entries at most, paths made of `A-Z a-z 0-9 . _ - /`, and only the extensions `js mjs css html json svg png jpg webp woff2 map`.

To check a manifest in your own code, use the schemas of `@vulog/bo-widget-sdk/manifest`:

```ts
import { publishedWidgetManifestSchema } from '@vulog/bo-widget-sdk/manifest';

const result = publishedWidgetManifestSchema.safeParse(JSON.parse(manifestText));
if (!result.success) console.error(result.error.issues);
```

`publishedWidgetManifestSchema` applies the rules of publication. `widgetManifestSchema` reads any manifest already published.
