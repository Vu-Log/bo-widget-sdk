#!/usr/bin/env node
/**
 * Raises the `@vulog/*` dependencies of the project templates to the versions of this repository,
 * so that a new project never installs a package older than what its README describes. Run after
 * `changeset version` (`npm run version-packages`), which bumps the packages but not the templates.
 * The templates ship in `@vulog/create-bo-widget`: when their floors change while that package is
 * not released, the script fails, so that the new floors are not left unpublished.
 *
 * @packageDocumentation
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PACKAGES_DIR = join(ROOT, 'packages');
const TEMPLATES_DIR = join(PACKAGES_DIR, 'create-bo-widget', 'templates');
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'];

/**
 * Sets every `@vulog/*` dependency of a template `package.json` to `^<version of the repository>`.
 *
 * @param {Record<string, unknown>} manifest - Parsed `package.json` of a template; not modified.
 * @param {Record<string, string>} versions - Version of each package of the repository, by name.
 * @returns {{ manifest: Record<string, unknown>, changed: string[] }} The updated copy, and the
 *   dependencies whose range changed.
 * @throws {Error} When a template depends on a `@vulog/*` package that this repository does not
 *   publish.
 */
export const withTemplateFloors = (manifest, versions) => {
  const changed = [];
  const next = structuredClone(manifest);
  for (const field of DEPENDENCY_FIELDS) {
    const dependencies = next[field];
    if (!dependencies || typeof dependencies !== 'object') continue;
    for (const [name, range] of Object.entries(dependencies)) {
      if (!name.startsWith('@vulog/')) continue;
      const version = versions[name];
      if (!version) throw new Error(`${name} is not a package of this repository`);
      const floor = `^${version}`;
      if (range === floor) continue;
      dependencies[name] = floor;
      changed.push(`${name} ${range} -> ${floor}`);
    }
  }
  return { manifest: next, changed };
};

/** Versions of the packages of this repository, by package name. */
export const workspaceVersions = (packagesDir = PACKAGES_DIR) =>
  Object.fromEntries(
    readdirSync(packagesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) =>
        JSON.parse(readFileSync(join(packagesDir, entry.name, 'package.json'), 'utf8')),
      )
      .map(({ name, version }) => [name, version]),
  );

/**
 * Rewrites the `package.json` of every template whose `@vulog/*` floors are behind.
 *
 * @returns {string[]} One line per changed dependency, prefixed with its template.
 */
export const syncTemplateFloors = (templatesDir = TEMPLATES_DIR, packagesDir = PACKAGES_DIR) => {
  const versions = workspaceVersions(packagesDir);
  const lines = [];
  for (const entry of readdirSync(templatesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(templatesDir, entry.name, 'package.json');
    const { manifest, changed } = withTemplateFloors(
      JSON.parse(readFileSync(path, 'utf8')),
      versions,
    );
    if (changed.length === 0) continue;
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
    lines.push(...changed.map((line) => `${entry.name}: ${line}`));
  }
  return lines;
};

const CREATE_PACKAGE = '@vulog/create-bo-widget';

/**
 * Error to report when the floors of the templates changed but `@vulog/create-bo-widget`, which
 * ships them, is not released: its version did not change since the last commit.
 *
 * @param {string[]} changes - Lines returned by {@link syncTemplateFloors}.
 * @param {string} version - Version of `@vulog/create-bo-widget` after `changeset version`.
 * @param {string | null} previousVersion - Its version at the last commit, `null` when unknown.
 * @returns {string | null} The message, `null` when there is nothing to report.
 */
export const unreleasedFloorsError = (changes, version, previousVersion) => {
  if (changes.length === 0 || previousVersion === null || version !== previousVersion) return null;
  return `The floors of the templates changed, but ${CREATE_PACKAGE} is not released (still ${version}): add a changeset for ${CREATE_PACKAGE} (npm run changeset), so that new projects get the new floors.`;
};

/**
 * Whether this module is the script that Node runs. Both paths are resolved, so that a checkout
 * reached through a symbolic link (`/tmp` on macOS) still runs the script.
 *
 * @param {string | undefined} scriptPath - `process.argv[1]`.
 * @param {string} moduleUrl - `import.meta.url`.
 */
export const isMainModule = (scriptPath, moduleUrl) => {
  if (!scriptPath) return false;
  try {
    return realpathSync(scriptPath) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
};

/** Version of `@vulog/create-bo-widget` at the last commit, `null` outside a git checkout. */
const committedCreateVersion = () => {
  try {
    const manifest = execFileSync('git', ['show', 'HEAD:packages/create-bo-widget/package.json'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(manifest).version;
  } catch {
    return null;
  }
};

if (isMainModule(process.argv[1], import.meta.url)) {
  const lines = syncTemplateFloors();
  console.log(lines.length > 0 ? lines.join('\n') : 'Template floors are up to date.');
  const error = unreleasedFloorsError(
    lines,
    workspaceVersions()[CREATE_PACKAGE],
    committedCreateVersion(),
  );
  if (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
