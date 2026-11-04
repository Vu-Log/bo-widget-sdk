/**
 * Scope of the generated `aima-api` skill and mapping between the AIMA OpenAPI tags and its files.
 *
 * The skill only lists what a BO widget can call with `bo.authFetch(...)`. An endpoint is left out
 * (and counted by reason in the sync summary) when:
 * - its base path is not under the admin gateway ({@link GATEWAY_BASE_PATH}), e.g. the mobile API;
 * - its base path is unknown: its path item declares `servers: []` and its route does not start
 *   with one of {@link KNOWN_ROOT_SERVICES} (reported as a warning);
 * - it is deprecated (`deprecated: true` or the `deprecated` tag) or internal (`x-internal: true`
 *   or the `internal` tag);
 * - it carries one of {@link EXCLUDED_TAGS} (compared case-insensitively);
 * - its route or its base path has one of {@link EXCLUDED_PATH_SEGMENTS}.
 *
 * Each kept endpoint goes to the first file (in this order) that claims one of its tags. Endpoints
 * whose tags are claimed by no file land in {@link FALLBACK_FILE} and are reported as warnings
 * (untagged endpoints too, and `admin-*` tags caught by its prefix but missing from its
 * `expectedTags`), so a new tag in the swagger shows up in the sync PR instead of disappearing
 * silently.
 */

/** Public swagger of the AIMA platform. */
export const DEFAULT_SPEC_URL = 'https://vulog-doc-api.web.app/swagger/sta.yaml';

/**
 * Admin gateway: `authFetch` resolves its paths under this prefix (the BO `baseUrl`), so only the
 * endpoints whose base path starts with it are kept. Also the base path used when neither the path
 * nor the spec declares a server.
 */
export const GATEWAY_BASE_PATH = 'boapi/proxy';

/**
 * Host suffix of the private services that some swagger paths declare as their server
 * (`https://service.example.local:1443/user`). Clients never reach them directly: they go through
 * the admin gateway, under {@link GATEWAY_BASE_PATH} followed by the service path (`boapi/proxy/user`).
 */
export const PRIVATE_HOST_SUFFIX = '.local';

/**
 * Services of the admin gateway that a route may start with (`/geoloc/fleets/...`, called as
 * `boapi/proxy/geoloc/fleets/...`). Only used for the path items declaring `servers: []`, whose base
 * path is otherwise unknown: such a route is kept only when its first segment is one of these.
 */
export const KNOWN_ROOT_SERVICES = ['desk', 'fleetadmin', 'geoloc'];

/**
 * Endpoints carrying one of these tags (in any case: `Internal` too) are not meant for widgets:
 * they are left out.
 */
export const EXCLUDED_TAGS = ['internal', 'deprecated', 'todo', 'need-migration'];

/**
 * Endpoints whose route or base path has one of these segments (`/internal/fleets/...`,
 * `boapi/proxy/internal`) are left out too.
 */
export const EXCLUDED_PATH_SEGMENTS = ['internal'];

/**
 * Prefixes of standard references (`ISO-8601`, `SHA-256`, `RSA-2048`…) kept in the descriptions.
 * Any other `ABC-123` reference (upper-case prefix, {@link TRACKER_KEY_MIN_DIGITS} digits or more)
 * is an issue-tracker key, meaningless for a widget developer: it is removed from the descriptions.
 */
export const STANDARD_REFERENCE_PREFIXES = [
  'AES',
  'BCP',
  'BG',
  'BT',
  'COVID',
  'EN',
  'ES',
  'HS',
  'HTTP',
  'ISO',
  'PS',
  'PSD',
  'RFC',
  'RS',
  'RSA',
  'SHA',
  'TLS',
  'UTC',
  'UTF',
];

/**
 * Minimum number of digits of an issue-tracker key: shorter references (`HTTP-2`, `UTF-8`,
 * `COVID-19`) are technical terms, never redacted.
 */
export const TRACKER_KEY_MIN_DIGITS = 3;

