import { createTheme, type Theme, type ThemeOptions } from '@mui/material';
import type { BoTheme } from '@vulog/bo-widget-sdk';

// MUI throws errors whose message starts with "MUI:" (or "Minified MUI error" in production) for a
// color or a palette it cannot use. Any other error is a bug, not a malformed theme: it is not
// hidden.
const isMuiThemeError = (error: unknown): boolean =>
  error instanceof Error && /^(Minified )?MUI\b/.test(error.message);

const tryCreateTheme = (options: ThemeOptions): Theme | null => {
  try {
    return createTheme(options);
  } catch (error) {
    if (!isMuiThemeError(error)) throw error;
    console.warn(
      '@vulog/bo-widget-react: MUI cannot use the back office theme, part of it is ignored',
      error,
    );
    return null;
  }
};

/**
 * Builds a MUI theme from the back office theme (`getTheme`): its palette, its typography and its
 * mode. The result lives in the widget only: it never changes the back office.
 *
 * When MUI rejects the palette or the typography sent by the back office, the theme is built
 * without the rejected part, with a warning, so that the widget still renders: first without the
 * palette, then with the default MUI theme in the same mode.
 *
 * @throws Any error of MUI that is not about a malformed theme.
 */
export const createBoMuiTheme = (boTheme: BoTheme): Theme => {
  const mode = boTheme.mode === 'dark' ? 'dark' : 'light';
  return (
    tryCreateTheme({ palette: { ...boTheme.palette, mode }, typography: boTheme.typography }) ??
    tryCreateTheme({ palette: { mode }, typography: boTheme.typography }) ??
    createTheme({ palette: { mode } })
  );
};

/**
 * Returns `theme` with the MUI portals (Dialog, Drawer, Menu, Popover, Popper, Tooltip…) rendered
 * into `container`, so that they stay inside the widget's shadow root, with its styles.
 */
export const withPortalContainer = (theme: Theme, container: HTMLElement): Theme =>
  createTheme(theme, {
    components: {
      MuiModal: { defaultProps: { container } },
      MuiPopover: { defaultProps: { container } },
      MuiPopper: { defaultProps: { container } },
    },
  });
