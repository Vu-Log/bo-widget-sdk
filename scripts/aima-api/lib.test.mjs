import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assignFile,
  authFetchPath,
  buildSkill,
  collectEndpoints,
  collectSchemaNames,
  describeFields,
  EXCLUSION_REASONS,
  exclusionReason,
  GENERATED_MARKER,
  getRelease,
  isWidgetEndpoint,
  mergeParameters,
  normalizeTags,
  oneLine,
  parseSpec,
  redactReferences,
  refName,
  renderEndpoint,
  renderEndpointFile,
  renderSchemas,
  renderTemplate,
  resolveBasePath,
  resolveRef,
  sanitizeText,
  schemaLabel,
} from './lib.mjs';

const FIXTURE = readFileSync(new URL('./__fixtures__/mini-spec.yaml', import.meta.url), 'utf8');
const TEMPLATE = readFileSync(new URL('./SKILL.template.md', import.meta.url), 'utf8');
const spec = parseSpec(FIXTURE);

/** Minimal valid spec with the given paths and schemas. */
const makeSpec = (paths, schemas = {}) => ({
  openapi: '3.1.0',
  info: { title: 'T - Release 1.0' },
  paths,
  components: { schemas },
});

/** Endpoint with every field, overridable. */
const makeEndpoint = (overrides = {}) => ({
  method: 'GET',
  path: '/x',
  basePath: 'boapi/proxy',
  tags: ['admin-user'],
  summary: '',
  description: '',
  deprecated: false,
  internal: false,
  operationId: null,
  params: [],
  requestBody: null,
  responses: [],
  redacted: [],
  ...overrides,
});

/** The fixture spec, parsed again so a test can change it. */
const freshSpec = () => parseSpec(FIXTURE);

describe('parseSpec', () => {
  it('parses a YAML OpenAPI document', () => {
    expect(spec.openapi).toBe('3.1.0');
    expect(Object.keys(spec.paths)).toHaveLength(20);
  });

  it('parses a JSON document', () => {
    expect(parseSpec('{"openapi":"3.0.3","paths":{}}').openapi).toBe('3.0.3');
  });

  it.each([
    ['', 'Spec is empty'],
    ['   ', 'Spec is empty'],
    ['title: not openapi', 'missing `openapi` field'],
    ['openapi: 3.0.3', 'no `paths` object'],
  ])('rejects %j', (text, message) => {
    expect(() => parseSpec(text)).toThrow(message);
  });

  it('rejects invalid YAML', () => {
    expect(() => parseSpec('openapi: [unclosed')).toThrow();
  });
});

describe('getRelease', () => {
  it('reads the release from the title', () => {
    expect(getRelease(spec)).toBe('9.99');
  });

  it('falls back to info.version, then to unknown', () => {
    expect(getRelease({ info: { title: 'API', version: '2.0' } })).toBe('2.0');
    expect(getRelease({})).toBe('unknown');
  });
});

describe('refName', () => {
  it('returns the last segment of a ref', () => {
    expect(refName('#/components/schemas/MobileBook')).toBe('MobileBook');
  });

  it('returns the whole string when it has no segment', () => {
    expect(refName('MobileBook')).toBe('MobileBook');
  });
});

describe('resolveRef', () => {
  it('follows a local ref', () => {
    expect(resolveRef(spec, { $ref: '#/components/schemas/Gender' }).enum).toContain('MALE');
  });

  it('returns non-ref nodes and undefined as is', () => {
    const node = { type: 'string' };
    expect(resolveRef(spec, node)).toBe(node);
    expect(resolveRef(spec, undefined)).toBeUndefined();
  });

  it('warns on unresolved and external refs', () => {
    const warnings = [];
    expect(resolveRef(spec, { $ref: '#/components/schemas/Nope' }, warnings)).toBeUndefined();
    expect(resolveRef(spec, { $ref: 'other.yaml#/X' }, warnings)).toBeUndefined();
    expect(warnings).toEqual([
      'Unresolved $ref: #/components/schemas/Nope',
      'External $ref not supported: other.yaml#/X',
    ]);
  });

  it('follows a chain of refs to the final target', () => {
    const chain = makeSpec(
      {},
      { A: { $ref: '#/components/schemas/B' }, B: { type: 'string', format: 'uuid' } },
    );
    expect(resolveRef(chain, { $ref: '#/components/schemas/A' })).toEqual({
      type: 'string',
      format: 'uuid',
    });
  });

  it('stops on a circular chain with a warning', () => {
    const loop = makeSpec(
      {},
      { A: { $ref: '#/components/schemas/B' }, B: { $ref: '#/components/schemas/A' } },
    );
    const warnings = [];
    expect(resolveRef(loop, { $ref: '#/components/schemas/A' }, warnings)).toBeUndefined();
    expect(warnings).toEqual(['Circular $ref: #/components/schemas/A']);
  });
});

describe('schemaLabel', () => {
  it.each([
    [undefined, 'any'],
    [{ $ref: '#/components/schemas/User' }, 'User'],
    [{ type: 'array', items: { $ref: '#/components/schemas/User' } }, 'User[]'],
    [{ oneOf: [{ $ref: '#/a/A' }, { $ref: '#/a/B' }] }, 'A | B'],
    [{ allOf: [{ $ref: '#/a/A' }, { type: 'object' }] }, 'A & object'],
    [{ type: 'string', format: 'uuid' }, 'string (uuid)'],
    [{ type: ['string', 'null'] }, 'string | null'],
    [{ type: 'string', enum: ['WGS', 'GCJ'] }, 'string: `WGS`, `GCJ`'],
    [{ type: 'string', enum: [] }, 'string'],
    [{}, 'object'],
  ])('labels %j as %j', (schema, label) => {
    expect(schemaLabel(schema)).toBe(label);
  });
});

