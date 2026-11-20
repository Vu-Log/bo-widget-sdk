import { describe, expect, it } from 'vitest';

import { findContentMismatch } from './content.js';

const bytes = (...values: number[]) => Buffer.from(values);

const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00);
const JPG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  bytes(0x10, 0x00, 0x00, 0x00),
  Buffer.from('WEBPVP8 '),
]);
const WOFF2 = Buffer.concat([Buffer.from('wOF2'), bytes(0x00, 0x01)]);

describe('findContentMismatch', () => {
  describe('binary signatures', () => {
    it.each([
      ['png', PNG],
      ['jpg', JPG],
      ['webp', WEBP],
      ['woff2', WOFF2],
    ])('accepts a real .%s', (extension, data) => {
      expect(findContentMismatch(`assets/a.${extension}`, data)).toBeNull();
    });

    it.each([
      ['HTML named .png', 'logo.png', Buffer.from('<html><script>x</script></html>')],
      ['a JPEG named .png', 'logo.png', JPG],
      ['a PNG named .jpg', 'photo.jpg', PNG],
      [
        'a RIFF that is not WEBP',
        'a.webp',
        Buffer.concat([Buffer.from('RIFF'), bytes(0, 0, 0, 0), Buffer.from('WAVE')]),
      ],
      ['a truncated WEBP', 'a.webp', Buffer.from('RIFF')],
      ['a WOFF 1 font named .woff2', 'f.woff2', Buffer.from('wOFF\u0000\u0001')],
      ['an empty image', 'a.png', Buffer.alloc(0)],
    ])('refuses %s', (_, path, data) => {
      const extension = path.slice(path.lastIndexOf('.') + 1);
      expect(findContentMismatch(path, data)).toBe(
        `does not start with the signature of a .${extension} file`,
      );
    });
  });

  describe('text files', () => {
    it.each(['js', 'mjs', 'css', 'html', 'json', 'map'])(
      'accepts UTF-8 .%s, and an empty one',
      (extension) => {
        const text =
          extension === 'json' || extension === 'map' ? '{"name":"é"}' : 'body { content: "é" }';
        expect(findContentMismatch(`a.${extension}`, Buffer.from(text))).toBeNull();
        expect(findContentMismatch(`a.${extension}`, Buffer.alloc(0))).toBeNull();
      },
    );

    it('refuses bytes that are not UTF-8', () => {
      expect(findContentMismatch('index.js', bytes(0x63, 0x6f, 0xff, 0x6e))).toBe(
        'is not valid UTF-8',
      );
    });

    it('refuses UTF-16, which a browser could read differently', () => {
      const utf16 = Buffer.concat([bytes(0xff, 0xfe), Buffer.from('alert(1)', 'utf16le')]);
      expect(findContentMismatch('index.js', utf16)).toBe('is not valid UTF-8');
    });

    it('refuses a NUL character', () => {
      expect(findContentMismatch('style.css', Buffer.from('a\u0000b'))).toBe(
        'contains a NUL character',
      );
    });

    it.each(['data.json', 'index.js.map'])('refuses %s when it is not JSON', (path) => {
      expect(findContentMismatch(path, Buffer.from('<html>'))).toBe('is not valid JSON');
    });

    it('accepts JSON with a UTF-8 BOM', () => {
      expect(
        findContentMismatch('data.json', Buffer.from(`${String.fromCharCode(0xfeff)}{"a":1}`)),
      ).toBeNull();
    });
  });

  describe('left to other checks', () => {
    it('does not check the root widget.json, which the manifest check reports itself', () => {
      expect(findContentMismatch('widget.json', Buffer.from('{ id: '))).toBeNull();
    });

    it('checks a widget.json in a folder like any JSON', () => {
      expect(findContentMismatch('dist/widget.json', Buffer.from('{ id: '))).toBe(
        'is not valid JSON',
      );
    });

    it('does not check svg, which svg.ts scans', () => {
      expect(findContentMismatch('logo.svg', bytes(0xff, 0x00))).toBeNull();
    });
  });
});
