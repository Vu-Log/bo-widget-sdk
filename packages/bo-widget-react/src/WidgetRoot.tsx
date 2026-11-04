import { CssBaseline, ScopedCssBaseline, ThemeProvider, type Theme } from '@mui/material';
import { connect, type BoClient, type ConnectOptions } from '@vulog/bo-widget-sdk';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useBoTheme } from './hooks.js';
import { withPortalContainer } from './theme.js';
import { WidgetErrorBoundary } from './WidgetErrorBoundary.js';
import {
  defaultErrorFallback,
  logError,
  renderErrorFallback,
  WidgetProvider,
  type WidgetFallbacks,
} from './WidgetProvider.js';

/** Options shared by `toCustomElement` and `renderIframeWidget`. */
export interface WidgetRenderOptions extends WidgetFallbacks {
  /**
   * Customizes the MUI theme. Receives the theme built from the back office theme, and returns the
   * one to render with, such as `(boTheme) => createTheme(boTheme, { shape: { borderRadius: 8 } })`.
   * Do not mutate `boTheme`. The portal container of a Web Component is set on top of the result.
   * Called again on `themeChanged`.
   */
  customizeTheme?: ((boTheme: Theme) => Theme) | undefined;
}

/** @internal */
export interface WidgetRootProps extends WidgetRenderOptions {
  App: ComponentType;
  /** The element, as a Web Component; `null` in an iframe. */
  element: HTMLElement | null;
  connectOptions?: ConnectOptions | undefined;
  /** Where MUI portals go (Web Component); `undefined` keeps `document.body` (iframe). */
  portalContainer?: HTMLElement | undefined;
}

type Connection =
  | { status: 'connecting' }
  | { status: 'connected'; client: BoClient }
  | { status: 'error'; error: unknown };

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
  customizeTheme,
  portalContainer,
}: Pick<WidgetRootProps, 'App' | 'customizeTheme' | 'portalContainer'>) => {
  const boTheme = useBoTheme();
  const theme = useMemo(() => {
    const base = customizeTheme ? customizeTheme(boTheme) : boTheme;
    return portalContainer ? withPortalContainer(base, portalContainer) : base;
  }, [boTheme, customizeTheme, portalContainer]);
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
 * Connects to the back office, then renders the widget with its providers, inside an error
 * boundary. Unmounting it disconnects the client, including one that connects after the unmount.
 * @internal
 */
export const WidgetRoot = ({
  App,
  element,
  connectOptions,
  portalContainer,
  fallback = null,
  errorFallback = defaultErrorFallback,
  customizeTheme,
}: WidgetRootProps) => {
  const [connection, setConnection] = useState<Connection>({ status: 'connecting' });

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
        setConnection({ status: 'connected', client });
      },
      (error: unknown) => {
        if (!active) return;
        logError('cannot connect to the back office', error);
        setConnection({ status: 'error', error });
      },
    );
    return () => {
      active = false;
      client?.disconnect();
      setConnection({ status: 'connecting' });
    };
  }, [element, connectOptions]);

  const content =
    connection.status === 'connecting' ? (
      fallback
    ) : connection.status === 'error' ? (
      renderErrorFallback(errorFallback, connection.error)
    ) : (
      <WidgetProvider client={connection.client} fallback={fallback} errorFallback={errorFallback}>
        <ThemedApp App={App} customizeTheme={customizeTheme} portalContainer={portalContainer} />
      </WidgetProvider>
    );
  return <WidgetErrorBoundary errorFallback={errorFallback}>{content}</WidgetErrorBoundary>;
};
