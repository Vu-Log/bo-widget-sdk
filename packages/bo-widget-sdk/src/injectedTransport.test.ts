import { describe, expect, it, vi } from 'vitest';
import { BoError } from './errors.js';
import {
  createInjectedTransport,
  isInjectedHostApi,
  type InjectedHostApi,
} from './injectedTransport.js';

const context = {
  fleetId: 'FLEET-1',
  host: 'bo.example.com',
  locale: 'en',
  timezone: 'Europe/Paris',
  currency: 'EUR',
  boVersion: '1.86.0',
  basename: '/FLEET-1/app/widget/fleet-report',
};

/** Same behavior as the API the back office injects: listeners per event, emitted by `emit`. */
const fakeHostApi = (overrides: Partial<InjectedHostApi> = {}) => {
  const listeners = new Map<string, Set<(data: unknown) => void>>();
  const api: InjectedHostApi = {
    protocolVersion: 2,
    getContext: vi.fn(async () => context),
    getCurrentUser: vi.fn(),
    getSettings: vi.fn(async () => ({ currency: 'EUR' })),
    getApiInfo: vi.fn(async () => ({
      baseUrl: 'https://api.example.com/boapi/proxy/',
      apiKey: 'k',
    })),
    getAccessToken: vi.fn(),
    getTheme: vi.fn(),
    navigate: vi.fn(async ({ path }) => ({ path })),
    notify: vi.fn(async () => null),
    on: vi.fn((name, listener) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)?.add(listener);
    }),
    off: vi.fn((name, listener) => {
      listeners.get(name)?.delete(listener);
    }),
    ...overrides,
  };
  const emit = (name: string, data: unknown) => listeners.get(name)?.forEach((l) => l(data));
  return { api, emit, listeners };
};

describe('isInjectedHostApi', () => {
  it('recognizes the injected API', () => {
    expect(isInjectedHostApi(fakeHostApi().api)).toBe(true);
  });

  it.each([undefined, null, 'vulogBo', {}, { getContext: () => null }])('rejects %j', (value) => {
    expect(isInjectedHostApi(value)).toBe(false);
  });
});

describe('createInjectedTransport', () => {
  it('describes a Web Component, whose permissions are only declarative', () => {
    const transport = createInjectedTransport(fakeHostApi().api);
    expect(transport).toMatchObject({
      mode: 'webcomponent',
      protocolVersion: 2,
      grantedPermissions: null,
    });
  });

  it('forwards requests and their payload to the injected API', async () => {
    const { api } = fakeHostApi();
    const transport = createInjectedTransport(api);
    await expect(transport.getContext()).resolves.toEqual(context);
    await expect(transport.navigate({ path: 'details/1' })).resolves.toEqual({ path: 'details/1' });
    expect(api.navigate).toHaveBeenCalledWith({ path: 'details/1' });
  });

  it('answers resize with { height: null }: a Web Component already fills the zone', async () => {
    const transport = createInjectedTransport(fakeHostApi().api);
    await expect(transport.resize({ height: 300 })).resolves.toEqual({ height: null });
  });

  it('converts a host error into a BoError, as the port would answer it', async () => {
    const hostError = Object.assign(new Error('not installed'), {
      code: 'not-installed',
      status: 404,
    });
    const { api } = fakeHostApi({ getSettings: vi.fn().mockRejectedValue(hostError) });
    const error = await createInjectedTransport(api)
      .getSettings()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BoError);
    expect(error).toMatchObject({ code: 'INTERNAL', reason: 'not-installed', status: 404 });
  });

  it('answers UNKNOWN_TYPE for a request an older back office does not serve', async () => {
    const { api } = fakeHostApi();
    const older = { ...api, navigate: undefined } as unknown as InjectedHostApi;
    await expect(createInjectedTransport(older).navigate({ path: '/app' })).rejects.toMatchObject({
      code: 'UNKNOWN_TYPE',
    });
  });

  it('adds and removes event listeners on the injected API', () => {
    const { api, emit } = fakeHostApi();
    const transport = createInjectedTransport(api);
    const listener = vi.fn();
    transport.on('localeChanged', listener);
    emit('localeChanged', { locale: 'fr' });
    transport.off('localeChanged', listener);
    emit('localeChanged', { locale: 'de' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ locale: 'fr' });
  });

  it('removes its listeners when closed', () => {
    const { api, emit, listeners } = fakeHostApi();
    const transport = createInjectedTransport(api);
    const listener = vi.fn();
    transport.on('fleetChanged', listener);
    transport.on('routeChanged', listener);
    transport.close();
    emit('fleetChanged', { fleetId: 'FLEET-2' });
    expect(listener).not.toHaveBeenCalled();
    expect([...listeners.values()].every((set) => set.size === 0)).toBe(true);
  });

  it('lets the host API refuse a listener that is not a function', () => {
    const { api } = fakeHostApi({
      on: () => {
        throw new TypeError('listener is not a function');
      },
    });
    expect(() =>
      createInjectedTransport(api).on('localeChanged', 'x' as unknown as () => void),
    ).toThrow(TypeError);
  });
});
