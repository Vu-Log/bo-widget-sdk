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
const repoRoot = join(templatesRoot, '..', '..', '..');

/** `/plugin install` argument of the Claude Code plugin that holds the skills, from the marketplace. */
const pluginInstall = (): string => {
  const marketplace = JSON.parse(
    readFileSync(join(repoRoot, '.claude-plugin', 'marketplace.json'), 'utf8'),
  ) as { name: string; plugins: { name: string; source: string }[] };
  const [plugin] = marketplace.plugins;
  if (plugin === undefined) throw new Error('marketplace.json lists no plugin');
  return `${plugin.name}@${marketplace.name}`;
};

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
        'AGENTS.md',
        'CLAUDE.md',
        'README.md',
        '_gitignore',
        '_gitlab-ci.yml',
        '_github/workflows/build.yml',
        '_github/dependabot.yml',
        'widget.config.ts',
        'vite.config.ts',
        'tsconfig.json',
      ]) {
        expect(existsSync(join(dir, file)), file).toBe(true);
      }
      expect(readdirSync(join(dir, 'src')).some((file) => /\.test\.tsx?$/.test(file))).toBe(true);
    });

    it('pins every GitHub action by commit SHA, kept up to date by Dependabot', () => {
      const workflow = readFileSync(join(dir, '_github/workflows/build.yml'), 'utf8');
      const uses = [...workflow.matchAll(/^\s*-?\s*uses:\s*(\S+)(.*)$/gm)];
      expect(uses.length).toBeGreaterThan(0);
      for (const [, action, comment] of uses) {
        expect(action, action).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
        expect(comment, action).toMatch(/^ # v\d+\.\d+\.\d+$/);
      }
      expect(readFileSync(join(dir, '_github/dependabot.yml'), 'utf8')).toContain(
        'package-ecosystem: github-actions',
      );
    });

    it('stores no dot file, which npm could drop: `_` names, renamed on creation', () => {
      const dotFiles = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((path) =>
        path.split(/[\\/]/).some((segment) => segment.startsWith('.')),
      );
      expect(dotFiles).toEqual([]);
    });

    it('gives AI coding agents the contract of the SDK, and Claude Code the same file', () => {
      const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
      expect(agents).toMatch(/^# AGENTS\.md\n/);
      expect(agents).toContain('node_modules/@vulog/bo-widget-sdk/AGENTS.md');
      expect(agents).toContain('`aima-api` skill');
      expect(agents).toContain(`/plugin install ${pluginInstall()}`);
      expect(existsSync(join(repoRoot, 'plugins', 'bo-widget', 'skills', 'aima-api'))).toBe(true);
      expect(agents).toContain('plugins/bo-widget/skills/aima-api');
      expect(agents).toContain(packageJson.scripts?.build?.split(' ')[0] ?? 'missing build script');
      expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf8')).toBe('@AGENTS.md\n');
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
        // A lower floor would let npm install an older package than what the README describes.
        expect(
          range,
          `${dependency}: run node scripts/template-floors.mjs (npm run version-packages does it)`,
        ).toBe(`^${workspaceVersion(dependency)}`);
      }
    });
  });
});