describe('oneLine', () => {
  it('flattens whitespace and escapes pipes', () => {
    expect(oneLine('a\n  b | c')).toBe('a b \\| c');
  });

  it('truncates long text with an ellipsis', () => {
    expect(oneLine('x'.repeat(20), 10)).toBe(`${'x'.repeat(9)}…`);
  });

  it('does not truncate a text of exactly maxLength', () => {
    expect(oneLine('x'.repeat(10), 10)).toBe('x'.repeat(10));
  });

  it.each([undefined, null, ''])('returns an empty string for %j', (value) => {
    expect(oneLine(value)).toBe('');
  });

  it('stringifies non-string values', () => {
    expect(oneLine(42)).toBe('42');
  });

  it('redacts issue-tracker keys and backend service names, and collects them', () => {
    const found = [];
    expect(oneLine('ABC-123 — refund lines, sent to\nfooWS', 160, found)).toBe(
      'refund lines, sent to the backend',
    );
    expect(found).toEqual([
      { kind: 'tracker', token: 'ABC-123' },
      { kind: 'service', token: 'fooWS' },
    ]);
  });
});

describe('redactReferences', () => {
  it('drops an issue-tracker key followed by a separator', () => {
    expect(redactReferences('ABC-123 — lines to refund')).toBe('lines to refund');
    expect(redactReferences('XY1-9999: fixed')).toBe('fixed');
  });

  it('replaces an issue-tracker key inside a sentence', () => {
    expect(redactReferences('the ride rate and, since ABC-123, the product rate')).toBe(
      'the ride rate and, since an earlier change, the product rate',
    );
  });

  it('keeps standard references', () => {
    const text = 'A date in ISO-8601, grouped as in BG-23, encoded in UTF-8';
    expect(redactReferences(text)).toBe(text);
  });

  it.each([
    'AES-256',
    'HTTP-2',
    'PSD-2',
    'TLS-1',
    'SHA-256',
    'RSA-2048',
    'BCP-47',
    'ES-256',
    'RS-256',
    'HS-256',
    'COVID-19',
    'UTF-8',
    'ISO-8601',
    'ABC-12',
  ])('keeps the technical term or short reference %s', (term) => {
    const found = [];
    expect(redactReferences(`signed with ${term} here`, found)).toBe(`signed with ${term} here`);
    expect(found).toEqual([]);
  });

  it('collects every redacted token, keys without their separator', () => {
    const found = [];
    redactReferences('ABC-123 — since XYZ-4567, via fooWS', found);
    expect(found).toEqual([
      { kind: 'tracker', token: 'ABC-123' },
      { kind: 'tracker', token: 'XYZ-4567' },
      { kind: 'service', token: 'fooWS' },
    ]);
  });

  it('replaces backend web-service names, not acronyms nor schema names', () => {
    expect(redactReferences('validated via fooWS, then BarWS')).toBe(
      'validated via the backend, then the backend',
    );
    expect(redactReferences('stored on AWS by FooWsRefundDTO')).toBe(
      'stored on AWS by FooWsRefundDTO',
    );
  });

  it('returns an empty text unchanged', () => {
    expect(redactReferences('')).toBe('');
  });
});

describe('sanitizeText', () => {
  it('turns a URL on a private host into its admin gateway path', () => {
    expect(sanitizeText('See https://service.example.local:1443/user/fleets/{fleetId}/ now')).toBe(
      'See /boapi/proxy/user/fleets/{fleetId} now',
    );
    expect(sanitizeText('(http://API.example.local)')).toBe('(/boapi/proxy)');
  });

  it('replaces a bare private host name', () => {
    expect(sanitizeText('served by service.example.local:1443.')).toBe(
      'served by the admin gateway.',
    );
  });

  it('keeps public URLs, localhost and words containing "local"', () => {
    const text = 'https://api.example.com/boapi/proxy, http://localhost:3000, a localized label';
    expect(sanitizeText(text)).toBe(text);
  });

  it.each([
    'https://api.local.example.com/x',
    'http://foo.localhost:3000/a',
    'svc.local.example.com',
    'see svc.localhost:8080',
  ])('keeps %s, whose host does not end with .local', (text) => {
    expect(sanitizeText(text)).toBe(text);
  });

  it('returns an empty text unchanged', () => {
    expect(sanitizeText('')).toBe('');
  });
});

