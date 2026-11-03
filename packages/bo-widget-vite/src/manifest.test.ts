import { publishedWidgetManifestSchema } from '@vulog/bo-widget-sdk/manifest';
import { describe, expect, it } from 'vitest';
import { BoWidgetConfigError, buildManifest, type WidgetConfig } from './manifest.js';

const pkg = { name: '@acme/fleet-report', version: '1.4.2' };

const issuesOf = (config: WidgetConfig, packageJson: object = pkg): readonly string[] => {
  try {
    buildManifest(config, packageJson);
  } catch (error) {
    expect(error).toBeInstanceOf(BoWidgetConfigError);
    return (error as BoWidgetConfigError).issues;
  }
  throw new Error('buildManifest did not throw');
};

describe('buildManifest', () => {
  it('builds a Web Component manifest from the config and package.json, defaults applied', () => {
    const manifest = buildManifest({ name: 'Fleet report' }, pkg);

    expect(manifest).toEqual({
      manifestVersion: 1,
      id: 'fleet-report',
      name: 'Fleet report',
      version: '1.4.2',
      runtime: { type: 'webcomponent', entry: 'index.js' },
      protocol: { version: 2 },
      permissions: [],
      settings: [],
    });
    expect(publishedWidgetManifestSchema.safeParse(manifest).success).toBe(true);
  });

  it('builds an iframe manifest with index.html as entry', () => {
    expect(buildManifest({ name: 'Report', runtime: 'iframe' }, pkg).runtime).toEqual({
      type: 'iframe',
      entry: 'index.html',
    });
  });

  it('keeps every field of the config', () => {
    const manifest = buildManifest(
      {
        id: 'fleet-admin',
        name: 'Fleet admin',
        description: 'Manages the **fleet** bookings',
        author: { name: 'ACME', email: 'dev@acme.example' },
        icon: 'icon.svg',
        minBoVersion: '1.86.0',
        menu: {
          defaultSection: 'settings',
          defaultRoles: ['manager'],
          label: { en: 'Fleet admin' },
        },
        permissions: ['apiInfo', 'notify'],
        settings: [{ key: 'currency', type: 'string', default: 'CAD' }],
      },
      pkg,
    );

    expect(manifest).toMatchObject({
      id: 'fleet-admin',
      description: 'Manages the **fleet** bookings',
      author: { name: 'ACME', email: 'dev@acme.example' },
      icon: 'icon.svg',
      protocol: { version: 2, minBoVersion: '1.86.0' },
      menu: { defaultSection: 'settings', defaultRoles: ['manager'], label: { en: 'Fleet admin' } },
      permissions: ['apiInfo', 'notify'],
      settings: [{ key: 'currency', type: 'string', required: false, default: 'CAD' }],
    });
  });

  it('takes the description and the author from package.json when the config has none', () => {
    const manifest = buildManifest(
      { name: 'Report' },
      {
        ...pkg,
        description: 'Fleet KPIs',
        author: 'ACME <dev@acme.example> (https://acme.example)',
      },
    );

    expect(manifest.description).toBe('Fleet KPIs');
    expect(manifest.author).toEqual({ name: 'ACME', email: 'dev@acme.example' });
  });

  it.each([
    ['a name only', 'ACME', { name: 'ACME' }],
    [
      'an object',
      { name: 'ACME', email: 'dev@acme.example', url: 'x' },
      { name: 'ACME', email: 'dev@acme.example' },
    ],
    ['an object without email', { name: 'ACME' }, { name: 'ACME' }],
  ])('reads a package.json author given as %s', (_label, author, expected) => {
    expect(buildManifest({ name: 'Report' }, { ...pkg, author }).author).toEqual(expected);
  });

  it.each([
    ['an empty string', ''],
    ['an email only', '<dev@acme.example>'],
    ['an object without name', { email: 'dev@acme.example' }],
    ['a number', 42],
  ])('ignores a package.json author given as %s', (_label, author) => {
    expect(buildManifest({ name: 'Report' }, { ...pkg, author }).author).toBeUndefined();
  });

  it('prefers the config over package.json', () => {
    const manifest = buildManifest(
      { name: 'Report', description: 'From config', author: { name: 'Config' } },
      { ...pkg, description: 'From package', author: 'Package' },
    );

    expect(manifest.description).toBe('From config');
    expect(manifest.author).toEqual({ name: 'Config' });
  });

  it('refuses an unknown configuration key, such as a typo', () => {
    expect(issuesOf({ name: 'Report', permisions: ['apiInfo'] } as WidgetConfig)).toEqual([
      'permisions: unknown configuration key',
    ]);
  });

  it('refuses a configuration that is not an object', () => {
    expect(issuesOf(null as unknown as WidgetConfig)).toEqual([
      'the widget configuration must be an object',
    ]);
  });

  it('says that the version comes from package.json', () => {
    expect(issuesOf({ name: 'Report' }, { name: 'report', version: 'v1' })).toEqual([
      expect.stringMatching(/^version \(from package\.json\): Must be a semantic version/),
    ]);
    expect(issuesOf({ name: 'Report' }, { name: 'report' })).toEqual([
      expect.stringMatching(/^version \(from package\.json\): /),
    ]);
  });

  it('refuses a missing id', () => {
    expect(issuesOf({ name: 'Report' }, { version: '1.0.0' })).toEqual([
      expect.stringMatching(/^id: /),
    ]);
  });

  it('lists every issue, with its path', () => {
    const issues = issuesOf({
      id: 'Fleet_Report',
      name: ' ',
      runtime: 'popup' as 'iframe',
      settings: [{ key: 'url', type: 'url', default: 'javascript:alert(1)' }],
      menu: { defaultRoles: [''] },
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^id: /),
        expect.stringMatching(/^name: /),
        expect.stringMatching(/^runtime\.type: /),
        'settings.0.default: Default value does not match the setting type "url"',
        expect.stringMatching(/^menu\.defaultRoles\.0: /),
      ]),
    );
  });

  it('refuses a duplicate permission', () => {
    expect(issuesOf({ name: 'Report', permissions: ['notify', 'notify'] })).toEqual([
      'permissions.1: Duplicate permission "notify"',
    ]);
  });

  it('applies the publication rules to the description', () => {
    expect(issuesOf({ name: 'Report', description: '   ' })).toEqual([
      'description: Must not be empty',
    ]);
  });

  it('refuses an unknown field inside the menu', () => {
    expect(issuesOf({ name: 'Report', menu: { role: ['manager'] } as never })).toEqual([
      expect.stringMatching(/^menu: .*role/),
    ]);
  });

  it('formats the issues in the error message', () => {
    expect(() => buildManifest({ name: '' }, pkg)).toThrow(
      /^Invalid widget configuration:\n {2}- name: /,
    );
  });
});
