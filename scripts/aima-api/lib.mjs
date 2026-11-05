import yaml from 'js-yaml';
import {
  EXCLUDED_PATH_SEGMENTS,
  EXCLUDED_TAGS,
  FALLBACK_FILE,
  GATEWAY_BASE_PATH,
  KNOWN_ROOT_SERVICES,
  PRIVATE_HOST_SUFFIX,
  SCHEMAS_FILE,
  SKILL_FILES,
  STANDARD_REFERENCE_PREFIXES,
  TRACKER_KEY_MIN_DIGITS,
} from './config.mjs';

/** HTTP methods rendered, in display order. */
export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** Methods valid in OpenAPI but not rendered: reported as warnings so nothing disappears silently. */
const IGNORED_METHODS = ['head', 'options', 'trace'];

/** Parameter locations, in display order. */
const PARAM_LOCATIONS = ['path', 'query', 'header', 'cookie'];

/**
 * Marker written in every generated file; `generate.mjs` only deletes stale files that carry it.
 */
export const GENERATED_MARKER =
  'Generated from the AIMA swagger by `scripts/aima-api/generate.mjs`';

const NOTE_MAX_LENGTH = 160;
const DESCRIPTION_MAX_LENGTH = 300;
const MAX_REF_HOPS = 20;

/**
 * A first-level field of a schema. `notes` is already a table-safe single line; `type` is
 * escaped when rendered in a table (it may contain `|` for unions).
 *
 * @typedef {{name: string, type: string, required: boolean, notes: string}} Field
 */

/**
 * An operation parameter.
 *
 * @typedef {{name: string, in: string, type: string, required: boolean, notes: string}} Param
 */

/**
 * Something {@link redactReferences} removed from a text: an issue-tracker key or a backend
 * web-service name. Only counted in the warnings, never printed.
 *
 * @typedef {{kind: 'tracker' | 'service', token: string}} Redaction
 */

/**
 * An operation, flattened for rendering. `summary` and `description` are single lines.
 *
 * @typedef {object} Endpoint
 * @property {string} method - uppercase member of {@link HTTP_METHODS}
 * @property {string} path - spec path, e.g. `/fleets/{fleetId}/users/{id}`
 * @property {string | null} basePath - public path the route is relative to: `boapi/proxy`,
 *   `boapi/proxy/user`, `boapi/proxy/fleetmanager/public`, `apiv5`…; `null` when unknown (path
 *   item declaring `servers: []` with a route outside {@link KNOWN_ROOT_SERVICES})
 * @property {string[]} tags - non-empty string tags
 * @property {string} summary
 * @property {string} description
 * @property {boolean} deprecated - `deprecated: true` or the `deprecated` tag (any case)
 * @property {boolean} internal - the `internal` tag (any case) or `x-internal: true`
 * @property {string | null} operationId
 * @property {Param[]} params - path-level parameters overridden by operation-level ones
 * @property {{label: string, fields: Field[]} | null} requestBody
 * @property {{status: string, label: string | null}[]} responses
 * @property {Redaction[]} redacted - what was redacted from its texts (summary, description,
 *   parameters, request body fields)
 */

/**
 * Why an endpoint is left out of the skill (see {@link exclusionReason}).
 *
 * @typedef {'outsideGateway' | 'unknownBasePath' | 'deprecatedOrInternal' | 'excludedTag' |
 *   'excludedPathSegment'} ExclusionReason
 */

/** Every {@link ExclusionReason}, in the order they are checked and reported. */
export const EXCLUSION_REASONS = [
  'unknownBasePath',
  'outsideGateway',
  'deprecatedOrInternal',
  'excludedTag',
  'excludedPathSegment',
];

/**
 * Values injected into the SKILL.md template and written to the sync summary. Counts are those
 * of the generated skill; `excludedCount` is the number of swagger endpoints left out of it, and
 * `excluded` splits it by {@link ExclusionReason}.
 *
 * @typedef {{release: string, openapi: string, endpointCount: number, excludedCount: number,
 *   excluded: Record<ExclusionReason, number>, tagCount: number, schemaCount: number}} SkillStats
 */

/**
 * Parses an OpenAPI document (YAML or JSON text).
 *
 * @param {string} text - raw spec content
 * @returns {object} the parsed spec
 * @throws {Error} when the text is not a YAML/JSON OpenAPI document with `paths`
 */
export function parseSpec(text) {
  if (!text || !text.trim()) throw new Error('Spec is empty');
  const spec = yaml.load(text);
  if (!spec || typeof spec !== 'object' || !spec.openapi) {
    throw new Error('Spec is not an OpenAPI document (missing `openapi` field)');
  }
  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('Spec has no `paths` object');
  }
  return spec;
}

/**
 * Extracts the release label from the spec title (`... - Release 1.66` → `1.66`).
 *
 * @param {object} spec - parsed OpenAPI spec
 * @returns {string} the release, or `info.version`, or `unknown`
 */
export function getRelease(spec) {
  const match = /Release\s+([\w.-]+)/i.exec(spec.info?.title ?? '');
  if (match) return match[1];
  return spec.info?.version ? String(spec.info.version) : 'unknown';
}

/**
 * Returns the component name targeted by a local `$ref`.
 *
 * @param {string} ref - e.g. `#/components/schemas/MobileBook`
 * @returns {string} e.g. `MobileBook`
 */
