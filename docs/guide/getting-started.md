---
description: Create a widget project, run it in the fake back office, test it, build the zip, and publish it in the Vulog back office.
---

# Getting started

This guide takes you from an empty folder to a widget published in the back office (BO). It uses the default template, React and MUI. The other templates follow the same steps: only the source files differ (see [Examples](../examples/react-mui)).

## Prerequisites

- **Node.js** 20 (20.19 or later), or 22.12 or later. Check with `node --version`.
- **npm**, the one installed with Node.js. The projects are made for npm: their CI installs with `npm ci` from `package-lock.json`.
- **Access to the back office of a Vulog environment** that has the **Configuration > Widgets** page. Publishing a widget needs the admin rights of that page.

## Create the project

```bash
npm create @vulog/bo-widget@next my-widget
```

`my-widget` is both the folder of the project and the **widget id**: lowercase letters and digits joined by single hyphens, 63 characters at most. The folder must be new or empty.

With a folder given, the command uses the default template, `react-mui`. To choose another one, add `--template` after `--`:

```bash
npm create @vulog/bo-widget@next my-widget -- --template vue
```

| Template              | Widget                                                                           |
| --------------------- | -------------------------------------------------------------------------------- |
| `react-mui` (default) | React and MUI 7.3.6 or later, with `toCustomElement` of `@vulog/bo-widget-react` |
| `svelte`              | Svelte 5 component compiled as a custom element                                  |
| `vue`                 | Vue 3.5 component defined as a custom element                                    |
| `lit`                 | Lit element                                                                      |
| `vanilla`             | Plain Web Component in TypeScript, no framework                                  |

Without a folder, in a terminal, the command asks for the widget id (default `my-widget`), then for the template, by number or name:

```bash
npm create @vulog/bo-widget@next
```

The command does not install the dependencies. Install them:

```bash
cd my-widget
npm install
```

The project holds:

| File                                            | Role                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `widget.config.ts`                              | The manifest of the widget (name, permissions, menu, settings) and the fake BO data   |
| `package.json`                                  | The id (`name`), the `version` and the `description` of the widget, and the scripts   |
| `vite.config.ts`                                | Vite with the `boWidget` plugin of `@vulog/bo-widget-vite`                            |
| `src/`                                          | The widget (`main.tsx` and `App.tsx` for React) and its tests                         |
| `.github/workflows/build.yml`, `.gitlab-ci.yml` | Example CI, for GitHub or GitLab, that tests, builds and keeps the zip as an artifact |
| `README.md`                                     | How the project works                                                                 |
| `AGENTS.md`, `CLAUDE.md`                        | Instructions for AI coding agents, see [AI coding agents](../ai-agents)               |

## Run it in the fake back office

```bash
npm run dev
```

Vite prints the URL of the fake back office, by default `http://localhost:5173/__bo-widget/`. Open it. The fake BO displays the widget the way the BO does: it registers the class under a tag of its own, injects its API and inserts the element.

The widget shows the fleet and the connected user. They come from the `dev` section of `widget.config.ts` (mock mode):

```ts
dev: {
  context: { fleetId: 'FLEET-1', locale: 'en_GB' },
  user: { fullName: 'Jane Doe' },
},
```

The bar of the fake BO switches the locale and the theme, which pushes `localeChanged` and `themeChanged` to the widget. The log at the bottom shows each request of the widget and its answer, and the errors the widget throws.

Stop the server with `Ctrl+C`.

## Change the widget

Open `src/App.tsx` and show the locale of the BO. Read it from `useBoContext()`:

```tsx
const { fleetId, locale } = useBoContext();
```

Then add a line in the main area, after the greeting:

```tsx
<Typography>Hello {user.fullName}</Typography>
<Typography>Locale: {locale ?? '-'}</Typography>
```

Run `npm run dev` again if you stopped it, and reload the fake BO. Switch the locale in its bar: the widget follows, since `useBoContext()` follows `localeChanged`.

The files to edit in the other templates are listed in [Examples](../examples/react-mui).

## Test it

```bash
npm test
```

The tests (Vitest, in happy-dom) mount the element with a fake of the BO API, as the BO does. They check that the widget shows the fleet and the user, follows `fleetChanged`, shows its errors and closes its connection once removed. Update them when you change what the widget shows. See [Testing](./testing).

