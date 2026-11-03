import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type WidgetManifest,
  type WidgetManifestInput,
  WIDGET_DESCRIPTION_MAX_LENGTH,
  publishedWidgetManifestSchema,
  widgetDescriptionSchema,
  widgetManifestSchema,
} from './index.js';

// Reference manifest of the widget documentation.
const docManifest = () => ({
  manifestVersion: 1,
  id: 'fleet-report',
  name: 'Fleet report',
  description: 'Rapport d’activité de la flotte',
  version: '1.4.2',
  author: { name: 'Example Inc', email: 'dev@example.com' },
  icon: 'icon.svg',
  runtime: { type: 'webcomponent', entry: 'index.js' },
  protocol: { version: 2, minBoVersion: '1.86.0' },
  menu: {
    defaultSection: 'settings',
    defaultTarget: 'Configurations',
    defaultPosition: 'before',
    defaultRoles: ['ROLE_FLEET_MANAGER', 'ROLE_SUPERVISOR'],
    label: { en: 'Fleet report', fr: 'Rapport de flotte' },
  },
  permissions: ['accessToken', 'apiInfo', 'navigate', 'notify'],
  settings: [
    { key: 'apiBaseUrl', type: 'url', required: true, label: { en: 'Middleware URL' } },
    { key: 'currency', type: 'string', default: 'CAD' },
  ],
});

/** Paths of the issues `schema.safeParse(value)` reports, joined with dots. */
const issuePaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('widgetDescriptionSchema', () => {
  it.each([
    ['plain text', 'Rapport d’activité de la flotte'],
    [
      'Markdown',
      '# Fleet report\n\nReport on **fleet** activity:\n\n- list\n- [docs](https://vulog.com)',
    ],
    ['raw HTML, which a consumer must not render', '<img src=x onerror=alert(1)>'],
    ['the maximum length', 'a'.repeat(WIDGET_DESCRIPTION_MAX_LENGTH)],
  ])('accepts %s', (_label, description) => {
    expect(widgetDescriptionSchema.parse(description)).toBe(description);
  });

  it('keeps the description as written, surrounding spaces included', () => {
    expect(widgetDescriptionSchema.parse('  Fleet report\n')).toBe('  Fleet report\n');
  });

  it('rejects one character over the maximum length', () => {
    const result = widgetDescriptionSchema.safeParse('a'.repeat(WIDGET_DESCRIPTION_MAX_LENGTH + 1));
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      `Must be at most ${WIDGET_DESCRIPTION_MAX_LENGTH} characters`,
    ]);
  });

  it('reports a whitespace-only description over the limit as empty only', () => {
    const result = widgetDescriptionSchema.safeParse(' '.repeat(WIDGET_DESCRIPTION_MAX_LENGTH + 1));
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(['Must not be empty']);
  });

  it.each(['', ' ', '\n\t '])('rejects an empty description (%j)', (description) => {
    expect(
      widgetDescriptionSchema.safeParse(description).error?.issues.map((issue) => issue.message),
    ).toEqual(['Must not be empty']);
  });

  it.each([null, undefined, 42, ['Fleet']])('rejects a non-string value (%j)', (value) => {
    expect(widgetDescriptionSchema.safeParse(value).success).toBe(false);
  });
});

