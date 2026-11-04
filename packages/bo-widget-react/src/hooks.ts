import type { Theme } from '@mui/material';
import type {
  AuthFetch,
  BoClient,
  BoContext,
  BoCurrentUser,
  BoNavigatePayload,
} from '@vulog/bo-widget-sdk';
import { useContext, useMemo } from 'react';
import { WidgetStateContext, type BoLocation, type WidgetState } from './WidgetProvider.js';

const useWidgetState = (hook: string): WidgetState => {
  const state = useContext(WidgetStateContext);
  if (!state) {
    throw new Error(
      `${hook} must be called inside a widget: render it with toCustomElement or renderIframeWidget, or inside <WidgetProvider>`,
    );
  }
  return state;
};

/**
 * The connection to the back office, for the requests no other hook covers (`getSettings`,
 * `notify`, `getAccessToken`…).
 *
 * @throws {Error} Outside a widget (`toCustomElement`, `renderIframeWidget` or `WidgetProvider`).
 */
export const useBoClient = (): BoClient => useWidgetState('useBoClient').client;

/**
 * Context of the back office page: fleet, locale, timezone, currency, basename… It is kept up to
 * date with `localeChanged` and `fleetChanged`.
 *
 * @throws {Error} Outside a widget.
 */
export const useBoContext = (): BoContext => useWidgetState('useBoContext').context;

/**
 * The connected user, kept up to date with `userChanged`.
 *
 * @throws {Error} Outside a widget.
 */
export const useCurrentUser = (): BoCurrentUser => useWidgetState('useCurrentUser').user;

/**
 * `fetch` with the Vulog authentication (`BoClient.authFetch`): pass a path relative to the Vulog
 * API, such as `` `fleetmanager/public/fleets/${fleetId}/vehicles` ``. Its identity is stable for
 * the life of the widget, so it can go in effect dependencies.
 *
 * @throws {Error} Outside a widget.
 */
export const useAuthFetch = (): AuthFetch => useWidgetState('useAuthFetch').client.authFetch;

/**
 * MUI theme built from the back office theme, kept up to date with `themeChanged`. The widget
 * already renders inside it with `toCustomElement` and `renderIframeWidget`: use it to derive a
 * theme of your own (`createTheme(useBoTheme(), { … })`) or to read the palette.
 *
 * @throws {Error} Outside a widget.
 */
export const useBoTheme = (): Theme => useWidgetState('useBoTheme').theme;

/** What {@link useBoRouter} returns. */
export interface BoRouter {
  /** Path of the widget's view in the back office: give it to your router as its basename. */
  basename: string;
  /**
   * Current route of the back office, updated by `routeChanged`. A Web Component starts from
   * `window.location`; in an iframe it is `null` until the first `routeChanged`.
   */
  location: BoLocation | null;
  /**
   * Navigates in the back office (permission `navigate`): `'/app/...'` is a back office route under
   * the current fleet, `'details/1'` is relative to the widget's view.
   */
  navigate: (path: BoNavigatePayload['path']) => Promise<{ path: string }>;
}

/**
 * Routing in the back office: the widget's basename, the current route, and `navigate`. Never use
 * `window.location` or `history` to navigate.
 *
 * @throws {Error} Outside a widget.
 */
export const useBoRouter = (): BoRouter => {
  const { client, context, location } = useWidgetState('useBoRouter');
  const { basename } = context;
  return useMemo(
    () => ({ basename, location, navigate: (path: string) => client.navigate({ path }) }),
    [client, basename, location],
  );
};