export function refName(ref) {
  return ref.split('/').pop();
}

/**
 * Follows a local `$ref` inside the spec, including chains of refs.
 *
 * @param {object} spec - parsed OpenAPI spec
 * @param {object | undefined} node - schema/parameter/response that may be a `$ref`
 * @param {string[]} warnings - collects external, unresolved and circular (or longer than 20 hops)
 *   references
 * @returns {object | undefined} the final target, `node` itself when it is not a ref, or
 *   `undefined` when the ref is external, unresolved or circular
 */
export function resolveRef(spec, node, warnings = []) {
  let current = node;
  for (let hops = 0; current?.$ref; hops += 1) {
    const ref = current.$ref;
    if (typeof ref !== 'string' || !ref.startsWith('#/')) {
      warnings.push(`External $ref not supported: ${ref}`);
      return undefined;
    }
    if (hops >= MAX_REF_HOPS) {
      warnings.push(`Circular $ref: ${node.$ref}`);
      return undefined;
    }
    current = ref
      .slice(2)
      .split('/')
      .reduce((target, key) => target?.[key], spec);
    if (!current) {
      warnings.push(`Unresolved $ref: ${ref}`);
      return undefined;
    }
  }
  return current;
}

/**
 * Builds a short, human-readable type label for a schema, without expanding it.
 *
 * @param {object | undefined} schema - OpenAPI schema
 * @returns {string} e.g. `MobileBook`, `Trip[]`, `string (date-time)`, ``string: `A`, `B` ``,
 *   `A | B`, `A & B`
 */
export function schemaLabel(schema) {
  if (!schema) return 'any';
  if (schema.$ref) return refName(schema.$ref);
  for (const combiner of ['oneOf', 'anyOf', 'allOf']) {
    if (Array.isArray(schema[combiner])) {
      const separator = combiner === 'allOf' ? ' & ' : ' | ';
      return schema[combiner].map(schemaLabel).join(separator);
    }
  }
  if (schema.type === 'array') return `${schemaLabel(schema.items)}[]`;
  const type = Array.isArray(schema.type) ? schema.type.join(' | ') : (schema.type ?? 'object');
  const base = schema.format ? `${type} (${schema.format})` : type;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return `${base}: ${schema.enum.map((value) => `\`${value}\``).join(', ')}`;
  }
  return base;
}

/**
 * Flattens a text for a Markdown table cell or a one-line note, after {@link redactReferences}.
 *
 * @param {unknown} text - raw description
 * @param {number} maxLength - truncation length
 * @param {Redaction[]} [found] - collects what was redacted
 * @returns {string} single-line text, pipes escaped, truncated with `…`
 */
export function oneLine(text, maxLength = NOTE_MAX_LENGTH, found = []) {
  if (text === undefined || text === null) return '';
  const flat = redactReferences(String(text), found)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\|/g, '\\|');
  return flat.length > maxLength ? `${flat.slice(0, maxLength - 1).trimEnd()}…` : flat;
}

const TRACKER_KEY = new RegExp(
  `\\b([A-Z][A-Z0-9]+)-\\d{${TRACKER_KEY_MIN_DIGITS},}\\b(\\s*[—:]\\s*)?`,
  'g',
);
const BACKEND_SERVICE_NAME = /\b[A-Za-z]*[a-z][A-Za-z]*WS\b/g;

/**
 * Removes from a description what only makes sense inside the platform team: issue-tracker keys
 * (`ABC-123 — text` gives `text`, `since ABC-123,` gives `since an earlier change,`), and backend
 * web-service names (`fooWS` gives `the backend`). A key needs {@link TRACKER_KEY_MIN_DIGITS}
 * digits and a prefix outside {@link STANDARD_REFERENCE_PREFIXES}, so technical terms (`UTF-8`,
 * `SHA-256`, `ISO-8601`, `HTTP-2`…) are kept.
 *
 * @param {string} text - swagger description or summary
 * @param {Redaction[]} [found] - collects what was redacted (to report counts, never the tokens)
 * @returns {string} the text, redacted
 */
export function redactReferences(text, found = []) {
  return text
    .replace(TRACKER_KEY, (match, prefix, separator) => {
      if (STANDARD_REFERENCE_PREFIXES.includes(prefix)) return match;
      found.push({
        kind: 'tracker',
        token: match.slice(0, match.length - (separator?.length ?? 0)),
      });
      return separator ? '' : 'an earlier change';
    })
    .replace(BACKEND_SERVICE_NAME, (token) => {
      found.push({ kind: 'service', token });
      return 'the backend';
    });
}

const ESCAPED_SUFFIX = PRIVATE_HOST_SUFFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// The suffix must end the host name: `api.local.example.com` and `foo.localhost` are public.
const END_OF_HOST = '(?![\\w-]|\\.[\\w-])';
const PRIVATE_URL = new RegExp(
  `\\bhttps?://[^\\s/?#:"'\`<>]+${ESCAPED_SUFFIX}${END_OF_HOST}(?::\\d+)?([^\\s"'\`<>)\\]]*)`,
  'gi',
);
const PRIVATE_HOST = new RegExp(
  `\\b[\\w-]+(?:\\.[\\w-]+)*${ESCAPED_SUFFIX}${END_OF_HOST}(?::\\d+)?`,
  'gi',
);

