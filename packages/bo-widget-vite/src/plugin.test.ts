import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { widgetManifestSchema } from '@vulog/bo-widget-sdk/manifest';
import {
  build,
  createLogger,
  normalizePath,
  type InlineConfig,
  type Logger,
  type UserConfig,
} from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoWidgetConfigError, type WidgetConfig } from './manifest.js';
import { boWidget, defineWidgetConfig, MANIFEST_FILE } from './plugin.js';

const roots: string[] = [];

/** Writes a widget project in a temporary folder. */
const project = async (files: Record<string, string>): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'bo-widget-vite-'));
  roots.push(root);
  const all = {
    'package.json': JSON.stringify({ name: '@acme/fleet-report', version: '1.2.3' }),
    ...files,
  };
  for (const [path, content] of Object.entries(all)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
  return root;
};

const ELEMENT_ENTRY = `
export default class FleetReport extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).textContent = 'Fleet report';
  }
}
`;

const silentLogger = (): Logger & { warn: ReturnType<typeof vi.fn> } => {
  const logger = createLogger('silent');
  return Object.assign(logger, { warn: vi.fn() });
};

const buildWidget = (root: string, config: WidgetConfig, extra: InlineConfig = {}) =>
  build({
    root,
    configFile: false,
    logLevel: 'silent',
    customLogger: silentLogger(),
    plugins: [boWidget(config)],
    ...extra,
  });

