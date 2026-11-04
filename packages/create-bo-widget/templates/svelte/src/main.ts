import App from './App.svelte';

/**
 * The widget: the class Svelte compiled from App.svelte. Export it: the back office registers it
 * under its own tag, so never call `customElements.define`.
 */
export default App.element as CustomElementConstructor;
