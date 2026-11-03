import type { BoContext, BoCurrentUser, BoSettings } from '@vulog/bo-widget-sdk';

/**
 * How the fake back office answers in dev.
 *
 * - `mock`: a fake token, and the Vulog API calls get the static `responses`.
 * - `token`: the Vulog API calls go to a real environment, with the token pasted from its back
 *   office (`BO_WIDGET_TOKEN`, `BO_WIDGET_API_URL`, `BO_WIDGET_API_KEY`).
 */
export type FakeBoMode = 'mock' | 'token';

/** HTTP methods of the mock responses. */
export type MockMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Key of a mock response: method and path relative to `baseUrl`, without query nor leading `/`. */
export type MockResponseKey = `${MockMethod} ${string}`;

/** Options of the fake back office that `vite` serves in dev on `/__bo-widget/`. */
export interface WidgetDevOptions {
  /**
   * Defaults to `token` when `BO_WIDGET_TOKEN` is set, `mock` otherwise. Forcing `token` without
   * the three `BO_WIDGET_*` variables makes `vite` fail at startup.
   */
  mode?: FakeBoMode;
  /** Overrides the context of the fake back office (`getContext`). */
  context?: Partial<BoContext>;
  /** Overrides the connected user (`getCurrentUser`). */
  user?: Partial<BoCurrentUser>;
  /** Installation settings (`getSettings`), merged over the `default` of each manifest setting. */
  settings?: BoSettings;
  /**
   * Mock mode only (ignored in token mode): JSON bodies of the Vulog API calls, answered with
   * `200`, keyed by method and path relative to `baseUrl`, URL-decoded and without query
   * (`'GET fleetmanager/public/fleets/DEV-FLEET/vehicles'`). Any other call answers `404`.
   */
  responses?: Partial<Record<MockResponseKey, unknown>>;
}

const DEV_KEYS: readonly string[] = [
  'mode',
  'context',
  'user',
  'settings',
  'responses',
] satisfies (keyof WidgetDevOptions)[];

const MOCK_KEY_PATTERN = /^(?:GET|HEAD|POST|PUT|PATCH|DELETE) [^/?\s][^?\s]*$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Checks the `dev` options, which are not part of `widget.json`.
 *
 * @returns One issue per problem, with its path (`dev.responses.get x: …`); empty when valid.
 */
export const devOptionsIssues = (dev: unknown): string[] => {
  if (dev === undefined) return [];
  if (!isPlainObject(dev)) return ['dev: must be an object'];
  const issues = Object.keys(dev)
    .filter((key) => !DEV_KEYS.includes(key))
    .map((key) => `dev.${key}: unknown configuration key`);
  if (dev.mode !== undefined && dev.mode !== 'mock' && dev.mode !== 'token') {
    issues.push(`dev.mode: must be "mock" or "token"`);
  }
  for (const key of ['context', 'user', 'settings', 'responses']) {
    if (dev[key] !== undefined && !isPlainObject(dev[key]))
      issues.push(`dev.${key}: must be an object`);
  }
  if (isPlainObject(dev.responses)) {
    for (const key of Object.keys(dev.responses)) {
      if (!MOCK_KEY_PATTERN.test(key)) {
        issues.push(
          `dev.responses.${key}: must be "<METHOD> <path>", the method in capitals and the path without leading "/" nor query (e.g. "GET fleetmanager/public/fleets")`,
        );
      }
    }
  }
  return issues;
};
