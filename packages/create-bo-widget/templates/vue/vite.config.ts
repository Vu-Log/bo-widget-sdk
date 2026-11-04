/// <reference types="vitest/config" />
import vue from '@vitejs/plugin-vue';
import { boWidget } from '@vulog/bo-widget-vite';
import { defineConfig } from 'vite';
import widget from './widget.config.ts';

export default defineConfig({
  // The *.ce.vue components are compiled as custom elements: their styles go into the shadow root.
  plugins: [vue(), boWidget(widget)],
  test: { environment: 'happy-dom' },
});