const readManifest = async (root: string): Promise<unknown> =>
  JSON.parse(await readFile(join(root, 'dist', MANIFEST_FILE), 'utf8'));

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('boWidget build', () => {
  it('builds a Web Component as index.js, whose default export is the class, with widget.json', async () => {
    const root = await project({ 'src/main.ts': ELEMENT_ENTRY });

    await buildWidget(root, { name: 'Fleet report', permissions: ['apiInfo'] });

    const manifest = await readManifest(root);
    expect(widgetManifestSchema.parse(manifest)).toMatchObject({
      id: 'fleet-report',
      version: '1.2.3',
      runtime: { type: 'webcomponent', entry: 'index.js' },
      permissions: ['apiInfo'],
    });
    const code = await readFile(join(root, 'dist/index.js'), 'utf8');
    expect(code).not.toMatch(/customElements\.define/);
    // The module runs in Node: importing it needs `HTMLElement`.
    vi.stubGlobal('HTMLElement', function HTMLElement() {});
    try {
      const module = (await import(pathToFileURL(join(root, 'dist/index.js')).href)) as {
        default: unknown;
      };
      expect(typeof module.default).toBe('function');
      expect((module.default as { prototype: unknown }).prototype).toBeInstanceOf(HTMLElement);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('uses the configured entry', async () => {
    const root = await project({ 'src/widget.js': ELEMENT_ENTRY });

    await buildWidget(root, { name: 'Report', entry: 'src/widget.js' });

    expect(existsSync(join(root, 'dist/index.js'))).toBe(true);
  });

  it('builds an iframe widget as index.html with relative URLs', async () => {
    const root = await project({
      'index.html':
        '<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>',
      'src/main.ts': "document.body.append('Report');",
    });

    await buildWidget(root, { name: 'Report', runtime: 'iframe' });

    const html = await readFile(join(root, 'dist/index.html'), 'utf8');
    expect(html).toMatch(/src="\.\/assets\/[^"]+\.js"/);
    expect(await readManifest(root)).toMatchObject({
      runtime: { type: 'iframe', entry: 'index.html' },
    });
  });

  it('replaces another base with ./ and warns', async () => {
    const root = await project({
      'index.html':
        '<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>',
      'src/main.ts': "document.body.append('Report');",
    });
    const customLogger = silentLogger();

    await buildWidget(
      root,
      { name: 'Report', runtime: 'iframe' },
      { base: '/widgets/', customLogger },
    );

    expect(await readFile(join(root, 'dist/index.html'), 'utf8')).toMatch(/src="\.\/assets\//);
    expect(customLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('base "/widgets/" replaced by "./"'),
    );
  });

  it('copies the icon from public/', async () => {
    const root = await project({ 'src/main.ts': ELEMENT_ENTRY, 'public/icon.svg': '<svg/>' });

    await buildWidget(root, { name: 'Report', icon: 'icon.svg' });

    expect(existsSync(join(root, 'dist/icon.svg'))).toBe(true);
    expect(await readManifest(root)).toMatchObject({ icon: 'icon.svg' });
  });

  it('fails when the icon is not in the bundle', async () => {
    const root = await project({ 'src/main.ts': ELEMENT_ENTRY });

    await expect(buildWidget(root, { name: 'Report', icon: 'icon.svg' })).rejects.toThrow(
      /icon "icon\.svg" is not in the bundle/,
    );
  });

  it('fails when the entry has no default export', async () => {
    const root = await project({
      'src/main.ts': 'export class FleetReport extends HTMLElement {}',
    });

    await expect(buildWidget(root, { name: 'Report' })).rejects.toThrow(
      /src\/main\.ts has no default export/,
    );
  });

  it('fails when an iframe widget is not built as index.html', async () => {
    const root = await project({
      'widget.html':
        '<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>',
      'src/main.ts': "document.body.append('Report');",
    });

    await expect(
      buildWidget(
        root,
        { name: 'Report', runtime: 'iframe' },
        { build: { rollupOptions: { input: join(root, 'widget.html') } } },
      ),
    ).rejects.toThrow(/the build did not produce index\.html/);
  });

  it('replaces process.env.NODE_ENV in a Web Component, whose dependencies are bundled', async () => {
    // Vitest sets NODE_ENV to "test"; unset, the mode of the build applies, as in an app build.
    vi.stubEnv('NODE_ENV', '');
    const root = await project({
      'src/main.ts': `${ELEMENT_ENTRY}\nexport const env = process.env.NODE_ENV;\n`,
    });

    await buildWidget(root, { name: 'Report' });

    const code = await readFile(join(root, 'dist/index.js'), 'utf8');
    expect(code).not.toContain('process.env');
    // Minified: the string may be written with backquotes.
    expect(code).toMatch(/["`]production["`]/);
  });

  it('keeps a process.env.NODE_ENV the project defines', async () => {
    const root = await project({
      'src/main.ts': `${ELEMENT_ENTRY}\nexport const env = process.env.NODE_ENV;\n`,
    });

    await buildWidget(
      root,
      { name: 'Report' },
      { define: { 'process.env.NODE_ENV': JSON.stringify('staging') } },
    );

    expect(await readFile(join(root, 'dist/index.js'), 'utf8')).toMatch(/["`]staging["`]/);
  });

  it('fails on an invalid configuration, before building', async () => {
    const root = await project({ 'src/main.ts': ELEMENT_ENTRY });

    const failure = buildWidget(root, { name: 'Report', permissions: ['camera' as 'notify'] });

    await expect(failure).rejects.toBeInstanceOf(BoWidgetConfigError);
    await expect(failure).rejects.toThrow(/permissions\.0: /);
    expect(existsSync(join(root, 'dist'))).toBe(false);
  });

  it('fails without package.json', async () => {
    const root = await project({ 'src/main.ts': ELEMENT_ENTRY });
    await rm(join(root, 'package.json'));

    await expect(buildWidget(root, { name: 'Report' })).rejects.toThrow(/package\.json not found/);
  });

  it.each(['null', '[]', '"fleet-report"'])(
    'fails on a package.json that is %s',
    async (content) => {
      const root = await project({ 'src/main.ts': ELEMENT_ENTRY, 'package.json': content });

      await expect(buildWidget(root, { name: 'Report' })).rejects.toThrow(
        /must contain a JSON object/,
      );
    },
  );

  it('fails on an unreadable package.json', async () => {
    const root = await project({ 'src/main.ts': ELEMENT_ENTRY, 'package.json': '{ nope' });

    await expect(buildWidget(root, { name: 'Report' })).rejects.toThrow(/is not valid JSON/);
  });

  it('warns on customElements.define, with the module and the line', async () => {
    const root = await project({
      'src/main.ts': `${ELEMENT_ENTRY}\ncustomElements.define('fleet-report', FleetReport);\n`,
    });
    const customLogger = silentLogger();

    await buildWidget(root, { name: 'Report' }, { customLogger });

    const warnings = customLogger.warn.mock.calls.map(([message]) => String(message));
    expect(warnings).toContainEqual(
      expect.stringMatching(/src\/main\.ts:8 calls customElements\.define/),
    );
  });

  it('still warns on customElements.define in a build in the test mode', async () => {
    const root = await project({
      'src/main.ts': `${ELEMENT_ENTRY}\ncustomElements.define('fleet-report', FleetReport);\n`,
    });
    const customLogger = silentLogger();

    await buildWidget(root, { name: 'Report' }, { customLogger, mode: 'test' });

    const warnings = customLogger.warn.mock.calls.map(([message]) => String(message));
    expect(warnings).toContainEqual(expect.stringMatching(/calls customElements\.define/));
  });
});

/** An entry that loads a part of the widget on demand: a chunk next to `index.js`. */
const LAZY_ENTRY = `
export default class FleetReport extends HTMLElement {
  connectedCallback() {
    const root = this.attachShadow({ mode: 'open' });
    void import('./details.ts').then((details) => details.render(root));
  }
}
`;
const LAZY_MODULE = `
export const render = (root: ShadowRoot) => {
  const message = 'Fleet details';
  root.textContent = message;
};
`;

/** The JavaScript files of `dist/`, by name (`.mjs` chunks without `"type": "module"`). */
const builtScripts = async (root: string): Promise<Map<string, string>> => {
  const scripts = new Map<string, string>();
  for (const file of await readdir(join(root, 'dist'), { recursive: true })) {
    if (/\.m?js$/.test(file)) scripts.set(file, await readFile(join(root, 'dist', file), 'utf8'));
  }
  return scripts;
};

/** Whitespace a minifier removes: an indented line. */
const INDENTED_LINE = /\n[\t ]+\S/;

describe('boWidget minification', () => {
  it('minifies a Web Component and its chunks, whitespace included, by default', async () => {
    const root = await project({ 'src/main.ts': LAZY_ENTRY, 'src/details.ts': LAZY_MODULE });

    await buildWidget(root, { name: 'Report' });

    const scripts = await builtScripts(root);
    expect(scripts.size).toBe(2);
    for (const code of scripts.values()) {
      expect(code).not.toMatch(INDENTED_LINE);
      expect(code).not.toMatch(/^\/\//m);
    }
    const chunk = [...scripts.keys()].find((file) => file !== 'index.js');
    expect(scripts.get('index.js')).toContain(`import(\`./${chunk}\`)`);
  });

  it.each<[string, NonNullable<InlineConfig['build']>]>([
    ['build.minify: false', { minify: false }],
    ['rolldownOptions.output.minify: false', { rolldownOptions: { output: { minify: false } } }],
    ['rollupOptions.output.minify: false', { rollupOptions: { output: { minify: false } } }],
  ])('keeps the whitespace with %s', async (_name, buildOptions) => {
    const root = await project({ 'src/main.ts': LAZY_ENTRY, 'src/details.ts': LAZY_MODULE });

    await buildWidget(root, { name: 'Report' }, { build: buildOptions });

    for (const code of (await builtScripts(root)).values()) expect(code).toMatch(INDENTED_LINE);
  });
});

describe('boWidget config', () => {
  type Env = { command: 'build' | 'serve'; mode: string };

  /** What the plugin adds to the configuration of the project. */
  const configOf = (
    widget: WidgetConfig,
    user: UserConfig = {},
    env: Env = { command: 'build', mode: 'production' },
  ): UserConfig =>
    (boWidget(widget).config as (config: UserConfig, env: Env) => UserConfig)(user, env);

  it.each<[string, NonNullable<UserConfig['build']>]>([
    ['an empty build', {}],
    ['build.minify: true', { minify: true }],
    ["build.minify: 'oxc'", { minify: 'oxc' }],
    ['another output option', { rolldownOptions: { output: { chunkFileNames: 'a-[hash].js' } } }],
  ])('minifies a Web Component build fully with %s', (_name, buildOptions) => {
    const config = configOf({ name: 'Report' }, { build: buildOptions });

    expect(config.build?.rolldownOptions).toEqual({ output: { minify: true } });
  });

  it.each<[string, NonNullable<UserConfig['build']>]>([
    ['build.minify: false', { minify: false }],
    ["build.minify: 'terser'", { minify: 'terser' }],
    ["build.minify: 'esbuild'", { minify: 'esbuild' }],
    ['build.minify: "false" (command line)', { minify: 'false' as unknown as false }],
    ['its own output.minify', { rolldownOptions: { output: { minify: 'dce-only' } } }],
    ['its own output.minify, under rollupOptions', { rollupOptions: { output: { minify: {} } } }],
    ['several outputs', { rolldownOptions: { output: [{}, {}] } }],
  ])('leaves the minifier of the project with %s', (_name, buildOptions) => {
    const config = configOf({ name: 'Report' }, { build: buildOptions });

    expect(config.build?.lib).toBeDefined();
    expect(config.build?.rolldownOptions).toBeUndefined();
  });

  it('minifies a Web Component build fully without build options', () => {
    expect(configOf({ name: 'Report' }).build?.rolldownOptions).toEqual({
      output: { minify: true },
    });
  });

  it('leaves an iframe build and the dev server to Vite', () => {
    expect(configOf({ name: 'Report', runtime: 'iframe' }).build).toBeUndefined();
    expect(
      configOf({ name: 'Report' }, {}, { command: 'serve', mode: 'development' }).build,
    ).toBeUndefined();
  });
});

describe('boWidget transform', () => {
  type Hook = (this: { warn: (message: string) => void }, code: string, id: string) => unknown;

  /** The plugin, configured as the dev server does it, with its transform hook. */
  const servedPlugin = async (mode = 'development') => {
    const root = await project({ 'src/main.ts': ELEMENT_ENTRY });
    const plugin = boWidget({ name: 'Report' });
    (plugin.config as (config: object, env: object) => unknown)(
      { root },
      { command: 'serve', mode },
    );
    (plugin.configResolved as (config: object) => void)({ root, mode, command: 'serve' });
    const warn = vi.fn();
    const transform = (code: string, id: string) =>
      (plugin.transform as { handler: Hook }).handler.call({ warn }, code, id);
    return { root, warn, transform };
  };

  it('does not warn on the customElements.define of the fake back office, whatever its query', async () => {
    const { root, warn, transform } = await servedPlugin();
    const host = normalizePath(fileURLToPath(new URL('./dev/host.ts', import.meta.url)));
    const code = 'customElements.define(tag, Widget);';

    // Vite gives the modules of node_modules a version query.
    transform(code, `${host}?v=0123abcd`);
    transform(code, host);
    transform(code, normalizePath(join(root, 'src/main.ts')));

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^src\/main\.ts:1 calls/));
  });

  it('does not warn under Vitest, whose tests register the widget to mount it', async () => {
    const { root, warn, transform } = await servedPlugin('test');

    transform('customElements.define(tag, Widget);', normalizePath(join(root, 'src/main.test.ts')));

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('defineWidgetConfig', () => {
  it('returns its argument', () => {
    const config = { name: 'Report' };

    expect(defineWidgetConfig(config)).toBe(config);
  });
});
