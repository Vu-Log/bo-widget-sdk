import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEMPLATE,
  isTemplateName,
  templateDir,
  TEMPLATES,
  type TemplateName,
} from './templates.js';

const names = Object.keys(TEMPLATES) as TemplateName[];
const templatesRoot = join(templateDir(DEFAULT_TEMPLATE), '..');

interface PackageJson {
  version: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const readJson = (path: string): PackageJson =>
  JSON.parse(readFileSync(path, 'utf8')) as PackageJson;

/** Versions of the packages of this repository, as they will be published. */
const workspaceVersion = (name: string): string =>
  readJson(join(templatesRoot, '..', '..', name.replace('@vulog/', ''), 'package.json')).version;

describe('templates', () => {
  it('lists exactly the template folders', () => {
    expect(readdirSync(templatesRoot).sort()).toEqual([...names].sort());
    expect(DEFAULT_TEMPLATE).toBe('react-mui');
  });

  it('tells the template names apart', () => {
    expect(isTemplateName('vue')).toBe(true);
    expect(isTemplateName('angular')).toBe(false);
    expect(isTemplateName('toString')).toBe(false);
  });

  describe.each(names)('%s', (name) => {
    const dir = templateDir(name);
    const packageJson = readJson(join(dir, 'package.json'));

    it('has the files of a widget project', () => {
      for (const file of [
        'README.md',
        '_gitignore',
        '_gitlab-ci.yml',
        '_github/workflows/build.yml',
        'widget.config.ts',
        'vite.config.ts',
        'tsconfig.json',
      ]) {
        expect(existsSync(join(dir, file)), file).toBe(true);
      }
      expect(readdirSync(join(dir, 'src')).some((file) => /\.test\.tsx?$/.test(file))).toBe(true);
    });

    it('stores no dot file, which npm could drop: `_` names, renamed on creation', () => {
      const dotFiles = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((path) =>
        path.split(/[\\/]/).some((segment) => segment.startsWith('.')),
      );
      expect(dotFiles).toEqual([]);
    });

    it('builds, tests and packs the zip with its scripts', () => {
      expect(packageJson.scripts).toMatchObject({ dev: 'vite', test: 'vitest run' });
      expect(packageJson.scripts?.build).toMatch(/&& vite build && bo-widget pack$/);
    });

    it('depends on versions of the @vulog packages this repository publishes', () => {
      const vulog = Object.entries({
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }).filter(([dependency]) => dependency.startsWith('@vulog/'));
      expect(vulog.map(([dependency]) => dependency)).toEqual(
        expect.arrayContaining([
          '@vulog/bo-widget-sdk',
          '@vulog/bo-widget-vite',
          '@vulog/bo-widget-cli',
        ]),
      );
      for (const [dependency, range] of vulog) {
        expect(
          semver.satisfies(workspaceVersion(dependency), range, { includePrerelease: true }),
          `${dependency}@${range} does not accept ${workspaceVersion(dependency)}: update the template`,
        ).toBe(true);
      }
    });
  });
});
