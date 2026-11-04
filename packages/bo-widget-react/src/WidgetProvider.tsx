import type { Theme } from '@mui/material';
import type { BoClient, BoContext, BoCurrentUser, BoEventMap, BoTheme } from '@vulog/bo-widget-sdk';
import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createBoMuiTheme } from './theme.js';

/** Route of the back office, as pushed by `routeChanged`. */
export type BoLocation = BoEventMap['routeChanged'];

/** What the hooks read. Internal to the package. */
export interface WidgetState {
  client: BoClient;
  context: BoContext;
  user: BoCurrentUser;
  theme: Theme;
  location: BoLocation | null;
}

/** Internal: read by the hooks. */
export const WidgetStateContext = createContext<WidgetState | null>(null);

/** Props of {@link WidgetProvider}. */
export interface WidgetProviderProps {
  /** Connection to the back office, from `connect`. */
  client: BoClient;
  children?: ReactNode;
  /** Shown while the initial state (context, user, theme) loads. Nothing by default. */
  fallback?: ReactNode;
  /** Shown when the initial state cannot be loaded. A short message by default. */
  errorFallback?: (error: unknown) => ReactNode;
}

interface LoadedState {
  context: BoContext;
  user: BoCurrentUser;
  boTheme: BoTheme;
  location: BoLocation | null;
}

type Status =
  { status: 'loading' } | { status: 'error'; error: unknown } | ({ status: 'ready' } & LoadedState);

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Default `errorFallback`: the reason, in a block the screen readers announce. */
export const defaultErrorFallback = (error: unknown): ReactNode => (
  <div role="alert" style={{ padding: 16 }}>
    Unable to connect to the back office: {errorMessage(error)}
  </div>
);

// No getter gives the current route. A Web Component shares the window of the back office, so its
// location is the back office's; an iframe only knows it from the first `routeChanged`.
const initialLocation = (client: BoClient): BoLocation | null => {
  if (client.mode !== 'webcomponent' || typeof window === 'undefined') return null;
  const { pathname, search, hash } = window.location;
  return { pathname, search, hash };
};

/**
 * Provides the back office state to the hooks (`useBoContext`, `useCurrentUser`, `useBoTheme`,
 * `useBoRouter`…): it loads the context, the user and the theme, then follows the events the back
 * office pushes. `toCustomElement` and `renderIframeWidget` already render it: use it directly
 * only to mount a widget by hand, or in tests.
 *
 * The children are rendered once the initial state is loaded, so the hooks never return a partial
 * state. The provider does not disconnect the client: its owner does.
 */
export const WidgetProvider = ({
  client,
  children,
  fallback = null,
  errorFallback = defaultErrorFallback,
}: WidgetProviderProps) => {
  const [state, setState] = useState<Status>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    // Events that arrive while loading are kept and applied on top of the loaded state, so that
    // none is lost.
    let changes: Partial<Omit<LoadedState, 'context'>> = {};
    let contextChanges: Partial<BoContext> = {};
    const update = (change: Partial<Omit<LoadedState, 'context'>>) => {
      if (!active) return;
      changes = { ...changes, ...change };
      setState((previous) => (previous.status === 'ready' ? { ...previous, ...change } : previous));
    };
    const updateContext = (change: Partial<BoContext>) => {
      if (!active) return;
      contextChanges = { ...contextChanges, ...change };
      setState((previous) =>
        previous.status === 'ready'
          ? { ...previous, context: { ...previous.context, ...change } }
          : previous,
      );
    };

    const stops = [
      client.on('localeChanged', ({ locale }) => updateContext({ locale })),
      client.on('fleetChanged', ({ fleetId }) => updateContext({ fleetId })),
      client.on('userChanged', (user) => update({ user })),
      client.on('themeChanged', (boTheme) => update({ boTheme })),
      client.on('routeChanged', (location) => update({ location })),
    ];

    Promise.all([client.getContext(), client.getCurrentUser(), client.getTheme()]).then(
      ([context, user, boTheme]) => {
        if (!active) return;
        setState({
          status: 'ready',
          user,
          boTheme,
          location: initialLocation(client),
          ...changes,
          context: { ...context, ...contextChanges },
        });
      },
      (error: unknown) => {
        if (active) setState({ status: 'error', error });
      },
    );

    return () => {
      active = false;
      stops.forEach((stop) => stop());
      setState({ status: 'loading' });
    };
  }, [client]);

  const boTheme = state.status === 'ready' ? state.boTheme : null;
  const theme = useMemo(() => (boTheme ? createBoMuiTheme(boTheme) : null), [boTheme]);

  const value = useMemo<WidgetState | null>(
    () =>
      state.status === 'ready' && theme
        ? { client, context: state.context, user: state.user, theme, location: state.location }
        : null,
    [client, state, theme],
  );

  if (state.status === 'error') return <>{errorFallback(state.error)}</>;
  if (!value) return <>{fallback}</>;
  return <WidgetStateContext.Provider value={value}>{children}</WidgetStateContext.Provider>;
};
