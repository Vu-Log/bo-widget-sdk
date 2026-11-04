import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import type { ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { WidgetRoot, type WidgetRenderOptions } from './WidgetRoot.js';

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
 * - renders the MUI portals (Dialog, Menu, Popover, Tooltip…) into a container of the shadow root,
 *   so that they keep the widget's styles and still cover the whole page;
 * - wraps `App` in `ScopedCssBaseline` and in a MUI theme built from the back office theme;
 * - connects to the back office (`connect(this)`), and provides the hooks (`useBoContext`,
 *   `useAuthFetch`…);
 * - unmounts React and disconnects once removed from the page. The unmount is deferred to the end
 *   of the current task, so that moving the element (removed, then inserted again) keeps the same
 *   React tree and connection.
 *
 * Fonts are not loaded: the widget relies on the Roboto font the back office already loads.
 *
 * @param App - Root component of the widget. It uses the hooks of this package, not props.
 * @param options - Fallbacks and theme customization.
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
  options: WidgetElementOptions = {},
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

      const cache = createCache({ key: EMOTION_KEY, container: shadow });
      this.#root = createRoot(mount);
      this.#root.render(
        <CacheProvider value={cache}>
          <WidgetRoot App={App} element={this} portalContainer={portals} {...options} />
        </CacheProvider>,
      );
    }

    disconnectedCallback(): void {
      if (this.#unmountScheduled) return;
      this.#unmountScheduled = true;
      queueMicrotask(() => {
        this.#unmountScheduled = false;
        if (this.isConnected || !this.#root) return;
        this.#root.unmount();
        this.#root = null;
        this.shadowRoot?.replaceChildren();
      });
    }
  };
