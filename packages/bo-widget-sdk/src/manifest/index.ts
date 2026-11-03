import { z } from 'zod';

/**
 * Schemas of the `widget.json` manifest, with the very rules Vulog applies when a widget is
 * published: check a manifest locally before uploading the widget.
 *
 * Imported from `@vulog/bo-widget-sdk/manifest`, apart from the protocol client, so that a widget
 * bundle that only talks to the back office does not pull in `zod`.
 *
 * Objects are strict: an unknown field is an error, not silently dropped, so a typo such as
 * `permisions` or `role` cannot turn into an empty list or a default.
 *
 * @packageDocumentation
 */

/**
 * A widget version: Semantic Versioning 2.0.0 (semver.org) **without build metadata**: `1.4.2`,
 * `2.0.0-beta.1`, but not `v1.4.2`, `01.0.0` or `1.4.2+build.7`. Build metadata is refused because
 * `1.0.0+a` and `1.0.0+b` have the same precedence, so they would be two "immutable" versions of
 * the same release, and `+` would end up in the widget URLs.
 */
export const WIDGET_VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/;

/** A widget id: lowercase letters and digits, joined by single hyphens (`fleet-report`). */
export const WIDGET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A widget id is a DNS label: 63 characters at most (RFC 1035). */
export const WIDGET_ID_MAX_LENGTH = 63;

/** A widget version (see {@link WIDGET_VERSION_PATTERN}). */
export const widgetVersionSchema = z
  .string()
  .regex(
    WIDGET_VERSION_PATTERN,
    'Must be a semantic version without build metadata (e.g. "1.4.2")',
  );

/** A widget id (`fleet-report`), unique within its publisher's namespace. */
export const widgetIdSchema = z
  .string()
  .min(1)
  .max(WIDGET_ID_MAX_LENGTH)
  .regex(
    WIDGET_ID_PATTERN,
    'Lowercase letters and digits, joined by single hyphens, with no hyphen at either end (e.g. "fleet-report")',
  );

/**
 * A file path inside the widget bundle (`icon.svg`, `assets/logo.png`): `/`-separated segments of
 * letters, digits, `.`, `_` and `-`, none of them `.` or `..`. This allow-list also rules out `%`
 * (so no encoded `%2e%2e`), `?`, `#`, `\`, `:` and a leading or trailing `/`, so the path, resolved
 * as a URL against the version's folder, can never leave it.
 */
export const WIDGET_BUNDLE_PATH_PATTERN =
  /^(?!(?:.*\/)?\.{1,2}(?:\/|$))[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;

const bundlePathSchema = z
  .string()
  .regex(
    WIDGET_BUNDLE_PATH_PATTERN,
    'Must be a relative file path inside the bundle (letters, digits, ".", "_", "-")',
  );

/** A non-blank label per locale (`{ "en": "Fleet report", "fr": "Rapport de flotte" }`). */
const localizedLabelSchema = z.record(z.string().min(1), z.string().trim().min(1));

/** A back office role name; empty means nothing, so it is refused (an empty *list* means every role). */
const roleSchema = z.string().trim().min(1);

/** How the back office runs a widget. */
export const WIDGET_RUNTIME_TYPES = ['webcomponent', 'iframe'] as const;

/** The only entry file accepted for each runtime: an ES module for a Web Component, a page for an iframe. */
export const WIDGET_RUNTIME_ENTRIES = {
  webcomponent: 'index.js',
  iframe: 'index.html',
} as const satisfies Record<(typeof WIDGET_RUNTIME_TYPES)[number], string>;

/** Protocol requests a widget may be granted; the others need no permission. */
export const WIDGET_PERMISSIONS = ['accessToken', 'apiInfo', 'navigate', 'notify'] as const;

/** Value types of an installation setting, which pick the input of the settings form. */
export const WIDGET_SETTING_TYPES = ['string', 'url', 'number', 'boolean'] as const;

/** A setting key: a JavaScript-style identifier, read by the widget through `getSettings`. */
export const WIDGET_SETTING_KEY_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** Keys that would reach `Object.prototype` when settings are copied into a plain object. */
const RESERVED_SETTING_KEYS: readonly string[] = ['__proto__', 'constructor', 'prototype'];

const settingKeySchema = z
  .string()
  .regex(WIDGET_SETTING_KEY_PATTERN, 'Must be an identifier (letters, digits, "_")')
  .refine((key) => !RESERVED_SETTING_KEYS.includes(key), 'Reserved setting key');

const runtimeSchema = z
  .strictObject({
    type: z.enum(WIDGET_RUNTIME_TYPES).default('webcomponent'),
    entry: z.string(),
  })
  .superRefine((runtime, ctx) => {
    const expected = WIDGET_RUNTIME_ENTRIES[runtime.type];
    if (runtime.entry !== expected) {
      ctx.addIssue({
        path: ['entry'],
        code: 'custom',
        message: `A ${runtime.type} widget must use "${expected}" as entry (type defaults to webcomponent)`,
      });
    }
  });

const menuPositionSchema = z.enum(['before', 'after']);

const manifestMenuSchema = z.strictObject({
  defaultSection: z.string().trim().min(1).optional(),
  defaultTarget: z.string().trim().min(1).optional(),
  defaultPosition: menuPositionSchema.optional(),
  /** Back office role names that see the entry; empty or absent means every role. */
  defaultRoles: z.array(roleSchema).default([]),
  label: localizedLabelSchema.optional(),
});

/** True when `value` is an absolute `http:` or `https:` URL; other schemes (`javascript:`, `data:`) are refused. */
const isHttpUrl = (value: string): boolean => {
  // `new URL` rather than `URL.parse`, which older browsers lack.
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

/** True when `value` fits a setting of type `type`. */
const isSettingValueOfType = (
  type: (typeof WIDGET_SETTING_TYPES)[number],
  value: unknown,
): boolean => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'url':
      return typeof value === 'string' && isHttpUrl(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
  }
};

const settingSchema = z
  .strictObject({
    key: settingKeySchema,
    type: z.enum(WIDGET_SETTING_TYPES),
    required: z.boolean().default(false),
    label: localizedLabelSchema.optional(),
    default: z.unknown().optional(),
  })
  .superRefine((setting, ctx) => {
    if (setting.default !== undefined && !isSettingValueOfType(setting.type, setting.default)) {
      ctx.addIssue({
        path: ['default'],
        code: 'custom',
        message: `Default value does not match the setting type "${setting.type}"`,
      });
    }
  });

/** Adds an issue on every item of `items` whose `key(item)` already appeared earlier in the array. */
const refineUnique = <T>(
  items: readonly T[],
  key: (item: T) => string,
  ctx: z.RefinementCtx,
  path: string,
  label: string,
): void => {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const value = key(item);
    if (seen.has(value)) {
      ctx.addIssue({
        path: [path, index],
        code: 'custom',
        message: `Duplicate ${label} "${value}"`,
      });
    }
    seen.add(value);
  });
};

