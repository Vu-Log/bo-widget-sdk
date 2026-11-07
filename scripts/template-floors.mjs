#!/usr/bin/env node
/**
 * Raises the `@vulog/*` dependencies of the project templates to the versions of this repository,
 * so that a new project never installs a package older than what its README describes. Run after
 * `changeset version` (`npm run version-packages`), which bumps the packages but not the templates.
 *
 * @packageDocumentation
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lines = syncTemplateFloors();
  console.log(lines.length > 0 ? lines.join('\n') : 'Template floors are up to date.');
}
