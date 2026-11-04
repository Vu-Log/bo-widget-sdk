import { PROTOCOL_VERSION } from '@vulog/bo-widget-sdk';
import {
  WIDGET_RUNTIME_ENTRIES,
  publishedWidgetManifestSchema,
  type WidgetManifest,
  type WidgetManifestInput,
  type WidgetPermission,
} from '@vulog/bo-widget-sdk/manifest';
import { devOptionsIssues, type WidgetDevOptions } from './dev/options.js';

/** How the back office runs the widget: Web Component (default) or iframe. */
export type WidgetRuntime = keyof typeof WIDGET_RUNTIME_ENTRIES;

/**
 * Configuration of a widget, usually kept in `widget.config.ts` and passed to `boWidget()`.
 *
 * It holds the fields of `widget.json` that `package.json` does not: `version` always comes from
 * `package.json`, and `id`, `description` and `author` default to its `name` (without scope),
 * `description` and `author`.
 */
export interface WidgetConfig {
  /** Widget id, in kebab-case. Defaults to the `package.json` name without its scope. */
  id?: string;
  /** Name shown to the back office admins. */
  name: string;
  /** What the widget does, in Markdown. Defaults to the `package.json` description. */
  description?: string;
  /** Defaults to the `package.json` author. */
  author?: { name: string; email?: string };
  /** Path of the icon inside the built bundle (put it in `public/`), e.g. `icon.svg`. */
  icon?: string;
  /** `webcomponent` (default): `index.js` exports the element class; `iframe`: `index.html`. */
  runtime?: WidgetRuntime;
  /**
   * Source module whose default export is the element class, relative to the Vite root
   * (Web Component only). Defaults to `src/main.ts`.
   */
  entry?: string;
  /** Oldest back office version the widget works with (`1.86.0`). */
  minBoVersion?: string;
  /** Default menu entry: section, target, position, roles and label per locale. */
  menu?: WidgetManifestInput['menu'];
  /** Protocol requests the widget needs (`accessToken`, `apiInfo`, `navigate`, `notify`). */
  permissions?: WidgetPermission[];
  /** Settings the admin fills in at installation, read with `getSettings`. Never secrets. */
  settings?: WidgetManifestInput['settings'];
  /** Fake back office used by `vite` in dev. */
  dev?: WidgetDevOptions;
}

/** The fields of `package.json` the manifest is built from. */
export interface WidgetPackageJson {
  name?: unknown;
  version?: unknown;
  description?: unknown;
  author?: unknown;
}

const CONFIG_KEYS: readonly string[] = [
  'id',
  'name',
  'description',
  'author',
  'icon',
  'runtime',
  'entry',
  'minBoVersion',
  'menu',
  'permissions',
  'settings',
  'dev',
] satisfies (keyof WidgetConfig)[];

/** Error of an invalid widget configuration: `issues` lists every problem, one line each. */
export class BoWidgetConfigError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid widget configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'BoWidgetConfigError';
    this.issues = Object.freeze([...issues]);
  }
}

