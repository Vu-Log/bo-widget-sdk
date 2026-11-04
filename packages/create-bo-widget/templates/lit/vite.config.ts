/// <reference types="vitest/config" />
import { boWidget } from '@vulog/bo-widget-vite';
import { defineConfig } from 'vite';
import widget from './widget.config.ts';

export default defineConfig({
  plugins: [boWidget(widget)],
  test: { environment: 'happy-dom' },
});
