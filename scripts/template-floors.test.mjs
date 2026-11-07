import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isMainModule,
  syncTemplateFloors,
  unreleasedFloorsError,
  withTemplateFloors,
  workspaceVersions,
} from './template-floors.mjs';

const VERSIONS = { '@vulog/bo-widget-sdk': '0.2.0', '@vulog/bo-widget-cli': '0.1.5' };

describe('withTemplateFloors', () => {
  it('raises the @vulog dependencies to the versions of the repository, and nothing else', () => {
    const manifest = {
      name: '{{name}}',
      dependencies: { '@vulog/bo-widget-sdk': '^0.1.0', lit: '^3.0.0' },
      devDependencies: { '@vulog/bo-widget-cli': '^0.1.0-next.0', vite: '^8.0.0' },
    };

    const result = withTemplateFloors(manifest, VERSIONS);

    expect(result.manifest).toEqual({
      name: '{{name}}',
      dependencies: { '@vulog/bo-widget-sdk': '^0.2.0', lit: '^3.0.0' },
      devDependencies: { '@vulog/bo-widget-cli': '^0.1.5', vite: '^8.0.0' },
    });
    expect(result.changed).toEqual([
      '@vulog/bo-widget-sdk ^0.1.0 -> ^0.2.0',
      '@vulog/bo-widget-cli ^0.1.0-next.0 -> ^0.1.5',
    ]);
    expect(manifest.dependencies['@vulog/bo-widget-sdk']).toBe('^0.1.0');
  });

  it('changes nothing when the floors are up to date, or without dependencies', () => {
    expect(
      withTemplateFloors({ dependencies: { '@vulog/bo-widget-sdk': '^0.2.0' } }, VERSIONS).changed,
    ).toEqual([]);
    expect(withTemplateFloors({ name: 'x' }, VERSIONS)).toEqual({
      manifest: { name: 'x' },
      changed: [],
    });
  });

  it('refuses a @vulog package that the repository does not publish', () => {
    expect(() =>
      withTemplateFloors({ dependencies: { '@vulog/unknown': '^1.0.0' } }, VERSIONS),
    ).toThrow('@vulog/unknown is not a package of this repository');
  });
});

describe('syncTemplateFloors', () => {
  const roots = [];

  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  const write = (path, value) => {
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
  };

  it('rewrites the templates that are behind, and reports each change', () => {
    const root = mkdtempSync(join(tmpdir(), 'template-floors-'));
    roots.push(root);
    const packages = join(root, 'packages');
    const templates = join(root, 'templates');
    write(join(packages, 'sdk', 'package.json'), {
      name: '@vulog/bo-widget-sdk',
      version: '0.2.0',
    });
    write(join(templates, 'vue', 'package.json'), {
      dependencies: { '@vulog/bo-widget-sdk': '^0.1.0' },
    });
    write(join(templates, 'lit', 'package.json'), {
      dependencies: { '@vulog/bo-widget-sdk': '^0.2.0' },
    });
    writeFileSync(join(templates, 'README.md'), 'not a template');

    expect(workspaceVersions(packages)).toEqual({ '@vulog/bo-widget-sdk': '0.2.0' });
    expect(syncTemplateFloors(templates, packages)).toEqual([
      'vue: @vulog/bo-widget-sdk ^0.1.0 -> ^0.2.0',
    ]);
    expect(readFileSync(join(templates, 'vue', 'package.json'), 'utf8')).toBe(
      '{\n  "dependencies": {\n    "@vulog/bo-widget-sdk": "^0.2.0"\n  }\n}\n',
    );
    expect(syncTemplateFloors(templates, packages)).toEqual([]);
  });

  it('reads the versions of the packages of this repository', () => {
    expect(Object.keys(workspaceVersions()).sort()).toEqual([
      '@vulog/bo-widget-cli',
      '@vulog/bo-widget-react',
      '@vulog/bo-widget-sdk',
      '@vulog/bo-widget-vite',
      '@vulog/create-bo-widget',
    ]);
  });
});

describe('unreleasedFloorsError', () => {
  const changes = ['vue: @vulog/bo-widget-sdk ^0.1.0 -> ^0.2.0'];

  it('asks for a changeset when the floors changed but create-bo-widget is not released', () => {
    expect(unreleasedFloorsError(changes, '0.1.0', '0.1.0')).toContain(
      'add a changeset for @vulog/create-bo-widget',
    );
  });

  it('accepts changed floors when create-bo-widget is released, and unchanged floors', () => {
    expect(unreleasedFloorsError(changes, '0.1.1', '0.1.0')).toBeNull();
    expect(unreleasedFloorsError([], '0.1.0', '0.1.0')).toBeNull();
  });

  it('says nothing when the committed version is unknown (no git checkout)', () => {
    expect(unreleasedFloorsError(changes, '0.1.0', null)).toBeNull();
  });
});

describe('isMainModule', () => {
  const roots = [];

  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  it('matches the script through a symbolic link of its folder', () => {
    const root = mkdtempSync(join(tmpdir(), 'template-floors-main-'));
    roots.push(root);
    mkdirSync(join(root, 'real'));
    const script = join(root, 'real', 'script.mjs');
    writeFileSync(script, '');
    symlinkSync(join(root, 'real'), join(root, 'link'));

    expect(isMainModule(join(root, 'link', 'script.mjs'), pathToFileURL(script).href)).toBe(true);
    expect(isMainModule(script, pathToFileURL(join(root, 'link', 'script.mjs')).href)).toBe(true);
  });

  it('is false for another script, a missing path or no path', () => {
    const root = mkdtempSync(join(tmpdir(), 'template-floors-main-'));
    roots.push(root);
    const script = join(root, 'script.mjs');
    const other = join(root, 'other.mjs');
    writeFileSync(script, '');
    writeFileSync(other, '');

    expect(isMainModule(other, pathToFileURL(script).href)).toBe(false);
    expect(isMainModule(join(root, 'missing.mjs'), pathToFileURL(script).href)).toBe(false);
    expect(isMainModule(undefined, pathToFileURL(script).href)).toBe(false);
  });
});
