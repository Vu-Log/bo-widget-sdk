import { crc32, inflateRawSync } from 'node:zlib';

import {
  WIDGET_BUNDLE_PATH_PATTERN,
  type WidgetManifest,
  publishedWidgetManifestSchema,
} from '@vulog/bo-widget-sdk/manifest';

/**
 * Validation of a widget zip, with the rules the Vulog back office applies when
 * a version is published. Pure: it takes the archive bytes and returns either
 * the bundle files and the validated manifest, or the list of errors.
 *
 * This is a copy of the validation run by the Vulog server, which stays the
 * source of truth: same limits, rules, codes and messages, so that an archive
 * this module accepts passes the same checks on publication (the namespace and
 * version checks excepted). A rule changed there must be changed here.
 *
 * The zip is read here rather than with `unzip-stream` or a similar library on
 * purpose: those trust the uncompressed size declared in the headers, so a zip
 * bomb that lies about it would still inflate in memory. Here the sizes are
 * checked against the limits before anything is inflated, and each entry is
 * inflated with `maxOutputLength` set to its declared size: an entry whose real
 * size differs from the declared one is refused, so the total output stays
 * within what was checked.
 *
 * Only the plain zip format produced by the SDK (and by `zip`, Finder, 7-Zip…)
 * is accepted: no ZIP64, no multi-disk archive, no encryption, and only the
 * stored and deflate methods.
 */

/** Limits applied to an uploaded widget archive. Each one is a positive integer. */
export interface WidgetArchiveLimits {
  /** Maximum size of the zip itself, in bytes. */
  maxArchiveBytes: number;
  /** Maximum total size of the entries once decompressed, in bytes. */
  maxUncompressedBytes: number;
  /** Maximum number of entries in the zip, folders and ignored macOS entries included. */
  maxEntries: number;
}

/** Default limits: 10 MB archive, 50 MB decompressed, 1000 entries. */
export const WIDGET_ARCHIVE_LIMITS: Readonly<WidgetArchiveLimits> = Object.freeze({
  maxArchiveBytes: 10 * 1024 * 1024,
  maxUncompressedBytes: 50 * 1024 * 1024,
  maxEntries: 1000,
});

/** File extensions a widget bundle may contain. Lowercase only. */
export const WIDGET_ARCHIVE_EXTENSIONS = [
  'js',
  'mjs',
  'css',
  'html',
  'json',
  'svg',
  'png',
  'jpg',
  'webp',
  'woff2',
  'map',
] as const;

/** Name of the manifest, at the root of the archive. */
export const WIDGET_MANIFEST_FILE = 'widget.json';

/** The only warning code: it never blocks publishing. */
export type WidgetArchiveWarningCode = 'custom-element-define';

/** Error codes: any of them refuses the archive. */
export type WidgetArchiveErrorCode =
  | 'archive-too-large'
  | 'invalid-archive'
  | 'too-many-files'
  | 'zip-bomb'
  | 'unsafe-path'
  | 'duplicate-path'
  | 'forbidden-extension'
  | 'manifest-missing'
  | 'manifest-invalid'
  | 'entry-missing';

/** Stable code of each rule, the same as the one the BO returns on publication. */
export type WidgetArchiveIssueCode = WidgetArchiveErrorCode | WidgetArchiveWarningCode;

/** One error or warning: a stable `code`, an English message for humans, and the file concerned if any. */
export interface WidgetArchiveIssue<Code extends WidgetArchiveIssueCode = WidgetArchiveIssueCode> {
  code: Code;
  message: string;
  /** Path of the file inside the archive, when the issue is about one file. */
  path?: string;
}

/** An error of {@link validateWidgetArchive}. */
export type WidgetArchiveError = WidgetArchiveIssue<WidgetArchiveErrorCode>;

/** A warning of {@link validateWidgetArchive}. */
export type WidgetArchiveWarning = WidgetArchiveIssue<WidgetArchiveWarningCode>;

/**
 * A file of the bundle, with its path relative to the root of the archive. Its
 * `data` is a copy: it does not share memory with the uploaded archive.
 */
export interface WidgetArchiveFile {
  readonly path: string;
  readonly data: Buffer;
}

/**
 * Outcome of {@link validateWidgetArchive}. Warnings never block publishing
 * and are returned in both cases, but they are only computed once the
 * manifest is valid.
 */
export type WidgetArchiveResult =
  | {
      ok: true;
      manifest: WidgetManifest;
      files: WidgetArchiveFile[];
      warnings: WidgetArchiveWarning[];
    }
  | {
      ok: false;
      errors: [WidgetArchiveError, ...WidgetArchiveError[]];
      warnings: WidgetArchiveWarning[];
    };

