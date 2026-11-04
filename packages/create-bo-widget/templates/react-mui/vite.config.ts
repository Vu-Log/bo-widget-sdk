/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { boWidget } from '@vulog/bo-widget-vite';
import { defineConfig } from 'vite';
import widget from './widget.config.ts';

export default defineConfig({
  plugins: [react(), boWidget(widget)],
  test: { environment: 'happy-dom' },
});