## Build the zip

```bash
npm run build
```

The script type-checks the project, runs `vite build`, which writes `dist/` with `index.js` and `widget.json`, then `bo-widget pack`, which zips `dist/` into `my-widget-0.1.0.zip` (`{id}-{version}.zip`) in the project folder.

`bo-widget pack` checks the zip with the rules the BO applies when you publish it. When the BO would refuse it, no zip is written and the errors are printed. You can check a zip again at any time:

```bash
npx bo-widget validate
```

Without argument, it checks the only `.zip` of the current folder or, when the folder holds the zips of several versions, the one of the version in `package.json`. You can also give the file:

```bash
npx bo-widget validate my-widget-0.1.0.zip
```

It exits with `1` on an error. A warning, such as a call to `customElements.define`, does not block publication. The codes are listed in the [README of `@vulog/bo-widget-cli`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-cli#bo-widget-validate-zip).

## Publish it

1. Open the back office of your Vulog environment with an admin account.
2. Go to **Configuration > Widgets**.
3. Click **Publish a version**, then drop `my-widget-0.1.0.zip`.

There is no publish command: the zip is always published in the BO.

On publication, the BO checks what the zip cannot tell:

- the widget id belongs to your namespace;
- the version is greater than the versions already published.

The admin who installs the widget fills in its `settings`, if it declares some, and the `menu` of the manifest gives its default menu entry: section, target, position, roles and label. These are defaults: the screens that install the widget and place it in the menu belong to the BO, and depend on its version.

## Publish the next version

The BO only accepts a version greater than those already published. Before each publication, raise the `version` of `package.json`: it is the version of `widget.json`. For example, for a fix:

```bash
npm version patch --no-git-tag-version
npm run build
```

`npm version patch` turns `0.1.0` into `0.1.1`; without `--no-git-tag-version`, it also commits and tags in a Git repository. Then publish `my-widget-0.1.1.zip` as above. The version follows [semantic versioning](https://semver.org), without build metadata: `1.2.0` and `1.2.0-beta.1` are accepted, `1.2.0+build.7` is not.

## Develop against a real API

In mock mode, the Vulog API calls of the widget get the static answers of `dev.responses` in `widget.config.ts`, and any other call a `404` that says which key to add. See [Calling Vulog APIs](./calling-vulog-apis#mock-the-api-in-dev).

To call the API of a Vulog environment instead, use the token mode:

1. Put the host of the BO of that environment into `.env.local`, at the root of the project:

   ```bash
   BO_WIDGET_HOST=bo.example.com
   ```

   At startup, the dev server reads the API URL and the API key from the conf of that BO, as the BO itself does. `.env.local` is in the `.gitignore` of the project: never commit it.

2. Copy a token of your BO session, then start the dev server with it. On macOS:

   ```bash
   pbpaste | npx bo-widget dev --token -
   ```

   On any system, run the command alone, paste the token and press Enter:

   ```bash
   npx bo-widget dev --token -
   ```

   `--token -` reads the token from the standard input, so that it does not stay in your shell history. Arguments after `--` go to Vite: `npx bo-widget dev --token - -- --port 4000`.

The fake BO forwards each Vulog API call to the API of that BO, with the token, as the BO service worker does. `getContext().host` returns `BO_WIDGET_HOST` (unless `dev.context.host` is set); the rest of the context and the user stay the `dev` fixtures. The token is short-lived: once it expires, the API answers `401`. Paste a new one and restart.

Keep the dev server on `localhost` in token mode: anyone who can reach it can call the API with your token. Never set `server.allowedHosts: true` either: it lets a page that rebinds its domain to your machine (DNS rebinding) reach the dev server, and the plugin warns.

The details of both modes are in the [README of `@vulog/bo-widget-vite`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-vite#fake-back-office).

## Next steps

- [The protocol](./protocol): what the widget can ask the BO.
- [Calling Vulog APIs](./calling-vulog-apis): `authFetch` and the Vulog API reference.
- [Layout and isolation](./layout-and-isolation): fill the content zone, keep styles in the Shadow DOM.
- [AI coding agents](../ai-agents): the files and skills that guide an agent.