const EOCD_SIGNATURE = 0x06054b50;
const EOCD_SIZE = 22;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const CENTRAL_HEADER_SIZE = 46;
const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const LOCAL_HEADER_SIZE = 30;
const MAX_ZIP_COMMENT = 0xffff;
const ZIP64_MARKER_16 = 0xffff;
const ZIP64_MARKER_32 = 0xffffffff;
const FLAG_ENCRYPTED = 0x1;
const METHOD_STORED = 0;
const METHOD_DEFLATE = 8;

/** zlib errors caused by the data itself (corrupted, truncated, larger than declared), as opposed to a bug. */
const ZLIB_DATA_ERROR_CODES = new Set(['Z_DATA_ERROR', 'Z_BUF_ERROR', 'ERR_BUFFER_TOO_LARGE']);

/** `customElements.define(`, also as `customElements?.define(`, with any spacing. */
const CUSTOM_ELEMENT_DEFINE_PATTERN = /customElements\s*\??\.\s*define\s*\(/;

/** A structural problem in the zip: the archive cannot be read safely, so validation stops. */
class ZipFormatError extends Error {}

/** One entry of the central directory, as read: its sizes and offset are checked later, by `extractEntry`. */
interface ZipEntry {
  name: string;
  nameBytes: Buffer;
  flags: number;
  method: number;
  crc: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

const ensure: (condition: boolean, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new ZipFormatError(message);
};

/**
 * Formats a size and its limit in MB, or in bytes when both would round to the
 * same MB value (so a message never reads "10 MB, the maximum is 10 MB").
 */
const formatSizes = (size: number, limit: number): [string, string] => {
  const megabytes = (bytes: number) => `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
  return megabytes(size) === megabytes(limit)
    ? [`${size} bytes`, `${limit} bytes`]
    : [megabytes(size), megabytes(limit)];
};

/**
 * Applies the overrides to the defaults, field by field. Throws a `TypeError`
 * on a value that is not a positive integer: `undefined` or `NaN` (an unset
 * environment variable, say) would otherwise silently disable the check, since
 * `size > NaN` is always false. An unknown key (a misspelt limit) throws too,
 * rather than leaving the default in place unnoticed.
 */
const resolveLimits = (overrides: Partial<WidgetArchiveLimits>): WidgetArchiveLimits => {
  const limits = { ...WIDGET_ARCHIVE_LIMITS };
  const unknownKey = Object.keys(overrides).find((key) => !(key in limits));
  if (unknownKey !== undefined) throw new TypeError(`Unknown widget archive limit: ${unknownKey}`);
  for (const key of Object.keys(limits) as (keyof WidgetArchiveLimits)[]) {
    if (!(key in overrides)) continue;
    const value = overrides[key];
    if (!Number.isSafeInteger(value) || (value as number) <= 0) {
      throw new TypeError(`Invalid widget archive limit ${key}: ${String(value)}`);
    }
    limits[key] = value as number;
  }
  return limits;
};

/**
 * Finds the end of central directory record: the last one, scanning from the
 * end, whose comment length reaches exactly the end of the buffer. A signature
 * that appears by chance inside the comment is therefore not mistaken for it.
 */
const findEndOfCentralDirectory = (archive: Buffer): number => {
  const lowest = Math.max(0, archive.length - EOCD_SIZE - MAX_ZIP_COMMENT);
  for (let offset = archive.length - EOCD_SIZE; offset >= lowest; offset--) {
    if (
      archive.readUInt32LE(offset) === EOCD_SIGNATURE &&
      offset + EOCD_SIZE + archive.readUInt16LE(offset + 20) === archive.length
    ) {
      return offset;
    }
  }
  throw new ZipFormatError('The file is not a zip archive');
};

/** Reads the entries of the central directory, refusing what this reader does not support. */
const readCentralDirectory = (archive: Buffer, eocdOffset: number): ZipEntry[] => {
  const diskNumber = archive.readUInt16LE(eocdOffset + 4);
  const directoryDisk = archive.readUInt16LE(eocdOffset + 6);
  const entriesOnDisk = archive.readUInt16LE(eocdOffset + 8);
  const total = archive.readUInt16LE(eocdOffset + 10);
  const directorySize = archive.readUInt32LE(eocdOffset + 12);
  const directoryOffset = archive.readUInt32LE(eocdOffset + 16);

  ensure(
    total !== ZIP64_MARKER_16 &&
      directorySize !== ZIP64_MARKER_32 &&
      directoryOffset !== ZIP64_MARKER_32,
    'ZIP64 archives are not supported',
  );
  ensure(
    diskNumber === 0 && directoryDisk === 0 && entriesOnDisk === total,
    'Multi-part archives are not supported',
  );
  const directoryEnd = directoryOffset + directorySize;
  ensure(directoryEnd <= eocdOffset, 'The zip central directory is out of bounds');

  const entries: ZipEntry[] = [];
  let offset = directoryOffset;
  for (let index = 0; index < total; index++) {
    ensure(offset + CENTRAL_HEADER_SIZE <= directoryEnd, 'The zip central directory is truncated');
    ensure(
      archive.readUInt32LE(offset) === CENTRAL_HEADER_SIGNATURE,
      'The zip central directory is corrupted',
    );
    const nameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const nameStart = offset + CENTRAL_HEADER_SIZE;
    const next = nameStart + nameLength + extraLength + commentLength;
    ensure(next <= directoryEnd, 'The zip central directory is truncated');

    const nameBytes = archive.subarray(nameStart, nameStart + nameLength);
    entries.push({
      name: nameBytes.toString('utf8'),
      nameBytes,
      flags: archive.readUInt16LE(offset + 8),
      method: archive.readUInt16LE(offset + 10),
      crc: archive.readUInt32LE(offset + 16),
      compressedSize: archive.readUInt32LE(offset + 20),
      uncompressedSize: archive.readUInt32LE(offset + 24),
      localHeaderOffset: archive.readUInt32LE(offset + 42),
    });
    offset = next;
  }
  // Headers left over would be entries this reader skips but another one could see.
  ensure(offset === directoryEnd, 'The zip central directory has more entries than announced');
  return entries;
};

/**
 * Returns a copy of the decompressed content of an entry. Only the central
 * directory's sizes, CRC and method are trusted; the local header must carry
 * the same name, which refuses several entries pointing at the same local
 * header. Other overlapping layouts are not detected, but their total output is
 * still bounded by the declared-size check in `readEntries`.
 */
const extractEntry = (archive: Buffer, entry: ZipEntry): Buffer => {
  ensure((entry.flags & FLAG_ENCRYPTED) === 0, `"${entry.name}" is encrypted`);
  ensure(
    entry.method === METHOD_STORED || entry.method === METHOD_DEFLATE,
    `"${entry.name}" uses an unsupported compression method (${entry.method})`,
  );

  const header = entry.localHeaderOffset;
  ensure(header + LOCAL_HEADER_SIZE <= archive.length, `"${entry.name}" is out of bounds`);
  ensure(
    archive.readUInt32LE(header) === LOCAL_HEADER_SIGNATURE,
    `"${entry.name}" has a corrupted header`,
  );
  const nameLength = archive.readUInt16LE(header + 26);
  const extraLength = archive.readUInt16LE(header + 28);
  const nameStart = header + LOCAL_HEADER_SIZE;
  ensure(
    archive.subarray(nameStart, nameStart + nameLength).equals(entry.nameBytes),
    `"${entry.name}" has inconsistent headers`,
  );
  const dataStart = nameStart + nameLength + extraLength;
  ensure(dataStart + entry.compressedSize <= archive.length, `"${entry.name}" is truncated`);
  const compressed = archive.subarray(dataStart, dataStart + entry.compressedSize);

  let data: Buffer;
  if (entry.method === METHOD_STORED) {
    data = Buffer.from(compressed);
  } else {
    try {
      // Node refuses a maxOutputLength below 1 (ERR_OUT_OF_RANGE), so an empty entry gets 1;
      // the size check below still refuses one byte of output declared as 0.
      data = inflateRawSync(compressed, { maxOutputLength: Math.max(1, entry.uncompressedSize) });
    } catch (error) {
      // Corrupted or truncated deflate data, or more output than declared: the archive's fault.
      // Anything else is a bug, and must not be reported as a bad upload.
      if (!ZLIB_DATA_ERROR_CODES.has((error as NodeJS.ErrnoException).code ?? '')) throw error;
      throw new ZipFormatError(
        `"${entry.name}" cannot be decompressed or is larger than declared`,
        {
          cause: error,
        },
      );
    }
  }
  ensure(data.length === entry.uncompressedSize, `"${entry.name}" does not have its declared size`);
  ensure(crc32(data) === entry.crc, `"${entry.name}" is corrupted (CRC mismatch)`);
  return data;
};

/** Metadata that macOS adds when zipping with Finder: never part of the bundle, so skipped. */
const isMacOsMetadata = (path: string): boolean =>
  path === '__MACOSX' ||
  path.startsWith('__MACOSX/') ||
  path === '.DS_Store' ||
  path.endsWith('/.DS_Store');

/** The rules on a file's path: safe relative path, allowed extension. Empty when the path is fine. */
const checkFilePath = (path: string): WidgetArchiveError[] => {
  if (!WIDGET_BUNDLE_PATH_PATTERN.test(path)) {
    return [
      {
        code: 'unsafe-path',
        path,
        message: `"${path}" is not a safe relative path: only letters, digits, ".", "_", "-" and "/" are allowed, without a leading "/" and without empty, "." or ".." segments`,
      },
    ];
  }
  const dot = path.lastIndexOf('.');
  const extension = dot > path.lastIndexOf('/') ? path.slice(dot + 1) : '';
  if (!(WIDGET_ARCHIVE_EXTENSIONS as readonly string[]).includes(extension)) {
    return [
      {
        code: 'forbidden-extension',
        path,
        message: `"${path}" has a forbidden extension; allowed: ${WIDGET_ARCHIVE_EXTENSIONS.join(', ')}`,
      },
    ];
  }
  return [];
};

/**
 * Parses and validates `widget.json`, then checks that its entry file is in
 * the archive. A UTF-8 BOM, which some editors add, is ignored.
 */
const checkManifest = (
  files: WidgetArchiveFile[],
): { manifest: WidgetManifest; errors: [] } | { manifest: null; errors: WidgetArchiveError[] } => {
  const manifestFile = files.find((file) => file.path === WIDGET_MANIFEST_FILE);
  if (!manifestFile) {
    const nested = files.find((file) => file.path.endsWith(`/${WIDGET_MANIFEST_FILE}`));
    return {
      manifest: null,
      errors: [
        {
          code: 'manifest-missing',
          message: nested
            ? `${WIDGET_MANIFEST_FILE} must be at the root of the archive, found "${nested.path}": zip the content of the folder, not the folder itself`
            : `${WIDGET_MANIFEST_FILE} is missing at the root of the archive`,
        },
      ],
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(manifestFile.data.toString('utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    return {
      manifest: null,
      errors: [
        {
          code: 'manifest-invalid',
          path: WIDGET_MANIFEST_FILE,
          message: `${WIDGET_MANIFEST_FILE} is not valid JSON: ${(error as Error).message}`,
        },
      ],
    };
  }

  const parsed = publishedWidgetManifestSchema.safeParse(json);
  if (!parsed.success) {
    return {
      manifest: null,
      errors: parsed.error.issues.map(
        (issue: { path: PropertyKey[]; message: string }): WidgetArchiveError => ({
          code: 'manifest-invalid',
          path: WIDGET_MANIFEST_FILE,
          message: `${WIDGET_MANIFEST_FILE}: ${issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''}${issue.message}`,
        }),
      ),
    };
  }

  const { entry } = parsed.data.runtime;
  if (!files.some((file) => file.path === entry)) {
    return {
      manifest: null,
      errors: [
        {
          code: 'entry-missing',
          path: entry,
          message: `The entry file "${entry}" declared in ${WIDGET_MANIFEST_FILE} (runtime.entry) is missing`,
        },
      ],
    };
  }
  return { manifest: parsed.data, errors: [] };
};

/**
 * A Web Component widget must not register itself: the BO registers its class
 * under a tag it computes. A static search, so a warning
 * only: it can match a comment or a library that defines its own elements.
 */
const findCustomElementDefines = (files: WidgetArchiveFile[]): WidgetArchiveWarning[] =>
  files
    .filter(
      ({ path, data }) =>
        /\.m?js$/.test(path) && CUSTOM_ELEMENT_DEFINE_PATTERN.test(data.toString('utf8')),
    )
    .map(({ path }) => ({
      code: 'custom-element-define',
      path,
      message: `"${path}" seems to call customElements.define(): the BO registers the widget itself, the bundle should only export its class`,
    }));

/**
 * Reads the entries of the archive and checks the limits, the paths and the
 * extensions. `stopped` means a limit was exceeded and nothing was extracted.
 * Throws a {@link ZipFormatError} on a structural problem.
 */
const readEntries = (
  archive: Buffer,
  limits: WidgetArchiveLimits,
):
  | { stopped: true; error: WidgetArchiveError }
  | { stopped: false; files: WidgetArchiveFile[]; errors: WidgetArchiveError[] } => {
  const entries = readCentralDirectory(archive, findEndOfCentralDirectory(archive));
  if (entries.length > limits.maxEntries) {
    return {
      stopped: true,
      error: {
        code: 'too-many-files',
        message: `The archive contains ${entries.length} entries, the maximum is ${limits.maxEntries}`,
      },
    };
  }
  const declaredSize = entries.reduce((sum, entry) => sum + entry.uncompressedSize, 0);
  if (declaredSize > limits.maxUncompressedBytes) {
    const [size, limit] = formatSizes(declaredSize, limits.maxUncompressedBytes);
    return {
      stopped: true,
      error: {
        code: 'zip-bomb',
        message: `The archive decompresses to ${size}, the maximum is ${limit}`,
      },
    };
  }

  const errors: WidgetArchiveError[] = [];
  const files: WidgetArchiveFile[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const isFolder = entry.name.endsWith('/');
    const path = isFolder ? entry.name.slice(0, -1) : entry.name;
    if (isMacOsMetadata(path)) continue;
    if (seen.has(path)) {
      errors.push({
        code: 'duplicate-path',
        path,
        message: `"${path}" appears more than once in the archive`,
      });
      continue;
    }
    seen.add(path);
    if (isFolder) {
      // Only the decompressed size: some tools store a folder as an empty deflate stream (2 bytes).
      ensure(entry.uncompressedSize === 0, `The folder "${path}" contains data`);
      if (!WIDGET_BUNDLE_PATH_PATTERN.test(path)) errors.push(...checkFilePath(path));
      continue;
    }
    const pathErrors = checkFilePath(path);
    if (pathErrors.length > 0) {
      errors.push(...pathErrors);
      continue;
    }
    files.push({ path, data: extractEntry(archive, entry) });
  }
  return { stopped: false, files, errors };
};

/**
 * Validates a widget zip: archive size, structure, number of entries and decompressed size (zip bombs), safe paths
 * (no `..`, no absolute path) with allowed extensions, a valid `widget.json` at
 * the root whose `runtime.entry` exists. A Web Component bundle that calls
 * `customElements.define` gets a warning. macOS metadata (`__MACOSX/`,
 * `.DS_Store`) is skipped.
 *
 * Errors are gathered so that they can all be fixed at once, except the
 * structural ones (`archive-too-large`, `invalid-archive`, `too-many-files`,
 * `zip-bomb`): validation stops there, and an `invalid-archive` raised while
 * reading an entry replaces the errors gathered so far.
 *
 * What only the back office can check is left out: the widget id against the
 * client's namespace, and the version against the versions already published.
 *
 * @param archive - The raw bytes of the zip.
 * @param limits - Overrides of {@link WIDGET_ARCHIVE_LIMITS}, each a positive integer.
 * @returns The manifest and the files (folders left out) on success, or the
 *   errors; the warnings in both cases.
 * @throws {TypeError} When a limit override is not a positive integer, or not a known limit.
 */
export const validateWidgetArchive = (
  archive: Buffer,
  limits: Partial<WidgetArchiveLimits> = {},
): WidgetArchiveResult => {
  const effectiveLimits = resolveLimits(limits);
  if (archive.length > effectiveLimits.maxArchiveBytes) {
    const [size, limit] = formatSizes(archive.length, effectiveLimits.maxArchiveBytes);
    return {
      ok: false,
      warnings: [],
      errors: [
        { code: 'archive-too-large', message: `The archive is ${size}, the maximum is ${limit}` },
      ],
    };
  }

  let read: ReturnType<typeof readEntries>;
  try {
    read = readEntries(archive, effectiveLimits);
  } catch (error) {
    if (!(error instanceof ZipFormatError)) throw error;
    return {
      ok: false,
      warnings: [],
      errors: [{ code: 'invalid-archive', message: error.message }],
    };
  }
  if (read.stopped) return { ok: false, warnings: [], errors: [read.error] };

  const { files } = read;
  const manifestCheck = checkManifest(files);
  const errors = [...read.errors, ...manifestCheck.errors];
  const warnings =
    manifestCheck.manifest?.runtime.type === 'webcomponent' ? findCustomElementDefines(files) : [];

  const [firstError, ...otherErrors] = errors;
  if (firstError) return { ok: false, errors: [firstError, ...otherErrors], warnings };
  if (!manifestCheck.manifest) throw new Error('Unreachable: no manifest and no error');
  return { ok: true, manifest: manifestCheck.manifest, files, warnings };
};
