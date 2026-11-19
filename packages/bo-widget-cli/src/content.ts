/**
 * Checks that the content of a widget file matches its extension, the
 * `content-mismatch` rule of the Vulog server (copied from it). A file whose
 * bytes are not what its extension says is refused: a "polyglot", such as
 * HTML named `.png`, is served
 * with the type of its extension but could be read as something else, and a
 * text file that is not UTF-8 is read differently by the browser and by the
 * other checks.
 *
 * Covered: the binary signatures of `png`, `jpg`, `webp` and `woff2`; strict
 * UTF-8 without NUL for `js`, `mjs`, `css`, `json`, `html` and `map`; JSON
 * that parses for `json` and `map`. An empty text file is accepted. `svg` is
 * checked by `svg.ts`, and the root `widget.json` by the manifest check.
 */

/** Signature of each binary extension: bytes expected at given offsets. */
const SIGNATURES: Readonly<
  Record<string, readonly { readonly offset: number; readonly bytes: readonly number[] }[]>
> = {
  png: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  jpg: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  // RIFF container, then the WEBP form type at offset 8.
  webp: [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  woff2: [{ offset: 0, bytes: [0x77, 0x4f, 0x46, 0x32] }],
};

/** Extensions checked as UTF-8 text (svg has its own check, `svg.ts`). */
const UTF8_EXTENSIONS = new Set(['js', 'mjs', 'css', 'json', 'html', 'map']);

/** Extensions whose content must be JSON. */
const JSON_EXTENSIONS = new Set(['json', 'map']);

/** Name of the manifest at the root, checked by the manifest rules with their own errors. */
const ROOT_MANIFEST = 'widget.json';

const extensionOf = (path: string): string => path.slice(path.lastIndexOf('.') + 1);

const hasSignature = (data: Buffer, extension: string): boolean =>
  (SIGNATURES[extension] ?? []).every(
    ({ offset, bytes }) =>
      data.length >= offset + bytes.length &&
      bytes.every((byte, index) => data[offset + index] === byte),
  );

/** The text of a file, or why it is not strict UTF-8 without NUL. */
const decodeText = (data: Buffer): { text: string } | { reason: string } => {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(data);
  } catch {
    return { reason: 'is not valid UTF-8' };
  }
  return text.includes('\u0000') ? { reason: 'contains a NUL character' } : { text };
};

/**
 * Looks for a mismatch between the content of a file and its extension.
 *
 * @param path The path of the file in the archive; an extension that is not covered is ignored.
 * @param data The bytes of the file.
 * @returns Why the content does not match, as the end of a sentence about the file
 *   ("does not start with the signature of a .png file"), or `null` when it matches or the extension is not covered.
 */
export const findContentMismatch = (path: string, data: Buffer): string | null => {
  const extension = extensionOf(path);
  if (extension in SIGNATURES) {
    return hasSignature(data, extension)
      ? null
      : `does not start with the signature of a .${extension} file`;
  }
  if (!UTF8_EXTENSIONS.has(extension) || data.length === 0 || path === ROOT_MANIFEST) return null;

  const decoded = decodeText(data);
  if ('reason' in decoded) return decoded.reason;
  if (!JSON_EXTENSIONS.has(extension)) return null;
  try {
    JSON.parse(decoded.text);
  } catch {
    return 'is not valid JSON';
  }
  return null;
};
