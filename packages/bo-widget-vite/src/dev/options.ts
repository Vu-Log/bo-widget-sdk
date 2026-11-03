import type { BoContext, BoCurrentUser, BoSettings } from '@vulog/bo-widget-sdk';

/**
 * How the fake back office answers in dev.
 *
 * - `mock`: a fake token, and the Vulog API calls get the static `responses`.
 * - `token`: the Vulog API calls go to a real environment, with the token pasted from its back
 *   office (`BO_WIDGET_TOKEN`, `BO_WIDGET_API_URL`, `BO_WIDGET_API_KEY`).
 */
export type FakeBoMode = 'mock' | 'token';

/** Options of the fake back office that `vite` serves in dev on `/__bo-widget/`. */
export interface WidgetDevOptions {
  /** Defaults to `token` when `BO_WIDGET_TOKEN` is set, `mock` otherwise. */
  mode?: FakeBoMode;
  /** Overrides the context of the fake back office (`getContext`). */
  context?: Partial<BoContext>;
  /** Overrides the connected user (`getCurrentUser`). */
  user?: Partial<BoCurrentUser>;
  /** Installation settings (`getSettings`), merged over the `default` of each manifest setting. */
  settings?: BoSettings;
  /**
   * Mock mode only: JSON bodies of the Vulog API calls, keyed by method and path relative to
   * `baseUrl`, without query (`'GET fleetmanager/public/fleets/DEV-FLEET/vehicles'`). Any other
   * call answers `404`.
   */
  responses?: Record<string, unknown>;
}