/** File that also receives the endpoints whose tags match no other entry of {@link SKILL_FILES}. */
export const FALLBACK_FILE = 'admin-other.md';

/**
 * @typedef {object} SkillFile
 * @property {string} file - generated file name, relative to the skill directory
 * @property {string} title - H1 of the generated file
 * @property {string} summary - one-line content description, used in the SKILL.md router table
 * @property {string[]} [tags] - swagger tags claimed by this file (exact match)
 * @property {string} [tagPrefix] - claims any tag starting with this prefix
 * @property {string[]} [expectedTags] - tags known to be claimed by `tagPrefix`: any other tag it
 *   claims is reported as a warning, so a new admin area shows up in the sync PR
 */

/**
 * Order is priority: the first file claiming one of an endpoint's tags wins, so an entry using
 * `tagPrefix` must come after every explicit file whose tags it would also match.
 *
 * @type {SkillFile[]}
 */
export const SKILL_FILES = [
  {
    file: 'admin-user.md',
    title: 'AIMA Admin User API Endpoints',
    summary: 'Users, documents, profiles, entities, roles, registration, etc.',
    tags: ['admin-user'],
  },
  {
    file: 'admin-trip.md',
    title: 'AIMA Admin Trip API Endpoints',
    summary: 'Trips, lifecycle, billing, notes, etc.',
    tags: ['admin-trip'],
  },
  {
    file: 'admin-booking.md',
    title: 'AIMA Admin Booking API Endpoints',
    summary: 'Stations, booking requests, security margins, etc.',
    tags: ['admin-booking'],
  },
  {
    file: 'admin-vehicle.md',
    title: 'AIMA Admin Vehicle API Endpoints',
    summary: 'Vehicles, models, options, groups, categories, etc.',
    tags: ['admin-vehicle'],
  },
  {
    file: 'admin-invoice.md',
    title: 'AIMA Admin Invoice API Endpoints',
    summary: 'Invoices, taxes, payments, credit notes, etc.',
    tags: ['admin-invoice'],
  },
  {
    file: 'admin-service.md',
    title: 'AIMA Admin Service API Endpoints',
    summary: 'Services, zones, vehicles, POIs, stations, etc.',
    tags: ['admin-service'],
  },
  {
    file: 'admin-fleet.md',
    title: 'AIMA Admin Fleet API Endpoints',
    summary: 'Fleet manager: fleet vehicles, sync, enable/disable, etc.',
    tags: ['admin-fleet'],
  },
  {
    file: 'business-other.md',
    title: 'AIMA Business, Service Desk and Geoloc API Endpoints',
    summary:
      'Business controllers (billing, payment gateways) + Service Desk (tickets, groups, categories) + Geoloc (zones, POIs, labels)',
    tags: [
      'business-controller',
      'invoice-controller',
      'billing-controller',
      'trip-controller',
      'user-controller',
      'stripe-controller',
      'product-controller',
      'invitation-request-controller',
      'payment-gateway-callbacks',
      'Tickets',
      'Groups',
      'Categories',
      'Assignees',
      'Attachments',
      'Configuration',
      'Label',
      'POI',
      'Zone',
      'Zones',
      'Operationnal Areas',
    ],
  },
  {
    file: FALLBACK_FILE,
    title: 'AIMA Other Admin API Endpoints',
    summary:
      'Other admin APIs (report, product, pricing, subscription, promocode, mobility plan, time ranges, notifier, PDF, etc.) and unmapped tags',
    tagPrefix: 'admin-',
    expectedTags: [
      'admin-additional-driver',
      'admin-charge-product-request',
      'admin-mobility-plan',
      'admin-notifier-rules',
      'admin-notifier-simulator',
      'admin-notifier-templates',
      'admin-notifier-tickets',
      'admin-pdf-simulator',
      'admin-pricing',
      'admin-product',
      'admin-promocode',
      'admin-receipt',
      'admin-report',
      'admin-subscription',
      'admin-timeranges',
    ],
  },
];

/** File holding the one-level description of the schemas reachable from the kept endpoints. */
export const SCHEMAS_FILE = 'schemas.md';