/** Maximum length of a manifest `description`, in UTF-16 code units (`String.length`). */
export const WIDGET_DESCRIPTION_MAX_LENGTH = 2000;

/**
 * `description` of a manifest being published: what the widget does, in Markdown (CommonMark).
 * Every string is valid CommonMark, so nothing is parsed here. Raw HTML is accepted and stored as
 * is: whoever displays the description must render it as Markdown without raw HTML. Not empty nor
 * whitespace only (one issue only), and {@link WIDGET_DESCRIPTION_MAX_LENGTH} UTF-16 code units at
 * most. The value is kept as written, not trimmed.
 */
export const widgetDescriptionSchema = z
  .string()
  .refine((description) => description.trim().length > 0, {
    message: 'Must not be empty',
    abort: true,
  })
  .max(
    WIDGET_DESCRIPTION_MAX_LENGTH,
    `Must be at most ${WIDGET_DESCRIPTION_MAX_LENGTH} characters`,
  );

/** Builds the `widget.json` schema; only the rule on `description` differs between reading and publishing. */
const buildWidgetManifestSchema = (descriptionSchema: z.ZodString) =>
  z
    .strictObject({
      manifestVersion: z.literal(1),
      id: widgetIdSchema,
      name: z.string().trim().min(1),
      description: descriptionSchema.optional(),
      version: widgetVersionSchema,
      author: z
        .strictObject({
          name: z.string().trim().min(1),
          email: z.email().optional(),
        })
        .optional(),
      icon: bundlePathSchema.optional(),
      runtime: runtimeSchema,
      protocol: z.strictObject({
        version: z.int().positive(),
        minBoVersion: widgetVersionSchema.optional(),
      }),
      menu: manifestMenuSchema.optional(),
      permissions: z.array(z.enum(WIDGET_PERMISSIONS)).default([]),
      settings: z.array(settingSchema).default([]),
    })
    .superRefine((manifest, ctx) => {
      refineUnique(
        manifest.permissions,
        (permission) => permission,
        ctx,
        'permissions',
        'permission',
      );
      refineUnique(manifest.settings, (setting) => setting.key, ctx, 'settings', 'setting key');
    });

/**
 * Shape of `widget.json`. Strict: an unknown field, at any level, is an error.
 *
 * Beyond field formats, it enforces that `runtime.entry` matches `runtime.type`, that permissions
 * and setting keys are unique, and that a setting's `default` has the setting's type (`url`: http
 * or https only).
 *
 * It also reads back the manifest of any version already published, so `description` is any
 * string here. To check a manifest about to be published, use
 * {@link publishedWidgetManifestSchema}.
 */
export const widgetManifestSchema = buildWidgetManifestSchema(z.string());

/**
 * `widget.json` as checked on publication: {@link widgetManifestSchema} plus the publication-only
 * rules ({@link widgetDescriptionSchema}).
 *
 * @example
 * ```ts
 * import { publishedWidgetManifestSchema } from '@vulog/bo-widget-sdk/manifest';
 *
 * const result = publishedWidgetManifestSchema.safeParse(JSON.parse(text));
 * if (!result.success) console.error(result.error.issues);
 * ```
 */
export const publishedWidgetManifestSchema = buildWidgetManifestSchema(widgetDescriptionSchema);

/** A parsed `widget.json`, defaults applied. */
export type WidgetManifest = z.infer<typeof widgetManifestSchema>;

/** A `widget.json` as written, before defaults are applied. */
export type WidgetManifestInput = z.input<typeof widgetManifestSchema>;

/** A permission a widget may declare in its manifest. */
export type WidgetPermission = (typeof WIDGET_PERMISSIONS)[number];
