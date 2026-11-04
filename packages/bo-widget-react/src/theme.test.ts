import { describe, expect, it, vi } from 'vitest';
import { createBoMuiTheme, withPortalContainer } from './theme.js';

describe('createBoMuiTheme', () => {
  it('builds a MUI theme from the palette, typography and mode of the back office', () => {
    const theme = createBoMuiTheme({
      palette: { primary: { main: '#123456' }, secondary: { main: '#654321' } },
      typography: { fontFamily: 'Lato, sans-serif' },
      mode: 'dark',
    });
    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.primary.main).toBe('#123456');
    expect(theme.palette.primary.contrastText).toBeDefined();
    expect(theme.typography.fontFamily).toBe('Lato, sans-serif');
  });

  it('uses the light mode for a mode MUI does not know', () => {
    expect(
      createBoMuiTheme({ palette: {}, typography: {}, mode: 'high-contrast' }).palette.mode,
    ).toBe('light');
  });

  it('lets the mode win over a mode in the palette', () => {
    const theme = createBoMuiTheme({ palette: { mode: 'dark' }, typography: {}, mode: 'light' });
    expect(theme.palette.mode).toBe('light');
  });

  it('falls back to the default theme in the same mode, with a warning, on an invalid palette', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const theme = createBoMuiTheme({
      palette: { primary: { main: 'not-a-color' } },
      typography: {},
      mode: 'dark',
    });
    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.primary.main).toBe(
      createBoMuiTheme({ palette: {}, typography: {}, mode: 'dark' }).palette.primary.main,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('not a valid MUI theme'),
      expect.any(Error),
    );
    warn.mockRestore();
  });
});

describe('withPortalContainer', () => {
  it('sets the container of every MUI portal and keeps the rest of the theme', () => {
    const container = document.createElement('div');
    const base = createBoMuiTheme({
      palette: { primary: { main: '#123456' } },
      typography: {},
      mode: 'light',
    });
    const theme = withPortalContainer(base, container);
    for (const name of ['MuiModal', 'MuiPopover', 'MuiPopper'] as const) {
      expect(theme.components?.[name]?.defaultProps).toMatchObject({ container });
    }
    expect(theme.palette.primary.main).toBe('#123456');
  });
});
