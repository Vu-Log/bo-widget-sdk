import { afterEach, describe, expect, it, vi } from 'vitest';
import Widget from './main';

customElements.define('test-widget', Widget);

type Listener = (data: unknown) => void;

/** A fake of the API the back office injects into the element, as `vulogBo`. */
const fakeBo = (overrides: Record<string, unknown> = {}) => {
  const listeners = new Map<string, Set<Listener>>();
  const api = {
    protocolVersion: 2,
    getContext: async () => ({ fleetId: 'FLEET-1', locale: 'en_GB', basename: '/' }),
    getCurrentUser: async () => ({ fullName: 'Jane Doe', roles: [] }),
    getTheme: async () => ({ palette: {}, typography: {}, mode: 'light' }),
    on: (name: string, listener: Listener) => {
      listeners.set(name, (listeners.get(name) ?? new Set()).add(listener));
    },
    off: vi.fn((name: string, listener: Listener) => {
      listeners.get(name)?.delete(listener);
    }),
    ...overrides,
  };
  const emit = (name: string, data: unknown) => listeners.get(name)?.forEach((l) => l(data));
  return { api, emit };
};

const mount = (api: object): HTMLElement => {
  const element = Object.assign(document.createElement('test-widget'), { vulogBo: api });
  document.body.append(element);
  return element;
};

const text = (element: HTMLElement): string => element.shadowRoot?.textContent ?? '';

describe('Widget', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('shows the fleet and the user of the back office', async () => {
    const element = mount(fakeBo().api);

    await vi.waitFor(() => expect(text(element)).toContain('Fleet FLEET-1'));
    expect(text(element)).toContain('Hello Jane Doe');
  });

  it('follows the fleet the back office switches to', async () => {
    const { api, emit } = fakeBo();
    const element = mount(api);
    await vi.waitFor(() => expect(text(element)).toContain('Fleet FLEET-1'));

    emit('fleetChanged', { fleetId: 'FLEET-2' });

    await vi.waitFor(() => expect(text(element)).toContain('Fleet FLEET-2'));
  });

  it('opens its dialog inside the shadow root', async () => {
    const element = mount(fakeBo().api);
    await vi.waitFor(() => expect(text(element)).toContain('Hello Jane Doe'));

    const button = [...(element.shadowRoot?.querySelectorAll('button') ?? [])].find(
      (candidate) => candidate.textContent === 'About',
    );
    button?.click();

    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('[role="dialog"]')?.textContent).toContain(
        'built with React and MUI',
      ),
    );
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows an error when the back office state cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const element = mount(fakeBo({ getContext: () => Promise.reject(new Error('boom')) }).api);

    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('[role="alert"]')?.textContent).toContain('boom'),
    );
  });

  it('closes the connection once removed', async () => {
    const { api } = fakeBo();
    const element = mount(api);
    await vi.waitFor(() => expect(text(element)).toContain('Fleet FLEET-1'));

    element.remove();

    await vi.waitFor(() => expect(api.off).toHaveBeenCalled());
  });
});
