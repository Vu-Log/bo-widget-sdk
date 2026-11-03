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
  FAKE_BO_MODULE_URL,
  fakeBoConfig,
  fakeBoModule,
  installFakeBo,
  resolveDevMode,
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
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch (error) {
    throw new BoWidgetConfigError([`${path} is not valid JSON: ${(error as Error).message}`]);
  }
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
 * - Warns on every `customElements.define`: the back office registers the class itself.
 * - In dev, serves a fake back office on `/__bo-widget/` that displays the widget, in mock mode
 *   or, with `BO_WIDGET_TOKEN`, against a real Vulog API.
 *
 * @param config - The widget configuration, usually imported from `widget.config.ts`.
 * @returns The plugin, to add to `plugins` in `vite.config.ts`.
 * @throws {BoWidgetConfigError} When Vite resolves its configuration, for an invalid widget
 * configuration or a missing `package.json`.
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
  let devMode: ReturnType<typeof resolveDevMode> | undefined;
  const warned = new Set<string>();
  const hostModuleId = normalizePath(hostModule());

  return {
    name: '@vulog/bo-widget-vite',

    config(userConfig, { command }) {
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

    configureServer(server) {
      const env = loadEnv(
        resolvedConfig.mode,
        resolvedConfig.envDir === false ? resolvedConfig.root : resolvedConfig.envDir,
        'BO_WIDGET_',
      );
      devMode = resolveDevMode(config.dev?.mode, env);
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
        // The fake back office registers the widget class, as the back office does.
        if (id.startsWith('\0') || warned.has(id) || id === hostModuleId) return null;
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
        !existsSync(resolve(options.dir ?? resolvedConfig.build.outDir, icon))
      ) {
        this.error(
          `[bo-widget] icon "${icon}" is not in the bundle: put it in ${relative(resolvedConfig.root, resolvedConfig.publicDir) || 'public'}/.`,
        );
      }
    },
  };
};
