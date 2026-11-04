import { toCustomElement } from '@vulog/bo-widget-react';
import App from './App';

/**
 * The widget: React rendered in a shadow root, with the MUI styles, dialogs and menus kept inside
 * it. Export the class: the back office registers it under its own tag, so never call
 * `customElements.define`.
 */
export default toCustomElement(App);
