import { describe, expect, it } from 'vitest';
import { validateWidgetArchive } from './archive.js';
import { createZip } from './zip.js';

const text = (value: string): Uint8Array => Buffer.from(value);

const MANIFEST = JSON.stringify({
  manifestVersion: 1,
  id: 'fleet-report',
  name: 'Fleet report',
  version: '1.0.0',
  runtime: { type: 'webcomponent', entry: 'index.js' },
  protocol: { version: 2 },
});

describe('createZip', () => {
  it('writes an archive the validator reads back, file by file', () => {
    const files = [
      { path: 'widget.json', data: text(MANIFEST) },
      { path: 'index.js', data: text('export default class extends HTMLElement {}\n'.repeat(50)) },
      { path: 'assets/empty.css', data: new Uint8Array() },
      { path: 'assets/img/logo.png', data: Uint8Array.from([0x89, 0x50, 0x4e, 0x47]) },
    ];

    const result = validateWidgetArchive(createZip(files));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.files.map(({ path, data }) => [path, Buffer.from(data)])).toEqual(
      files.map(({ path, data }) => [path, Buffer.from(data)]),
    );
  });

  it('deflates a compressible file and stores an incompressible one', () => {
    const repeated = text('a'.repeat(10_000));
    const random = Uint8Array.from({ length: 64 }, (_, index) => (index * 151 + 17) % 256);

    const zip = createZip([
      { path: 'a.js', data: repeated },
      { path: 'b.png', data: random },
    ]);

    // Method of each local header: 8 = deflate, 0 = stored.
    expect(zip.readUInt16LE(8)).toBe(8);
    const second = zip.indexOf(Buffer.from('b.png')) - 30;
    expect(zip.readUInt16LE(second + 8)).toBe(0);
    expect(zip.length).toBeLessThan(repeated.length);
  });

  it('gives the same bytes for the same files', () => {
    const files = [
      { path: 'widget.json', data: text(MANIFEST) },
      { path: 'index.js', data: text('export default 1;') },
    ];

    expect(createZip(files).equals(createZip(files))).toBe(true);
  });

  it('writes an empty archive', () => {
    const zip = createZip([]);

    expect(zip.length).toBe(22);
    expect(validateWidgetArchive(zip)).toMatchObject({
      ok: false,
      errors: [{ code: 'manifest-missing' }],
    });
  });

  it('refuses more files than a zip without ZIP64 can hold', () => {
    const files = Array.from({ length: 0x10000 }, (_, index) => ({
      path: `${index}.js`,
      data: new Uint8Array(),
    }));

    expect(() => createZip(files)).toThrow(RangeError);
  });

  it('refuses a path longer than a zip header can hold', () => {
    expect(() => createZip([{ path: 'a'.repeat(0x10000), data: new Uint8Array() }])).toThrow(
      RangeError,
    );
  });
});
