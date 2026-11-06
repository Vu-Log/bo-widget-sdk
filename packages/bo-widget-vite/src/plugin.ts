import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { WidgetManifest } from '@vulog/bo-widget-sdk/manifest';
import {
  loadEnv,
  normalizePath,
  searchForWorkspaceRoot,
  type Plugin,
  type ResolvedConfig,
} from 'vite';
import { defineWarning, findCustomElementsDefine } from './defineCheck.js';
import {
  FAKE_BO_BASENAME,
  FAKE_BO_MODULE_URL,
  fakeBoConfig,
  fakeBoModule,
  installFakeBo,
  resolveDevMode,
  type ResolvedDevMode,
} from './dev/server.js';
import { BoWidgetConfigError, buildManifest, type WidgetConfig } from './manifest.js';

/** Name of the generated manifest, at the root of the bundle. */
export const MANIFEST_FILE = 'widget.json';

const DEFAULT_ENTRY = 'src/main.ts';
const FAKE_BO_MODULE_ID = '\0bo-widget:fake-bo';

/** The fake back office module, compiled next to this file (`.ts` when run from the sources). */
const hostModule = (): string => {
  const compiled = fileURLToPath(new URL('./dev/host.js', import.meta.url));
  return existsSync(compiled) ? compiled : compiled.replace(/\.js$/, '.ts');
};

/**
 * The `process.env` defines Vite applies to an app build and skips in library mode: a widget
 * bundles its dependencies, and React or MUI read `process.env.NODE_ENV` at runtime.
 */
const processEnvDefines = (nodeEnv: string): Record<string, string> => {
  const value = JSON.stringify(nodeEnv);
  return {
    'process.env': '{}',
    'global.process.env': '{}',
    'globalThis.process.env': '{}',
    'process.env.NODE_ENV': value,
    'global.process.env.NODE_ENV': value,
    'globalThis.process.env.NODE_ENV': value,
  };
};

/**
 * Typed helper for `widget.config.ts`: returns its argument.
 *
 * @example
 * ```ts
 * // widget.config.ts
 * import { defineWidgetConfig } from '@vulog/bo-widget-vite';
 *
 * export default defineWidgetConfig({
 *   name: 'Fleet report',
 *   permissions: ['apiInfo'],
 *   menu: { label: { en: 'Fleet report', fr: 'Rapport de flotte' } },
 * });
 * ```
 */
export const defineWidgetConfig = (config: WidgetConfig): WidgetConfig => config;

const readPackageJson = (root: string): Record<string, unknown> => {
  const path = resolve(root, 'package.json');
  if (!existsSync(path)) {
    throw new BoWidgetConfigError([
      `package.json not found in ${root}: the widget version comes from it`,
    ]);
  }
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    throw new BoWidgetConfigError([`cannot read ${path}: ${(error as Error).message}`]);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new BoWidgetConfigError([`${path} is not valid JSON: ${(error as Error).message}`]);
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new BoWidgetConfigError([`${path} must contain a JSON object`]);
  }
  return json as Record<string, unknown>;
};

/**
 * Vite plugin of a back office widget.
 *
 * - Generates `widget.json` from the configuration and `package.json`, validated with the rules
 *   Vulog applies on publication: an invalid configuration fails `vite` and `vite build`.
 * - Forces `base: './'`, so that the bundle works from the folder the back office serves it from.
 * - Web Component (default): builds the `entry` in library mode as `index.js`, an ES module whose
 *   default export must be the element class (the build fails otherwise). Iframe: builds
 *   `index.html` as a regular app.
 * - Warns, once per module (dependencies included), on each `customElements.define`: the back
 *   office registers the class itself.
 * - Web Component build: defines `process.env.NODE_ENV`, which library mode leaves as is, since
 *   the widget bundles its dependencies (React reads it).
 * - In dev, serves a fake back office on `/__bo-widget/` that displays the widget, in mock mode
 *   or, with `BO_WIDGET_TOKEN`, against a real Vulog API: with `BO_WIDGET_HOST`, its URL and key
 *   come from the anonymous conf of that back office, read at startup. Always in mock mode in the
 *   `test` mode (Vitest).
 *
 * @param config - The widget configuration, usually imported from `widget.config.ts`.
 * @returns The plugin, to add to `plugins` in `vite.config.ts`.
 * @throws {BoWidgetConfigError} When Vite resolves its configuration, for an invalid widget
 * configuration or a missing or invalid `package.json`.
 * @throws {Error} When the dev server starts in token mode without its `BO_WIDGET_*` variables,
 * with an invalid `BO_WIDGET_HOST` (in mock mode too), or with a `BO_WIDGET_HOST` whose conf
 * cannot be read or lacks the API URL or key (except in the `test` mode of Vitest, always mock);
 * the build fails when the entry has no default export, the iframe build has no `index.html`, or
 * the icon is not in the bundle.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { boWidget } from '@vulog/bo-widget-vite';
 * import widget from './widget.config';
 *
 * export default defineConfig({ plugins: [boWidget(widget)] });
 * ```
 */
