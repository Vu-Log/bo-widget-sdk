import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBoMuiTheme, withPortalContainer } from './theme.js';

// Errors the next calls of `createTheme` throw before reaching MUI, to drive the failures that real
// data cannot (production messages, bugs, every stage rejected).
const createThemeFailures = vi.hoisted(() => [] as Error[]);
vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return {
    ...actual,
    createTheme: (...args: Parameters<typeof actual.createTheme>) => {
      const failure = createThemeFailures.shift();
      if (failure) throw failure;
      return actual.createTheme(...args);
    },
  };
});

afterEach(() => {
  createThemeFailures.length = 0;
  vi.restoreAllMocks();
});

const boTheme = {
  palette: { primary: { main: '#123456' } },
  typography: { fontFamily: 'Lato, sans-serif' },
  mode: 'dark',
} as const;

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
      expect.stringContaining('MUI cannot use the back office theme'),
      expect.any(Error),
    );
  });

  it('keeps the typography when only the palette is rejected', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const theme = createBoMuiTheme({
      palette: { primary: { main: 'not-a-color' } },
      typography: { fontFamily: 'Lato, sans-serif' },
      mode: 'light',
    });
    expect(theme.typography.fontFamily).toBe('Lato, sans-serif');
  });

  it('rethrows an error of MUI that is not about a malformed theme, without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createThemeFailures.push(new TypeError('Cannot read properties of undefined'));
    expect(() => createBoMuiTheme(boTheme)).toThrow('Cannot read properties of undefined');
    expect(warn).not.toHaveBeenCalled();
  });

  it('recognizes the minified errors of a production build of MUI', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createThemeFailures.push(
      new Error('Minified MUI error #9; visit https://mui.com/production-error/?code=9'),
    );
    const theme = createBoMuiTheme(boTheme);
    expect(theme.palette.mode).toBe('dark');
    expect(theme.typography.fontFamily).toBe('Lato, sans-serif');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('falls back to the default theme in the same mode when the typography is rejected too', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createThemeFailures.push(
      new Error('MUI: invalid palette'),
      new Error('MUI: invalid typography'),
    );
    const theme = createBoMuiTheme(boTheme);
    expect(theme.palette.mode).toBe('dark');
    expect(theme.typography.fontFamily).not.toBe('Lato, sans-serif');
    expect(warn).toHaveBeenCalledTimes(2);
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
