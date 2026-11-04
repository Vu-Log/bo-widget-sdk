/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { boWidget } from '@vulog/bo-widget-vite';
import { defineConfig } from 'vite';
import widget from './widget.config.ts';

export default defineConfig(({ mode }) => ({
  // svelte.config.js compiles the components as custom elements.
  plugins: [svelte(), boWidget(widget)],
  // The tests (Vitest runs in the `test` mode) need the browser build of Svelte, not its server one.
  ...(mode === 'test' ? { resolve: { conditions: ['browser'] } } : {}),
  test: { environment: 'happy-dom' },
}));
