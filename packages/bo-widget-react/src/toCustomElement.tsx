import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import type { ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { WidgetRoot, type WidgetRenderOptions } from './WidgetRoot.js';
import { logError } from './WidgetProvider.js';

/** Options of {@link toCustomElement}. */
export type WidgetElementOptions = WidgetRenderOptions;

/** Class returned by {@link toCustomElement}: a custom element the back office registers. */
export type WidgetElementClass = new () => HTMLElement;

// The back office sets the size of the element inline; these rules cover the local test pages and
// the menu entries that do not.
const HOST_CSS = ':host { display: block; width: 100%; height: 100%; box-sizing: border-box; }';
const MOUNT_CSS = 'height: 100%; display: flex; flex-direction: column;';
const EMOTION_KEY = 'bo-widget';

/**
 * Turns a React component into the class of a Web Component the back office can display. Export
 * the class as the default export of `index.js`: **never call `customElements.define`**, the back
 * office registers it under a tag it chooses.
 *
 * The element:
 * - renders `App` in an open Shadow DOM, which it fills (`:host` is a block at 100 %) with a column
 *   layout;
 * - inserts the Emotion styles (MUI) into the shadow root, never into `document.head`;
 * - renders the MUI portals (Dialog, Drawer, Menu, Select, Popover, Tooltip…) into a container of
 *   the shadow root, so that they keep the widget's styles; the Modal-based ones (Dialog, Drawer,
 *   Menu, Select) still cover the whole page;
 * - wraps `App` in `ScopedCssBaseline` and in a MUI theme built from the back office theme;
 * - connects to the back office (`connect(this)`), and provides the hooks (`useBoContext`,
 *   `useAuthFetch`…);
 * - unmounts React and disconnects once removed from the page. The unmount is deferred to a later
 *   task (`setTimeout`), so that an element moved within the same task (removed, then inserted
 *   again, even after an `await`) keeps the same React tree and connection.
 *
 * Requires MUI 7.3.6 or later: earlier versions trap the focus of a dialog outside a shadow root.
 *
 * Fonts are not loaded: the widget relies on the Roboto font the back office already loads.
 *
 * @param App - Root component of the widget. It uses the hooks of this package, not props.
 * @param options - Fallbacks and theme customization (`fallback`, `errorFallback`, `customizeTheme`).
 * @returns The class, not registered.
 *
 * @example
 * ```tsx
 * import { toCustomElement, useBoContext } from '@vulog/bo-widget-react';
 *
 * function App() {
 *   const { fleetId } = useBoContext();
 *   return <p>Fleet {fleetId}</p>;
 * }
 *
 * export default toCustomElement(App);
 * ```
 */
export const toCustomElement = (
  App: ComponentType,
  { fallback, errorFallback, customizeTheme }: WidgetElementOptions = {},
): WidgetElementClass =>
  class BoWidgetElement extends HTMLElement {
    #root: Root | null = null;
    #unmountScheduled = false;

    connectedCallback(): void {
      // Moved: the unmount scheduled by `disconnectedCallback` will see the element connected.
      if (this.#root) return;
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = HOST_CSS;
      const mount = document.createElement('div');
      mount.style.cssText = MOUNT_CSS;
      const portals = document.createElement('div');
      portals.dataset.boWidgetPortals = '';
      shadow.replaceChildren(style, mount, portals);

      // `speedy: false` keeps the rules as text in the <style> elements: the browser drops the rules
      // inserted with `insertRule` (Emotion's production mode) when the element leaves the
      // document, and would not restore them when it is inserted again.
      const cache = createCache({ key: EMOTION_KEY, container: shadow, speedy: false });
      this.#root = createRoot(mount);
      this.#root.render(
        <CacheProvider value={cache}>
          <WidgetRoot
            App={App}
            element={this}
            portalContainer={portals}
            fallback={fallback}
            errorFallback={errorFallback}
            customizeTheme={customizeTheme}
          />
        </CacheProvider>,
      );
    }

    disconnectedCallback(): void {
      if (this.#unmountScheduled) return;
      this.#unmountScheduled = true;
      setTimeout(() => {
        this.#unmountScheduled = false;
        const root = this.#root;
        if (this.isConnected || !root) return;
        this.#root = null;
        try {
          root.unmount();
        } catch (error) {
          logError('failed to unmount the widget', error);
        } finally {
          this.shadowRoot?.replaceChildren();
        }
      }, 0);
    }
  };
