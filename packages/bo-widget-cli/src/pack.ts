import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import type { WidgetManifest } from '@vulog/bo-widget-sdk/manifest';
import {
  validateWidgetArchive,
  type WidgetArchiveResult,
  type WidgetArchiveWarning,
} from './archive.js';
import { BoWidgetCliError } from './errors.js';
import { createZip, type ZipInputFile } from './zip.js';

/** Options of {@link packWidget}. */
export interface PackOptions {
  /** Folder whose content is zipped: the build output, with `widget.json` at its root. */
  readonly dir: string;
  /** Folder the zip is written to, created if needed. */
  readonly outDir: string;
}

/** Outcome of {@link packWidget}: nothing is written when the archive is refused. */
export type PackResult =
  | {
      ok: true;
      /** Absolute path of the zip written. */
      file: string;
      manifest: WidgetManifest;
      warnings: WidgetArchiveWarning[];
    }
  | Extract<WidgetArchiveResult, { ok: false }>;

/** Reads the files of `dir`, recursively, sorted by path so that the zip is reproducible. */
const readBundle = async (dir: string, outDir: string): Promise<ZipInputFile[]> => {
  let entries;
  try {
    entries = await readdir(dir, { recursive: true, withFileTypes: true });
  } catch (error) {
    throw new BoWidgetCliError(`${dir} does not exist or is not a folder: build the widget first`, {
      cause: error,
    });
  }
  const files: ZipInputFile[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    // `.DS_Store`: written by macOS Finder in every folder it opens, never part of a bundle.
    if (entry.name === '.DS_Store') continue;
    // A zip written by an earlier `pack` when the output folder is inside the build folder.
    if (resolve(entry.parentPath) === outDir && entry.name.endsWith('.zip')) continue;
    const absolute = join(entry.parentPath, entry.name);
    const path = relative(dir, absolute).split(sep).join('/');
    if (!entry.isFile()) {
      throw new BoWidgetCliError(
        `${path} is not a regular file (symbolic link?): it cannot be packed`,
      );
    }
    files.push({ path, data: await readFile(absolute) });
  }
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
};

/** Writes through a temporary file, so that a failed write never leaves a truncated zip. */
const writeAtomically = async (file: string, data: Buffer): Promise<void> => {
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, data);
    await rename(temporary, file);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
};

/**
 * Zips the content of a widget build into `{id}-{version}.zip`, the archive to publish in the
 * back office. The archive is checked with {@link validateWidgetArchive} before it is written:
 * when it would be refused, nothing is written and the errors are returned. `.DS_Store` files are
 * left out, and so are the `.zip` files of `outDir` when it is inside `dir`. The zip is
 * reproducible: the same build packed with the same Node.js version gives the same bytes.
 *
 * @param options - The build folder and the output folder.
 * @returns The path of the zip written, with the manifest and the warnings; or the errors.
 * @throws {BoWidgetCliError} When `dir` is missing or not a folder, or holds a symbolic link or another
 * file that is not a regular file.
 * @throws {Error} When the zip cannot be written.
 *
 * @example
 * ```ts
 * const result = await packWidget({ dir: 'dist', outDir: '.' });
 * if (result.ok) console.log(`Wrote ${result.file}`);
 * ```
 */
export const packWidget = async ({ dir, outDir }: PackOptions): Promise<PackResult> => {
  const output = resolve(outDir);
  const archive = createZip(await readBundle(resolve(dir), output));
  const result = validateWidgetArchive(archive);
  if (!result.ok) return result;
  const { manifest, warnings } = result;
  await mkdir(output, { recursive: true });
  const file = resolve(output, `${manifest.id}-${manifest.version}.zip`);
  await writeAtomically(file, archive);
  return { ok: true, file, manifest, warnings };
};