describe('describeFields', () => {
  it('lists first-level fields with required flags and deprecation notes', () => {
    expect(describeFields(spec, { $ref: '#/components/schemas/MobileBook' })).toEqual([
      { name: 'serviceId', type: 'string (uuid)', required: true, notes: 'The service id' },
      {
        name: 'pricingId',
        type: 'string',
        required: false,
        notes: '*(deprecated)* Pricing override',
      },
    ]);
  });

  it('merges allOf parts', () => {
    const names = describeFields(spec, { $ref: '#/components/schemas/MobileJourneyInfo' }).map(
      (field) => field.name,
    );
    expect(names).toEqual(['serviceId', 'pricingId', 'journeyId']);
  });

  it('returns an empty list for scalars, missing schemas and broken refs', () => {
    const warnings = [];
    expect(describeFields(spec, { $ref: '#/components/schemas/Gender' })).toEqual([]);
    expect(describeFields(spec, undefined)).toEqual([]);
    expect(describeFields(spec, { $ref: '#/components/schemas/Nope' }, warnings)).toEqual([]);
    expect(warnings).toHaveLength(1);
  });

  it('stops on a circular allOf instead of overflowing the stack', () => {
    const loop = makeSpec(
      {},
      {
        A: {
          allOf: [
            { $ref: '#/components/schemas/B' },
            { type: 'object', properties: { a: { type: 'string' } } },
          ],
        },
        B: { allOf: [{ $ref: '#/components/schemas/A' }] },
      },
    );
    const warnings = [];
    const names = describeFields(loop, { $ref: '#/components/schemas/A' }, warnings).map(
      (field) => field.name,
    );
    expect(names).toEqual(['a']);
    expect(warnings).toContain('Circular allOf: #/components/schemas/A');
    expect(() => renderSchemas(loop)).not.toThrow();
  });

  it('expands a base shared by several allOf parts each time, without calling it circular', () => {
    const shared = makeSpec(
      {},
      {
        Base: { type: 'object', properties: { id: { type: 'string' } } },
        Mid: {
          allOf: [
            { $ref: '#/components/schemas/Base' },
            { type: 'object', properties: { m: { type: 'string' } } },
          ],
        },
        Top: {
          allOf: [{ $ref: '#/components/schemas/Base' }, { $ref: '#/components/schemas/Mid' }],
        },
      },
    );
    const warnings = [];
    const names = describeFields(shared, { $ref: '#/components/schemas/Top' }, warnings).map(
      (field) => field.name,
    );
    expect(names).toEqual(['id', 'id', 'm']);
    expect(warnings).toEqual([]);
  });

  it('keeps the properties declared next to allOf, with the outer required list', () => {
    const mixed = makeSpec(
      {},
      {
        D: { type: 'object', properties: { d: { type: 'string' } } },
        S: {
          allOf: [{ $ref: '#/components/schemas/D' }],
          required: ['d', 'own'],
          properties: { own: { type: 'integer' } },
        },
      },
    );
    expect(describeFields(mixed, { $ref: '#/components/schemas/S' })).toEqual([
      { name: 'd', type: 'string', required: true, notes: '' },
      { name: 'own', type: 'integer', required: true, notes: '' },
    ]);
  });

  it('warns on a malformed `required` instead of crashing', () => {
    const bad = makeSpec(
      {},
      { X: { type: 'object', required: true, properties: { a: { type: 'string' } } } },
    );
    const warnings = [];
    expect(describeFields(bad, { $ref: '#/components/schemas/X' }, warnings)).toEqual([
      { name: 'a', type: 'string', required: false, notes: '' },
    ]);
    expect(warnings).toEqual(['Malformed `required` (not a list) in #/components/schemas/X']);
  });

  it('warns on broken refs used as property types, items or union members', () => {
    const bad = makeSpec(
      {},
      {
        X: {
          type: 'object',
          properties: {
            a: { $ref: '#/components/schemas/Missing1' },
            b: { type: 'array', items: { $ref: '#/components/schemas/Missing2' } },
            c: { oneOf: [{ $ref: '#/components/schemas/Missing3' }] },
          },
        },
      },
    );
    const warnings = [];
    describeFields(bad, { $ref: '#/components/schemas/X' }, warnings);
    expect(warnings).toEqual([
      'Unresolved $ref: #/components/schemas/Missing1',
      'Unresolved $ref: #/components/schemas/Missing2',
      'Unresolved $ref: #/components/schemas/Missing3',
    ]);
  });
});

describe('normalizeTags', () => {
  it('keeps string tags', () => {
    expect(normalizeTags(['Tickets', 'admin-user'])).toEqual({
      names: ['Tickets', 'admin-user'],
      malformed: false,
    });
  });

  it('drops pasted parameters and empty tags, and flags them', () => {
    expect(normalizeTags(['admin-invoice', { in: 'path' }, ''])).toEqual({
      names: ['admin-invoice'],
      malformed: true,
    });
  });

  it('flags a tag given as a string instead of a list', () => {
    expect(normalizeTags('admin-user')).toEqual({ names: [], malformed: true });
  });

  it.each([undefined, null])('does not flag an absent tag list (%j)', (tags) => {
    expect(normalizeTags(tags)).toEqual({ names: [], malformed: false });
  });
});

describe('assignFile', () => {
  it('routes exact tags', () => {
    expect(assignFile(['admin-user'])).toEqual({ file: 'admin-user.md', tag: 'admin-user' });
    expect(assignFile(['Tickets'])).toEqual({ file: 'business-other.md', tag: 'Tickets' });
  });

  it('routes unknown admin-* tags by prefix', () => {
    expect(assignFile(['admin-report'])).toEqual({ file: 'admin-other.md', tag: 'admin-report' });
  });

  it('prefers the first file in priority order', () => {
    expect(assignFile(['admin-report', 'admin-trip'])).toEqual({
      file: 'admin-trip.md',
      tag: 'admin-trip',
    });
  });

  it('falls back to admin-other.md for unmapped or missing tags', () => {
    expect(assignFile(['brand-new-tag'])).toEqual({ file: 'admin-other.md', tag: null });
    expect(assignFile([])).toEqual({ file: 'admin-other.md', tag: null });
  });
});

describe('mergeParameters', () => {
  const param = (name, location, description) => ({
    name,
    in: location,
    schema: { type: 'string' },
    description,
  });

  it('lets an operation parameter override the path parameter with the same name and location', () => {
    expect(
      mergeParameters(
        makeSpec({}),
        [param('id', 'path', 'path-level'), param('q', 'query')],
        [param('id', 'path', 'operation-level')],
        'GET /x',
      ),
    ).toEqual([
      { name: 'id', in: 'path', type: 'string', required: false, notes: 'operation-level' },
      { name: 'q', in: 'query', type: 'string', required: false, notes: '' },
    ]);
  });

  it('keeps parameters with the same name in different locations', () => {
    expect(
      mergeParameters(makeSpec({}), [param('id', 'path')], [param('id', 'query')], 'GET /x'),
    ).toHaveLength(2);
  });

  it('warns on a parameter list that is not a list and on nameless parameters', () => {
    const warnings = [];
    expect(
      mergeParameters(makeSpec({}), { id: {} }, [{ in: 'query' }], 'GET /x', warnings),
    ).toEqual([]);
    expect(warnings).toEqual([
      'Malformed parameters (not a list) on GET /x',
      'Parameter without a name dropped on GET /x',
    ]);
  });

  it('returns an empty list when there is no parameter', () => {
    expect(mergeParameters(makeSpec({}), undefined, undefined, 'GET /x')).toEqual([]);
  });
});

