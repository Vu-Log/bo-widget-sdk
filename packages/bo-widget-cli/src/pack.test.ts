import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateWidgetArchive } from './archive.js';
import { packWidget } from './pack.js';

const MANIFEST = {
  manifestVersion: 1,
  id: 'fleet-report',
  name: 'Fleet report',
  version: '1.2.0',
  runtime: { type: 'webcomponent', entry: 'index.js' },
  protocol: { version: 2 },
};

let root: string;
let dist: string;
let out: string;

const write = async (path: string, content: string | Uint8Array): Promise<void> => {
  await mkdir(dirname(join(dist, path)), { recursive: true });
  await writeFile(join(dist, path), content);
};

const writeValidBundle = async (): Promise<void> => {
  await write('widget.json', JSON.stringify(MANIFEST));
  await write('index.js', 'export default class extends HTMLElement {}');
  await write('assets/style.css', 'body { margin: 0 }');
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'bo-widget-cli-'));
  dist = join(root, 'dist');
  out = join(root, 'out');
  await mkdir(dist);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('packWidget', () => {
  it('writes {id}-{version}.zip with the content of the folder at its root', async () => {
    await writeValidBundle();

    const result = await packWidget({ dir: dist, outDir: out });

    expect(result).toMatchObject({ ok: true, file: join(out, 'fleet-report-1.2.0.zip') });
    const archive = validateWidgetArchive(await readFile(join(out, 'fleet-report-1.2.0.zip')));
    expect(archive.ok && archive.files.map(({ path }) => path)).toEqual([
      'assets/style.css',
      'index.js',
      'widget.json',
    ]);
    expect(archive.ok && archive.manifest).toEqual(result.ok && result.manifest);
  });

  it('leaves out the .DS_Store files of macOS', async () => {
    await writeValidBundle();
    await write('.DS_Store', 'x');
    await write('assets/.DS_Store', 'x');

    const result = await packWidget({ dir: dist, outDir: out });

    const archive = result.ok && validateWidgetArchive(await readFile(result.file));
    expect(archive && archive.ok && archive.files.map(({ path }) => path)).not.toContain(
      '.DS_Store',
    );
    expect(archive && archive.ok && archive.files).toHaveLength(3);
  });

  it('gives the same zip when packed twice', async () => {
    await writeValidBundle();

    const first = await packWidget({ dir: dist, outDir: join(root, 'a') });
    const second = await packWidget({ dir: dist, outDir: join(root, 'b') });

    const bytes = async (result: typeof first) => (result.ok ? readFile(result.file) : null);
    expect((await bytes(first))?.equals((await bytes(second)) as Buffer)).toBe(true);
  });

  it('returns the warnings of a bundle that calls customElements.define', async () => {
    await writeValidBundle();
    await write('index.js', 'customElements.define("x-y", class extends HTMLElement {});');

    const result = await packWidget({ dir: dist, outDir: out });

    expect(result.ok).toBe(true);
    expect(result.warnings).toMatchObject([{ code: 'custom-element-define', path: 'index.js' }]);
  });

  it('writes nothing and returns every error when the bundle would be refused', async () => {
    await write('index.js', 'export default 1;');
    await write('notes.txt', 'not allowed');

    const result = await packWidget({ dir: dist, outDir: out });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.map(({ code }) => code)).toEqual([
      'forbidden-extension',
      'manifest-missing',
    ]);
    await expect(readdir(out)).rejects.toThrow(/ENOENT/);
  });

  it('refuses a folder that holds the manifest one level down', async () => {
    await mkdir(join(dist, 'dist'));
    await writeFile(join(dist, 'dist', 'widget.json'), JSON.stringify(MANIFEST));

    const result = await packWidget({ dir: dist, outDir: out });

    expect(!result.ok && result.errors[0].message).toContain('found "dist/widget.json"');
  });

  it('throws when the folder does not exist', async () => {
    await expect(packWidget({ dir: join(root, 'missing'), outDir: out })).rejects.toThrow(/ENOENT/);
  });

  it('throws on a symbolic link, rather than packing what it points to', async () => {
    await writeValidBundle();
    await symlink(join(dist, 'index.js'), join(dist, 'link.js'));

    await expect(packWidget({ dir: dist, outDir: out })).rejects.toThrow(
      'link.js is not a regular file',
    );
  });
});