/** `@vulog/fleet-report` → `fleet-report`. */
const unscoped = (name: string): string => name.replace(/^@[^/]+\//, '');

/** Reads the npm `author` field: `"Name <email> (url)"` or `{ name, email }`; `error` when it cannot. */
const parseAuthor = (author: unknown): { author?: WidgetConfig['author']; error?: string } => {
  if (author === undefined || author === '') return {};
  if (typeof author === 'string') {
    const match = /^\s*([^<(]*?)\s*(?:<([^>]*)>)?\s*(?:\([^)]*\))?\s*$/.exec(author);
    const name = match?.[1];
    if (!name) return { error: `"${author}" is not understood` };
    const email = match[2]?.trim();
    return { author: email ? { name, email } : { name } };
  }
  if (typeof author === 'object' && author !== null) {
    const { name, email } = author as { name?: unknown; email?: unknown };
    if (typeof name !== 'string' || !name.trim()) return { error: 'has no name' };
    return { author: typeof email === 'string' && email ? { name, email } : { name } };
  }
  return { error: 'must be a string or an object' };
};

/**
 * Builds `widget.json` from the widget configuration and `package.json`, and validates it with the
 * rules Vulog applies on publication (`publishedWidgetManifestSchema`).
 *
 * @param config - The widget configuration (`widget.config.ts`).
 * @param packageJson - The parsed `package.json` of the widget.
 * @returns The manifest, defaults applied, as written to `widget.json`.
 * @throws {BoWidgetConfigError} When the configuration is not an object, has an unknown key (also
 * inside `dev`), or the manifest is invalid: one issue per problem, with its path and, for a value
 * taken from `package.json`, where it came from (e.g. `version (from package.json): Must be…`).
 *
 * @example
 * ```ts
 * const manifest = buildManifest({ name: 'Fleet report' }, { name: 'fleet-report', version: '1.0.0' });
 * // { manifestVersion: 1, id: 'fleet-report', version: '1.0.0', runtime: { type: 'webcomponent', entry: 'index.js' }, … }
 * ```
 */
export const buildManifest = (
  config: WidgetConfig,
  packageJson: WidgetPackageJson,
): WidgetManifest => {
  if (typeof config !== 'object' || config === null) {
    throw new BoWidgetConfigError(['(root): the widget configuration must be an object']);
  }
  const unknownKeys = Object.keys(config).filter((key) => !CONFIG_KEYS.includes(key));
  if (unknownKeys.length > 0) {
    throw new BoWidgetConfigError(unknownKeys.map((key) => `${key}: unknown configuration key`));
  }

  const runtime = config.runtime ?? 'webcomponent';
  const issues = devOptionsIssues(config.dev);
  if (runtime === 'iframe' && config.entry !== undefined) {
    issues.push('entry: an iframe widget is built from index.html, remove entry');
  }
  const fromPackage = new Set<string>(['version']);
  let author = config.author;
  if (author === undefined) {
    const parsed = parseAuthor(packageJson.author);
    if (parsed.error) {
      issues.push(`author (from package.json): ${parsed.error}, set author in widget.config.ts`);
    }
    author = parsed.author;
    fromPackage.add('author');
  }
  let description = config.description;
  if (description === undefined && typeof packageJson.description === 'string') {
    description = packageJson.description;
    fromPackage.add('description');
  }
  let id = config.id;
  if (id === undefined) {
    fromPackage.add('id');
    if (typeof packageJson.name === 'string') id = unscoped(packageJson.name);
  }
  const manifest = {
    manifestVersion: 1,
    id,
    name: config.name,
    ...(description === undefined ? {} : { description }),
    version: packageJson.version,
    ...(author === undefined ? {} : { author }),
    ...(config.icon === undefined ? {} : { icon: config.icon }),
    runtime: {
      type: runtime,
      entry: (WIDGET_RUNTIME_ENTRIES as Record<string, string>)[runtime] ?? '',
    },
    protocol: {
      version: PROTOCOL_VERSION,
      ...(config.minBoVersion === undefined ? {} : { minBoVersion: config.minBoVersion }),
    },
    ...(config.menu === undefined ? {} : { menu: config.menu }),
    ...(config.permissions === undefined ? {} : { permissions: config.permissions }),
    ...(config.settings === undefined ? {} : { settings: config.settings }),
  };

  const result = publishedWidgetManifestSchema.safeParse(manifest);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      const field = String(issue.path[0] ?? '');
      // Say where to fix a value taken from package.json.
      const where = fromPackage.has(field)
        ? field === 'id'
          ? ' (from the package.json name, or set id in widget.config.ts)'
          : ' (from package.json)'
        : '';
      issues.push(`${path || '(root)'}${where}: ${issue.message}`);
    }
  }
  if (!result.success || issues.length > 0) throw new BoWidgetConfigError(issues);
  return result.data;
};
