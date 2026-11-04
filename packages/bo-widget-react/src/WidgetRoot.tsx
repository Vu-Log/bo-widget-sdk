import { CssBaseline, ScopedCssBaseline, ThemeProvider, type Theme } from '@mui/material';
import { connect, type BoClient, type ConnectOptions } from '@vulog/bo-widget-sdk';
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useBoTheme } from './hooks.js';
import { defaultErrorFallback, WidgetProvider } from './WidgetProvider.js';
import { withPortalContainer } from './theme.js';

/** Options shared by `toCustomElement` and `renderIframeWidget`. */
export interface WidgetRenderOptions {
  /** Shown while the widget connects to the back office and loads its state. Nothing by default. */
  fallback?: ReactNode;
  /** Shown when the widget cannot connect or load its state. A short message by default. */
  errorFallback?: (error: unknown) => ReactNode;
  /**
   * Customizes the MUI theme. Receives the theme built from the back office theme, and returns the
   * one to render with, such as `(boTheme) => createTheme(boTheme, { shape: { borderRadius: 8 } })`.
   * The portal container of a Web Component is set on top of it. Called again on `themeChanged`.
   */
  theme?: ((boTheme: Theme) => Theme) | undefined;
}

interface WidgetRootProps extends WidgetRenderOptions {
  App: ComponentType;
  /** The element, as a Web Component; `null` in an iframe. */
  element: HTMLElement | null;
  connectOptions?: ConnectOptions | undefined;
  /** Where MUI portals go (Web Component); `undefined` keeps `document.body` (iframe). */
  portalContainer?: HTMLElement | undefined;
}

type Connection = { client: BoClient } | { error: unknown } | null;

// Fills the element and lays out its content in a column, so that the widget follows the layout of
// the back office content zone (toolbar `flex: none`, main area `flex: 1; min-height: 0`).
const scopedBaselineSx = {
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
} as const;

const ThemedApp = ({
  App,
  theme: customize,
  portalContainer,
}: Pick<WidgetRootProps, 'App' | 'theme' | 'portalContainer'>) => {
  const boTheme = useBoTheme();
  const theme = useMemo(() => {
    const base = customize ? customize(boTheme) : boTheme;
    return portalContainer ? withPortalContainer(base, portalContainer) : base;
  }, [boTheme, customize, portalContainer]);
  return (
    <ThemeProvider theme={theme}>
      {portalContainer ? (
        <ScopedCssBaseline sx={scopedBaselineSx}>
          <App />
        </ScopedCssBaseline>
      ) : (
        <>
          <CssBaseline />
          <App />
        </>
      )}
    </ThemeProvider>
  );
};

/**
 * Connects to the back office, then renders the widget with its providers. Unmounting it
 * disconnects the client, including one that connects after the unmount. Internal to the package.
 */
export const WidgetRoot = ({
  App,
  element,
  connectOptions,
  portalContainer,
  fallback = null,
  errorFallback = defaultErrorFallback,
  theme,
}: WidgetRootProps) => {
  const [connection, setConnection] = useState<Connection>(null);

  useEffect(() => {
    let active = true;
    let client: BoClient | null = null;
    connect(element, connectOptions).then(
      (connected) => {
        if (!active) {
          connected.disconnect();
          return;
        }
        client = connected;
        setConnection({ client });
      },
      (error: unknown) => {
        if (active) setConnection({ error });
      },
    );
    return () => {
      active = false;
      client?.disconnect();
      setConnection(null);
    };
  }, [element, connectOptions]);

  if (!connection) return <>{fallback}</>;
  if ('error' in connection) return <>{errorFallback(connection.error)}</>;
  return (
    <WidgetProvider client={connection.client} fallback={fallback} errorFallback={errorFallback}>
      <ThemedApp App={App} theme={theme} portalContainer={portalContainer} />
    </WidgetProvider>
  );
};
