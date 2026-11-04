import { crc32, deflateRawSync } from 'node:zlib';
import { WIDGET_DESCRIPTION_MAX_LENGTH } from '@vulog/bo-widget-sdk/manifest';
import { describe, expect, it } from 'vitest';

import {
  WIDGET_ARCHIVE_LIMITS,
  type WidgetArchiveLimits,
  type WidgetArchiveResult,
  validateWidgetArchive,
} from './archive.js';

interface TestEntry {
  name: string;
  content?: string | Buffer;
  /** 0 = stored, 8 = deflate (default). */
  method?: number;
  flags?: number;
  // Overrides of the values written in both headers, to forge broken or lying archives.
  crc?: number;
  uncompressedSize?: number;
  localHeaderOffset?: number;
  /** Name written in the local header, when it must differ from the central one. */
  localName?: string;
  /**
   * Writes the entry as `zip`, Finder or 7-Zip do: different extra fields in
   * the local and central headers, and a data descriptor (flag bit 3, so the
   * local header has a zero CRC and zero sizes).
   */
  likeRealTools?: boolean;
}

/** An extra field of `size` bytes (id 0x5455, extended timestamp, as `zip` writes it). */
const extraField = (size: number): Buffer => {
  const extra = Buffer.alloc(size);
  extra.writeUInt16LE(0x5455, 0);
  extra.writeUInt16LE(size - 4, 2);
  return extra;
};

/**
 * Builds a zip in memory, so each test shows the archive it feeds the
 * validator instead of relying on binary fixtures.
 */
const buildZip = (
  entries: TestEntry[],
  { comment = '' }: { comment?: string | Buffer } = {},
): Buffer => {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const raw = Buffer.from(entry.content ?? '');
    const method = entry.method ?? 8;
    const data = method === 8 ? deflateRawSync(raw) : raw;
    const name = Buffer.from(entry.name);
    const localName = Buffer.from(entry.localName ?? entry.name);
    const crc = entry.crc ?? crc32(raw);
    const size = entry.uncompressedSize ?? raw.length;
    const real = entry.likeRealTools ?? false;
    const flags = (entry.flags ?? 0) | (real ? 0x8 : 0);
    const localExtra = real ? extraField(28) : Buffer.alloc(0);
    const centralExtra = real ? extraField(24) : Buffer.alloc(0);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(real ? 0 : crc, 14);
    local.writeUInt32LE(real ? 0 : data.length, 18);
    local.writeUInt32LE(real ? 0 : size, 22);
    local.writeUInt16LE(localName.length, 26);
    local.writeUInt16LE(localExtra.length, 28);
    const descriptor = Buffer.alloc(real ? 16 : 0);
    if (real) {
      descriptor.writeUInt32LE(0x08074b50, 0);
      descriptor.writeUInt32LE(crc, 4);
      descriptor.writeUInt32LE(data.length, 8);
      descriptor.writeUInt32LE(size, 12);
    }
    locals.push(local, localName, localExtra, data, descriptor);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(centralExtra.length, 30);
    central.writeUInt32LE(entry.localHeaderOffset ?? offset, 42);
    centrals.push(central, name, centralExtra);

    offset += local.length + localName.length + localExtra.length + data.length + descriptor.length;
  }
  const directory = Buffer.concat(centrals);
  const commentBytes = Buffer.from(comment);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(commentBytes.length, 20);
  return Buffer.concat([...locals, directory, eocd, commentBytes]);
};

const MANIFEST = {
  manifestVersion: 1,
  id: 'fleet-report',
  name: 'Fleet report',
  version: '1.4.2',
  runtime: { type: 'webcomponent', entry: 'index.js' },
  protocol: { version: 2 },
};

const IFRAME_MANIFEST = { ...MANIFEST, runtime: { type: 'iframe', entry: 'index.html' } };

const manifestEntry = (manifest: unknown = MANIFEST): TestEntry => ({
  name: 'widget.json',
  content: JSON.stringify(manifest),
});

