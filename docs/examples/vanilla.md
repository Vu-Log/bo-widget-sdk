---
description: A complete BO widget as a plain Web Component in TypeScript, from the vanilla template - connect(this), cleanup, inline styles in the shadow root.
---

# Vanilla

The `vanilla` template builds the widget as a plain Web Component in TypeScript, with no framework.

```bash
npm create @vulog/bo-widget@next my-widget -- --template vanilla
```

The code below is the template itself, built and tested by the CI of the SDK. <span v-pre>`{{name}}`</span> and <span v-pre>`{{title}}`</span> are replaced at creation by the widget id and its display name.

## How it works

- **The host element.** `src/main.ts` exports the element class. Never call `customElements.define`.
- **Connecting.** `connectedCallback` attaches an open shadow root, or reuses it when the element is inserted again, and calls `connect(this)`.
- **Cleanup.** `disconnectedCallback` closes the connection and empties the shadow root. The promise of `connect` is kept, since the element may be removed before it resolves.
- **Layout.** `:host` at 100 %, a column `.root`, only `main` scrolls.
- **Styles.** `src/style.css` is imported with `?inline` and inserted as a `<style>` in the shadow root, never in the page of the BO. A CSS file imported without `?inline` would be emitted as a separate file that the BO never loads.
- **Safe texts.** The texts are set with `textContent`, never `innerHTML`, so that data of the BO cannot inject markup.

## `src/main.ts`

<<< @/../packages/create-bo-widget/templates/vanilla/src/main.ts

## `src/style.css`

<<< @/../packages/create-bo-widget/templates/vanilla/src/style.css

## `widget.config.ts`

<<< @/../packages/create-bo-widget/templates/vanilla/widget.config.ts

## `vite.config.ts`

<<< @/../packages/create-bo-widget/templates/vanilla/vite.config.ts

## `src/main.test.ts`

<<< @/../packages/create-bo-widget/templates/vanilla/src/main.test.ts
