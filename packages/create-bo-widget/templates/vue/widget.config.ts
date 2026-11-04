import { defineWidgetConfig } from '@vulog/bo-widget-vite';

// The manifest of the widget (widget.json). The id, version and description come from package.json.
export default defineWidgetConfig({
  name: '{{title}}',
  // Vulog API calls through authFetch need `apiInfo`.
  permissions: ['apiInfo'],
  menu: { label: { en: '{{title}}', fr: '{{title}}' } },
  // Data of the fake back office in `npm run dev` (mock mode).
  dev: {
    context: { fleetId: 'FLEET-1', locale: 'en' },
    user: { fullName: 'Jane Doe' },
  },
});
