---
'@vulog/bo-widget-react': minor
---

Add `@vulog/bo-widget-react`: `toCustomElement(App)` turns a React component into the Web Component class the back office registers (Shadow DOM, Emotion styles in the shadow root, MUI portals in the shadow root, `ScopedCssBaseline`, deferred unmount), `renderIframeWidget(App)` renders it in an iframe, and the hooks `useBoContext`, `useCurrentUser`, `useAuthFetch`, `useBoTheme`, `useBoRouter` and `useBoClient` read the back office state.
