import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  // Compiles the components as custom elements: App.element is the class of the widget.
  compilerOptions: { customElement: true },
};
