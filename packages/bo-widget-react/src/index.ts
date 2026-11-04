/**
 * React bindings for Vulog back office widgets. Export {@link toCustomElement}`(App)` as a Web
 * Component, or call {@link renderIframeWidget}`(App)` in an iframe, then read the back office from
 * the hooks (`useBoContext`, `useCurrentUser`, `useAuthFetch`, `useBoTheme`, `useBoRouter`).
 *
 * @packageDocumentation
 */
export {
  toCustomElement,
  type WidgetElementClass,
  type WidgetElementOptions,
} from './toCustomElement.js';
export { renderIframeWidget, type IframeWidgetOptions } from './renderIframeWidget.js';
export type { WidgetRenderOptions } from './WidgetRoot.js';
export { WidgetProvider, type BoLocation, type WidgetProviderProps } from './WidgetProvider.js';
export {
  useAuthFetch,
  useBoClient,
  useBoContext,
  useBoRouter,
  useBoTheme,
  useCurrentUser,
  type BoRouter,
} from './hooks.js';
export { createBoMuiTheme } from './theme.js';