/**
 * Removes the private hosts (ending with {@link PRIVATE_HOST_SUFFIX}) from a text: a URL on such a
 * host becomes its admin gateway path (`https://service.example.local:1443/user/x` gives
 * `/boapi/proxy/user/x`), and a bare host name becomes `the admin gateway`.
 *
 * @param {string} text - generated Markdown or a warning
 * @returns {string} the text without any private host
 */
export function sanitizeText(text) {
  return text
    .replace(PRIVATE_URL, (_, rest) => `/${GATEWAY_BASE_PATH}${rest.replace(/\/+$/, '')}`)
    .replace(PRIVATE_HOST, 'the admin gateway');
}

/** Warns about `$ref`s used as property types (not expanded, but they must exist). */
function checkPropertyRefs(spec, property, warnings) {
  for (const candidate of [
    property,
    property?.items,
    ...(property?.oneOf ?? []),
    ...(property?.anyOf ?? []),
  ]) {
    if (candidate?.$ref) resolveRef(spec, candidate, warnings);
  }
}

/**
 * Lists the first-level fields of an object schema, following `$ref` chains and `allOf`.
 *
 * @param {object} spec - parsed OpenAPI spec
 * @param {object | undefined} schema - schema to describe
 * @param {string[]} warnings - collects unresolved/circular references and malformed `required`
 * @param {Set<object>} [visited] - schemas being expanded on the current `allOf` path (guards
 *   circular `allOf`; a base shared by several parts is expanded each time)
 * @param {Redaction[]} [found] - collects what was redacted from the field descriptions
 * @returns {Field[]} fields, in spec order
 */
export function describeFields(spec, schema, warnings = [], visited = new Set(), found = []) {
  const resolved = resolveRef(spec, schema, warnings);
  if (!resolved) return [];
  if (visited.has(resolved)) {
    warnings.push(`Circular allOf: ${schema?.$ref ?? 'inline schema'}`);
    return [];
  }
  let inherited = [];
  if (Array.isArray(resolved.allOf)) {
    visited.add(resolved);
    inherited = resolved.allOf.flatMap((part) =>
      describeFields(spec, part, warnings, visited, found),
    );
    visited.delete(resolved);
  }
  if (resolved.required !== undefined && !Array.isArray(resolved.required)) {
    warnings.push(`Malformed \`required\` (not a list) in ${schema?.$ref ?? 'inline schema'}`);
  }
  const required = new Set(Array.isArray(resolved.required) ? resolved.required : []);
  // Properties declared next to `allOf` belong to the schema too; its `required` applies to all.
  const own = Object.entries(resolved.properties ?? {}).map(([name, property]) => {
    checkPropertyRefs(spec, property, warnings);
    return {
      name,
      type: schemaLabel(property),
      required: required.has(name),
      notes: oneLine(
        [property?.deprecated ? '*(deprecated)*' : '', property?.description ?? '']
          .filter(Boolean)
          .join(' '),
        NOTE_MAX_LENGTH,
        found,
      ),
    };
  });
  return [
    ...inherited.map((field) => (required.has(field.name) ? { ...field, required: true } : field)),
    ...own,
  ];
}

/**
 * Splits an operation's tags into usable names and malformed entries.
 * The STA swagger contains tag lists where a parameter (`- in: path`) was pasted by mistake.
 *
 * @param {unknown} tags - `operation.tags`
 * @returns {{names: string[], malformed: boolean}} non-empty string tags, and whether junk was found
 *   (non-string entries, empty strings, or `tags` defined but not a list)
 */
export function normalizeTags(tags) {
  if (tags === undefined || tags === null) return { names: [], malformed: false };
  if (!Array.isArray(tags)) return { names: [], malformed: true };
  const names = tags.filter((tag) => typeof tag === 'string' && tag.trim() !== '');
  return { names, malformed: names.length !== tags.length };
}

/**
 * Picks the skill file of an endpoint from its tags.
 *
 * @param {string[]} tags - endpoint tags
 * @param {import('./config.mjs').SkillFile[]} files - candidate files, in priority order
 * @returns {{file: string, tag: string | null}} target file and the tag that matched (`null` → fallback)
 */
export function assignFile(tags, files = SKILL_FILES) {
  for (const definition of files) {
    const tag = tags.find(
      (candidate) =>
        definition.tags?.includes(candidate) ||
        (definition.tagPrefix !== undefined && candidate.startsWith(definition.tagPrefix)),
    );
    if (tag) return { file: definition.file, tag };
  }
  return { file: FALLBACK_FILE, tag: null };
}

/**
 * Merges path-level and operation-level parameters: per OpenAPI, an operation parameter
 * overrides the path parameter with the same `name` and `in`.
 *
 * @param {object} spec - parsed OpenAPI spec
 * @param {unknown[]} pathParameters - `pathItem.parameters`
 * @param {unknown[]} operationParameters - `operation.parameters`
 * @param {string} where - `METHOD path`, for warnings
 * @param {string[]} warnings - collects dropped parameters
 * @param {Redaction[]} [found] - collects what was redacted from the parameter descriptions
 * @returns {Param[]} parameters, path-level order first
 */
