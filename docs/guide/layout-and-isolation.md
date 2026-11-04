---
description: Fill the content zone of the back office, keep styles and overlays in the shadow root, ship your own framework, and follow the BO theme.
---

# Layout and isolation

A Web Component widget runs in the BO page. It must fill the content zone without breaking the BO layout, and keep its styles to itself.

## Fill the content zone

The element takes 100 % of the BO content zone. Inside it, the root is a column: fixed areas do not grow, and only the main area scrolls.

```css
:host {
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.root {
  height: 100%;
  display: flex;
  flex-direction: column;
}
header {
  flex: none;
}
main {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
```

- The widget scrolls, not the BO.
- **Never use `100vh` or `100vw`**: the content zone is smaller than the viewport, next to the BO menu and app bar.
- `min-height: 0` lets the main area shrink below its content, so that `overflow: auto` applies.

With React, `toCustomElement` sets `:host` and the column for you: give fixed areas `flex: none` and the main area `flex: 1; min-height: 0; overflow: auto`.

## Shadow DOM

Every template renders into an open shadow root, reused when the element is inserted again:

```ts
const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
```

The shadow root isolates the widget both ways:

- BO selectors do not match inside the widget. Only inherited properties, such as `font-family`, and CSS variables cross the boundary.
- The widget's styles do not reach the BO.

## Styles never in `document.head`

A style added to `document.head` applies to the BO page, not to the shadow root: the widget would lose it, and the BO would get it. Keep every style in the shadow root.

| Stack       | How the styles reach the shadow root                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| React + MUI | `toCustomElement` inserts the Emotion styles into the shadow root (cache key `bo-widget`) |
| Svelte      | The `<style>` of a component compiled as a custom element goes into the shadow root       |
| Vue         | The `<style>` of a `.ce.vue` component goes into the shadow root                          |
| Lit         | `static styles` go into the shadow root                                                   |
| Vanilla     | Import the CSS with `?inline` and insert a `<style>` into the shadow root                 |

A CSS file imported as a regular module is emitted by Vite next to `index.js`, **outside** the Shadow DOM: import it with `?inline`, or let the framework inject it.

`@font-face` is ignored in a shadow root by some browsers. The templates use the Roboto font the BO already loads.

## Overlays stay in the shadow root

Dialogs, menus, popovers and tooltips are often rendered in a portal on `document.body`. There, they are outside the shadow root and lose the widget's styles.

- **React + MUI**: `toCustomElement` renders MUI `Modal`, `Popover` and `Popper` (so `Dialog`, `Drawer`, `Menu`, `Select`, `Tooltip`…) into a container of the shadow root. They keep the widget's styles, and the Modal-based ones cover the whole page (`position: fixed`). Do not set `container` on MUI portals. The scroll lock of a dialog applies to that container: the BO page behind it can still scroll.
- **Vue**: a `<Teleport to="body">`, or a library that teleports its overlays to `body` (Vuetify dialogs and menus…), renders them outside the shadow root. Point them to an element of the shadow root instead.
- **Svelte, Lit, vanilla**: render overlays inside the component tree. A library that appends to `document.body` has the same problem: give it a container in the shadow root.

The React template has a test that opens its dialog and checks it is in the shadow root, not in `document.body`.

## Each widget ships its own framework

The widget bundles its framework, its UI library and their versions. It shares nothing with the BO: React, MUI or any other library of the BO is not available to the widget, whatever their versions. Two widgets can use different versions of the same framework.

For React, MUI must be 7.3.6 or later (7 or 9): earlier versions trap the focus of a dialog outside a shadow root, so its text fields cannot be typed in.

## Follow the BO theme

Read the theme with `getTheme()`, then follow `themeChanged`:

```ts
const theme = await bo.getTheme(); // { palette, typography, mode }, in the shape of a MUI theme
apply(theme);
bo.on('themeChanged', apply);
```

- **React + MUI**: `toCustomElement` builds a MUI theme from the BO theme and updates it on `themeChanged`. Change it with the `customizeTheme` option, for instance `(boTheme) => createTheme(boTheme, { shape: { borderRadius: 8 } })`. A theme with `cssVariables` is not supported: its `:root` variables do not apply in a shadow root.
- **Other stacks**: map `palette` and `mode` to your CSS custom properties on `:host`.

The fake back office switches the theme from its bar, to test `themeChanged`.
