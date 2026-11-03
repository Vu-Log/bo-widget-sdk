import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { widgetManifestSchema } from '@vulog/bo-widget-sdk/manifest';
import { build, createLogger, type InlineConfig, type Logger } from 'vite';
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

  it('fails when an iframe widget has no index.html', async () => {
    const root = await project({ 'src/main.ts': ELEMENT_ENTRY });

    await expect(buildWidget(root, { name: 'Report', runtime: 'iframe' })).rejects.toThrow();
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
});

describe('defineWidgetConfig', () => {
  it('returns its argument', () => {
    const config = { name: 'Report' };

    expect(defineWidgetConfig(config)).toBe(config);
  });
});
