---
description: A complete BO widget with Lit, from the lit template - connect(this) in connectedCallback, cleanup in disconnectedCallback, static styles in the shadow root.
---

# Lit

The `lit` template builds the widget with a [Lit](https://lit.dev) element.

```bash
npm create @vulog/bo-widget@next my-widget -- --template lit
```

The code below is the template itself, built and tested by the CI of the SDK. <span v-pre>`{{name}}`</span> and <span v-pre>`{{title}}`</span> are replaced at creation by the widget id and its display name.

## How it works

- **The host element.** `src/main.ts` exports a `LitElement` class. Never call `customElements.define`, and do not use the `@customElement` decorator, which registers the class.
- **Connecting.** `connectedCallback` calls `connect(this)`. Reactive state is declared with `static properties`, with no decorators to configure.
- **Cleanup.** `disconnectedCallback` closes the connection. The promise of `connect` is kept, since the element may be removed before it resolves.
- **Layout.** `:host` at 100 %, a column `.root`, only `main` scrolls.
- **Styles and overlays.** Lit renders into an open shadow root, with the `static styles`. Render overlays in the element's template, not on `document.body`.

## `src/main.ts`

<<< @/../packages/create-bo-widget/templates/lit/src/main.ts

## `widget.config.ts`

<<< @/../packages/create-bo-widget/templates/lit/widget.config.ts

## `vite.config.ts`

<<< @/../packages/create-bo-widget/templates/lit/vite.config.ts

## `src/main.test.ts`

<<< @/../packages/create-bo-widget/templates/lit/src/main.test.ts
