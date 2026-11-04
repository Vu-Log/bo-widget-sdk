import yaml from 'js-yaml';
import {
  EXCLUDED_PATH_SEGMENTS,
  EXCLUDED_TAGS,
  FALLBACK_FILE,
  GATEWAY_BASE_PATH,
  PRIVATE_HOST_SUFFIX,
  SCHEMAS_FILE,
  SKILL_FILES,
  STANDARD_REFERENCE_PREFIXES,
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
 * An operation, flattened for rendering. `summary` and `description` are single lines.
 *
 * @typedef {object} Endpoint
 * @property {string} method - uppercase member of {@link HTTP_METHODS}
 * @property {string} path - spec path, e.g. `/fleets/{fleetId}/users/{id}`
 * @property {string} basePath - public path the route is relative to: `boapi/proxy`,
 *   `boapi/proxy/user`, `boapi/proxy/fleetmanager/public`, `apiv5`…
 * @property {string[]} tags - non-empty string tags
 * @property {string} summary
 * @property {string} description
 * @property {boolean} deprecated - `deprecated: true` or the `deprecated` tag
 * @property {boolean} internal - the `internal` tag or `x-internal: true`
 * @property {string | null} operationId
 * @property {Param[]} params - path-level parameters overridden by operation-level ones
 * @property {{label: string, fields: Field[]} | null} requestBody
 * @property {{status: string, label: string | null}[]} responses
 */

/**
 * Values injected into the SKILL.md template and written to the sync summary. Counts are those
 * of the generated skill; `excludedCount` is the number of swagger endpoints left out of it.
 *
 * @typedef {{release: string, openapi: string, endpointCount: number, excludedCount: number,
 *   tagCount: number, schemaCount: number}} SkillStats
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
 * Flattens a text for a Markdown table cell or a one-line note.
 *
 * @param {unknown} text - raw description
 * @param {number} maxLength - truncation length
 * @returns {string} single-line text, pipes escaped, truncated with `…`
 */
export function oneLine(text, maxLength = NOTE_MAX_LENGTH) {
  if (text === undefined || text === null) return '';
  const flat = redactReferences(String(text)).replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
  return flat.length > maxLength ? `${flat.slice(0, maxLength - 1).trimEnd()}…` : flat;
}

const TRACKER_KEY = /\b([A-Z][A-Z0-9]+)-\d+\b(\s*[—:]\s*)?/g;
const BACKEND_SERVICE_NAME = /\b[A-Za-z]*[a-z][A-Za-z]*WS\b/g;

/**
 * Removes from a description what only makes sense inside the platform team: issue-tracker keys
 * (`ABC-123 — text` gives `text`, `since ABC-123,` gives `since an earlier change,`), except the
 * standard references of {@link STANDARD_REFERENCE_PREFIXES}, and backend web-service names
 * (`fooWS` gives `the backend`).
 *
 * @param {string} text - swagger description or summary
 * @returns {string} the text, redacted
 */
export function redactReferences(text) {
  return text
    .replace(TRACKER_KEY, (match, prefix, separator) => {
      if (STANDARD_REFERENCE_PREFIXES.includes(prefix)) return match;
      return separator ? '' : 'an earlier change';
    })
    .replace(BACKEND_SERVICE_NAME, 'the backend');
}

const ESCAPED_SUFFIX = PRIVATE_HOST_SUFFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PRIVATE_URL = new RegExp(
  `\\bhttps?://[^\\s/?#:"'\`<>]+${ESCAPED_SUFFIX}(?::\\d+)?([^\\s"'\`<>)\\]]*)`,
  'gi',
);
const PRIVATE_HOST = new RegExp(`\\b[\\w-]+(?:\\.[\\w-]+)*${ESCAPED_SUFFIX}\\b(?::\\d+)?`, 'gi');

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
 * @returns {Field[]} fields, in spec order
 */
export function describeFields(spec, schema, warnings = [], visited = new Set()) {
  const resolved = resolveRef(spec, schema, warnings);
  if (!resolved) return [];
  if (visited.has(resolved)) {
    warnings.push(`Circular allOf: ${schema?.$ref ?? 'inline schema'}`);
    return [];
  }
  let inherited = [];
  if (Array.isArray(resolved.allOf)) {
    visited.add(resolved);
    inherited = resolved.allOf.flatMap((part) => describeFields(spec, part, warnings, visited));
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
 * @returns {Param[]} parameters, path-level order first
 */
export function mergeParameters(spec, pathParameters, operationParameters, where, warnings = []) {
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
        notes: oneLine(parameter.description),
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

function collectOperation(spec, path, item, method, basePath, warnings) {
  const where = `${method.toUpperCase()} ${path}`;
  const operation = item[method];
  const { names: tags, malformed } = normalizeTags(operation.tags);
  if (malformed) warnings.push(`Malformed tags on ${where}`);
  const params = mergeParameters(spec, item.parameters, operation.parameters, where, warnings);
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
    summary: oneLine(operation.summary, DESCRIPTION_MAX_LENGTH),
    description: oneLine(operation.description, DESCRIPTION_MAX_LENGTH),
    deprecated: Boolean(operation.deprecated) || tags.includes('deprecated'),
    internal: tags.includes('internal') || operation['x-internal'] === true,
    operationId: operation.operationId ?? null,
    params,
    requestBody: bodySchema
      ? { label: schemaLabel(bodySchema), fields: describeFields(spec, bodySchema, warnings) }
      : null,
    responses: Object.entries(operation.responses ?? {}).map(([status, response]) => {
      const schema = firstJsonSchema(resolveRef(spec, response, warnings)?.content);
      return { status, label: schema ? schemaLabel(schema) : null };
    }),
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
 *   gives `boapi/proxy/fleetmanager/public`.
 *
 * @param {unknown} servers - `servers` of a path item or of the spec
 * @param {string} fallback - base path when no usable server is declared
 * @param {string} where - path or `spec`, for the warning
 * @param {string[]} warnings - collects an unreadable server URL
 * @returns {string} base path, without leading or trailing `/`
 */
export function resolveBasePath(servers, fallback, where, warnings = []) {
  const server = Array.isArray(servers) ? servers[0] : undefined;
  if (typeof server?.url !== 'string') return fallback;
  const missing = [];
  const url = server.url.replace(/\{([^}]+)\}/g, (_, name) => {
    const value = variableDefault(server.variables, name);
    if (value !== undefined) return value;
    missing.push(name);
    return name;
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
  const unresolved = missing.filter((name) => parsed.pathname.split('/').includes(name));
  if (unresolved.length > 0) {
    warnings.push(
      `Server variable without default {${unresolved.join('}, {')}} in the path of "${server.url}" on ${where}, base path /${fallback} used`,
    );
    return fallback;
  }
  if (parsed.hostname.endsWith(PRIVATE_HOST_SUFFIX)) {
    return path ? `${GATEWAY_BASE_PATH}/${path}` : GATEWAY_BASE_PATH;
  }
  return path || fallback;
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
    const basePath = resolveBasePath(item.servers, specBasePath, path, warnings);
    for (const method of IGNORED_METHODS) {
      if (item[method]) warnings.push(`Method not rendered: ${method.toUpperCase()} ${path}`);
    }
    for (const method of HTTP_METHODS) {
      if (!item[method]) continue;
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
  return basePath === GATEWAY_BASE_PATH || basePath.startsWith(`${GATEWAY_BASE_PATH}/`);
}

/**
 * Tells whether a widget can call an endpoint with `bo.authFetch`: it is served under the admin
 * gateway ({@link GATEWAY_BASE_PATH}), is neither deprecated nor internal, carries none of
 * {@link EXCLUDED_TAGS} and its route has none of {@link EXCLUDED_PATH_SEGMENTS}.
 *
 * @param {Endpoint} endpoint - item of {@link collectEndpoints}
 * @returns {boolean} true when the endpoint belongs in the skill
 */
export function isWidgetEndpoint(endpoint) {
  if (!isUnderGateway(endpoint.basePath) || endpoint.deprecated || endpoint.internal) return false;
  if (endpoint.tags.some((tag) => EXCLUDED_TAGS.includes(tag))) return false;
  return !endpoint.path.split('/').some((segment) => EXCLUDED_PATH_SEGMENTS.includes(segment));
}

/**
 * Path to pass to `bo.authFetch`: the base path after the admin gateway, then the route.
 *
 * @param {Endpoint} endpoint - endpoint under {@link GATEWAY_BASE_PATH}
 * @returns {string} e.g. `fleetmanager/public/fleets/{fleetId}/vehicles`
 * @throws {Error} when the endpoint is not served under the admin gateway
 */
export function authFetchPath(endpoint) {
  const { basePath, path } = endpoint;
  if (!isUnderGateway(basePath)) {
    throw new Error(`Not under /${GATEWAY_BASE_PATH}: ${endpoint.method} ${path} (/${basePath})`);
  }
  const service = basePath.slice(GATEWAY_BASE_PATH.length + 1);
  return [service, path.replace(/^\/+/, '')].filter(Boolean).join('/');
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
 * Renders one endpoint as a Markdown section.
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
  for (const location of PARAM_LOCATIONS) {
    const params = endpoint.params.filter((param) => param.in === location);
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
 * @returns {string} Markdown content, one `### Name` section per schema
 * @throws {Error} with the schema name in the message when a schema cannot be read
 */
export function renderSchemas(
  spec,
  warnings = [],
  names = Object.keys(spec.components?.schemas ?? {}),
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
    if (schema?.description) parts.push(oneLine(schema.description, DESCRIPTION_MAX_LENGTH));
    try {
      const fields = describeFields(spec, { $ref: `#/components/schemas/${name}` }, warnings);
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
 * Groups the widget endpoints by skill file, and warns about untagged and unmapped ones.
 *
 * @param {Endpoint[]} endpoints - endpoints kept by {@link isWidgetEndpoint}
 * @param {string[]} warnings - collects untagged endpoints and unmapped tags
 * @returns {Map<string, {endpoint: Endpoint, section: string}[]>} file name → entries
 */
function groupByFile(endpoints, warnings) {
  const byFile = new Map(SKILL_FILES.map((definition) => [definition.file, []]));
  const unmappedTags = new Set();
  for (const endpoint of endpoints) {
    const { file, tag } = assignFile(endpoint.tags);
    if (!tag) endpoint.tags.forEach((unknown) => unmappedTags.add(unknown));
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
  return byFile;
}

/**
 * Generates every file of the `aima-api` skill from a parsed spec: only the endpoints a widget can
 * call ({@link isWidgetEndpoint}) and the schemas they reach. Every file and warning goes through
 * {@link sanitizeText}, so no private host can leak into the skill or the sync PR.
 *
 * @param {object} spec - parsed OpenAPI spec
 * @param {string} template - SKILL.md template
 * @returns {{files: Map<string, string>, warnings: string[], stats: SkillStats}} file name → content,
 *   deduplicated warnings to surface in the sync PR, and the release/counts
 * @throws {Error} when an operation, a schema or a template placeholder cannot be rendered
 */
export function buildSkill(spec, template) {
  const warnings = [];
  const all = collectEndpoints(spec, warnings);
  const endpoints = all.filter(isWidgetEndpoint);
  const byFile = groupByFile(endpoints, warnings);

  const files = new Map();
  const tableRows = [];
  for (const definition of SKILL_FILES) {
    const entries = byFile.get(definition.file);
    files.set(definition.file, renderEndpointFile(definition, entries));
    tableRows.push(`| \`${definition.file}\` | ${definition.summary} | ${entries.length} |`);
  }
  const roots = endpoints.flatMap(({ method, path }) => [
    spec.paths[path].parameters,
    spec.paths[path][method.toLowerCase()],
  ]);
  const schemaNames = collectSchemaNames(spec, roots);
  files.set(SCHEMAS_FILE, renderSchemas(spec, warnings, schemaNames));
  tableRows.push(
    `| \`${SCHEMAS_FILE}\` | Request/response schemas used by these endpoints (first-level fields) | ${schemaNames.size} schemas |`,
  );

  /** @type {SkillStats} */
  const stats = {
    release: getRelease(spec),
    openapi: String(spec.openapi),
    endpointCount: endpoints.length,
    excludedCount: all.length - endpoints.length,
    tagCount: new Set(endpoints.flatMap((endpoint) => endpoint.tags)).size,
    schemaCount: schemaNames.size,
  };
  if (stats.release === 'unknown')
    warnings.push('Release not found in info.title nor info.version');
  files.set('SKILL.md', renderTemplate(template, { ...stats, fileTable: tableRows.join('\n') }));
  for (const [name, content] of files) files.set(name, sanitizeText(content));
  return { files, warnings: [...new Set(warnings.map(sanitizeText))], stats };
}