describe('resolveBasePath', () => {
  const resolve = (servers, warnings = []) =>
    resolveBasePath(servers, 'fallback', 'GET /x', warnings);

  it('reads the default of a {basePath} variable', () => {
    expect(
      resolve([
        {
          url: 'https://{environment}.example.com/{basePath}',
          variables: { basePath: { default: 'apiv5' } },
        },
      ]),
    ).toBe('apiv5');
  });

  it('reads variables written as a list', () => {
    const variables = [{ basePath: null, default: 'boapi/proxy', enum: ['apiv5', 'boapi/proxy'] }];
    expect(resolve([{ url: 'https://api.example.com/{basePath}', variables }])).toBe('boapi/proxy');
  });

  it('keeps the whole path of a public server, whatever its host variables', () => {
    const server = {
      url: 'https://api-{region}.example.com/boapi/proxy/fleetmanager/public',
      variables: { region: { default: 'eu' } },
    };
    expect(resolve([server])).toBe('boapi/proxy/fleetmanager/public');
  });

  it.each([
    ['https://service.example.local:1443/user', 'boapi/proxy/user'],
    ['https://service.example.local:1443/notifier/', 'boapi/proxy/notifier'],
    ['https://SERVICE.EXAMPLE.LOCAL', 'boapi/proxy'],
  ])('reaches the private service %s through the admin gateway', (url, expected) => {
    expect(resolve([{ url }])).toBe(expected);
  });

  it('does not treat a host merely containing "local" as private', () => {
    expect(resolve([{ url: 'https://local.example.com/apiv5' }])).toBe('apiv5');
  });

  it('accepts a host variable without default, which is not rendered', () => {
    const warnings = [];
    expect(resolve([{ url: 'https://{host}.example.com/apiv5' }], warnings)).toBe('apiv5');
    expect(warnings).toEqual([]);
  });

  it('falls back, with a warning, for a path variable without default', () => {
    const warnings = [];
    expect(resolve([{ url: 'https://api.example.com/{basePath}' }], warnings)).toBe('fallback');
    expect(warnings).toEqual([
      'Server variable without default {basePath} in the path of "https://api.example.com/{basePath}" on GET /x, base path /fallback used',
    ]);
  });

  it('reads the path of a relative server URL', () => {
    expect(resolve([{ url: '/apiv5' }])).toBe('apiv5');
  });

  it.each([[undefined], [[]], [[{}]], [[{ url: 42 }]], ['https://x.example.com/apiv5']])(
    'falls back when no usable server is declared (%j)',
    (servers) => {
      expect(resolve(servers)).toBe('fallback');
    },
  );

  it('falls back, with a warning, for a public server URL without path', () => {
    const warnings = [];
    expect(resolve([{ url: 'https://api.example.com/' }], warnings)).toBe('fallback');
    expect(warnings).toEqual([
      'Server URL "https://api.example.com/" without path on GET /x, base path /fallback used',
    ]);
  });

  it('falls back, with a warning, for a path variable without default inside a segment', () => {
    const warnings = [];
    expect(resolve([{ url: 'https://api.example.com/boapi/v-{version}' }], warnings)).toBe(
      'fallback',
    );
    expect(warnings).toEqual([
      'Server variable without default {version} in the path of "https://api.example.com/boapi/v-{version}" on GET /x, base path /fallback used',
    ]);
  });

  it('falls back, with a warning, for an unreadable server URL', () => {
    const warnings = [];
    expect(resolve([{ url: 'http://[bad' }], warnings)).toBe('fallback');
    expect(warnings).toEqual([
      'Unreadable server URL "http://[bad" on GET /x, base path /fallback used',
    ]);
  });
});

