---
description: A complete BO widget in Vue 3.5, from the vue template - defineCustomElement, useHost(), onUnmounted cleanup, styles and overlays in the shadow root.
---

# Vue

The `vue` template builds the widget with a [Vue 3.5](https://vuejs.org) component defined as a custom element. It uses `@vulog/bo-widget-sdk` directly: no dedicated Vue package is needed.

```bash
npm create @vulog/bo-widget@next my-widget -- --template vue
```

The code below is the template itself, built and tested by the CI of the SDK. <span v-pre>`{{name}}`</span> and <span v-pre>`{{title}}`</span> are replaced at creation by the widget id and its display name.

## How it works

- **The host element.** `src/main.ts` exports `defineCustomElement(App)`, the class of a custom element that renders `App` in an open shadow root. Never call `customElements.define`.
- **Connecting.** `useHost()`, called in `<script setup>`, is the element the BO set its API on: `connect(element)` in `onMounted`.
- **Cleanup.** `onUnmounted` closes the connection. The promise of `connect` is kept, since the element may be removed before it resolves.
- **Layout.** `:host` at 100 %, a column `.root`, only `main` scrolls.
- **Styles.** The `.ce.vue` files are compiled in custom element mode: their `<style>` goes into the shadow root.
- **Overlays.** A `<Teleport to="body">`, or a library that teleports its overlays to `body` (Vuetify dialogs and menus…), renders them outside the shadow root, without the widget's styles: point them to an element of the shadow root instead.

## `src/main.ts`

<<< @/../packages/create-bo-widget/templates/vue/src/main.ts

## `src/App.ce.vue`

<<< @/../packages/create-bo-widget/templates/vue/src/App.ce.vue

## `widget.config.ts`

<<< @/../packages/create-bo-widget/templates/vue/widget.config.ts

## `vite.config.ts`

<<< @/../packages/create-bo-widget/templates/vue/vite.config.ts

## `src/main.test.ts`

<<< @/../packages/create-bo-widget/templates/vue/src/main.test.ts
