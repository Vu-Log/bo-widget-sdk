import { afterEach, describe, expect, it, vi } from 'vitest';
import Widget from './main';

customElements.define('test-widget', Widget);

type Listener = (data: unknown) => void;

/** A fake of the API the back office injects into the element, as `vulogBo`. */
const fakeBo = (overrides: Record<string, unknown> = {}) => {
  const listeners = new Map<string, Set<Listener>>();
  const api = {
    protocolVersion: 2,
    getContext: async () => ({ fleetId: 'FLEET-1', locale: 'en' }),
    getCurrentUser: async () => ({ fullName: 'Jane Doe' }),
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

    expect(text(element)).toContain('Fleet FLEET-2');
  });

  it('shows an error when the back office state cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const element = mount(fakeBo({ getContext: () => Promise.reject(new Error('boom')) }).api);

    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('[role="alert"]')?.textContent).toContain('boom'),
    );
  });

  it('cleans up once removed', async () => {
    const { api } = fakeBo();
    const element = mount(api);
    await vi.waitFor(() => expect(text(element)).toContain('Fleet FLEET-1'));

    element.remove();

    expect(element.shadowRoot?.childNodes).toHaveLength(0);
    await vi.waitFor(() => expect(api.off).toHaveBeenCalled());
  });
});