describe('collectEndpoints', () => {
  const warnings = [];
  const endpoints = collectEndpoints(spec, warnings);
  const find = (method, path) =>
    endpoints.find((endpoint) => endpoint.method === method && endpoint.path === path);

  it('flattens every operation, in or out of scope', () => {
    expect(endpoints).toHaveLength(25);
  });

  it('serves an empty servers list under the gateway only for a known root service', () => {
    expect(find('GET', '/geoloc/fleets/{fleetId}/zones').basePath).toBe('boapi/proxy');
    expect(find('GET', '/tickets/{ticketId}').basePath).toBeNull();
    expect(warnings).toContain(
      'Empty servers on GET /tickets/{ticketId}: base path unknown, left out',
    );
    expect(warnings.filter((warning) => warning.startsWith('Empty servers'))).toHaveLength(1);
  });

  it('drops the service segment that the route repeats', () => {
    expect(find('GET', '/business/fleets/{fleetId}/entities').basePath).toBe('boapi/proxy');
    expect(find('GET', '/fleets/{fleetId}/taxes').basePath).toBe('boapi/proxy/business');
  });

  it('keeps what was redacted from the texts of each endpoint', () => {
    expect(find('GET', '/fleets/{fleetId}/trips').redacted).toEqual([
      { kind: 'tracker', token: 'ABC-1234' },
      { kind: 'tracker', token: 'ABC-1234' },
      { kind: 'tracker', token: 'XYZ-987' },
      { kind: 'service', token: 'fooWS' },
    ]);
    expect(find('GET', '/fleets/{fleetId}/stations').redacted).toEqual([]);
  });

  it('uses the path-level base path, else the spec one', () => {
    expect(find('POST', '/vehicles/{VehicleId}/journey').basePath).toBe('apiv5');
    expect(find('GET', '/fleets/{fleetId}/reports').basePath).toBe('boapi/proxy');
    expect(find('GET', '/fleets/{fleetId}/vehicles').basePath).toBe(
      'boapi/proxy/fleetmanager/public',
    );
  });

  it('reaches the private services of the spec through the admin gateway', () => {
    expect(find('GET', '/fleets/{fleetId}/users/{id}').basePath).toBe('boapi/proxy/user');
    expect(find('GET', '/fleets/{fleetId}/taxes').basePath).toBe('boapi/proxy/business');
  });

  it('merges path-level and operation parameters, resolving refs', () => {
    expect(find('GET', '/fleets/{fleetId}/users/{id}').params.map((param) => param.name)).toEqual([
      'fleetId',
      'id',
    ]);
    expect(find('POST', '/vehicles/{VehicleId}/journey').params[0]).toMatchObject({
      name: 'VehicleId',
      in: 'path',
      required: true,
      type: 'string (uuid)',
    });
  });

  it('describes the request body and response schemas', () => {
    const journey = find('POST', '/vehicles/{VehicleId}/journey');
    expect(journey.requestBody.label).toBe('MobileBook');
    expect(journey.requestBody.fields).toHaveLength(2);
    expect(journey.responses).toEqual([
      { status: '200', label: 'MobileJourneyInfo' },
      { status: '400', label: 'MobileInvalidProfile | MobileServiceInvalid' },
    ]);
    expect(find('DELETE', '/fleets/{fleetId}/users/{id}').requestBody).toBeNull();
  });

  it('flags deprecated and internal operations, from tags, `deprecated` or `x-internal`', () => {
    expect(find('PUT', '/fleets/{fleetId}/users/{id}').deprecated).toBe(true);
    expect(find('GET', '/trips/legacy').deprecated).toBe(true);
    expect(find('DELETE', '/fleets/{fleetId}/users/{id}').internal).toBe(true);
    expect(find('GET', '/trips/hidden').internal).toBe(true);
    expect(find('GET', '/fleets/{fleetId}/services/old').deprecated).toBe(true);
    expect(find('GET', '/fleets/{fleetId}/users/{id}')).toMatchObject({
      deprecated: false,
      internal: false,
    });
  });

  it('warns about malformed tags', () => {
    expect(warnings).toContain('Malformed tags on GET /fleets/{fleetId}/taxes');
  });

  it('warns about methods it does not render and path items that are not objects', () => {
    const edgeWarnings = [];
    const edge = collectEndpoints(
      makeSpec({
        '/a': { head: { responses: {} }, get: { tags: ['admin-user'], responses: {} } },
        '/b': 'oops',
      }),
      edgeWarnings,
    );
    expect(edge.map((endpoint) => endpoint.method)).toEqual(['GET']);
    expect(edgeWarnings).toEqual([
      'Method not rendered: HEAD /a',
      'Path item is not an object, skipped: /b',
    ]);
  });

  it('warns about parameters with an unknown location', () => {
    const edgeWarnings = [];
    collectEndpoints(
      makeSpec({
        '/a': { get: { tags: ['admin-user'], parameters: [{ name: 'w', in: 'body' }] } },
      }),
      edgeWarnings,
    );
    expect(edgeWarnings).toEqual(['Parameter `w` with unknown location "body" on GET /a']);
  });

  it('follows requestBody and response refs, and falls back to a non-JSON media type', () => {
    const withRefs = makeSpec(
      {
        '/upload': {
          post: {
            tags: ['admin-user'],
            requestBody: { $ref: '#/components/requestBodies/Upload' },
            responses: { 200: { $ref: '#/components/responses/Ok' } },
          },
        },
      },
      { Doc: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } },
    );
    withRefs.components.requestBodies = {
      Upload: {
        content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/Doc' } } },
      },
    };
    withRefs.components.responses = {
      Ok: { content: { '*/*': { schema: { $ref: '#/components/schemas/Doc' } } } },
    };
    const [endpoint] = collectEndpoints(withRefs);
    expect(endpoint.requestBody).toEqual({
      label: 'Doc',
      fields: [{ name: 'file', type: 'string (binary)', required: false, notes: '' }],
    });
    expect(endpoint.responses).toEqual([{ status: '200', label: 'Doc' }]);
  });

  it('names the operation when it cannot be read', () => {
    const broken = makeSpec({ '/a': { get: { tags: ['admin-user'] } } });
    Object.defineProperty(broken.paths['/a'].get, 'responses', {
      get() {
        throw new Error('boom');
      },
    });
    expect(() => collectEndpoints(broken)).toThrow('Cannot read GET /a: boom');
  });
});

describe('isWidgetEndpoint', () => {
  it.each([['boapi/proxy'], ['boapi/proxy/user'], ['boapi/proxy/fleetmanager/public']])(
    'keeps an endpoint under the admin gateway (%s)',
    (basePath) => {
      expect(isWidgetEndpoint(makeEndpoint({ basePath }))).toBe(true);
    },
  );

  it.each([['apiv5'], ['boapi/proxyfoo'], ['other/boapi/proxy']])(
    'drops an endpoint outside the admin gateway (%s)',
    (basePath) => {
      expect(isWidgetEndpoint(makeEndpoint({ basePath }))).toBe(false);
    },
  );

  it.each([['internal'], ['deprecated'], ['todo'], ['need-migration'], ['Internal'], ['TODO']])(
    'drops an endpoint tagged %s',
    (tag) => {
      expect(isWidgetEndpoint(makeEndpoint({ tags: ['admin-user', tag] }))).toBe(false);
    },
  );

  it('drops an endpoint whose base path is unknown or has an excluded segment', () => {
    expect(isWidgetEndpoint(makeEndpoint({ basePath: null }))).toBe(false);
    expect(isWidgetEndpoint(makeEndpoint({ basePath: 'boapi/proxy/internal' }))).toBe(false);
    expect(isWidgetEndpoint(makeEndpoint({ basePath: 'boapi/proxy/internalx' }))).toBe(true);
  });

  it('drops deprecated and internal endpoints, and routes under /internal/', () => {
    expect(isWidgetEndpoint(makeEndpoint({ deprecated: true }))).toBe(false);
    expect(isWidgetEndpoint(makeEndpoint({ internal: true }))).toBe(false);
    expect(isWidgetEndpoint(makeEndpoint({ path: '/internal/fleets/{fleetId}' }))).toBe(false);
    expect(isWidgetEndpoint(makeEndpoint({ path: '/fleets/{fleetId}/internalNotes' }))).toBe(true);
  });
});

