import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { syncTemplateFloors, withTemplateFloors, workspaceVersions } from './template-floors.mjs';

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
