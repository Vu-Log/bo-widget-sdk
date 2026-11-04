/**
 * Scope of the generated `aima-api` skill and mapping between the AIMA OpenAPI tags and its files.
 *
 * The skill only lists what a BO widget can call with `bo.authFetch(...)`: the endpoints served
 * under the admin gateway ({@link GATEWAY_BASE_PATH}), minus those tagged {@link EXCLUDED_TAGS}.
 * Each kept endpoint goes to the first file (in this order) that claims one of its tags. Endpoints
 * whose tags are claimed by no file land in {@link FALLBACK_FILE} and are reported as warnings
 * (untagged endpoints too), so a new tag in the swagger shows up in the sync PR instead of
 * disappearing silently.
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

/** Endpoints carrying one of these tags are not meant for widgets: they are left out. */
export const EXCLUDED_TAGS = ['internal', 'deprecated', 'todo', 'need-migration'];

/** Endpoints whose route has one of these segments (`/internal/fleets/...`) are left out too. */
export const EXCLUDED_PATH_SEGMENTS = ['internal'];

/**
 * Prefixes of standard references (`ISO-8601`, `BG-23` of EN 16931…) kept in the descriptions.
 * Any other `ABC-123` reference is an issue-tracker key, meaningless for a widget developer: it is
 * removed from the descriptions.
 */
export const STANDARD_REFERENCE_PREFIXES = ['BG', 'BT', 'EN', 'ISO', 'RFC', 'SHA', 'UTC', 'UTF'];

/** File that also receives the endpoints whose tags match no other entry of {@link SKILL_FILES}. */
export const FALLBACK_FILE = 'admin-other.md';

/**
 * @typedef {object} SkillFile
 * @property {string} file - generated file name, relative to the skill directory
 * @property {string} title - H1 of the generated file
 * @property {string} summary - one-line content description, used in the SKILL.md router table
 * @property {string[]} [tags] - swagger tags claimed by this file (exact match)
 * @property {string} [tagPrefix] - claims any tag starting with this prefix
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
  },
];

/** File holding the one-level description of the schemas reachable from the kept endpoints. */
export const SCHEMAS_FILE = 'schemas.md';
