/**
 * Vite plugin to build a Vulog back office widget: generates and validates `widget.json`, lays out
 * the bundle the back office loads (`index.js` or `index.html`, `base: './'`), and serves a fake
 * back office in dev. Start with {@link boWidget}.
 *
 * @packageDocumentation
 */
export { boWidget, defineWidgetConfig, MANIFEST_FILE } from './plugin.js';
export {
  BoWidgetConfigError,
  buildManifest,
  type WidgetConfig,
  type WidgetPackageJson,
  type WidgetRuntime,
} from './manifest.js';
export { FAKE_BO_PATH } from './dev/server.js';
export type { FakeBoMode, MockMethod, MockResponseKey, WidgetDevOptions } from './dev/options.js';