const INDEX_JS: TestEntry = {
  name: 'index.js',
  content: 'export default class extends HTMLElement {}',
};

const validEntries = (): TestEntry[] => [
  manifestEntry(),
  INDEX_JS,
  { name: 'assets/', content: '' },
  { name: 'assets/style.css', content: 'body { margin: 0 }', method: 0 },
];

const errorsOf = (result: WidgetArchiveResult) => (result.ok ? [] : result.errors);
const codesOf = (result: WidgetArchiveResult) => errorsOf(result).map((issue) => issue.code);
const messagesOf = (result: WidgetArchiveResult) => errorsOf(result).map((issue) => issue.message);

describe('validateWidgetArchive', () => {
  describe('valid archives', () => {
    it('returns the parsed manifest and the files, folders left out', () => {
      const result = validateWidgetArchive(buildZip(validEntries()));

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.manifest).toMatchObject({
        id: 'fleet-report',
        version: '1.4.2',
        permissions: [],
      });
      expect(result.files.map((file) => file.path)).toEqual([
        'widget.json',
        'index.js',
        'assets/style.css',
      ]);
      expect(result.files.map((file) => file.data.toString())).toEqual([
        JSON.stringify(MANIFEST),
        'export default class extends HTMLElement {}',
        'body { margin: 0 }',
      ]);
      expect(result.warnings).toEqual([]);
    });

    it('accepts an iframe widget whose entry is index.html', () => {
      const result = validateWidgetArchive(
        buildZip([
          manifestEntry(IFRAME_MANIFEST),
          { name: 'index.html', content: '<!doctype html>' },
        ]),
      );

      expect(result.ok).toBe(true);
    });

    it('reads an archive written like real tools do (extra fields, data descriptors)', () => {
      const entries = validEntries().map((entry) => ({ ...entry, likeRealTools: true }));
      const result = validateWidgetArchive(buildZip(entries));

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.files.map((file) => file.data.toString())).toEqual([
        JSON.stringify(MANIFEST),
        'export default class extends HTMLElement {}',
        'body { margin: 0 }',
      ]);
    });

    it('returns file contents that do not share memory with the archive', () => {
      const zip = buildZip(validEntries());
      const result = validateWidgetArchive(zip);
      zip.fill(0);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.files[2]?.data.toString()).toBe('body { margin: 0 }');
    });

    it('accepts an empty file and an archive comment', () => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'empty.json', content: '' }], {
          comment: 'built by the SDK',
        }),
      );

      expect(result.ok).toBe(true);
    });
  });

  describe('limits', () => {
    it('uses the defaults: 10 MB archive, 50 MB decompressed, 1000 entries', () => {
      expect(WIDGET_ARCHIVE_LIMITS).toEqual({
        maxArchiveBytes: 10 * 1024 * 1024,
        maxUncompressedBytes: 50 * 1024 * 1024,
        maxEntries: 1000,
      });
    });

    it.each([
      ['undefined', { maxEntries: undefined }],
      ['NaN', { maxUncompressedBytes: Number.NaN }],
      ['zero', { maxArchiveBytes: 0 }],
      ['a negative value', { maxEntries: -1 }],
      ['a fraction', { maxEntries: 1.5 }],
    ])('throws on a limit set to %s, instead of disabling the check', (_label, limits) => {
      // A plain JavaScript caller (or an unset environment variable) can pass undefined.
      const loose = limits as Partial<WidgetArchiveLimits>;
      expect(() => validateWidgetArchive(buildZip(validEntries()), loose)).toThrow(TypeError);
    });

    it('throws on an unknown limit, instead of silently keeping the default', () => {
      const misspelt = { maxArchiveSize: 1 } as Partial<WidgetArchiveLimits>;

      expect(() => validateWidgetArchive(buildZip(validEntries()), misspelt)).toThrow(
        'Unknown widget archive limit: maxArchiveSize',
      );
    });
  });

  describe('archive size', () => {
    it('refuses an archive above the maximum, before reading it', () => {
      const result = validateWidgetArchive(Buffer.alloc(WIDGET_ARCHIVE_LIMITS.maxArchiveBytes + 1));

      expect(errorsOf(result)).toEqual([
        {
          code: 'archive-too-large',
          message: 'The archive is 10485761 bytes, the maximum is 10485760 bytes',
        },
      ]);
    });

    it('shows the sizes in MB when they differ at that precision', () => {
      const result = validateWidgetArchive(Buffer.alloc(3 * 1024 * 1024), {
        maxArchiveBytes: 1024 * 1024,
      });

      expect(messagesOf(result)).toEqual(['The archive is 3 MB, the maximum is 1 MB']);
    });

    it('accepts an archive at exactly the maximum', () => {
      const zip = buildZip(validEntries());

      expect(validateWidgetArchive(zip, { maxArchiveBytes: zip.length }).ok).toBe(true);
      expect(codesOf(validateWidgetArchive(zip, { maxArchiveBytes: zip.length - 1 }))).toEqual([
        'archive-too-large',
      ]);
    });
  });

  describe('invalid archives', () => {
    it.each([
      ['an empty buffer', Buffer.alloc(0)],
      ['a text file', Buffer.from('not a zip at all, just some text that is long enough')],
    ])('refuses %s', (_label, archive) => {
      expect(errorsOf(validateWidgetArchive(archive))).toEqual([
        { code: 'invalid-archive', message: 'The file is not a zip archive' },
      ]);
    });

    it('refuses an archive cut inside its end record', () => {
      const zip = buildZip(validEntries());

      expect(messagesOf(validateWidgetArchive(zip.subarray(0, zip.length - 10)))).toEqual([
        'The file is not a zip archive',
      ]);
    });

    it('is not misled by an end-record signature inside the archive comment', () => {
      const comment = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x05, 0x06]),
        Buffer.alloc(30, 0x41),
      ]);

      expect(validateWidgetArchive(buildZip(validEntries(), { comment })).ok).toBe(true);
    });

    it('refuses a central directory with fewer entries than announced', () => {
      const zip = buildZip(validEntries());
      zip.writeUInt16LE(5, zip.length - 22 + 8);
      zip.writeUInt16LE(5, zip.length - 22 + 10);

      expect(messagesOf(validateWidgetArchive(zip))).toEqual([
        'The zip central directory is truncated',
      ]);
    });

    it('refuses a central directory with more entries than announced', () => {
      const zip = buildZip(validEntries());
      zip.writeUInt16LE(3, zip.length - 22 + 8);
      zip.writeUInt16LE(3, zip.length - 22 + 10);

      expect(messagesOf(validateWidgetArchive(zip))).toEqual([
        'The zip central directory has more entries than announced',
      ]);
    });

    it('refuses a corrupted central directory header', () => {
      const zip = buildZip(validEntries());
      zip.writeUInt32LE(0xdeadbeef, zip.readUInt32LE(zip.length - 22 + 16));

      expect(messagesOf(validateWidgetArchive(zip))).toEqual([
        'The zip central directory is corrupted',
      ]);
    });

    it('refuses an entry whose local header is out of bounds', () => {
      const result = validateWidgetArchive(
        buildZip([
          ...validEntries(),
          { name: 'lib.js', content: 'x', localHeaderOffset: 0xfffffff0 },
        ]),
      );

      expect(messagesOf(result)).toEqual(['"lib.js" is out of bounds']);
    });

    it('refuses an entry whose local header is corrupted', () => {
      const zip = buildZip(validEntries());
      zip.writeUInt32LE(0xdeadbeef, 0);

      expect(messagesOf(validateWidgetArchive(zip))).toEqual([
        '"widget.json" has a corrupted header',
      ]);
    });

    it('refuses an entry whose data runs past the end of the archive', () => {
      const zip = buildZip(validEntries());
      const firstCentralHeader = zip.readUInt32LE(zip.length - 22 + 16);
      zip.writeUInt32LE(zip.length, firstCentralHeader + 20);

      expect(messagesOf(validateWidgetArchive(zip))).toEqual(['"widget.json" is truncated']);
    });

    it('refuses corrupted deflate data', () => {
      const zip = buildZip(validEntries());
      const dataStart = 30 + 'widget.json'.length;
      zip.fill(0xff, dataStart, dataStart + 4);

      expect(messagesOf(validateWidgetArchive(zip))).toEqual([
        '"widget.json" cannot be decompressed or is larger than declared',
      ]);
    });

    it('refuses a folder entry that carries data', () => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'lib/', content: 'x' }]),
      );

      expect(messagesOf(result)).toEqual(['The folder "lib" contains data']);
    });

    it('refuses an archive whose central directory points out of bounds', () => {
      const zip = buildZip(validEntries());
      zip.writeUInt32LE(zip.length, zip.length - 22 + 16);

      expect(codesOf(validateWidgetArchive(zip))).toEqual(['invalid-archive']);
    });

    it('refuses a ZIP64 archive', () => {
      const zip = buildZip(validEntries());
      zip.writeUInt16LE(0xffff, zip.length - 22 + 10);

      expect(messagesOf(validateWidgetArchive(zip))).toEqual(['ZIP64 archives are not supported']);
    });

    it('refuses a multi-part archive', () => {
      const zip = buildZip(validEntries());
      zip.writeUInt16LE(1, zip.length - 22 + 4);

      expect(messagesOf(validateWidgetArchive(zip))).toEqual([
        'Multi-part archives are not supported',
      ]);
    });

    it('refuses an encrypted entry', () => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'secret.js', flags: 0x1 }]),
      );

      expect(errorsOf(result)).toEqual([
        { code: 'invalid-archive', message: '"secret.js" is encrypted' },
      ]);
    });

    it('refuses an unsupported compression method', () => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'lib.js', method: 12 }]),
      );

      expect(messagesOf(result)).toEqual(['"lib.js" uses an unsupported compression method (12)']);
    });

    it('refuses a CRC mismatch', () => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'lib.js', content: 'x', crc: 1 }]),
      );

      expect(messagesOf(result)).toEqual(['"lib.js" is corrupted (CRC mismatch)']);
    });

    it('refuses an entry smaller than declared', () => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'lib.js', content: 'abc', uncompressedSize: 10 }]),
      );

      expect(messagesOf(result)).toEqual(['"lib.js" does not have its declared size']);
    });

    it('refuses an entry whose local header names another file', () => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'lib.js', content: 'x', localName: 'other.js' }]),
      );

      expect(messagesOf(result)).toEqual(['"lib.js" has inconsistent headers']);
    });
  });

  describe('zip bombs', () => {
    it('refuses an archive with too many entries, before decompressing anything', () => {
      const entries = Array.from({ length: 4 }, (_, index) => ({
        name: `f${index}.js`,
        content: 'x',
      }));

      expect(errorsOf(validateWidgetArchive(buildZip(entries), { maxEntries: 3 }))).toEqual([
        { code: 'too-many-files', message: 'The archive contains 4 entries, the maximum is 3' },
      ]);
    });

    it('accepts exactly the maximum number of entries, folders included', () => {
      const zip = buildZip(validEntries());

      expect(validateWidgetArchive(zip, { maxEntries: 4 }).ok).toBe(true);
      expect(codesOf(validateWidgetArchive(zip, { maxEntries: 3 }))).toEqual(['too-many-files']);
    });

    it('refuses an archive whose declared decompressed size is above the maximum', () => {
      // 60 MB of zeros deflates to about 60 KB: a small upload, a big expansion.
      const bomb = { name: 'bomb.js', content: Buffer.alloc(60 * 1024 * 1024) };
      const zip = buildZip([manifestEntry(), bomb]);

      expect(zip.length).toBeLessThan(WIDGET_ARCHIVE_LIMITS.maxArchiveBytes);
      expect(errorsOf(validateWidgetArchive(zip))).toEqual([
        { code: 'zip-bomb', message: 'The archive decompresses to 60 MB, the maximum is 50 MB' },
      ]);
    });

    it('stops inflating an entry that lies about its size', () => {
      const liar = {
        name: 'bomb.js',
        content: Buffer.alloc(5 * 1024 * 1024),
        uncompressedSize: 100,
      };

      expect(errorsOf(validateWidgetArchive(buildZip([...validEntries(), liar])))).toEqual([
        {
          code: 'invalid-archive',
          message: '"bomb.js" cannot be decompressed or is larger than declared',
        },
      ]);
    });

    it('refuses an entry that lies about a zero size', () => {
      const liar = { name: 'bomb.js', content: 'not empty', uncompressedSize: 0 };

      expect(codesOf(validateWidgetArchive(buildZip([...validEntries(), liar])))).toEqual([
        'invalid-archive',
      ]);
    });

    it('accepts a decompressed size at exactly the maximum', () => {
      const zip = buildZip(validEntries());
      const total = validEntries().reduce(
        (sum, entry) => sum + Buffer.from(entry.content ?? '').length,
        0,
      );

      expect(validateWidgetArchive(zip, { maxUncompressedBytes: total }).ok).toBe(true);
      expect(codesOf(validateWidgetArchive(zip, { maxUncompressedBytes: total - 1 }))).toEqual([
        'zip-bomb',
      ]);
    });
  });

  describe('paths and extensions', () => {
    it.each([
      '../evil.js',
      'assets/../../evil.js',
      '/etc/evil.js',
      'assets\\evil.js',
      'a//b.js',
      '',
    ])('refuses the unsafe path %j', (name) => {
      const result = validateWidgetArchive(buildZip([...validEntries(), { name, content: 'x' }]));

      expect(errorsOf(result)).toEqual([
        {
          code: 'unsafe-path',
          path: name,
          message: `"${name}" is not a safe relative path: only letters, digits, ".", "_", "-" and "/" are allowed, without a leading "/" and without empty, "." or ".." segments`,
        },
      ]);
    });

    it('refuses an unsafe folder entry', () => {
      const result = validateWidgetArchive(buildZip([...validEntries(), { name: '../' }]));

      expect(errorsOf(result)).toMatchObject([{ code: 'unsafe-path', path: '..' }]);
    });

    it.each(['run.sh', 'Makefile', 'index.JS', 'photo.jpeg', '.env'])(
      'refuses the forbidden extension of %j',
      (name) => {
        const result = validateWidgetArchive(buildZip([...validEntries(), { name, content: 'x' }]));

        expect(errorsOf(result)).toEqual([
          {
            code: 'forbidden-extension',
            path: name,
            message: `"${name}" has a forbidden extension; allowed: js, mjs, css, html, json, svg, png, jpg, webp, woff2, map`,
          },
        ]);
      },
    );

    it('refuses a file that appears twice', () => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'index.js', content: 'x' }]),
      );

      expect(errorsOf(result)).toEqual([
        {
          code: 'duplicate-path',
          path: 'index.js',
          message: '"index.js" appears more than once in the archive',
        },
      ]);
    });

    it('refuses a file and a folder with the same name', () => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'lib.js', content: 'x' }, { name: 'lib.js/' }]),
      );

      expect(errorsOf(result)).toMatchObject([{ code: 'duplicate-path', path: 'lib.js' }]);
    });

    it('skips the macOS metadata added by Finder', () => {
      const result = validateWidgetArchive(
        buildZip([
          ...validEntries(),
          { name: '.DS_Store', content: 'x' },
          { name: 'assets/.DS_Store', content: 'x' },
          { name: '__MACOSX/' },
          { name: '__MACOSX/._index.js', content: 'x' },
        ]),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.files.map((file) => file.path)).toEqual([
        'widget.json',
        'index.js',
        'assets/style.css',
      ]);
    });

    it('reports every path error together with the manifest errors', () => {
      const result = validateWidgetArchive(
        buildZip([
          { name: 'index.js', content: 'x' },
          { name: '../a.js', content: 'x' },
          { name: 'b.exe', content: 'x' },
        ]),
      );

      expect(codesOf(result)).toEqual(['unsafe-path', 'forbidden-extension', 'manifest-missing']);
    });
  });

  describe('manifest', () => {
    it('refuses an archive without widget.json', () => {
      const result = validateWidgetArchive(buildZip([INDEX_JS]));

      expect(errorsOf(result)).toEqual([
        { code: 'manifest-missing', message: 'widget.json is missing at the root of the archive' },
      ]);
    });

    it('tells where widget.json was found when it is in a folder', () => {
      const result = validateWidgetArchive(
        buildZip([{ name: 'dist/widget.json', content: JSON.stringify(MANIFEST) }, INDEX_JS]),
      );

      expect(errorsOf(result)).toEqual([
        {
          code: 'manifest-missing',
          message:
            'widget.json must be at the root of the archive, found "dist/widget.json": zip the content of the folder, not the folder itself',
        },
      ]);
    });

    it('accepts a widget.json that starts with a UTF-8 BOM', () => {
      const withBom = { name: 'widget.json', content: `\uFEFF${JSON.stringify(MANIFEST)}` };

      expect(validateWidgetArchive(buildZip([withBom, INDEX_JS])).ok).toBe(true);
    });

    it('refuses a widget.json that is not JSON', () => {
      const result = validateWidgetArchive(
        buildZip([{ name: 'widget.json', content: '{ id: ' }, INDEX_JS]),
      );

      expect(errorsOf(result)).toMatchObject([
        {
          code: 'manifest-invalid',
          path: 'widget.json',
          message: expect.stringMatching(/^widget\.json is not valid JSON: /),
        },
      ]);
    });

    it('reports each schema error with its field', () => {
      const result = validateWidgetArchive(
        buildZip([manifestEntry({ ...MANIFEST, id: 'Fleet Report', version: 'v1' }), INDEX_JS]),
      );

      const errors = errorsOf(result);
      expect(errors.map((issue) => issue.code)).toEqual(['manifest-invalid', 'manifest-invalid']);
      expect(errors.map((issue) => issue.message)).toEqual([
        expect.stringMatching(/^widget\.json: id: /),
        expect.stringMatching(/^widget\.json: version: /),
      ]);
    });

    it('reports a root-level schema error without a field prefix', () => {
      const result = validateWidgetArchive(buildZip([manifestEntry([]), INDEX_JS]));

      expect(messagesOf(result)).toEqual([
        'widget.json: Invalid input: expected object, received array',
      ]);
    });

    describe('description', () => {
      const publish = (description: unknown) =>
        validateWidgetArchive(buildZip([manifestEntry({ ...MANIFEST, description }), INDEX_JS]));

      it('accepts a manifest without description', () => {
        const result = validateWidgetArchive(buildZip([manifestEntry(), INDEX_JS]));

        expect(result.ok && result.manifest.description).toBeUndefined();
      });

      it('accepts and keeps a Markdown description as written', () => {
        const description =
          '# Fleet report\n\nShows the **fleet** vehicles:\n\n- list\n- [docs](https://vulog.com)\n';

        const result = publish(description);

        expect(result.ok && result.manifest.description).toBe(description);
      });

      it('accepts raw HTML, which a consumer must not render ', () => {
        expect(publish('<script>alert(1)</script> <b>bold</b>').ok).toBe(true);
      });

      it(`accepts ${WIDGET_DESCRIPTION_MAX_LENGTH} characters`, () => {
        expect(publish('a'.repeat(WIDGET_DESCRIPTION_MAX_LENGTH)).ok).toBe(true);
      });

      it(`refuses ${WIDGET_DESCRIPTION_MAX_LENGTH + 1} characters, naming description`, () => {
        expect(errorsOf(publish('a'.repeat(WIDGET_DESCRIPTION_MAX_LENGTH + 1)))).toEqual([
          {
            code: 'manifest-invalid',
            path: 'widget.json',
            message: `widget.json: description: Must be at most ${WIDGET_DESCRIPTION_MAX_LENGTH} characters`,
          },
        ]);
      });

      it.each(['', '  \n\t'])('refuses an empty description (%j)', (description) => {
        expect(messagesOf(publish(description))).toEqual([
          'widget.json: description: Must not be empty',
        ]);
      });

      it('reports a non-string description once', () => {
        expect(messagesOf(publish(42))).toEqual([
          'widget.json: description: Invalid input: expected string, received number',
        ]);
      });

      it('reports a description error together with the other manifest errors', () => {
        const result = validateWidgetArchive(
          buildZip([manifestEntry({ ...MANIFEST, id: 'Fleet Report', description: '' }), INDEX_JS]),
        );

        expect(messagesOf(result)).toEqual([
          expect.stringMatching(/^widget\.json: id: /),
          'widget.json: description: Must not be empty',
        ]);
      });
    });

    it('refuses a manifest whose entry file is missing', () => {
      const result = validateWidgetArchive(buildZip([manifestEntry(IFRAME_MANIFEST), INDEX_JS]));

      expect(errorsOf(result)).toEqual([
        {
          code: 'entry-missing',
          path: 'index.html',
          message: 'The entry file "index.html" declared in widget.json (runtime.entry) is missing',
        },
      ]);
    });
  });

  describe('customElements.define', () => {
    it.each([
      'customElements.define("x-a", A)',
      'window.customElements .define ( tag, A )',
      'customElements?.define(tag, A)',
    ])('warns, without refusing, on %j', (code) => {
      const result = validateWidgetArchive(
        buildZip([...validEntries(), { name: 'assets/chunk.mjs', content: `${code};` }]),
      );

      expect(result.ok).toBe(true);
      expect(result.warnings).toEqual([
        {
          code: 'custom-element-define',
          path: 'assets/chunk.mjs',
          message:
            '"assets/chunk.mjs" seems to call customElements.define(): the BO registers the widget itself, the bundle should only export its class',
        },
      ]);
    });

    it('ignores other files and calls such as customElements.get', () => {
      const result = validateWidgetArchive(
        buildZip([
          ...validEntries(),
          { name: 'readme.json', content: '"customElements.define(x)"' },
          { name: 'lib.js', content: 'customElements.get("x-a"); defineX(1)' },
        ]),
      );

      expect(result.warnings).toEqual([]);
    });

    it('does not warn for an iframe widget', () => {
      const result = validateWidgetArchive(
        buildZip([
          manifestEntry(IFRAME_MANIFEST),
          { name: 'index.html', content: '<!doctype html>' },
          { name: 'app.js', content: 'customElements.define("x-a", A)' },
        ]),
      );

      expect(result).toMatchObject({ ok: true, warnings: [] });
    });

    it('still returns the warning when the archive has errors', () => {
      const result = validateWidgetArchive(
        buildZip([
          manifestEntry(),
          { name: 'index.js', content: 'customElements.define("x-a", A)' },
          { name: 'run.sh', content: 'x' },
        ]),
      );

      expect(result.ok).toBe(false);
      expect(codesOf(result)).toEqual(['forbidden-extension']);
      expect(result.warnings.map((issue) => issue.code)).toEqual(['custom-element-define']);
    });
  });
});