export function mergeParameters(
  spec,
  pathParameters,
  operationParameters,
  where,
  warnings = [],
  found = [],
) {
  const merged = new Map();
  for (const list of [pathParameters, operationParameters]) {
    if (list === undefined || list === null) continue;
    if (!Array.isArray(list)) {
      warnings.push(`Malformed parameters (not a list) on ${where}`);
      continue;
    }
    for (const raw of list) {
      const parameter = resolveRef(spec, raw, warnings);
      if (!parameter || typeof parameter.name !== 'string') {
        warnings.push(`Parameter without a name dropped on ${where}`);
        continue;
      }
      merged.set(`${parameter.in}:${parameter.name}`, {
        name: parameter.name,
        in: parameter.in,
        type: schemaLabel(parameter.schema),
        required: Boolean(parameter.required),
        notes: oneLine(parameter.description, NOTE_MAX_LENGTH, found),
      });
    }
  }
  return [...merged.values()];
}

function firstJsonSchema(content) {
  if (!content) return undefined;
  const mediaType =
    Object.keys(content).find((type) => type.includes('json')) ?? Object.keys(content)[0];
  return content[mediaType]?.schema;
}

function hasTag(tags, name) {
  return tags.some((tag) => tag.toLowerCase() === name);
}

function collectOperation(spec, path, item, method, basePath, warnings) {
  const where = `${method.toUpperCase()} ${path}`;
  const operation = item[method];
  const redacted = [];
  const { names: tags, malformed } = normalizeTags(operation.tags);
  if (malformed) warnings.push(`Malformed tags on ${where}`);
  const params = mergeParameters(
    spec,
    item.parameters,
    operation.parameters,
    where,
    warnings,
    redacted,
  );
  for (const param of params) {
    if (!PARAM_LOCATIONS.includes(param.in)) {
      warnings.push(`Parameter \`${param.name}\` with unknown location "${param.in}" on ${where}`);
    }
  }
  const bodySchema = firstJsonSchema(resolveRef(spec, operation.requestBody, warnings)?.content);
  return {
    method: method.toUpperCase(),
    path,
    basePath,
    tags,
    summary: oneLine(operation.summary, DESCRIPTION_MAX_LENGTH, redacted),
    description: oneLine(operation.description, DESCRIPTION_MAX_LENGTH, redacted),
    deprecated: Boolean(operation.deprecated) || hasTag(tags, 'deprecated'),
    internal: hasTag(tags, 'internal') || operation['x-internal'] === true,
    operationId: operation.operationId ?? null,
    params,
    requestBody: bodySchema
      ? {
          label: schemaLabel(bodySchema),
          fields: describeFields(spec, bodySchema, warnings, new Set(), redacted),
        }
      : null,
    responses: Object.entries(operation.responses ?? {}).map(([status, response]) => {
      const schema = firstJsonSchema(resolveRef(spec, response, warnings)?.content);
      return { status, label: schema ? schemaLabel(schema) : null };
    }),
    redacted,
  };
}

/**
 * Default value of a server variable. The AIMA swagger writes `variables` either as an object
 * (`{ basePath: { default } }`) or as a list (`[{ basePath: null, default }]`).
 *
 * @param {unknown} variables - `servers[].variables`
 * @param {string} name - variable name
 * @returns {string | undefined} its default, when there is one
 */
function variableDefault(variables, name) {
  if (Array.isArray(variables)) {
    const entry = variables.find((item) => item && typeof item === 'object' && name in item);
    return typeof entry?.default === 'string' ? entry.default : undefined;
  }
  const value = variables?.[name]?.default;
  return typeof value === 'string' ? value : undefined;
}

/**
 * Public base path of a route, from the first server it (or the spec) declares:
 * - variables of the URL (`{basePath}`, `{region}`…) are replaced by their default;
 * - a private service (host ending with {@link PRIVATE_HOST_SUFFIX}) is reached through the
 *   admin gateway: `https://service.example.local:1443/user` gives `boapi/proxy/user`;
 * - any other URL gives its path: `https://api-{region}.example.com/boapi/proxy/fleetmanager/public`
 *   gives `boapi/proxy/fleetmanager/public`; one without path gives `fallback`, with a warning.
 *
 * @param {unknown} servers - `servers` of a path item or of the spec
 * @param {string} fallback - base path when no usable server is declared
 * @param {string} where - path or `spec`, for the warning
 * @param {string[]} warnings - collects an unreadable server URL, a path variable without default
 *   and a public server URL without path
 * @returns {string} base path, without leading or trailing `/`
 */
export function resolveBasePath(servers, fallback, where, warnings = []) {
  const server = Array.isArray(servers) ? servers[0] : undefined;
  if (typeof server?.url !== 'string') return fallback;
  // A variable without default becomes a placeholder token, to find out below where it sits.
  const missing = [];
  const url = server.url.replace(/\{([^}]+)\}/g, (_, name) => {
    const value = variableDefault(server.variables, name);
    if (value !== undefined) return value;
    missing.push({ name, token: `unresolvedvariable${missing.length}` });
    return missing.at(-1).token;
  });
  let parsed;
  try {
    // A relative server URL (`/apiv5`) is relative to the spec's host: only its path matters here.
    parsed = new URL(url, 'https://relative.invalid');
  } catch {
    warnings.push(`Unreadable server URL "${server.url}" on ${where}, base path /${fallback} used`);
    return fallback;
  }
  const path = parsed.pathname.replace(/^\/+|\/+$/g, '');
  // A variable without default is harmless in the host, which is not rendered, but not in the path.
  const unresolved = missing
    .filter(({ token }) => parsed.pathname.includes(token))
    .map(({ name }) => name);
  if (unresolved.length > 0) {
    warnings.push(
      `Server variable without default {${unresolved.join('}, {')}} in the path of "${server.url}" on ${where}, base path /${fallback} used`,
    );
    return fallback;
  }
  if (parsed.hostname.endsWith(PRIVATE_HOST_SUFFIX)) {
    return path ? `${GATEWAY_BASE_PATH}/${path}` : GATEWAY_BASE_PATH;
  }
  if (!path) {
    warnings.push(
      `Server URL "${server.url}" without path on ${where}, base path /${fallback} used`,
    );
    return fallback;
  }
  return path;
}