describe('publishedWidgetManifestSchema', () => {
  it('keeps description typed as an optional string, input and output', () => {
    expectTypeOf<WidgetManifestInput['description']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<WidgetManifest['description']>().toEqualTypeOf<string | undefined>();
  });

  it('accepts the reference manifest, as widgetManifestSchema reads it', () => {
    expect(publishedWidgetManifestSchema.parse(docManifest())).toEqual(
      widgetManifestSchema.parse(docManifest()),
    );
  });

  it('accepts a manifest without description', () => {
    const manifest: Partial<ReturnType<typeof docManifest>> = docManifest();
    delete manifest.description;
    expect(publishedWidgetManifestSchema.safeParse(manifest).success).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['over the limit', 'a'.repeat(WIDGET_DESCRIPTION_MAX_LENGTH + 1)],
  ])('rejects a description %s, which widgetManifestSchema still reads', (_label, description) => {
    const manifest = { ...docManifest(), description };
    expect(issuePaths(publishedWidgetManifestSchema.safeParse(manifest))).toEqual(['description']);
    expect(widgetManifestSchema.safeParse(manifest).success).toBe(true);
  });

  it('reports a non-string description once', () => {
    const result = publishedWidgetManifestSchema.safeParse({ ...docManifest(), description: 42 });
    expect(issuePaths(result)).toEqual(['description']);
  });

  it('keeps the other manifest rules', () => {
    const result = publishedWidgetManifestSchema.safeParse({
      ...docManifest(),
      id: 'Fleet Report',
      description: '',
    });
    expect(issuePaths(result)).toEqual(['id', 'description']);
  });
});

