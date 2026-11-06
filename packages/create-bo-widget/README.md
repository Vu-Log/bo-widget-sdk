# @vulog/create-bo-widget

Creates the project of a widget of the Vulog back office (BO): `npm create @vulog/bo-widget`.

The project is ready to develop in a fake BO, test, build and publish: Vite with [`@vulog/bo-widget-vite`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-vite), Vitest, the [`bo-widget`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-cli) command that packs the zip, an example CI for GitHub (actions pinned by commit SHA, kept up to date by Dependabot) and GitLab that keeps the zip as an artifact, and a README.

## Usage

```bash
npm create @vulog/bo-widget@next fleet-report
cd fleet-report
npm install
npm run dev      # the widget in a fake back office
npm run build    # fleet-report-0.1.0.zip, to publish in the BO: Configuration > Widgets
```

The folder is the widget id: lowercase letters and digits joined by single hyphens, 63 characters at most. It must be new or empty. In a terminal, without a folder, the command asks for the folder, and for the template unless `--template` is given.

```bash
npm create @vulog/bo-widget@next fleet-report -- --template vue
npx @vulog/create-bo-widget@next fleet-report --template vue   # same
```

Requires Node.js `^20.19` or `>=22.12`.

## Templates

| Template              | Widget                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-mui` (default) | React and MUI 7.3.6 or later, with `toCustomElement` of [`@vulog/bo-widget-react`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-react) |
| `svelte`              | Svelte 5 component compiled as a custom element, `connect($host())`                                                                                            |
| `vue`                 | Vue 3.5 component defined as a custom element (`defineCustomElement`), `connect(useHost())`                                                                    |
| `lit`                 | Lit element, `connect(this)`                                                                                                                                   |
| `vanilla`             | Plain Web Component in TypeScript, `connect(this)`                                                                                                             |

Every template is a Web Component in TypeScript that:

- exports its class and never calls `customElements.define`: the BO registers it under its own tag;
- connects to the BO with [`@vulog/bo-widget-sdk`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-sdk) and shows the current fleet and user, following `fleetChanged`, and closes the connection once removed;
- fills the content zone of the BO, with its styles in its shadow root;
- shows the errors it gets after its insertion, which the BO cannot see;
- has tests that mount it with a fake of the BO API.

| Script          | What it does                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `npm run dev`   | The widget in the fake BO of `@vulog/bo-widget-vite`, with mock data, or a real API with a token |
| `npm test`      | Vitest, in happy-dom                                                                             |
| `npm run build` | Type-check (`tsc`, `svelte-check` or `vue-tsc`), `vite build`, then `bo-widget pack`             |

## Options

| Option                  | Description                                   |
| ----------------------- | --------------------------------------------- |
| `-t, --template <name>` | Template of the project, default `react-mui`. |
| `-h, --help`            | Shows the help.                               |
| `-v, --version`         | Shows the version.                            |

Exit codes: `0` success, `1` the project cannot be created (folder not empty, file system error), `2` wrong command line (unknown template or option, invalid folder name, no folder outside a terminal), `130` a question cancelled with Ctrl+C or Ctrl+D. When the copy fails, the files already written are removed, so the command can be run again (if they cannot be, the error says to empty the folder first).

## In scripts

```ts
import { createWidgetProject } from '@vulog/create-bo-widget';

const { dir, files } = await createWidgetProject({ dir: 'widgets/fleet-report', template: 'lit' });
```

`createWidgetProject` throws a `CreateBoWidgetError` when the folder name is not a widget id, the template is unknown, the folder exists and is not empty (a folder holding only `.git` and/or `.DS_Store` is accepted), or a failed copy cannot be undone. `validateWidgetName(name)` returns the problem of a name, or `undefined`.

## License

MIT
