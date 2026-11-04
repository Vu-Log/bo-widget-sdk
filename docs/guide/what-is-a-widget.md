---
description: What a Vulog back office widget is, its two runtime modes, and the npm packages of the SDK.
---

# What is a BO widget?

A back office (BO) widget is a page added to the menu of the Vulog back office. You build it, pack it into a zip and publish it in the BO. The BO then shows it in its content zone, next to its own pages.

The widget talks to the BO through one protocol. It reads the context (fleet, locale, connected user, theme), listens to changes, calls the Vulog APIs with the user's authentication, navigates the BO and shows notifications.

## Two runtime modes

|                    | Web Component                                                               | iframe                                                      |
| ------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Entry of the zip   | `index.js`, an ES module whose default export is the element class          | `index.html`                                                |
| How the BO runs it | Registers the class under its own tag, injects its API, inserts the element | Loads the page in an iframe, then a `postMessage` handshake |
| Isolation          | Shadow DOM                                                                  | A separate document                                         |
| Permissions        | Declarative                                                                 | Enforced: a missing one rejects with `FORBIDDEN`            |
| Size               | Fills the content zone                                                      | Can ask for a height with `resize`                          |

`connect()` of `@vulog/bo-widget-sdk` returns the same client in both modes, so the widget code does not change. Every template of `npm create @vulog/bo-widget` builds a Web Component. See [Web Component or iframe](./web-component-or-iframe) to choose.

## The packages

The SDK is a set of npm packages under the `@vulog` scope. They are pre-releases, published under the `next` tag.

| Package                                                                                                  | Description                                                                               |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`@vulog/bo-widget-sdk`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-sdk)       | Framework-agnostic client of the widget protocol, and the schemas of `widget.json`        |
| [`@vulog/bo-widget-vite`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-vite)     | Vite plugin: `widget.json`, bundle layout, fake back office in dev                        |
| [`@vulog/bo-widget-react`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-react)   | React bindings: Web Component wrapper (Shadow DOM, MUI), iframe entry, hooks              |
| [`@vulog/bo-widget-cli`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-cli)       | `bo-widget` command: validate and pack the zip to publish, dev with a token               |
| [`@vulog/create-bo-widget`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/create-bo-widget) | `npm create @vulog/bo-widget`: project templates (React + MUI, Svelte, Vue, Lit, vanilla) |

The README of each package holds its detailed API. This site explains the concepts and the workflow.

## Lifecycle of a widget

1. Create the project: `npm create @vulog/bo-widget@next my-widget`.
2. Develop in the fake back office: `npm run dev`.
3. Test: `npm test`.
4. Build the zip: `npm run build`, which also checks it.
5. Publish the zip in the BO: **Configuration > Widgets**.
6. For the next publication, raise the version and build again.

[Getting started](./getting-started) walks through each step.
