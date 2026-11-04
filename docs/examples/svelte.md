---
description: A complete BO widget in Svelte 5, from the svelte template - a component compiled as a custom element, $host(), onMount cleanup, styles in the shadow root.
---

# Svelte

The `svelte` template builds the widget with a [Svelte 5](https://svelte.dev) component compiled as a custom element. It uses `@vulog/bo-widget-sdk` directly: no dedicated Svelte package is needed.

```bash
npm create @vulog/bo-widget@next my-widget -- --template svelte
```

The code below is the template itself, built and tested by the CI of the SDK. <span v-pre>`{{name}}`</span> and <span v-pre>`{{title}}`</span> are replaced at creation by the widget id and its display name.

## How it works

- **The host element.** `svelte.config.js` compiles the components as custom elements (`customElement: true`), and `src/main.ts` exports `App.element`, the class Svelte generates. <span v-pre>`<svelte:options customElement={{}} />`</span> gives no tag: the BO chooses it. Never call `customElements.define`.
- **Connecting.** `$host()`, called at the top of the script, is the element the BO set its API on: `connect(element)` in `onMount`. Do not name that variable `host`: Svelte would read `$host` as the subscription to a store named `host`.
- **Cleanup.** The cleanup function of `onMount` closes the connection. The promise of `connect` is kept, since the element may be removed before it resolves.
- **Layout.** `:host` at 100 %, a column `.root`, only `main` scrolls.
- **Styles and overlays.** The `<style>` of the component goes into the shadow root. Render overlays in the component tree, not on `document.body`.
- **Tests.** They run the browser build of Svelte (`resolve.conditions` in `vite.config.ts`).

## `src/main.ts`

<<< @/../packages/create-bo-widget/templates/svelte/src/main.ts

## `src/App.svelte`

<<< @/../packages/create-bo-widget/templates/svelte/src/App.svelte

## `svelte.config.js`

<<< @/../packages/create-bo-widget/templates/svelte/svelte.config.js

## `widget.config.ts`

<<< @/../packages/create-bo-widget/templates/svelte/widget.config.ts

## `vite.config.ts`

<<< @/../packages/create-bo-widget/templates/svelte/vite.config.ts

## `src/main.test.ts`

<<< @/../packages/create-bo-widget/templates/svelte/src/main.test.ts
