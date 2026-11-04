---
description: How AI coding agents learn the widget contract - AGENTS.md and CLAUDE.md in every project, AGENTS.md in the SDK, the bo-widget and aima-api skills, llms.txt.
---

# AI coding agents

The SDK gives AI coding agents what they need to write a widget correctly: the rules of the project, the protocol contract of the installed SDK, the Vulog API endpoints, and this documentation in a format made for them.

## `AGENTS.md` and `CLAUDE.md` in every project

Every project created by `npm create @vulog/bo-widget` has, at its root:

- **`AGENTS.md`**: instructions for the agent. What to read first, the commands, the rules of the template (export the class, styles and overlays in the shadow root, layout, permissions, no secrets), how to call the Vulog API, how to test. It is read by Codex, Cursor, GitHub Copilot, Gemini CLI and other agents that support the `AGENTS.md` convention.
- **`CLAUDE.md`**: one line, `@AGENTS.md`, that imports it for Claude Code.

Keep them in your repository and extend them with the rules of your widget.

## `AGENTS.md` of the SDK

`@vulog/bo-widget-sdk` ships its own `AGENTS.md`, in `node_modules/@vulog/bo-widget-sdk/AGENTS.md`. It holds the protocol contract in one page: `connect`, the requests and events, the permissions, `authFetch`, `BoError`, the rules and their pitfalls, minimal widgets and how to test them.

It is versioned with the installed SDK, so it always matches the code the widget runs. The `AGENTS.md` of each project points the agent to it. You can also [read it on GitHub](https://github.com/Vu-Log/bo-widget-sdk/blob/main/packages/bo-widget-sdk/AGENTS.md).

## Skills

The SDK repository has two skills in the open Agent Skills format (a folder with a `SKILL.md`), under [`plugins/bo-widget/skills/`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/plugins/bo-widget/skills):

| Skill       | What it is for                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bo-widget` | Write or change a widget: create the project, the rules that are easy to get wrong, test, build and publish                                               |
| `aima-api`  | Reference of the Vulog admin API a widget can call with `authFetch`: endpoints, parameters, bodies, response schemas, and the path to pass to `authFetch` |

`aima-api` is generated from the public Vulog API reference. A GitHub Action of the repository regenerates it every Monday and opens a pull request when it changed. With it, an agent finds the endpoint it needs instead of guessing one.

### Install in Claude Code

```text
/plugin marketplace add Vu-Log/bo-widget-sdk
/plugin install bo-widget@bo-widget-sdk
```

### Install in other agents

```bash
npx skills add Vu-Log/bo-widget-sdk
```

Or copy the folders of `plugins/bo-widget/skills/` into the skills directory of your agent.

## `llms.txt`

This site publishes its content for language models:

- [`llms.txt`](https://vu-log.github.io/bo-widget-sdk/llms.txt): the list of the pages, with their description.
- [`llms-full.txt`](https://vu-log.github.io/bo-widget-sdk/llms-full.txt): every page in one Markdown file.

Give one of these URLs to an agent that has no access to the repository.
