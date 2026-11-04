---
description: A complete BO widget in React and MUI, from the react-mui template - toCustomElement, hooks, Shadow DOM, MUI dialogs in the shadow root.
---

# React and MUI

The `react-mui` template, the default one, builds the widget with React and [MUI](https://mui.com) 7.3.6 or later, through `toCustomElement` of [`@vulog/bo-widget-react`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-react).

```bash
npm create @vulog/bo-widget@next my-widget
```

The code below is the template itself, built and tested by the CI of the SDK. <span v-pre>`{{name}}`</span> and <span v-pre>`{{title}}`</span> are replaced at creation by the widget id (`my-widget`) and its display name (`My widget`).

## How it works

- **The host element.** `toCustomElement(App)` returns the element class. The widget exports it and never calls `customElements.define`. The element calls `connect(this)` on insertion; `App` reads the BO through hooks, and never calls `connect` itself.
- **State.** `useBoContext()` follows `localeChanged` and `fleetChanged`, `useCurrentUser()` follows `userChanged`. The children render once the initial state is loaded, so the hooks never return a partial state. Other hooks: `useAuthFetch()`, `useBoTheme()`, `useBoRouter()`, `useBoClient()`.
- **Cleanup.** Once the element is removed, React unmounts and the connection closes in a later task. An element moved within the same task keeps its React tree and connection.
- **Layout.** `:host` is a block at 100 % of the content zone and `App` renders in a column: the `Toolbar` has `flex: none`, the `main` area `flex: 1; minHeight: 0; overflow: auto`.
- **Styles and overlays.** Emotion inserts every style into the shadow root. MUI `Dialog`, `Menu`, `Popover`, `Select`, `Tooltip`… render into a container of the shadow root, with the widget's styles; `Dialog` covers the whole page. Do not set `container` on MUI portals.
- **Theme.** A MUI theme built from `getTheme()`, updated on `themeChanged`. Change it with the `customizeTheme` option of `toCustomElement`. Do not use `cssVariables`.
- **Errors.** An error boundary wraps `App`: when the widget cannot connect, load the BO state or render, it shows a short message with `role="alert"`. Change it with the `errorFallback` option.

Keep MUI 7.3.6 or later: earlier versions trap the focus of a dialog outside a shadow root, so its text fields cannot be typed in.

## `src/main.tsx`

<<< @/../packages/create-bo-widget/templates/react-mui/src/main.tsx

## `src/App.tsx`

<<< @/../packages/create-bo-widget/templates/react-mui/src/App.tsx

## `widget.config.ts`

<<< @/../packages/create-bo-widget/templates/react-mui/widget.config.ts

## `vite.config.ts`

<<< @/../packages/create-bo-widget/templates/react-mui/vite.config.ts

## `src/main.test.tsx`

<<< @/../packages/create-bo-widget/templates/react-mui/src/main.test.tsx

## Call the Vulog API

`useAuthFetch()` returns `authFetch`, with a stable identity. Cancel the call on unmount:

```tsx
import { useAuthFetch, useBoClient, useBoContext } from '@vulog/bo-widget-react';
import { useEffect, useState } from 'react';

export function VehicleCount() {
  const { fleetId } = useBoContext();
  const authFetch = useAuthFetch();
  const bo = useBoClient();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    authFetch(`fleetmanager/public/fleets/${fleetId}/vehicles?page=0`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((vehicles: unknown[]) => setCount(vehicles.length))
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          void bo.notify({ message: String(error), severity: 'error' });
      });
    return () => controller.abort();
  }, [authFetch, bo, fleetId]);

  return <>{count === null ? 'Loading…' : `${count} vehicles`}</>;
}
```

`notify` needs the `notify` permission in `widget.config.ts`, next to `apiInfo`.

## iframe

For an iframe widget, `renderIframeWidget(App)` renders `App` into `#root` of `index.html` and connects. The hooks are the same. See the [README of `@vulog/bo-widget-react`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-react#iframe).
