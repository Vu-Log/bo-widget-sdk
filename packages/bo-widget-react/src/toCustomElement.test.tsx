import { Button, createTheme, Dialog, DialogTitle } from '@mui/material';
import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { useBoContext } from './hooks.js';
import { createFakeHostApi } from './testing/fakeHostApi.js';
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

const shadowText = (element: HTMLElement) => element.shadowRoot?.textContent ?? '';

const FleetApp = () => {
  const { fleetId } = useBoContext();
  return <p>Fleet {fleetId}</p>;
};

afterEach(async () => {
  await act(async () => document.body.replaceChildren());
  document.head.querySelectorAll('style').forEach((style) => style.remove());
});

describe('toCustomElement', () => {
  it('returns an HTMLElement class without registering it', () => {
    const define = vi.spyOn(customElements, 'define');
    const WidgetClass = toCustomElement(FleetApp);
    expect(WidgetClass.prototype).toBeInstanceOf(HTMLElement);
    expect(define).not.toHaveBeenCalled();
    define.mockRestore();
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

  it('renders MUI dialogs into the shadow root, styled and covering the whole page', async () => {
    const App = () => (
      <Dialog open fullScreen>
        <DialogTitle>Edit vehicle</DialogTitle>
      </Dialog>
    );
    const element = await mount(toCustomElement(App));
    const shadow = defined(element.shadowRoot);
    await waitFor(() => expect(shadow.querySelector('[role="dialog"]')).not.toBeNull());

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    const modal = defined(shadow.querySelector<HTMLElement>('.MuiDialog-root'));
    expect(modal.parentElement?.hasAttribute('data-bo-widget-portals')).toBe(true);
    const css = [...shadow.querySelectorAll('style')].map((style) => style.textContent).join('\n');
    const modalClass = defined([...modal.classList].find((name) => name.startsWith('bo-widget-')));
    const modalRule = new RegExp(`\\.${modalClass}\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
    expect(modalRule).toContain('position:fixed');
    for (const side of ['top', 'right', 'bottom', 'left']) expect(modalRule).toContain(`${side}:0`);
    expect(document.head.querySelector('style[data-emotion]')).toBeNull();
  });

  it('disconnects and unmounts once removed from the page', async () => {
    const fake = createFakeHostApi();
    const element = await mount(toCustomElement(FleetApp), fake.api);
    await waitFor(() => expect(shadowText(element)).toContain('Fleet FLEET'));
    expect(fake.listenerCount()).toBeGreaterThan(0);

    await act(async () => element.remove());

    expect(fake.listenerCount()).toBe(0);
    expect(element.shadowRoot?.childNodes).toHaveLength(0);
  });

  it('keeps the same tree and connection when the element is moved', async () => {
    const fake = createFakeHostApi();
    const element = await mount(toCustomElement(FleetApp), fake.api);
    await waitFor(() => expect(shadowText(element)).toContain('Fleet FLEET'));
    const paragraph = element.shadowRoot?.querySelector('p');
    const other = document.createElement('section');
    document.body.appendChild(other);

    await act(async () => other.appendChild(element));

    expect(element.shadowRoot?.querySelector('p')).toBe(paragraph);
    expect(fake.api.getContext).toHaveBeenCalledTimes(1);
    expect(fake.listenerCount()).toBeGreaterThan(0);
  });

  it('mounts again when inserted after a removal', async () => {
    const fake = createFakeHostApi();
    const element = await mount(toCustomElement(FleetApp), fake.api);
    await waitFor(() => expect(shadowText(element)).toContain('Fleet FLEET'));
    await act(async () => element.remove());

    await act(async () => document.body.appendChild(element));

    await waitFor(() => expect(shadowText(element)).toContain('Fleet FLEET'));
    expect(fake.api.getContext).toHaveBeenCalledTimes(2);
  });

  it('shows the error fallback when vulogBo is not a back office API', async () => {
    const errorFallback = vi.fn((error: unknown) => `Failed: ${(error as Error).message}`);
    const element = await mount(toCustomElement(FleetApp, { errorFallback }), { nope: true });
    await waitFor(() => expect(shadowText(element)).toContain('Failed:'));
    expect(shadowText(element)).toContain('vulogBo is not a back office API');
  });

  it('shows the default error message when the initial state cannot be loaded', async () => {
    const { api } = createFakeHostApi({
      getCurrentUser: async () => {
        throw new Error('session expired');
      },
    });
    const element = await mount(toCustomElement(FleetApp), api);
    await waitFor(() => expect(element.shadowRoot?.querySelector('[role="alert"]')).not.toBeNull());
    expect(shadowText(element)).toContain('session expired');
  });

  it('applies the theme customization on top of the back office theme', async () => {
    const App = () => <Button variant="contained">Save</Button>;
    const element = await mount(
      toCustomElement(App, {
        theme: (boTheme) => {
          expect(boTheme.palette.primary.main).toBe('#123456');
          return createTheme(boTheme, { palette: { primary: { main: '#abcdef' } } });
        },
      }),
    );
    await waitFor(() => expect(element.shadowRoot?.querySelector('button')).not.toBeNull());
    const css = [...defined(element.shadowRoot).querySelectorAll('style')]
      .map((style) => style.textContent)
      .join('\n');
    expect(css).toContain('#abcdef');
  });
});