function routeSegments(path) {
  return path.split('/').filter(Boolean);
}

/**
 * Drops the service segment that a route repeats: a private service declared as
 * `https://service.example.local:1443/business` with the route `/business/fleets/...` is called as
 * `boapi/proxy/business/fleets/...`, not `boapi/proxy/business/business/fleets/...`.
 *
 * @param {string} basePath - resolved base path
 * @param {string} path - spec route
 * @returns {string} the base path without its last segment when the route starts with it
 */
function dropRepeatedService(basePath, path, warnings = []) {
  if (basePath === GATEWAY_BASE_PATH || !basePath.startsWith(`${GATEWAY_BASE_PATH}/`)) {
    return basePath;
  }
  const segments = basePath.split('/');
  if (segments.at(-1) !== routeSegments(path)[0]) return basePath;
  const shortened = segments.slice(0, -1).join('/');
  const warning = `Base path /${basePath} shortened to /${shortened}: its routes repeat the service (/${segments.at(-1)}/...)`;
  if (!warnings.includes(warning)) warnings.push(warning);
  return shortened;
}

/**
 * Base path of a path item. An empty `servers` list says nothing about where the route is served:
 * it is reached through the admin gateway only when its first segment is one of
 * {@link KNOWN_ROOT_SERVICES}, otherwise its base path is unknown (`null`).
 */
function pathItemBasePath(item, path, specBasePath, warnings) {
  if (Array.isArray(item.servers) && item.servers.length === 0) {
    return KNOWN_ROOT_SERVICES.includes(routeSegments(path)[0]) ? GATEWAY_BASE_PATH : null;
  }
  return dropRepeatedService(
    resolveBasePath(item.servers, specBasePath, path, warnings),
    path,
    warnings,
  );
}

/**
 * Flattens `spec.paths` into a list of endpoints with everything the Markdown needs.
 *
 * @param {object} spec - parsed OpenAPI spec
 * @param {string[]} warnings - collects everything skipped or malformed
 * @returns {Endpoint[]} endpoints
 * @throws {Error} with the `METHOD path` in the message when an operation cannot be read
 */
export function collectEndpoints(spec, warnings = []) {
  const endpoints = [];
  const specBasePath = resolveBasePath(spec.servers, GATEWAY_BASE_PATH, 'spec', warnings);
  for (const [path, item] of Object.entries(spec.paths)) {
    if (!item || typeof item !== 'object') {
      warnings.push(`Path item is not an object, skipped: ${path}`);
      continue;
    }
    const basePath = pathItemBasePath(item, path, specBasePath, warnings);
    for (const method of IGNORED_METHODS) {
      if (item[method]) warnings.push(`Method not rendered: ${method.toUpperCase()} ${path}`);
    }
    for (const method of HTTP_METHODS) {
      if (!item[method]) continue;
      if (basePath === null) {
        warnings.push(
          `Empty servers on ${method.toUpperCase()} ${path}: base path unknown, left out`,
        );
      }
      try {
        endpoints.push(collectOperation(spec, path, item, method, basePath, warnings));
      } catch (error) {
        throw new Error(`Cannot read ${method.toUpperCase()} ${path}: ${error.message}`, {
          cause: error,
        });
      }
    }
  }
  return endpoints;
}

function isUnderGateway(basePath) {
  return (
    typeof basePath === 'string' &&
    (basePath === GATEWAY_BASE_PATH || basePath.startsWith(`${GATEWAY_BASE_PATH}/`))
  );
}

/**
 * Tells why a widget cannot call an endpoint with `bo.authFetch`, checking in the order of
 * {@link EXCLUSION_REASONS}: its base path is unknown or not under the admin gateway
 * ({@link GATEWAY_BASE_PATH}), it is deprecated or internal, it carries one of
 * {@link EXCLUDED_TAGS} (any case), or its route or base path has one of
 * {@link EXCLUDED_PATH_SEGMENTS}.
 *
 * @param {Endpoint} endpoint - item of {@link collectEndpoints}
 * @returns {ExclusionReason | null} the first reason found, `null` when the endpoint belongs in the skill
 */
export function exclusionReason(endpoint) {
  if (endpoint.basePath === null) return 'unknownBasePath';
  if (!isUnderGateway(endpoint.basePath)) return 'outsideGateway';
  if (endpoint.deprecated || endpoint.internal) return 'deprecatedOrInternal';
  if (EXCLUDED_TAGS.some((excluded) => hasTag(endpoint.tags, excluded))) return 'excludedTag';
  const segments = [...endpoint.basePath.split('/'), ...routeSegments(endpoint.path)];
  if (segments.some((segment) => EXCLUDED_PATH_SEGMENTS.includes(segment))) {
    return 'excludedPathSegment';
  }
  return null;
}

