import type { Theme } from '@mui/material';
import {
  BoError,
  type BoClient,
  type BoContext,
  type BoCurrentUser,
  type BoEventMap,
  type BoTheme,
} from '@vulog/bo-widget-sdk';
import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createBoMuiTheme } from './theme.js';

/**
 * Route of the back office, as pushed by `routeChanged`: `search` and `hash` keep their `?` and `#`
 * prefixes, as in `window.location`.
 */
export type BoLocation = Readonly<BoEventMap['routeChanged']>;

/** What the hooks read. @internal */
export interface WidgetState {
  readonly client: BoClient;
  readonly context: BoContext;
  readonly user: BoCurrentUser;
  readonly theme: Theme;
  readonly location: BoLocation | null;
}

/** Read by the hooks. @internal */
export const WidgetStateContext = createContext<WidgetState | null>(null);

/** What a widget shows while it starts, and when it cannot start. */
export interface WidgetFallbacks {
  /** Shown while the widget connects and loads the back office state. Nothing by default. */
  fallback?: ReactNode | undefined;
  /**
   * Shown when the widget cannot connect, load the back office state or render. Receives the error,
   * usually a `BoError`. A short message by default. The failure is final until the widget is
   * mounted again.
   */
  errorFallback?: ((error: unknown) => ReactNode) | undefined;
}

/** Props of {@link WidgetProvider}. */
export interface WidgetProviderProps extends WidgetFallbacks {
  /** Connection to the back office, from `connect`. */
  client: BoClient;
  children?: ReactNode;
}

interface LoadedState {
  context: BoContext;
  user: BoCurrentUser;
  boTheme: BoTheme;
  location: BoLocation | null;
}

// Every status names the client it belongs to, so that a new client never shows the state of the
// previous one, even for the render before the effect reloads it.
type Status =
  | { status: 'loading'; client: BoClient | null }
  | { status: 'error'; client: BoClient; error: unknown }
  | ({ status: 'ready'; client: BoClient } & LoadedState);

/** Logs a failure the widget shows, so that it can be diagnosed even with a custom fallback. @internal */
export const logError = (message: string, error: unknown): void => {
  console.error(`@vulog/bo-widget-react: ${message}`, error);
};

const describeError = (error: unknown): string => {
  if (error instanceof BoError) {
    const reason = error.reason ? `, ${error.reason}` : '';
    return `${error.message} (${error.code}${reason})`;
  }
  return error instanceof Error ? error.message : String(error);
};

/** Default `errorFallback`: the reason, in a block the screen readers announce. @internal */
export const defaultErrorFallback = (error: unknown): ReactNode => (
  <div role="alert" style={{ padding: 16 }}>
    The widget cannot be displayed: {describeError(error)}
  </div>
);

/**
 * Renders `errorFallback(error)`, or the default message for `error` when `errorFallback` itself
 * throws, so that the original error is always shown. @internal
 */
export const renderErrorFallback = (
  errorFallback: (error: unknown) => ReactNode,
  error: unknown,
): ReactNode => {
  try {
    return errorFallback(error);
  } catch (fallbackError) {
    logError('errorFallback failed', fallbackError);
    return defaultErrorFallback(error);
  }
};

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
 * state. A failure to subscribe or to load is logged, then shown with `errorFallback`. The provider
 * does not disconnect the client: its owner does.
 */
export const WidgetProvider = ({
  client,
  children,
  fallback = null,
  errorFallback = defaultErrorFallback,
}: WidgetProviderProps) => {
  const [state, setState] = useState<Status>({ status: 'loading', client: null });

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

    const stops: Array<() => void> = [];
    // Each listener is removed even when removing another one fails.
    const stopAll = () => {
      for (const stop of stops.splice(0)) {
        try {
          stop();
        } catch (error) {
          logError('cannot remove a back office listener', error);
        }
      }
    };
    try {
      stops.push(client.on('localeChanged', ({ locale }) => updateContext({ locale })));
      stops.push(client.on('fleetChanged', ({ fleetId }) => updateContext({ fleetId })));
      stops.push(client.on('userChanged', (user) => update({ user })));
      stops.push(client.on('themeChanged', (boTheme) => update({ boTheme })));
      stops.push(client.on('routeChanged', (location) => update({ location })));
    } catch (error) {
      stopAll();
      logError('cannot subscribe to the back office events', error);
      setState({ status: 'error', client, error });
      return () => {
        active = false;
      };
    }

    Promise.all([client.getContext(), client.getCurrentUser(), client.getTheme()]).then(
      ([context, user, boTheme]) => {
        if (!active) return;
        setState({
          status: 'ready',
          client,
          user,
          boTheme,
          location: initialLocation(client),
          ...changes,
          context: { ...context, ...contextChanges },
        });
      },
      (error: unknown) => {
        if (!active) return;
        logError('cannot load the back office state (context, user, theme)', error);
        setState({ status: 'error', client, error });
      },
    );

    return () => {
      active = false;
      stopAll();
    };
  }, [client]);

  const current = state.client === client ? state : null;
  const boTheme = current?.status === 'ready' ? current.boTheme : null;
  const theme = useMemo(() => (boTheme ? createBoMuiTheme(boTheme) : null), [boTheme]);

  const value = useMemo<WidgetState | null>(
    () =>
      current?.status === 'ready' && theme
        ? {
            client,
            context: current.context,
            user: current.user,
            theme,
            location: current.location,
          }
        : null,
    [client, current, theme],
  );

  if (current?.status === 'error') return <>{renderErrorFallback(errorFallback, current.error)}</>;
  if (!value) return <>{fallback}</>;
  return <WidgetStateContext.Provider value={value}>{children}</WidgetStateContext.Provider>;
};