describe('exclusionReason', () => {
  it.each([
    [{}, null],
    [{ basePath: null }, 'unknownBasePath'],
    [{ basePath: 'apiv5', deprecated: true }, 'outsideGateway'],
    [{ deprecated: true, tags: ['todo'] }, 'deprecatedOrInternal'],
    [{ internal: true }, 'deprecatedOrInternal'],
    [{ tags: ['admin-user', 'Need-Migration'] }, 'excludedTag'],
    [{ path: '/internal/x' }, 'excludedPathSegment'],
    [{ basePath: 'boapi/proxy/internal' }, 'excludedPathSegment'],
  ])('classifies %j as %s', (overrides, reason) => {
    expect(exclusionReason(makeEndpoint(overrides))).toBe(reason);
  });

  it('only returns known reasons', () => {
    expect(EXCLUSION_REASONS).toEqual([
      'unknownBasePath',
      'outsideGateway',
      'deprecatedOrInternal',
      'excludedTag',
      'excludedPathSegment',
    ]);
  });
});

describe('authFetchPath', () => {
  it('joins the service path after the gateway and the route', () => {
    expect(
      authFetchPath(
        makeEndpoint({
          basePath: 'boapi/proxy/fleetmanager/public',
          path: '/fleets/{fleetId}/vehicles',
        }),
      ),
    ).toBe('fleetmanager/public/fleets/{fleetId}/vehicles');
  });

  it('returns the bare route for the gateway itself', () => {
    expect(authFetchPath(makeEndpoint({ path: '/tickets' }))).toBe('tickets');
  });

  it('collapses duplicate slashes', () => {
    expect(authFetchPath(makeEndpoint({ path: '/fleetadmin//fleets/{fleetId}/config' }))).toBe(
      'fleetadmin/fleets/{fleetId}/config',
    );
    expect(
      authFetchPath(makeEndpoint({ basePath: 'boapi/proxy/user', path: '//fleets//{fleetId}' })),
    ).toBe('user/fleets/{fleetId}');
  });

  it('throws for an endpoint whose base path is unknown', () => {
    expect(() => authFetchPath(makeEndpoint({ basePath: null, path: '/tickets' }))).toThrow(
      'Not under /boapi/proxy: GET /tickets (base path unknown)',
    );
  });

  it('throws for an endpoint outside the admin gateway', () => {
    expect(() => authFetchPath(makeEndpoint({ basePath: 'apiv5', path: '/user' }))).toThrow(
      'Not under /boapi/proxy: GET /user (/apiv5)',
    );
  });
});

describe('collectSchemaNames', () => {
  it('follows refs transitively from operations, through parameters and nested schemas', () => {
    const roots = [
      spec.paths['/fleets/{fleetId}/users/{id}'].get,
      spec.paths['/fleets/{fleetId}/vehicles'].get,
    ];
    expect([...collectSchemaNames(spec, roots)].sort()).toEqual([
      'Gender',
      'User',
      'Vehicle',
      'VehicleModel',
    ]);
  });

  it('lists every schema of a ref chain and survives cycles', () => {
    const chain = makeSpec(
      {},
      {
        A: { $ref: '#/components/schemas/B' },
        B: { type: 'object', properties: { self: { $ref: '#/components/schemas/B' } } },
      },
    );
    expect([...collectSchemaNames(chain, [{ $ref: '#/components/schemas/A' }])].sort()).toEqual([
      'A',
      'B',
    ]);
  });

  it('ignores unresolved, external and non-schema refs, and empty roots', () => {
    const names = collectSchemaNames(spec, [
      undefined,
      null,
      { $ref: '#/components/schemas/Nope' },
      { $ref: 'other.yaml#/X' },
      { $ref: '#/components/parameters/VehicleId' },
    ]);
    expect([...names]).toEqual([]);
  });
});

describe('renderEndpoint', () => {
  const endpoints = collectEndpoints(spec);
  const find = (method, path) =>
    endpoints.find((endpoint) => endpoint.method === method && endpoint.path === path);

  it('renders the authFetch path, params and responses', () => {
    const markdown = renderEndpoint(find('GET', '/fleets/{fleetId}/vehicles'));
    expect(markdown).toContain('### GET `/fleets/{fleetId}/vehicles`\nList fleet vehicles');
    expect(markdown).toContain(
      'authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles` (base path `/boapi/proxy/fleetmanager/public`)',
    );
    expect(markdown).toContain('**Query params:**\n- `page`: integer (optional)');
    expect(markdown).toContain('**Responses:** `200` → `Vehicle[]`');
  });

  it('renders the description, the request body and escapes pipes', () => {
    const markdown = renderEndpoint(
      makeEndpoint({
        summary: 'Upload',
        description: 'Uploads a file',
        params: [{ name: 'session', in: 'cookie', type: 'string', required: true, notes: 'x' }],
        requestBody: {
          label: 'X',
          fields: [{ name: 'a', type: 'A | B', required: false, notes: '' }],
        },
      }),
    );
    expect(markdown).toContain('Upload\n\nUploads a file');
    expect(markdown).toContain('**Cookie params:**\n- `session`: string (required) — x');
    expect(markdown).toContain('**Request body:** `X`\n| Field |');
    expect(markdown).toContain('| a | A \\| B | no |  |');
    expect(renderEndpoint(find('GET', '/fleets/{fleetId}/taxes'))).toContain(
      'List taxes \\| by fleet',
    );
  });

  it('throws for an endpoint outside the admin gateway', () => {
    expect(() => renderEndpoint(find('POST', '/vehicles/{VehicleId}/journey'))).toThrow(
      'Not under /boapi/proxy',
    );
  });
});