/**
 * Tells whether a widget can call an endpoint with `bo.authFetch` (see {@link exclusionReason}).
 *
 * @param {Endpoint} endpoint - item of {@link collectEndpoints}
 * @returns {boolean} true when the endpoint belongs in the skill
 */
export function isWidgetEndpoint(endpoint) {
  return exclusionReason(endpoint) === null;
}

/**
 * Path to pass to `bo.authFetch`: the base path after the admin gateway, then the route, with
 * duplicate slashes collapsed (`fleetadmin//fleets` gives `fleetadmin/fleets`).
 *
 * @param {Endpoint} endpoint - endpoint under {@link GATEWAY_BASE_PATH}
 * @returns {string} e.g. `fleetmanager/public/fleets/{fleetId}/vehicles`
 * @throws {Error} when the endpoint is not served under the admin gateway
 */
export function authFetchPath(endpoint) {
  const { basePath, path } = endpoint;
  if (!isUnderGateway(basePath)) {
    const where = basePath === null ? 'base path unknown' : `/${basePath}`;
    throw new Error(`Not under /${GATEWAY_BASE_PATH}: ${endpoint.method} ${path} (${where})`);
  }
  const service = basePath.slice(GATEWAY_BASE_PATH.length + 1);
  return [service, path]
    .join('/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '');
}

/**
 * Names of the `components.schemas` reachable from some spec nodes, following every local `$ref`
 * (parameters, request bodies, responses, nested schemas) transitively.
 *
 * @param {object} spec - parsed OpenAPI spec
 * @param {unknown[]} roots - nodes to walk, e.g. operations and path-level parameters
 * @returns {Set<string>} schema names
 */
export function collectSchemaNames(spec, roots) {
  const names = new Set();
  const seen = new Set();
  const pending = [...roots];
  while (pending.length > 0) {
    const node = pending.pop();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    const ref = node.$ref;
    if (typeof ref === 'string' && ref.startsWith('#/')) {
      // One hop at a time, so every schema of a `$ref` chain is listed.
      const target = ref
        .slice(2)
        .split('/')
        .reduce((current, key) => current?.[key], spec);
      if (target && ref.startsWith('#/components/schemas/')) names.add(refName(ref));
      pending.push(target);
    }
    pending.push(...Object.values(node));
  }
  return names;
}

function fieldsTable(fields) {
  const rows = fields.map(
    (field) =>
      `| ${field.name} | ${field.type.replace(/\|/g, '\\|')} | ${field.required ? 'yes' : 'no'} | ${field.notes} |`,
  );
  return [
    '| Field | Type | Required | Notes |',
    '|-------|------|----------|-------|',
    ...rows,
  ].join('\n');
}

function paramsList(params) {
  return params
    .map((param) => {
      const flag = param.required ? 'required' : 'optional';
      const notes = param.notes ? ` — ${param.notes}` : '';
      return `- \`${param.name}\`: ${param.type} (${flag})${notes}`;
    })
    .join('\n');
}

/**
 * True for the `x-user-id` header: the gateway reads the user from the token, so the caller
 * never sends it.
 *
 * @param {{name: string, in: string}} param - endpoint param
 * @returns {boolean} whether the param is the `x-user-id` header
 */
const isUserIdHeader = (param) => param.in === 'header' && param.name.toLowerCase() === 'x-user-id';

/**
 * Renders one endpoint as a Markdown section. The `x-user-id` header is not listed: when the
 * spec requires it, the section says that the endpoint needs a user token instead.
 *
 * @param {Endpoint} endpoint - endpoint under {@link GATEWAY_BASE_PATH}
 * @returns {string} Markdown, starting with `### METHOD \`path\``
 * @throws {Error} when the endpoint is not served under the admin gateway
 */
export function renderEndpoint(endpoint) {
  const lines = [`### ${endpoint.method} \`${endpoint.path}\``];
  if (endpoint.summary) lines.push(endpoint.summary);
  if (endpoint.description && endpoint.description !== endpoint.summary) {
    lines.push('', endpoint.description);
  }
  lines.push(
    '',
    `authFetch path: \`${authFetchPath(endpoint)}\` (base path \`/${endpoint.basePath}\`)`,
  );
  if (endpoint.params.some((param) => isUserIdHeader(param) && param.required)) {
    lines.push('', '**Auth:** needs a user token.');
  }
  for (const location of PARAM_LOCATIONS) {
    const params = endpoint.params.filter(
      (param) => param.in === location && !isUserIdHeader(param),
    );
    if (params.length > 0) {
      const label = location.charAt(0).toUpperCase() + location.slice(1);
      lines.push('', `**${label} params:**`, paramsList(params));
    }
  }
  if (endpoint.requestBody) {
    lines.push('', `**Request body:** \`${endpoint.requestBody.label}\``);
    if (endpoint.requestBody.fields.length > 0) {
      lines.push(fieldsTable(endpoint.requestBody.fields));
    }
  }
  if (endpoint.responses.length > 0) {
    const responses = endpoint.responses
      .map(({ status, label }) => (label ? `\`${status}\` → \`${label}\`` : `\`${status}\``))
      .join(', ');
    lines.push('', `**Responses:** ${responses}`);
  }
  return lines.join('\n');
}

function compareEndpoints(a, b) {
  if (a.path !== b.path) return a.path < b.path ? -1 : 1;
  return (
    HTTP_METHODS.indexOf(a.method.toLowerCase()) - HTTP_METHODS.indexOf(b.method.toLowerCase())
  );
}

/**
 * Renders a generated endpoint file, one `##` section per tag, sections and endpoints sorted
 * so the output does not depend on the order of the spec.
 *
 * @param {import('./config.mjs').SkillFile} definition - target file
 * @param {{endpoint: Endpoint, section: string}[]} entries - endpoints of this file and their section tag
 * @returns {string} Markdown content, ending with a newline
 * @throws {Error} when an endpoint is not served under the admin gateway
 */
export function renderEndpointFile(definition, entries) {
  const sections = new Map();
  for (const { endpoint, section } of entries) {
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section).push(endpoint);
  }
  const parts = [
    `# ${definition.title}`,
    '',
    `> ${GENERATED_MARKER} — do not edit by hand.`,
    '> Schema names in backticks are described in `schemas.md`.',
  ];
  for (const name of [...sections.keys()].sort((a, b) => a.localeCompare(b))) {
    const endpoints = sections.get(name).sort(compareEndpoints);
    const count = endpoints.length === 1 ? '1 endpoint' : `${endpoints.length} endpoints`;
    parts.push('', `## ${name} (${count})`, '', endpoints.map(renderEndpoint).join('\n\n'));
  }
  return `${parts.join('\n')}\n`;
}

