import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { CreateBoWidgetError } from './errors.js';
import { isTemplateName, templateDir, TEMPLATES, type TemplateName } from './templates.js';

/**
 * A widget id: lowercase letters and digits, joined by single hyphens. Same rule as the manifest
 * (`WIDGET_ID_PATTERN` of `@vulog/bo-widget-sdk/manifest`), copied so that the generator installs
 * without dependency.
 */
export const WIDGET_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A widget id is 63 characters at most (`WIDGET_ID_MAX_LENGTH` of the manifest). */
export const WIDGET_NAME_MAX_LENGTH = 63;

/**
 * Files stored with `_` instead of `.`: npm leaves `.gitignore` out of the published package, and
 * the CI files stay out of the dot folders that tools scanning this repository read as their
 * configuration.
 */
const RENAMED: Readonly<Record<string, string>> = {
  _gitignore: '.gitignore',
  _github: '.github',
  '_gitlab-ci.yml': '.gitlab-ci.yml',
};

/**
 * Extensions of the files (plus `.gitignore`) whose `{{name}}` and `{{title}}` placeholders are
 * replaced. A template must therefore never contain them other than as placeholders (in a Vue
 * mustache, a string…).
 */
const TEXT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
  '.yml',
]);

/** Options of {@link createWidgetProject}. */
export interface CreateOptions {
  /** Folder of the project, created if missing. Its name is the widget id. */
  readonly dir: string;
  /** Template to copy. */
  readonly template: TemplateName;
}

/** What {@link createWidgetProject} created. */
export interface CreateResult {
  /** Absolute folder of the project. */
  readonly dir: string;
  /** Widget id, the name of the folder and of the npm package. */
  readonly name: string;
  /** Display name of the widget, from its id (`fleet-report` → `Fleet report`). */
  readonly title: string;
  /** Files written, relative to `dir`, in order. */
  readonly files: readonly string[];
}

/**
 * Checks a widget id.
 *
 * @returns The problem, in English, or `undefined` when the name is valid.
 */
export const validateWidgetName = (name: string): string | undefined => {
  if (name === '') return 'the name is empty';
  if (name.length > WIDGET_NAME_MAX_LENGTH) {
    return `"${name}" is longer than ${WIDGET_NAME_MAX_LENGTH} characters`;
  }
  if (!WIDGET_NAME_PATTERN.test(name)) {
    return `"${name}" is not a valid widget id: use lowercase letters and digits, joined by single hyphens (fleet-report)`;
  }
  return undefined;
};

/** Display name of a widget, from its id: `fleet-report` → `Fleet report`. */
export const titleFromName = (name: string): string => {
  const words = name.replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Lists the files of a folder, recursively, as paths relative to it, in path order. */
const listFiles = async (dir: string, prefix = ''): Promise<string[]> => {
  const entries = await readdir(join(dir, prefix), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await listFiles(dir, path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
};

/** Entries a target folder may already hold: `.git` of a repository just initialized, `.DS_Store`. */
const KEPT = new Set(['.git', '.DS_Store']);

/** Path of a template file in the project: `_gitignore` → `.gitignore`, at any depth. */
const targetPath = (path: string): string =>
  path
    .split('/')
    .map((segment) => RENAMED[segment] ?? segment)
    .join('/');

/**
 * Throws unless `dir` is missing or an empty folder.
 *
 * @returns Whether `dir` already exists.
 */
const checkTarget = async (dir: string): Promise<boolean> => {
  const info = await stat(dir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (info === undefined) return false;
  if (!info.isDirectory()) throw new CreateBoWidgetError(`${dir} exists and is not a folder`);
  const entries = (await readdir(dir)).filter((entry) => !KEPT.has(entry));
  if (entries.length > 0) {
    throw new CreateBoWidgetError(`${dir} is not empty: choose a new or an empty folder`);
  }
  return true;
};

/** Copies the files of a template into `dir`, and returns their paths in it. */
const copyTemplate = async (
  source: string,
  dir: string,
  replace: (content: string) => string,
): Promise<string[]> => {
  const written: string[] = [];
  for (const path of await listFiles(source)) {
    const target = targetPath(path);
    const to = join(dir, target);
    await mkdir(join(to, '..'), { recursive: true });
    if (TEXT_EXTENSIONS.has(extname(path)) || target === '.gitignore') {
      await writeFile(to, replace(await readFile(join(source, path), 'utf8')));
    } else {
      await copyFile(join(source, path), to);
    }
    written.push(target);
  }
  return written;
};

const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Leaves the file system as it was before a failed copy, so that the command can simply be run
 * again: removes `created`, the first folder created for `dir` (`dir` or one of its parents), or,
 * when `dir` existed, its entries but `.git` and `.DS_Store`.
 *
 * @throws {CreateBoWidgetError} When it cannot, with the copy error as cause.
 */
const removeWritten = async (
  dir: string,
  created: string | undefined,
  copyError: unknown,
): Promise<void> => {
  try {
    if (created !== undefined) {
      await rm(created, { recursive: true, force: true });
      return;
    }
    const entries = (await readdir(dir)).filter((entry) => !KEPT.has(entry));
    await Promise.all(
      entries.map((entry) => rm(join(dir, entry), { recursive: true, force: true })),
    );
  } catch (cleanupError) {
    throw new CreateBoWidgetError(
      `could not create the project (${message(copyError)}), nor remove the files already written (${message(cleanupError)}): empty ${dir} before retrying`,
      { cause: copyError },
    );
  }
};

/**
 * Creates a widget project from a template: copies its files into `dir`, with the widget id (the
 * name of `dir`) and its display name in place of the `{{name}}` and `{{title}}` placeholders.
 *
 * @throws {CreateBoWidgetError} When the name of `dir` is not a valid widget id, the template is
 * unknown, `dir` exists and is not an empty folder, or a failed copy cannot be undone (the copy
 * error is its `cause`).
 * @throws {Error} Whatever the file system throws (permission denied…). The files already written
 * are then removed (all but `.git` and `.DS_Store`), and `dir` and its parents too when this call
 * created them.
 */
export const createWidgetProject = async (options: CreateOptions): Promise<CreateResult> => {
  const dir = resolve(options.dir);
  const name = basename(dir);
  const problem = validateWidgetName(name);
  if (problem !== undefined) throw new CreateBoWidgetError(problem);
  if (!isTemplateName(options.template)) {
    throw new CreateBoWidgetError(
      `unknown template "${String(options.template)}": choose one of ${Object.keys(TEMPLATES).join(', ')}`,
    );
  }
  const existed = await checkTarget(dir);
  // The first folder created, to remove on failure: `dir` or a parent that did not exist.
  const created = existed ? undefined : await mkdir(dir, { recursive: true });

  const title = titleFromName(name);
  let files: string[];
  try {
    files = await copyTemplate(templateDir(options.template), dir, (content) =>
      content.replaceAll('{{name}}', name).replaceAll('{{title}}', title),
    );
  } catch (error) {
    await removeWritten(dir, created, error);
    throw error;
  }
  return { dir, name, title, files };
};