export const boWidget = (config: WidgetConfig): Plugin => {
  const runtime = config.runtime ?? 'webcomponent';
  let resolvedConfig: ResolvedConfig;
  let manifest: WidgetManifest;
  let entry: string;
  let requestedBase: string | undefined;
  let devMode: ResolvedDevMode | undefined;
  const warned = new Set<string>();
  const hostModuleId = normalizePath(hostModule());

  return {
    name: '@vulog/bo-widget-vite',

    config(userConfig, { command, mode }) {
      const root = resolve(userConfig.root ?? process.cwd());
      entry = resolve(root, config.entry ?? DEFAULT_ENTRY);
      requestedBase = userConfig.base;
      return {
        base: './',
        server: {
          // The fake back office module lives in this package, maybe outside the workspace.
          fs: { allow: [searchForWorkspaceRoot(root), dirname(hostModule())] },
        },
        ...(runtime === 'webcomponent' && command === 'build'
          ? {
              build: {
                lib: { entry, formats: ['es' as const], fileName: () => 'index.js' },
              },
              ...(userConfig.define?.['process.env.NODE_ENV'] === undefined
                ? { define: processEnvDefines(process.env.NODE_ENV || mode) }
                : {}),
            }
          : {}),
      };
    },

    configResolved(resolved) {
      resolvedConfig = resolved;
      manifest = buildManifest(config, readPackageJson(resolved.root));
      if (requestedBase !== undefined && requestedBase !== './') {
        resolved.logger.warn(
          `[bo-widget] base "${requestedBase}" replaced by "./": the back office serves the widget from its own folder.`,
        );
      }
    },

    async configureServer(server) {
      const env = loadEnv(
        resolvedConfig.mode,
        resolvedConfig.envDir === false ? resolvedConfig.root : resolvedConfig.envDir,
        'BO_WIDGET_',
      );
      // Vitest serves the tests in the `test` mode, where nobody opens the fake back office: no
      // token mode, so that a test run never depends on the conf of a back office.
      devMode =
        resolvedConfig.mode === 'test'
          ? { mode: 'mock' }
          : await resolveDevMode(config.dev?.mode, env, {
              warn: (message) => server.config.logger.warn(message),
            });
      const settingKeys = new Set(manifest.settings.map((setting) => setting.key));
      const unknownSettings = Object.keys(config.dev?.settings ?? {}).filter(
        (key) => !settingKeys.has(key),
      );
      if (unknownSettings.length > 0) {
        server.config.logger.warn(
          `[bo-widget] dev.settings ${unknownSettings.join(', ')}: not declared in settings, the back office would never send them.`,
        );
      }
      const basename = config.dev?.context?.basename;
      if (
        basename !== undefined &&
        basename !== FAKE_BO_BASENAME &&
        !basename.startsWith(`${FAKE_BO_BASENAME}/`)
      ) {
        server.config.logger.warn(
          `[bo-widget] dev.context.basename ${basename} is outside ${FAKE_BO_BASENAME}, the path of the fake back office: a widget router matches nothing, and its sub-routes are not served on reload. Keep the default.`,
        );
      }
      installFakeBo(server, { runtime, responses: config.dev?.responses ?? {}, resolved: devMode });
    },

    resolveId(id) {
      return id === FAKE_BO_MODULE_URL ? FAKE_BO_MODULE_ID : null;
    },

    load(id) {
      // Only served by the dev server, which resolved the mode.
      if (id !== FAKE_BO_MODULE_ID || !devMode) return null;
      const boConfig = fakeBoConfig(manifest, config.dev ?? {}, devMode);
      return fakeBoModule(
        normalizePath(hostModule()),
        boConfig,
        runtime === 'webcomponent' ? normalizePath(entry) : null,
      );
    },

    transform: {
      // Before the TypeScript or framework compilers, so that the lines are the source's.
      order: 'pre',
      handler(code, id) {
        // The tests of a widget register its class to mount it: Vitest serves them in the `test`
        // mode. A build in that mode (`vite build --mode test`) is still checked.
        if (resolvedConfig.command === 'serve' && resolvedConfig.mode === 'test') return null;
        // The fake back office registers the widget class, as the back office does. Vite adds a
        // query to the modules of node_modules (`host.js?v=…`).
        if (id.startsWith('\0') || warned.has(id) || id.split('?')[0] === hostModuleId) return null;
        const lines = findCustomElementsDefine(code);
        if (lines.length > 0) {
          warned.add(id);
          const module = relative(resolvedConfig.root, id.split('?')[0] ?? id);
          this.warn(defineWarning(normalizePath(module), lines));
        }
        return null;
      },
    },

    generateBundle(_options, bundle) {
      if (runtime === 'webcomponent') {
        const chunk = bundle['index.js'];
        if (chunk?.type !== 'chunk' || !chunk.isEntry) {
          this.error(`[bo-widget] the build did not produce index.js from ${entry}`);
        }
        if (!chunk.exports.includes('default')) {
          this.error(
            `[bo-widget] ${relative(resolvedConfig.root, entry)} has no default export: export the element class as default (export default class extends HTMLElement { … }).`,
          );
        }
      }
      this.emitFile({
        type: 'asset',
        fileName: MANIFEST_FILE,
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
    },

    // Checked once written: the HTML is emitted late, and the public folder is copied by then.
    writeBundle(options, bundle) {
      if (runtime === 'iframe' && bundle['index.html']?.type !== 'asset') {
        this.error(
          '[bo-widget] the build did not produce index.html: an iframe widget needs one at the Vite root.',
        );
      }
      const { icon } = manifest;
      if (
        icon &&
        !bundle[icon] &&
        !existsSync(resolve(resolvedConfig.root, options.dir ?? resolvedConfig.build.outDir, icon))
      ) {
        this.error(
          `[bo-widget] icon "${icon}" is not in the bundle: put it in ${relative(resolvedConfig.root, resolvedConfig.publicDir) || 'public'}/.`,
        );
      }
    },
  };
};