describe('widgetManifestSchema', () => {
  it('accepts the reference manifest', () => {
    const result = widgetManifestSchema.safeParse(docManifest());
    expect(result.success).toBe(true);
    expect(result.data?.settings[1]).toEqual({
      key: 'currency',
      type: 'string',
      required: false,
      default: 'CAD',
    });
  });

  it('applies defaults to a minimal manifest', () => {
    const result = widgetManifestSchema.parse({
      manifestVersion: 1,
      id: 'hello',
      name: 'Hello',
      version: '0.1.0',
      runtime: { entry: 'index.js' },
      protocol: { version: 2 },
    });
    expect(result.runtime.type).toBe('webcomponent');
    expect(result.permissions).toEqual([]);
    expect(result.settings).toEqual([]);
    expect(result.menu).toBeUndefined();
  });

  it('accepts an iframe widget with a pre-release version', () => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      version: '2.0.0-beta.1',
      runtime: { type: 'iframe', entry: 'index.html' },
    });
    expect(result.success).toBe(true);
  });

  it('trims the name', () => {
    expect(widgetManifestSchema.parse({ ...docManifest(), name: '  Fleet report ' }).name).toBe(
      'Fleet report',
    );
  });

  it.each([
    ['a misspelled root field', { permisions: ['accessToken'] }, ''],
    [
      'an unknown author field',
      { author: { name: 'Example Inc', url: 'https://example.com' } },
      'author',
    ],
    [
      'an unknown runtime field',
      { runtime: { type: 'webcomponent', entry: 'index.js', tag: 'x-a' } },
      'runtime',
    ],
    ['an unknown protocol field', { protocol: { version: 2, maxBoVersion: '2.0.0' } }, 'protocol'],
    ['a misspelled menu field', { menu: { defaultRole: ['ROLE_FLEET_MANAGER'] } }, 'menu'],
    [
      'an unknown setting field',
      { settings: [{ key: 'k', type: 'string', hint: 'x' }] },
      'settings.0',
    ],
  ])('rejects %s instead of dropping it', (_label, patch, path) => {
    const result = widgetManifestSchema.safeParse({ ...docManifest(), ...patch });
    expect(result.error?.issues).toEqual([expect.objectContaining({ code: 'unrecognized_keys' })]);
    expect(issuePaths(result)).toEqual([path]);
  });

  it.each([null, undefined, {}, 'widget.json', []])(
    'rejects a non-manifest value (%j)',
    (value) => {
      expect(widgetManifestSchema.safeParse(value).success).toBe(false);
    },
  );

  it.each([
    '1.4',
    'v1.4.2',
    '01.0.0',
    '1.4.2-',
    '1.4.2.0',
    '',
    ' 1.4.2',
    '1.0.0-01',
    '1.0.0-alpha..1',
    '1.0.0+',
    '1.4.2+build.7',
    '1.4.2-beta.1+build.7',
  ])('rejects version %j', (version) => {
    expect(issuePaths(widgetManifestSchema.safeParse({ ...docManifest(), version }))).toEqual([
      'version',
    ]);
  });

  it.each(['0.0.0', '10.20.30', '1.0.0-alpha.1', '1.0.0-0.3.7', '1.0.0-x-y-z.--'])(
    'accepts version %j',
    (version) => {
      expect(widgetManifestSchema.safeParse({ ...docManifest(), version }).success).toBe(true);
    },
  );

  it('rejects a protocol.minBoVersion that is not semver', () => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      protocol: { version: 2, minBoVersion: '1.86' },
    });
    expect(issuePaths(result)).toEqual(['protocol.minBoVersion']);
  });

  it.each([0, -1, 2.5, '2'])('rejects protocol.version %j', (version) => {
    expect(
      issuePaths(widgetManifestSchema.safeParse({ ...docManifest(), protocol: { version } })),
    ).toEqual(['protocol.version']);
  });

  it('rejects a manifestVersion other than 1', () => {
    expect(
      issuePaths(widgetManifestSchema.safeParse({ ...docManifest(), manifestVersion: 2 })),
    ).toEqual(['manifestVersion']);
  });

  it.each([
    '',
    'Fleet_Report',
    'FleetReport',
    '-fleet',
    'fleet-',
    'fleet--report',
    'fleet report',
    'a'.repeat(64),
  ])('rejects id %j', (id) => {
    expect(issuePaths(widgetManifestSchema.safeParse({ ...docManifest(), id }))).toContain('id');
  });

  it('accepts a 63-character id', () => {
    expect(widgetManifestSchema.safeParse({ ...docManifest(), id: 'a'.repeat(63) }).success).toBe(
      true,
    );
  });

  it('rejects a blank name', () => {
    expect(issuePaths(widgetManifestSchema.safeParse({ ...docManifest(), name: '   ' }))).toEqual([
      'name',
    ]);
  });

  it('rejects an unknown runtime type', () => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      runtime: { type: 'script', entry: 'index.js' },
    });
    expect(issuePaths(result)).toEqual(['runtime.type']);
  });

  it.each([
    { type: 'webcomponent', entry: 'index.html' },
    { type: 'iframe', entry: 'index.js' },
    { type: 'webcomponent', entry: 'main.js' },
    { entry: 'index.html' },
  ])('rejects runtime %j whose entry does not match the type', (runtime) => {
    expect(issuePaths(widgetManifestSchema.safeParse({ ...docManifest(), runtime }))).toEqual([
      'runtime.entry',
    ]);
  });

  it('rejects a missing runtime', () => {
    const manifest: Partial<ReturnType<typeof docManifest>> = docManifest();
    delete manifest.runtime;
    expect(issuePaths(widgetManifestSchema.safeParse(manifest))).toEqual(['runtime']);
  });

  it('defaults menu.defaultRoles to [] (every role)', () => {
    const menu: Partial<ReturnType<typeof docManifest>['menu']> = docManifest().menu;
    delete menu.defaultRoles;
    expect(widgetManifestSchema.parse({ ...docManifest(), menu }).menu?.defaultRoles).toEqual([]);
  });

  it.each([[[42]], [['']], ['ROLE_FLEET_MANAGER']])(
    'rejects menu.defaultRoles %j',
    (defaultRoles) => {
      const result = widgetManifestSchema.safeParse({
        ...docManifest(),
        menu: { ...docManifest().menu, defaultRoles },
      });
      expect(issuePaths(result)[0]).toMatch(/^menu\.defaultRoles/);
    },
  );

  it.each([
    ['defaultSection', ''],
    ['defaultSection', '  '],
    ['defaultTarget', ''],
    ['label', { en: '  ' }],
    ['label', { '': 'Fleet report' }],
    ['defaultRoles', ['  ']],
  ])('rejects a blank menu.%s (%j)', (field, value) => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      menu: { ...docManifest().menu, [field]: value },
    });
    expect(issuePaths(result)[0]).toMatch(new RegExp(`^menu\\.${field}`));
  });

  it('rejects an unknown menu.defaultPosition', () => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      menu: { ...docManifest().menu, defaultPosition: 'inside' },
    });
    expect(issuePaths(result)).toEqual(['menu.defaultPosition']);
  });

  it('rejects an unknown permission', () => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      permissions: ['accessToken', 'storage'],
    });
    expect(issuePaths(result)).toEqual(['permissions.1']);
  });

  it('rejects a duplicate permission', () => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      permissions: ['notify', 'notify'],
    });
    expect(issuePaths(result)).toEqual(['permissions.1']);
  });

  it('rejects an unknown setting type', () => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      settings: [{ key: 'tz', type: 'date' }],
    });
    expect(issuePaths(result)).toEqual(['settings.0.type']);
  });

  it.each(['', '1abc', 'api-base-url', 'api.url', '__proto__', 'constructor', 'prototype'])(
    'rejects setting key %j',
    (key) => {
      const result = widgetManifestSchema.safeParse({
        ...docManifest(),
        settings: [{ key, type: 'string' }],
      });
      expect(issuePaths(result)).toEqual(['settings.0.key']);
    },
  );

  it('rejects a duplicate setting key', () => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      settings: [
        { key: 'currency', type: 'string' },
        { key: 'currency', type: 'string' },
      ],
    });
    expect(issuePaths(result)).toEqual(['settings.1']);
  });

  it.each([
    { type: 'string', default: 42 },
    { type: 'url', default: 'not a url' },
    { type: 'url', default: 42 },
    { type: 'url', default: 'javascript:alert(1)' },
    { type: 'url', default: 'data:text/html,x' },
    { type: 'url', default: 'ftp://files.example.com' },
    { type: 'url', default: '/relative' },
    { type: 'number', default: '42' },
    { type: 'number', default: Number.NaN },
    { type: 'boolean', default: 'true' },
  ])('rejects a default of the wrong type (%j)', (setting) => {
    const result = widgetManifestSchema.safeParse({
      ...docManifest(),
      settings: [{ key: 'k', ...setting }],
    });
    expect(issuePaths(result)).toEqual(['settings.0.default']);
  });

  it.each([
    { type: 'string', default: '' },
    { type: 'url', default: 'https://mw.example.com/api' },
    { type: 'url', default: 'http://localhost:3000' },
    { type: 'number', default: 0 },
    { type: 'boolean', default: false },
  ])('accepts a default of the right type (%j)', (setting) => {
    expect(
      widgetManifestSchema.safeParse({ ...docManifest(), settings: [{ key: 'k', ...setting }] })
        .success,
    ).toBe(true);
  });

  it.each([
    '../icon.svg',
    'assets/../../x.svg',
    '/icon.svg',
    'https://evil.com/icon.svg',
    'data:image/svg+xml,x',
    'a\\b.svg',
    '',
    '%2e%2e/icon.svg',
    '.%2e/icon.svg',
    'assets/%2E%2E/%2e%2e/x.svg',
    '.',
    './icon.svg',
    'assets/./icon.svg',
    'assets/..',
    'assets/',
    'assets//icon.svg',
    'icon.svg?v=2',
    'icon.svg#x',
    'icon\n.svg',
    'icône.svg',
  ])('rejects icon %j', (icon) => {
    expect(issuePaths(widgetManifestSchema.safeParse({ ...docManifest(), icon }))).toContain(
      'icon',
    );
  });

  it.each(['assets/icon.svg', 'icon.v2.svg', '..icon.svg', 'a/b_c/d-e.svg'])(
    'accepts icon %j',
    (icon) => {
      expect(widgetManifestSchema.safeParse({ ...docManifest(), icon }).success).toBe(true);
    },
  );

  it('rejects an author without name or with a bad email', () => {
    expect(
      issuePaths(
        widgetManifestSchema.safeParse({ ...docManifest(), author: { email: 'dev@example.com' } }),
      ),
    ).toEqual(['author.name']);
    expect(
      issuePaths(
        widgetManifestSchema.safeParse({
          ...docManifest(),
          author: { name: 'Example Inc', email: 'not-an-email' },
        }),
      ),
    ).toEqual(['author.email']);
  });
});