describe('renderEndpointFile', () => {
  const definition = { file: 'x.md', title: 'X Endpoints', summary: 'X' };

  it('sorts sections, then endpoints by path and method, with the right count wording', () => {
    const markdown = renderEndpointFile(definition, [
      { endpoint: makeEndpoint({ method: 'DELETE', path: '/b' }), section: 'Zeta' },
      { endpoint: makeEndpoint({ method: 'GET', path: '/b' }), section: 'Zeta' },
      { endpoint: makeEndpoint({ method: 'GET', path: '/a' }), section: 'Alpha' },
    ]);
    expect(markdown.match(/^## .+$/gm)).toEqual(['## Alpha (1 endpoint)', '## Zeta (2 endpoints)']);
    expect(markdown.indexOf('### GET `/b`')).toBeLessThan(markdown.indexOf('### DELETE `/b`'));
    expect(markdown).toContain(GENERATED_MARKER);
  });

  it('renders only the header for a file without endpoints', () => {
    const markdown = renderEndpointFile(definition, []);
    expect(markdown).toMatch(/^# X Endpoints\n/);
    expect(markdown).not.toContain('##');
    expect(markdown.endsWith('\n')).toBe(true);
  });

  it('throws for an endpoint outside the admin gateway', () => {
    expect(() =>
      renderEndpointFile(definition, [
        { endpoint: makeEndpoint({ basePath: 'apiv5' }), section: 'A' },
      ]),
    ).toThrow('Not under /boapi/proxy');
  });
});

describe('renderSchemas', () => {
  it('renders every schema sorted, with fields or a type line', () => {
    const markdown = renderSchemas(spec);
    const headings = markdown.match(/^### .+$/gm);
    expect(headings).toEqual([...headings].sort((a, b) => a.localeCompare(b)));
    expect(markdown).toContain('### User\nA physical person\n| Field |');
    expect(markdown).toContain('| roles | string: `manager`, `customer`[] | no |  |');
    expect(markdown).toContain('### Gender\nType: string: `MALE`, `FEMALE`, `UNDEFINED`');
  });

  it('collects what it redacted from the schema and field descriptions', () => {
    const redactSpec = makeSpec(
      {},
      {
        X: {
          description: 'Built by fooWS',
          properties: { a: { type: 'string', description: 'since ABC-123' } },
        },
      },
    );
    const found = [];
    const markdown = renderSchemas(redactSpec, [], ['X'], found);
    expect(markdown).toContain('Built by the backend');
    expect(markdown).toContain('since an earlier change');
    expect(found.map((item) => item.kind)).toEqual(['service', 'tracker']);
  });

  it('renders only the requested schemas, skipping unknown names', () => {
    const markdown = renderSchemas(spec, [], new Set(['User', 'Nope']));
    expect(markdown.match(/^### .+$/gm)).toEqual(['### User']);
  });

  it('handles a spec without components', () => {
    expect(renderSchemas({ paths: {} })).toContain('# AIMA API Schemas');
  });

  it('names the schema that cannot be read', () => {
    const broken = makeSpec({}, { X: { type: 'object' } });
    Object.defineProperty(broken.components.schemas.X, 'properties', {
      get() {
        throw new Error('boom');
      },
    });
    expect(() => renderSchemas(broken)).toThrow('Cannot read schema X: boom');
  });
});

describe('renderTemplate', () => {
  it('replaces placeholders', () => {
    expect(renderTemplate('Release {{release}} ({{count}})', { release: '1.66', count: 3 })).toBe(
      'Release 1.66 (3)',
    );
  });

  it('throws on a missing value', () => {
    expect(() => renderTemplate('{{missing}}', {})).toThrow('Missing template value: {{missing}}');
  });
});

describe('buildSkill', () => {
  const { files, warnings, stats } = buildSkill(spec, TEMPLATE);

  it('produces every configured file plus schemas and SKILL.md, and no internal.md', () => {
    expect([...files.keys()].sort()).toEqual(
      [
        'SKILL.md',
        'admin-booking.md',
        'admin-fleet.md',
        'admin-invoice.md',
        'admin-other.md',
        'admin-service.md',
        'admin-trip.md',
        'admin-user.md',
        'admin-vehicle.md',
        'business-other.md',
        'schemas.md',
      ].sort(),
    );
  });

  it('computes stats on the endpoints a widget can call', () => {
    expect(stats).toEqual({
      release: '9.99',
      openapi: '3.1.0',
      endpointCount: 14,
      excludedCount: 11,
      excluded: {
        unknownBasePath: 1,
        outsideGateway: 1,
        deprecatedOrInternal: 5,
        excludedTag: 3,
        excludedPathSegment: 1,
      },
      tagCount: 13,
      schemaCount: 4,
    });
    const reasons = Object.values(stats.excluded).reduce((sum, count) => sum + count, 0);
    expect(reasons).toBe(stats.excludedCount);
  });

  it('keeps only the endpoints under the admin gateway that are not excluded', () => {
    const all = [...files]
      .filter(([name]) => name !== 'SKILL.md')
      .map(([, content]) => content)
      .join('\n');
    for (const excluded of [
      '/vehicles/{VehicleId}/journey',
      '/trips/legacy',
      '/trips/hidden',
      'Replace a user',
      'Patch a user',
      'Delete a user',
      'apiv5',
      'Mobile',
      'Old services',
      'Create a service',
      'Secrets of a private service',
      'served nobody knows where',
    ]) {
      expect(all).not.toContain(excluded);
    }
    expect(files.get('admin-user.md')).toContain('## admin-user (1 endpoint)');
    expect(files.get('admin-trip.md')).toContain('## admin-trip (1 endpoint)');
  });

  it('routes endpoints to their files and sections', () => {
    expect(files.get('admin-fleet.md')).toContain('## admin-fleet (1 endpoint)');
    expect(files.get('business-other.md')).toContain('## Tickets (1 endpoint)');
    expect(files.get('admin-other.md')).toContain('## admin-report (1 endpoint)');
    expect(files.get('admin-other.md')).toContain('## brand-new-tag (1 endpoint)');
    expect(files.get('admin-other.md')).toContain('## Untagged (1 endpoint)');
    expect(files.get('admin-other.md')).toContain('## admin-novelty (1 endpoint)');
    expect(files.get('business-other.md')).toContain('## Zone (1 endpoint)');
    expect(files.get('business-other.md')).toContain(
      'authFetch path: `geoloc/fleets/{fleetId}/zones` (base path `/boapi/proxy`)',
    );
    expect(files.get('business-other.md')).toContain(
      'authFetch path: `business/fleets/{fleetId}/entities` (base path `/boapi/proxy`)',
    );
  });

  it('warns about a tag caught by the admin- prefix that admin-other.md does not expect', () => {
    expect(warnings).toContain(
      'New tag sent to admin-other.md by prefix: admin-novelty (give it a file or add it to its expectedTags in scripts/aima-api/config.mjs)',
    );
    expect(warnings.join('\n')).not.toContain('by prefix: admin-report');
  });

  it('reports how many references it redacted per file, never the references themselves', () => {
    expect(warnings).toContain('Redacted 2 tracker reference(s) in admin-trip.md');
    expect(warnings).toContain('Replaced 1 backend service name(s) in admin-trip.md');
    expect(warnings.join('\n')).not.toMatch(/ABC-1234|XYZ-987|fooWS/);
    expect(files.get('admin-trip.md')).toContain(
      'Trips of the fleet. Signed with SHA-256 by the backend, see an earlier change and an earlier change.',
    );
  });

  it('throws when no endpoint is kept', () => {
    const empty = freshSpec();
    empty.servers = [{ url: 'https://api.example.com/apiv5' }];
    for (const item of Object.values(empty.paths)) delete item.servers;
    expect(() => buildSkill(empty, TEMPLATE)).toThrow('No endpoint a widget can call');
  });

  it('throws naming the file that gets no endpoint', () => {
    const shrunk = freshSpec();
    delete shrunk.paths['/fleets/{fleetId}/models'];
    expect(() => buildSkill(shrunk, TEMPLATE)).toThrow(
      'No endpoint for admin-vehicle.md (tags: admin-vehicle)',
    );
  });

  it('does not require an endpoint in the fallback file', () => {
    const noFallback = freshSpec();
    const fallbackPaths = [
      '/fleets/{fleetId}/reports',
      '/brand-new',
      '/untagged',
      '/fleets/{fleetId}/novelties',
    ];
    noFallback.paths = Object.fromEntries(
      Object.entries(noFallback.paths).filter(([path]) => !fallbackPaths.includes(path)),
    );
    expect(buildSkill(noFallback, TEMPLATE).files.get('admin-other.md')).not.toContain('##');
  });

  it('reports unmapped tags, untagged endpoints and malformed tags', () => {
    expect(warnings).toContain(
      'Tag not mapped in scripts/aima-api/config.mjs (sent to admin-other.md): brand-new-tag',
    );
    expect(warnings).toContain('Untagged endpoint (sent to admin-other.md): GET /untagged');
    expect(warnings).toContain('Malformed tags on GET /fleets/{fleetId}/taxes');
  });

  it('keeps only the schemas reachable from the kept endpoints', () => {
    expect(files.get('schemas.md').match(/^### .+$/gm)).toEqual([
      '### Gender',
      '### User',
      '### Vehicle',
      '### VehicleModel',
    ]);
  });

  it('leaves no private host in any file', () => {
    for (const content of files.values()) expect(content).not.toMatch(/\.local\b/i);
    expect(files.get('admin-other.md')).toContain(
      'Same as /boapi/proxy/user/fleets/{fleetId}/reports on the admin gateway.',
    );
  });

  it('sanitises and redacts the warnings too', () => {
    const withHost = freshSpec();
    withHost.paths['/a'] = { servers: [{ url: 'https://svc.example.local/{basePath}' }] };
    withHost.paths['/b'] = {
      get: { tags: ['admin-user'], parameters: [{ name: 'w', in: 'ABC-1234' }] },
    };
    const { warnings: hostWarnings } = buildSkill(withHost, TEMPLATE);
    expect(hostWarnings).toContain(
      'Server variable without default {basePath} in the path of "/boapi/proxy/{basePath}" on /a, base path /boapi/proxy used',
    );
    expect(hostWarnings).toContain(
      'Parameter `w` with unknown location "an earlier change" on GET /b',
    );
  });

  it('renders the SKILL.md router with release, counts and file table', () => {
    const skill = files.get('SKILL.md');
    expect(skill).toMatch(/^---\nname: aima-api\n/);
    expect(skill).toContain('**Release 9.99** — OpenAPI 3.1.0 — 14 endpoints a widget can call');
    expect(skill).toContain('| `admin-user.md` | Users, documents');
    expect(skill).toContain('| `admin-other.md` |');
    expect(skill).toMatch(/\| `schemas\.md` \| .+ \| 4 schemas \|/);
    expect(skill).not.toMatch(/\{\{\w+\}\}/);
  });

  it('warns when the release cannot be found', () => {
    const noRelease = freshSpec();
    noRelease.info = { title: 'API' };
    const { warnings: releaseWarnings, stats: releaseStats } = buildSkill(noRelease, TEMPLATE);
    expect(releaseStats.release).toBe('unknown');
    expect(releaseWarnings).toContain('Release not found in info.title nor info.version');
  });

  it('throws when the template has an unknown placeholder', () => {
    expect(() => buildSkill(spec, '{{nope}}')).toThrow('Missing template value: {{nope}}');
  });

  it('does not depend on the order of paths and methods in the spec', () => {
    const reversed = parseSpec(FIXTURE);
    reversed.paths = Object.fromEntries(
      Object.entries(reversed.paths)
        .reverse()
        .map(([path, item]) => [path, Object.fromEntries(Object.entries(item).reverse())]),
    );
    expect(buildSkill(reversed, TEMPLATE).files).toEqual(files);
  });
});
