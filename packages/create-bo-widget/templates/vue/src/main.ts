import { defineCustomElement } from 'vue';
import App from './App.ce.vue';

/**
 * The widget: the class of a custom element that renders App in an open shadow root. Export it:
 * the back office registers it under its own tag, so never call `customElements.define`.
 */
export default defineCustomElement(App);
