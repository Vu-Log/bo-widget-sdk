import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import type { WidgetManifest } from '@vulog/bo-widget-sdk/manifest';
import {
  validateWidgetArchive,
  type WidgetArchiveError,
  type WidgetArchiveWarning,
} from './archive.js';
import { createZip, type ZipInputFile } from './zip.js';

/** Options of {@link packWidget}. */
export interface PackOptions {
  /** Folder whose content is zipped: the build output, with `widget.json` at its root. */
  dir: string;
  /** Folder the zip is written to, created if needed. */
  outDir: string;
}

/** Outcome of {@link packWidget}: nothing is written when the archive is refused. */
export type PackResult =
  | { ok: true; file: string; manifest: WidgetManifest; warnings: WidgetArchiveWarning[] }
  | {
      ok: false;
      errors: [WidgetArchiveError, ...WidgetArchiveError[]];
      warnings: WidgetArchiveWarning[];
    };

/** Written by macOS Finder in every folder it opens: never part of a bundle. */
const isIgnored = (name: string): boolean => name === '.DS_Store';

/** Reads the files of `dir`, recursively, sorted by path so that the zip is reproducible. */
const readBundle = async (dir: string): Promise<ZipInputFile[]> => {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const files: ZipInputFile[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() || isIgnored(entry.name)) continue;
    const absolute = join(entry.parentPath, entry.name);
    const path = relative(dir, absolute).split(sep).join('/');
    if (!entry.isFile()) {
      throw new Error(`${path} is not a regular file (symbolic link?): it cannot be packed`);
    }
    files.push({ path, data: await readFile(absolute) });
  }
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
};

/**
 * Zips the content of a widget build into `{id}-{version}.zip`, the archive to publish in the
 * back office. The archive is checked with {@link validateWidgetArchive} before it is written:
 * when it would be refused, nothing is written and the errors are returned. `.DS_Store` files are
 * left out. The zip is reproducible: the same build gives the same bytes, so the same checksum.
 *
 * @param options - The build folder and the output folder.
 * @returns The path of the zip written, with the manifest and the warnings; or the errors.
 * @throws {Error} When `dir` cannot be read (missing, not a folder) or holds a symbolic link, or
 * when the zip cannot be written.
 *
 * @example
 * ```ts
 * const result = await packWidget({ dir: 'dist', outDir: '.' });
 * if (result.ok) console.log(`Wrote ${result.file}`);
 * ```
 */
export const packWidget = async ({ dir, outDir }: PackOptions): Promise<PackResult> => {
  const archive = createZip(await readBundle(resolve(dir)));
  const result = validateWidgetArchive(archive);
  if (!result.ok) return result;
  const { manifest, warnings } = result;
  await mkdir(outDir, { recursive: true });
  const file = resolve(outDir, `${manifest.id}-${manifest.version}.zip`);
  await writeFile(file, archive);
  return { ok: true, file, manifest, warnings };
};
