import { Button, createTheme, Dialog, DialogTitle, Menu, MenuItem, Tooltip } from '@mui/material';
import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { useBoContext } from './hooks.js';
import { boTheme, createFakeHostApi } from './testing/fakeHostApi.js';
import { toCustomElement } from './toCustomElement.js';

beforeAll(() => {
  // React only batches `act` updates in an environment that declares it.
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let count = 0;
// The back office registers the class under its own tag: the tests do the same.
const register = (WidgetClass: CustomElementConstructor): string => {
  const tag = `widget-test-${++count}`;
  customElements.define(tag, WidgetClass);
  return tag;
};

const mount = async (
  WidgetClass: CustomElementConstructor,
  vulogBo: unknown = createFakeHostApi().api,
) => {
  const element = document.createElement(register(WidgetClass)) as HTMLElement & {
    vulogBo?: unknown;
  };
  element.vulogBo = vulogBo;
  await act(async () => {
    document.body.appendChild(element);
  });
  return element;
};

const defined = <T,>(value: T | null | undefined): T => {
  if (value === null || value === undefined) throw new Error('Expected a value');
  return value;
};

// The element unmounts in a later task.
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

// Text the widget renders, without the CSS of the <style> elements.
const shadowText = (element: HTMLElement) =>
  [...(element.shadowRoot?.children ?? [])]
    .filter((child) => child.tagName !== 'STYLE')
    .map((child) => child.textContent)
    .join('');

// Emotion's development mode writes the rules as text, which the tests read.
const shadowCss = (element: HTMLElement) =>
  [...defined(element.shadowRoot).querySelectorAll('style')]
    .map((style) => style.textContent)
    .join('\n');

const ruleOf = (css: string, node: Element): string => {
  const className = defined([...node.classList].find((name) => name.startsWith('bo-widget-')));
  return new RegExp(`\\.${className}\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
};

const FleetApp = () => {
  const { fleetId } = useBoContext();
  return <p>Fleet {fleetId}</p>;
};

afterEach(async () => {
  await act(async () => {
    document.body.replaceChildren();
    await nextTask();
  });
  document.head.querySelectorAll('style').forEach((style) => style.remove());
  vi.restoreAllMocks();
});

describe('toCustomElement', () => {
  it('returns an HTMLElement class without registering it', () => {
    const define = vi.spyOn(customElements, 'define');
    const WidgetClass = toCustomElement(FleetApp);
    expect(WidgetClass.prototype).toBeInstanceOf(HTMLElement);
    expect(define).not.toHaveBeenCalled();
  });

  it('renders the app in an open shadow root once connected to the back office', async () => {
    const element = await mount(toCustomElement(FleetApp));
    await waitFor(() => expect(shadowText(element)).toContain('Fleet FLEET'));
    expect(element.shadowRoot?.mode).toBe('open');
    expect(element.shadowRoot?.querySelector('style')?.textContent).toContain(':host');
    expect(element.shadowRoot?.querySelector('.MuiScopedCssBaseline-root')).not.toBeNull();
  });

  it('shows the fallback while connecting', async () => {
    const { api } = createFakeHostApi({ getContext: () => new Promise(() => {}) });
    const element = await mount(toCustomElement(FleetApp, { fallback: 'Loading…' }), api);
    expect(shadowText(element)).toContain('Loading…');
  });

  it('keeps every style of the widget out of document.head', async () => {
    const headStyles = document.head.querySelectorAll('style').length;
    const element = await mount(toCustomElement(() => <Button variant="contained">Save</Button>));
    await waitFor(() => expect(element.shadowRoot?.querySelector('button')).not.toBeNull());
    expect(document.head.querySelectorAll('style')).toHaveLength(headStyles);
    const emotionStyles = element.shadowRoot?.querySelectorAll('style[data-emotion^="bo-widget"]');
    expect(emotionStyles?.length).toBeGreaterThan(0);
  });

  it('keeps the rules as text even in production mode, so that they survive a move', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const element = await mount(toCustomElement(() => <Button variant="contained">Save</Button>));
    await waitFor(() => expect(element.shadowRoot?.querySelector('button')).not.toBeNull());
    vi.unstubAllEnvs();
    expect(
      ruleOf(shadowCss(element), defined(element.shadowRoot?.querySelector('button'))),
    ).not.toBe('');
  });

  it('renders full-screen MUI dialogs into the shadow root, styled and covering the page', async () => {
    const App = () => (
      <Dialog open fullScreen>
        <DialogTitle>Edit vehicle</DialogTitle>
      </Dialog>
    );
    const element = await mount(toCustomElement(App));
    const shadow = defined(element.shadowRoot);
    await waitFor(() => expect(shadow.querySelector('[role="dialog"]')).not.toBeNull());

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    const modal = defined(shadow.querySelector('.MuiDialog-root'));
    expect(modal.parentElement?.hasAttribute('data-bo-widget-portals')).toBe(true);
    const css = shadowCss(element);
    const modalRule = ruleOf(css, modal);
    expect(modalRule).toContain('position:fixed');
    for (const side of ['top', 'right', 'bottom', 'left']) expect(modalRule).toContain(`${side}:0`);
    const paperRule = ruleOf(css, defined(shadow.querySelector('.MuiDialog-paperFullScreen')));
    expect(paperRule).toContain('width:100%');
    expect(paperRule).toContain('height:100%');
    expect(document.head.querySelector('style[data-emotion]')).toBeNull();
  });

  it('renders menus and tooltips into the shadow root', async () => {
    const App = () => (
      <>
        <Tooltip open title="Vehicle details">
          <span>Hover me</span>
        </Tooltip>
        <Menu open anchorEl={document.body}>
          <MenuItem>Edit</MenuItem>
        </Menu>
      </>
    );
    const element = await mount(toCustomElement(App));
    const shadow = defined(element.shadowRoot);
    await waitFor(() => expect(shadow.querySelector('[role="menu"]')).not.toBeNull());
    await waitFor(() => expect(shadow.querySelector('[role="tooltip"]')).not.toBeNull());

    const portals = defined(shadow.querySelector('[data-bo-widget-portals]'));
    expect(portals.querySelector('[role="menu"]')).not.toBeNull();
    expect(portals.querySelector('[role="tooltip"]')).not.toBeNull();
    expect(document.body.querySelector('[role="menu"], [role="tooltip"]')).toBeNull();
  });

  it('disconnects and unmounts once removed from the page', async () => {
    const fake = createFakeHostApi();
    const element = await mount(toCustomElement(FleetApp), fake.api);
    await waitFor(() => expect(shadowText(element)).toContain('Fleet FLEET'));
    expect(fake.listenerCount()).toBeGreaterThan(0);

    await act(async () => {
      element.remove();
      await nextTask();
    });

    expect(fake.listenerCount()).toBe(0);
    expect(element.shadowRoot?.childNodes).toHaveLength(0);
  });

  it('keeps the same tree and connection when the element is moved, even across an await', async () => {
    const fake = createFakeHostApi();
    const element = await mount(toCustomElement(FleetApp), fake.api);
    await waitFor(() => expect(shadowText(element)).toContain('Fleet FLEET'));
    const paragraph = element.shadowRoot?.querySelector('p');
    const other = document.createElement('section');
    document.body.appendChild(other);

    await act(async () => {
      element.remove();
      await Promise.resolve();
      other.appendChild(element);
      await nextTask();
    });

    expect(element.shadowRoot?.querySelector('p')).toBe(paragraph);
    expect(fake.api.getContext).toHaveBeenCalledTimes(1);
    expect(fake.listenerCount()).toBeGreaterThan(0);
  });

  it('mounts again, with its styles, when inserted after a removal', async () => {
    const fake = createFakeHostApi();
    const App = () => <Button>{useBoContext().fleetId}</Button>;
    const element = await mount(toCustomElement(App), fake.api);
    await waitFor(() => expect(shadowText(element)).toContain('FLEET'));
    await act(async () => {
      element.remove();
      await nextTask();
    });

    await act(async () => document.body.appendChild(element));

    await waitFor(() => expect(shadowText(element)).toContain('FLEET'));
    expect(fake.api.getContext).toHaveBeenCalledTimes(2);
    expect(
      ruleOf(shadowCss(element), defined(element.shadowRoot?.querySelector('button'))),
    ).not.toBe('');
  });

  it('shows the error fallback, and logs, when vulogBo is not a back office API', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorFallback = vi.fn((error: unknown) => `Failed: ${(error as Error).message}`);
    const element = await mount(toCustomElement(FleetApp, { errorFallback }), { nope: true });
    await waitFor(() => expect(shadowText(element)).toContain('Failed:'));
    expect(shadowText(element)).toContain('vulogBo is not a back office API');
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('cannot connect to the back office'),
      expect.any(Error),
    );
  });

  it('shows the default error message, with the error code, when the state cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { api } = createFakeHostApi({
      getCurrentUser: async () => {
        throw Object.assign(new Error('session expired'), { code: 'no-token' });
      },
    });
    const element = await mount(toCustomElement(FleetApp), api);
    await waitFor(() => expect(element.shadowRoot?.querySelector('[role="alert"]')).not.toBeNull());
    expect(shadowText(element)).toContain('The widget could not start');
    expect(shadowText(element)).toContain('session expired (INTERNAL, no-token)');
  });

  it('shows the error fallback when the app throws while rendering', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Broken = () => {
      throw new Error('render failed');
    };
    const element = await mount(
      toCustomElement(Broken, { errorFallback: (error) => `Oops: ${(error as Error).message}` }),
    );
    await waitFor(() => expect(shadowText(element)).toBe('Oops: render failed'));
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('the widget failed to render'),
      expect.any(Error),
    );
  });

  it('shows the default message when errorFallback itself throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const element = await mount(
      toCustomElement(FleetApp, {
        errorFallback: () => {
          throw new Error('fallback failed');
        },
      }),
      { nope: true },
    );
    await waitFor(() => expect(element.shadowRoot?.querySelector('[role="alert"]')).not.toBeNull());
    expect(shadowText(element)).toContain('vulogBo is not a back office API');
  });

  it('applies the theme customization on top of the back office theme, portals kept', async () => {
    const App = () => (
      <>
        <Button variant="contained">Save</Button>
        <Dialog open>
          <DialogTitle>Edit</DialogTitle>
        </Dialog>
      </>
    );
    const element = await mount(
      toCustomElement(App, {
        customizeTheme: (theme) => {
          expect(theme.palette.primary.main).toBe('#123456');
          return createTheme(theme, {
            palette: { primary: { main: '#abcdef' } },
            components: { MuiModal: { defaultProps: { container: document.body } } },
          });
        },
      }),
    );
    const shadow = defined(element.shadowRoot);
    await waitFor(() => expect(shadow.querySelector('[role="dialog"]')).not.toBeNull());
    expect(shadowCss(element)).toContain('#abcdef');
    expect(shadow.querySelector('[data-bo-widget-portals] [role="dialog"]')).not.toBeNull();
  });

  it('shows the error fallback when the theme customization throws on themeChanged', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = createFakeHostApi();
    const element = await mount(
      toCustomElement(FleetApp, {
        errorFallback: () => 'Theme failed',
        customizeTheme: (theme) => {
          if (theme.palette.mode === 'dark') throw new Error('no dark theme');
          return theme;
        },
      }),
      fake.api,
    );
    await waitFor(() => expect(shadowText(element)).toContain('Fleet FLEET'));

    await act(async () => fake.emit('themeChanged', { ...boTheme, mode: 'dark' }));

    expect(shadowText(element)).toBe('Theme failed');
  });
});
