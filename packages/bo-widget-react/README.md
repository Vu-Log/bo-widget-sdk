# @vulog/bo-widget-react

React bindings for widgets embedded in the Vulog back office (BO), as a Web Component or in an iframe. Built on [`@vulog/bo-widget-sdk`](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-sdk).

- **`toCustomElement(App)`**: the class of a Web Component the BO registers, with React rendered in a Shadow DOM, the MUI (Emotion) styles kept in the shadow root, MUI dialogs and menus that keep their styles and cover the page, and a clean unmount.
- **`renderIframeWidget(App)`**: the same for a widget displayed in an iframe.
- **Hooks**: `useBoContext`, `useCurrentUser`, `useAuthFetch`, `useBoTheme`, `useBoRouter` and `useBoClient`, kept up to date with the events the BO pushes.

## Install

```bash
npm install @vulog/bo-widget-react@next @vulog/bo-widget-sdk@next
npm install react react-dom @mui/material @emotion/react @emotion/styled @emotion/cache
```

Peer dependencies: React 18 or 19, MUI 5.15 or later (5, 6, 7 or 9), Emotion 11. The widget bundles its own React and MUI: it shares nothing with the BO, whatever their versions.

## Web Component

```tsx
// src/index.tsx: the entry of the widget, built as index.js
import { toCustomElement } from '@vulog/bo-widget-react';
import App from './App';

// Export the class: the BO registers it under its own tag. Never call customElements.define.
export default toCustomElement(App);
```

```tsx
// src/App.tsx
import { Box, Button, Toolbar, Typography } from '@mui/material';
import { useAuthFetch, useBoClient, useBoContext } from '@vulog/bo-widget-react';
import { useEffect, useState } from 'react';

export default function App() {
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

  return (
    <>
      <Toolbar sx={{ flex: 'none', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Fleet {fleetId}</Typography>
      </Toolbar>
      <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
        {count === null ? 'Loading…' : `${count} vehicles`}
        <Button onClick={() => bo.navigate({ path: '/app/vehicles' })}>All vehicles</Button>
      </Box>
    </>
  );
}
```

What the element does:

| Point      | Behavior                                                                                                                                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shadow DOM | Open, reused when the element is inserted again. `:host` is a block at 100 % of the BO content zone.                                                                                                                                                |
| Layout     | `App` renders in a column (`display: flex; flex-direction: column`) that fills the element: give fixed areas `flex: none` and the main area `flex: 1; min-height: 0; overflow: auto`. The widget scrolls, not the BO. Never use `100vh` or `100vw`. |
| Styles     | Emotion inserts every style into the shadow root (cache key `bo-widget`), never into `document.head`. BO styles do not reach the widget, and the widget's do not reach the BO.                                                                      |
| Baseline   | `ScopedCssBaseline` wraps `App` (`CssBaseline` matches nothing in a shadow root).                                                                                                                                                                   |
| Portals    | MUI `Modal`, `Popover` and `Popper` (so `Dialog`, `Drawer`, `Menu`, `Select`, `Tooltip`…) render into a container of the shadow root: they keep the widget's styles, and stay `position: fixed` over the whole page.                                |
| Theme      | A MUI theme built from the BO theme (`getTheme`), updated on `themeChanged`. Customize it with the `theme` option.                                                                                                                                  |
| Fonts      | Not loaded: the widget uses the Roboto font the BO already loads (`@font-face` is ignored in a shadow root by some browsers).                                                                                                                       |
| Lifecycle  | `connect(this)` on insertion. Once removed, React unmounts and the connection closes at the end of the current task: an element moved (removed, then inserted again in the same task) keeps its React tree and connection.                          |

## iframe

```tsx
// src/main.tsx, loaded by index.html, which has a <div id="root">
import { renderIframeWidget } from '@vulog/bo-widget-react';
import App from './App';

renderIframeWidget(App, { connect: { widgetId: 'fleet-report' } });
```

The iframe isolates the widget, so there is no Shadow DOM: Emotion and the MUI portals use the iframe document, and `CssBaseline` wraps `App`. `renderIframeWidget` returns a function that unmounts the widget and closes the connection. It throws a `TypeError` when the page has no `#root` and no `container` is given.

## Options

Both `toCustomElement(App, options)` and `renderIframeWidget(App, options)` accept:

| Option          | Default                          | Description                                                                                                                                                                              |
| --------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fallback`      | nothing                          | Shown while the widget connects and loads the BO state.                                                                                                                                  |
| `errorFallback` | a short message (`role="alert"`) | `(error) => ReactNode`, shown when the widget cannot connect or load the BO state. `error` is usually a `BoError`.                                                                       |
| `theme`         | the BO theme                     | `(boTheme) => Theme`: the MUI theme to render with, such as `(boTheme) => createTheme(boTheme, { shape: { borderRadius: 8 } })`. A Web Component's portal container is set on top of it. |

`renderIframeWidget` also accepts `container` (default `#root`) and `connect`, the options of the iframe channel (`widgetId`, `widgetVersion`, `targetOrigin`, timeouts).

## Hooks

They throw outside a widget (`toCustomElement`, `renderIframeWidget` or `WidgetProvider`). The children render once the initial state is loaded, so the hooks never return a partial state.

| Hook               | Returns                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useBoContext()`   | `BoContext` (fleet, locale, timezone, currency, `basename`…), updated on `localeChanged` and `fleetChanged`.                                                                                                                                            |
| `useCurrentUser()` | `BoCurrentUser`, updated on `userChanged`.                                                                                                                                                                                                              |
| `useAuthFetch()`   | `authFetch` of the client: `fetch` with the Vulog authentication, with a path relative to the Vulog API. Stable identity.                                                                                                                               |
| `useBoTheme()`     | The MUI `Theme` built from the BO theme, updated on `themeChanged`.                                                                                                                                                                                     |
| `useBoRouter()`    | `{ basename, location, navigate }`: `basename` for your router, `location` the BO route (`window.location` as a Web Component until the first `routeChanged`, `null` in an iframe until then), `navigate(path)` through the BO (permission `navigate`). |
| `useBoClient()`    | The `BoClient`, for the other requests (`getSettings`, `notify`, `getAccessToken`…).                                                                                                                                                                    |

See the [`@vulog/bo-widget-sdk` README](https://github.com/Vu-Log/bo-widget-sdk/tree/main/packages/bo-widget-sdk#readme) for `authFetch`, permissions and errors.

## Testing a widget

Mount it the way the BO does, with a fake injected API (see the SDK's `AGENTS.md`):

```tsx
import WidgetClass from './index';

customElements.define('widget-test', WidgetClass);
const element = document.createElement('widget-test');
Object.assign(element, { vulogBo: fakeHostApi }); // getContext, getCurrentUser, getTheme, on, off…
document.body.appendChild(element);
// then query element.shadowRoot
```

Or render a component inside `<WidgetProvider client={await connect({ vulogBo: fakeHostApi })}>`.

## License

MIT
