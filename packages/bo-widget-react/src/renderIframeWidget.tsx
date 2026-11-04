import type { ConnectOptions } from '@vulog/bo-widget-sdk';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { WidgetRoot, type WidgetRenderOptions } from './WidgetRoot.js';

/** Options of {@link renderIframeWidget}. */
export interface IframeWidgetOptions extends WidgetRenderOptions {
  /** Element to render into. Defaults to `#root`. */
  container?: Element | undefined;
  /** Options of the iframe channel (`widgetId`, `widgetVersion`, `targetOrigin`, timeouts). */
  connect?: ConnectOptions | undefined;
}

/**
 * Renders a React widget displayed by the back office in an iframe: the counterpart of
 * {@link toCustomElement} for `runtime.type: 'iframe'`. It connects to the back office
 * (`connect()`), then renders `App` with the same hooks, in a MUI theme built from the back office
 * theme, with `CssBaseline`. The iframe isolates the widget, so no Shadow DOM is involved.
 *
 * @param App - Root component of the widget.
 * @param options - Container, connection options, fallbacks and theme customization.
 * @returns A function that unmounts the widget and disconnects it.
 * @throws {TypeError} When no container is given and the page has no `#root` element.
 *
 * @example
 * ```tsx
 * // main.tsx, loaded by index.html
 * import { renderIframeWidget } from '@vulog/bo-widget-react';
 * import App from './App';
 *
 * renderIframeWidget(App, { connect: { widgetId: 'fleet-report' } });
 * ```
 */
export const renderIframeWidget = (
  App: ComponentType,
  { container, connect, fallback, errorFallback, customizeTheme }: IframeWidgetOptions = {},
): (() => void) => {
  const target = container ?? document.getElementById('root');
  if (!target) {
    throw new TypeError(
      'renderIframeWidget: no #root element in the page, pass the element to render into as container',
    );
  }
  const root = createRoot(target);
  root.render(
    <WidgetRoot
      App={App}
      element={null}
      connectOptions={connect}
      fallback={fallback}
      errorFallback={errorFallback}
      customizeTheme={customizeTheme}
    />,
  );
  return () => root.unmount();
};