/**
 * Renders `components.schemas` with their first-level fields.
 *
 * @param {object} spec - parsed OpenAPI spec
 * @param {string[]} warnings - collects unresolved/circular references
 * @param {Iterable<string>} [names] - schemas to render (default: all of them); unknown names are
 *   skipped
 * @param {Redaction[]} [found] - collects what was redacted from the descriptions
 * @returns {string} Markdown content, one `### Name` section per schema
 * @throws {Error} with the schema name in the message when a schema cannot be read
 */
export function renderSchemas(
  spec,
  warnings = [],
  names = Object.keys(spec.components?.schemas ?? {}),
  found = [],
) {
  const schemas = spec.components?.schemas ?? {};
  const parts = [
    '# AIMA API Schemas',
    '',
    `> ${GENERATED_MARKER} — do not edit by hand.`,
    '> First-level fields only: follow the type names to go deeper. Search with `### <SchemaName>`.',
  ];
  const selected = [...names].filter((name) => Object.hasOwn(schemas, name));
  for (const name of selected.sort((a, b) => a.localeCompare(b))) {
    const schema = schemas[name];
    parts.push('', `### ${name}`);
    if (schema?.description) {
      parts.push(oneLine(schema.description, DESCRIPTION_MAX_LENGTH, found));
    }
    try {
      const ref = { $ref: `#/components/schemas/${name}` };
      const fields = describeFields(spec, ref, warnings, new Set(), found);
      parts.push(fields.length > 0 ? fieldsTable(fields) : `Type: ${schemaLabel(schema)}`);
    } catch (error) {
      throw new Error(`Cannot read schema ${name}: ${error.message}`, { cause: error });
    }
  }
  return `${parts.join('\n')}\n`;
}

/**
 * Replaces `{{key}}` placeholders in the SKILL.md template.
 *
 * @param {string} template - template text
 * @param {Record<string, string | number>} values - placeholder values
 * @returns {string} rendered text
 * @throws {Error} when a placeholder has no value
 */
