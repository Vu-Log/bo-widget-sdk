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

  const noop = (): null => null;
  it.each([undefined, null, 'vulogBo', {}, { getContext: noop }, { getContext: noop, on: noop }])(
    'rejects %j',
    (value) => {
      expect(isInjectedHostApi(value)).toBe(false);
    },
  );
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
  it('defaults protocolVersion to the SDK version when the host does not say', () => {
    const { api } = fakeHostApi();
    const transport = createInjectedTransport({
      ...api,
      protocolVersion: undefined,
    } as unknown as InjectedHostApi);
    expect(transport.protocolVersion).toBe(2);
  });

  it('calls the host methods with the host as this', async () => {
    class Host {
      readonly protocolVersion = 2;
      private readonly context = context;
      async getContext(): Promise<typeof context> {
        return this.context;
      }
      on() {}
      off() {}
    }
    await expect(createInjectedTransport(new Host()).getContext()).resolves.toEqual(context);
  });

  it('converts an error the host throws synchronously', async () => {
    const { api } = fakeHostApi({
      getTheme: (() => {
        throw Object.assign(new Error('broken'), { code: 'boom' });
      }) as NonNullable<InjectedHostApi['getTheme']>,
    });
    await expect(createInjectedTransport(api).getTheme()).rejects.toMatchObject({
      code: 'INTERNAL',
      reason: 'boom',
    });
  });

  it('calls a listener added twice once, as the port does', () => {
    const { api, emit } = fakeHostApi();
    const transport = createInjectedTransport(api);
    const listener = vi.fn();
    transport.on('localeChanged', listener);
    transport.on('localeChanged', listener);
    emit('localeChanged', { locale: 'fr' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(api.on).toHaveBeenCalledTimes(1);
  });

  it('does not call the host off for a listener it never added', () => {
    const { api } = fakeHostApi();
    createInjectedTransport(api).off('localeChanged', vi.fn());
    expect(api.off).not.toHaveBeenCalled();
  });

  it('removes only the remaining listeners when closed', () => {
    const { api } = fakeHostApi();
    const transport = createInjectedTransport(api);
    const removed = vi.fn();
    const kept = vi.fn();
    transport.on('fleetChanged', removed);
    transport.on('fleetChanged', kept);
    transport.off('fleetChanged', removed);
    vi.mocked(api.off).mockClear();
    transport.close();
    expect(api.off).toHaveBeenCalledTimes(1);
    expect(api.off).toHaveBeenCalledWith('fleetChanged', kept);
  });

  it('rejects pending and later requests with DISCONNECTED once closed, as the port does', async () => {
    let answer: (value: unknown) => void = () => {};
    const { api } = fakeHostApi({
      getSettings: vi.fn(() => new Promise((resolve) => (answer = resolve))) as NonNullable<
        InjectedHostApi['getSettings']
      >,
    });
    const transport = createInjectedTransport(api);
    const pending = transport.getSettings();
    await Promise.resolve();
    transport.close();
    answer({ late: true });
    await expect(pending).rejects.toMatchObject({ code: 'DISCONNECTED' });
    await expect(transport.getContext()).rejects.toMatchObject({ code: 'DISCONNECTED' });
    await expect(transport.resize({ height: 1 })).rejects.toMatchObject({ code: 'DISCONNECTED' });
    expect(api.getContext).not.toHaveBeenCalled();
  });

  it('adds no listener on the host once closed', () => {
    const { api } = fakeHostApi();
    const transport = createInjectedTransport(api);
    transport.close();
    transport.close();
    transport.on('localeChanged', vi.fn());
    expect(api.on).not.toHaveBeenCalled();
  });
  it('names the request it rejects on close', async () => {
    const { api } = fakeHostApi({
      getSettings: vi.fn(() => new Promise(() => {})) as NonNullable<
        InjectedHostApi['getSettings']
      >,
    });
    const transport = createInjectedTransport(api);
    const pending = transport.getSettings();
    await Promise.resolve();
    transport.close();
    await expect(pending).rejects.toThrow(/^getSettings: /);
  });

  it('keeps closing when the host off throws, and rethrows its error', async () => {
    const thrown: unknown[] = [];
    const onError = (error: unknown) => thrown.push(error);
    process.on('uncaughtException', onError);
    try {
      const failure = new Error('off failed');
      const { api, listeners } = fakeHostApi();
      const realOff = api.off;
      let calls = 0;
      api.off = vi.fn((name, listener) => {
        calls += 1;
        if (calls === 1) throw failure;
        realOff(name, listener);
      });
      const transport = createInjectedTransport(api);
      transport.on('localeChanged', vi.fn());
      transport.on('fleetChanged', vi.fn());
      transport.close();
      expect(api.off).toHaveBeenCalledTimes(2);
      expect(listeners.get('fleetChanged')?.size).toBe(0);
      await vi.waitFor(() => expect(thrown).toEqual([failure]));
    } finally {
      process.off('uncaughtException', onError);
    }
  });
});
