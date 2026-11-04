import { createTheme, type Theme } from '@mui/material';
import type { BoTheme } from '@vulog/bo-widget-sdk';

/**
 * Builds a MUI theme from the back office theme (`getTheme`): its palette, its typography and its
 * mode. The result lives in the widget only: it never changes the back office.
 *
 * A theme MUI cannot build (malformed palette sent by the back office) falls back to the default
 * MUI theme in the same mode, with a warning, so that the widget still renders.
 */
export const createBoMuiTheme = (boTheme: BoTheme): Theme => {
  const mode = boTheme.mode === 'dark' ? 'dark' : 'light';
  try {
    return createTheme({
      palette: { ...boTheme.palette, mode },
      typography: boTheme.typography,
    });
  } catch (error) {
    console.warn(
      '@vulog/bo-widget-react: the back office theme is not a valid MUI theme, the default theme is used',
      error,
    );
    return createTheme({ palette: { mode } });
  }
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