export function renderTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Missing template value: ${placeholder}`);
    return String(values[key]);
  });
}

/**
 * Tells whether a tag was claimed by the `tagPrefix` of a file without being one of its
 * `expectedTags`: a new admin area, to map or to list.
 */
function isUnexpectedPrefixTag(file, tag) {
  const definition = SKILL_FILES.find((candidate) => candidate.file === file);
  if (!definition?.tagPrefix || definition.tags?.includes(tag)) return false;
  return !(definition.expectedTags ?? []).includes(tag);
}

/**
 * Groups the widget endpoints by skill file, and warns about untagged and unmapped ones, and about
 * tags caught by a prefix but not expected.
 *
 * @param {Endpoint[]} endpoints - endpoints kept by {@link isWidgetEndpoint}
 * @param {string[]} warnings - collects untagged endpoints, unmapped and unexpected tags
 * @returns {Map<string, {endpoint: Endpoint, section: string}[]>} file name → entries
 */
function groupByFile(endpoints, warnings) {
  const byFile = new Map(SKILL_FILES.map((definition) => [definition.file, []]));
  const unmappedTags = new Set();
  const unexpectedTags = new Map();
  for (const endpoint of endpoints) {
    const { file, tag } = assignFile(endpoint.tags);
    if (!tag) endpoint.tags.forEach((unknown) => unmappedTags.add(unknown));
    if (tag && isUnexpectedPrefixTag(file, tag)) unexpectedTags.set(tag, file);
    if (endpoint.tags.length === 0) {
      warnings.push(
        `Untagged endpoint (sent to ${FALLBACK_FILE}): ${endpoint.method} ${endpoint.path}`,
      );
    }
    byFile.get(file).push({ endpoint, section: tag ?? endpoint.tags[0] ?? 'Untagged' });
  }
  for (const tag of [...unmappedTags].sort()) {
    warnings.push(
      `Tag not mapped in scripts/aima-api/config.mjs (sent to ${FALLBACK_FILE}): ${tag}`,
    );
  }
  for (const [tag, file] of [...unexpectedTags].sort(([a], [b]) => a.localeCompare(b))) {
    warnings.push(
      `New tag sent to ${file} by prefix: ${tag} (give it a file or add it to its expectedTags in scripts/aima-api/config.mjs)`,
    );
  }
  return byFile;
}

/**
 * Checks that the skill is not empty nor shrunk: at least one endpoint is kept, and every file of
 * {@link SKILL_FILES} but {@link FALLBACK_FILE} receives at least one.
 *
 * @throws {Error} naming the empty files
 */
function checkNotShrunk(endpoints, byFile) {
  if (endpoints.length === 0) {
    throw new Error('No endpoint a widget can call in the swagger: wrong spec or scope rules');
  }
  const empty = SKILL_FILES.filter(
    (definition) => definition.file !== FALLBACK_FILE && byFile.get(definition.file).length === 0,
  ).map((definition) => `${definition.file} (tags: ${definition.tags?.join(', ')})`);
  if (empty.length > 0) {
    throw new Error(
      `No endpoint for ${empty.join('; ')}: tags renamed or removed in the swagger? Update scripts/aima-api/config.mjs`,
    );
  }
}

/**
 * Warnings counting what was redacted in a file: the tokens themselves may be internal, so they
 * are never printed.
 *
 * @param {string} file - generated file name
 * @param {Redaction[]} found - redactions of its content
 * @returns {string[]} one warning per kind with at least one distinct token
 */
function redactionWarnings(file, found) {
  const distinct = (kind) =>
    new Set(found.filter((item) => item.kind === kind).map((item) => item.token)).size;
  const trackers = distinct('tracker');
  const services = distinct('service');
  return [
    trackers > 0 ? `Redacted ${trackers} tracker reference(s) in ${file}` : null,
    services > 0 ? `Replaced ${services} backend service name(s) in ${file}` : null,
  ].filter(Boolean);
}

/**
 * Generates every file of the `aima-api` skill from a parsed spec: only the endpoints a widget can
 * call ({@link isWidgetEndpoint}) and the schemas they reach. Every file goes through
 * {@link sanitizeText}, and every warning through {@link redactReferences} and
 * {@link sanitizeText}, so no private host nor internal reference can leak into the skill or the
 * sync PR.
 *
 * @param {object} spec - parsed OpenAPI spec
 * @param {string} template - SKILL.md template
 * @returns {{files: Map<string, string>, warnings: string[], stats: SkillStats}} file name → content,
 *   deduplicated warnings to surface in the sync PR, and the release/counts
 * @throws {Error} when an operation, a schema or a template placeholder cannot be rendered, when no
 *   endpoint is kept, or when a file other than {@link FALLBACK_FILE} gets no endpoint
 */
export function buildSkill(spec, template) {
  const warnings = [];
  const all = collectEndpoints(spec, warnings);
  const excluded = Object.fromEntries(EXCLUSION_REASONS.map((reason) => [reason, 0]));
  const endpoints = all.filter((endpoint) => {
    const reason = exclusionReason(endpoint);
    if (reason) excluded[reason] += 1;
    return reason === null;
  });
  const byFile = groupByFile(endpoints, warnings);
  checkNotShrunk(endpoints, byFile);

  const files = new Map();
  const tableRows = [];
  for (const definition of SKILL_FILES) {
    const entries = byFile.get(definition.file);
    files.set(definition.file, renderEndpointFile(definition, entries));
    tableRows.push(`| \`${definition.file}\` | ${definition.summary} | ${entries.length} |`);
    const found = entries.flatMap(({ endpoint }) => endpoint.redacted);
    warnings.push(...redactionWarnings(definition.file, found));
  }
  const roots = endpoints.flatMap(({ method, path }) => [
    spec.paths[path].parameters,
    spec.paths[path][method.toLowerCase()],
  ]);
  const schemaNames = collectSchemaNames(spec, roots);
  const schemaRedactions = [];
  files.set(SCHEMAS_FILE, renderSchemas(spec, warnings, schemaNames, schemaRedactions));
  warnings.push(...redactionWarnings(SCHEMAS_FILE, schemaRedactions));
  tableRows.push(
    `| \`${SCHEMAS_FILE}\` | Request/response schemas used by these endpoints (first-level fields) | ${schemaNames.size} schemas |`,
  );

  /** @type {SkillStats} */
  const stats = {
    release: getRelease(spec),
    openapi: String(spec.openapi),
    endpointCount: endpoints.length,
    excludedCount: all.length - endpoints.length,
    excluded,
    tagCount: new Set(endpoints.flatMap((endpoint) => endpoint.tags)).size,
    schemaCount: schemaNames.size,
  };
  if (stats.release === 'unknown')
    warnings.push('Release not found in info.title nor info.version');
  files.set('SKILL.md', renderTemplate(template, { ...stats, fileTable: tableRows.join('\n') }));
  for (const [name, content] of files) files.set(name, sanitizeText(content));
  const cleanWarnings = warnings.map((warning) => sanitizeText(redactReferences(warning)));
  return { files, warnings: [...new Set(cleanWarnings)], stats };
}
