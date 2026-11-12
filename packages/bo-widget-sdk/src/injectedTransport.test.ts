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

describe('createInjectedTransport: log', () => {
  const hostLog = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });

  it('relays each level to vulogBo.log', () => {
    const log = hostLog();
    const transport = createInjectedTransport(fakeHostApi({ log }).api);
    transport.log('debug', 'd', undefined);
    transport.log('info', 'i', undefined);
    transport.log('warn', 'w', { status: 500 });
    transport.log('error', 'e', undefined);
    expect(log.debug).toHaveBeenCalledWith('d', undefined);
    expect(log.info).toHaveBeenCalledWith('i', undefined);
    expect(log.warn).toHaveBeenCalledWith('w', { status: 500 });
    expect(log.error).toHaveBeenCalledWith('e', undefined);
  });

  it('drops logs for a back office without log, or without the level', () => {
    const transport = createInjectedTransport(fakeHostApi().api);
    expect(() => transport.log('warn', 'w', undefined)).not.toThrow();
    const partial = createInjectedTransport(fakeHostApi({ log: { error: vi.fn() } }).api);
    expect(() => partial.log('warn', 'w', undefined)).not.toThrow();
  });

  it('drops logs once closed', () => {
    const log = hostLog();
    const transport = createInjectedTransport(fakeHostApi({ log }).api);
    transport.close();
    transport.log('error', 'late', undefined);
    expect(log.error).not.toHaveBeenCalled();
  });

  it('does not throw when the back office log throws, and rethrows its error later', async () => {
    const thrown: unknown[] = [];
    const onError = (error: unknown) => thrown.push(error);
    process.on('uncaughtException', onError);
    try {
      const failure = new Error('log failed');
      const log = {
        error: vi.fn(() => {
          throw failure;
        }),
      };
      const transport = createInjectedTransport(fakeHostApi({ log }).api);
      expect(() => transport.log('error', 'e', undefined)).not.toThrow();
      await vi.waitFor(() => expect(thrown).toEqual([failure]));
    } finally {
      process.off('uncaughtException', onError);
    }
  });
});

describe('createInjectedTransport: storage', () => {
  const storageApi = () => ({
    get: vi.fn(async (collection: string, id: unknown) => ({ collection, id })),
    set: vi.fn(async (...args: unknown[]) => args),
    add: vi.fn(async (...args: unknown[]) => args),
    update: vi.fn(async (...args: unknown[]) => args),
    delete: vi.fn(async () => null),
    list: vi.fn(async (...args: unknown[]) => args),
    query: vi.fn(async (...args: unknown[]) => args),
    clear: vi.fn(async () => ({ deletedDocs: 0 })),
  });

  it('calls vulogBo.storage with the collection first, then the arguments of the operation', async () => {
    const storage = storageApi();
    const transport = createInjectedTransport(fakeHostApi({ storage }).api);
    const value = { a: 1 };

    await expect(
      transport.storage('storage', { op: 'get', collection: 'c', id: 'd' }),
    ).resolves.toEqual({ collection: 'c', id: 'd' });
    await transport.storage('storage', {
      op: 'set',
      collection: 'c',
      id: 'd',
      value,
      options: { ifVersion: 0 },
    });
    await transport.storage('storage', { op: 'add', collection: 'c', value });
    await transport.storage('storage', { op: 'update', collection: 'c', id: 'd', value });
    await transport.storage('storage', { op: 'delete', collection: 'c', id: 'd' });
    await transport.storage('storage', { op: 'list', collection: 'c', options: { limit: 2 } });
    await transport.storage('storage', {
      op: 'query',
      collection: 'c',
      options: { where: { a: 1 } },
    });
    await expect(transport.storage('storage', { op: 'clear', collection: 'c' })).resolves.toEqual({
      deletedDocs: 0,
    });

    expect(storage.set).toHaveBeenCalledWith('c', 'd', value, { ifVersion: 0 });
    expect(storage.add).toHaveBeenCalledWith('c', value, undefined);
    expect(storage.update).toHaveBeenCalledWith('c', 'd', value, undefined);
    expect(storage.delete).toHaveBeenCalledWith('c', 'd');
    expect(storage.list).toHaveBeenCalledWith('c', { limit: 2 });
    expect(storage.query).toHaveBeenCalledWith('c', { where: { a: 1 } });
    expect(storage.clear).toHaveBeenCalledWith('c');
  });

  it('keeps the two spaces apart', async () => {
    const storage = storageApi();
    const sharedStorage = storageApi();
    const transport = createInjectedTransport(fakeHostApi({ storage, sharedStorage }).api);
    await transport.storage('sharedStorage', { op: 'clear', collection: 'c' });
    expect(sharedStorage.clear).toHaveBeenCalledWith('c');
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it('calls the method on its storage object', async () => {
    const storage = {
      prefix: 'shared',
      async clear(this: { prefix: string }, collection: string) {
        return `${this.prefix}:${collection}`;
      },
    };
    const transport = createInjectedTransport(fakeHostApi({ storage } as never).api);
    await expect(transport.storage('storage', { op: 'clear', collection: 'c' })).resolves.toBe(
      'shared:c',
    );
  });

  it.each([
    ['without storage (older back office)', {}],
    ['with storage that is not an object', { storage: 'yes' }],
    ['without the operation', { storage: { get: vi.fn() } }],
  ])('rejects with UNKNOWN_TYPE %s', async (_name, overrides) => {
    const transport = createInjectedTransport(fakeHostApi(overrides as never).api);
    await expect(
      transport.storage('storage', { op: 'clear', collection: 'c' }),
    ).rejects.toMatchObject({
      code: 'UNKNOWN_TYPE',
      message: 'storage.clear: not served by this back office',
    });
  });

  it.each([
    [
      'FORBIDDEN, kept with its status',
      { code: 'FORBIDDEN', status: 403, message: 'no permission' },
      { code: 'FORBIDDEN', reason: null, status: 403 },
    ],
    [
      'invalid-payload as INVALID_PAYLOAD',
      { code: 'invalid-payload', status: null, message: 'bad id' },
      { code: 'INVALID_PAYLOAD', reason: null, status: null },
    ],
    [
      'a server code as INTERNAL with reason and status',
      { code: 'version-conflict', status: 409, message: 'conflict' },
      { code: 'INTERNAL', reason: 'version-conflict', status: 409 },
    ],
    [
      'not-found as INTERNAL with reason and status',
      { code: 'not-found', status: 404, message: 'absent' },
      { code: 'INTERNAL', reason: 'not-found', status: 404 },
    ],
    [
      'a transport code without status',
      { code: 'ERR_NETWORK', status: null, message: 'offline' },
      { code: 'INTERNAL', reason: 'ERR_NETWORK', status: null },
    ],
  ])('turns a rejection into a BoError: %s', async (_name, hostError, expected) => {
    const storage = {
      get: vi.fn(async () => {
        throw Object.assign(new Error(hostError.message), hostError);
      }),
    };
    const transport = createInjectedTransport(fakeHostApi({ storage }).api);
    const error = await transport
      .storage('storage', { op: 'get', collection: 'c', id: 'd' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BoError);
    expect(error).toMatchObject({ ...expected, message: hostError.message });
  });

  it('turns a synchronous throw into a rejection', async () => {
    const storage = {
      get: () => {
        throw Object.assign(new Error('bad'), { code: 'invalid-payload' });
      },
    };
    const transport = createInjectedTransport(fakeHostApi({ storage } as never).api);
    await expect(
      transport.storage('storage', { op: 'get', collection: 'c', id: 'd' }),
    ).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
  });

  it('rejects pending and later storage requests with DISCONNECTED after close', async () => {
    const storage = { get: vi.fn(() => new Promise(() => {})), clear: vi.fn() };
    const transport = createInjectedTransport(fakeHostApi({ storage } as never).api);
    const pending = transport.storage('storage', { op: 'get', collection: 'c', id: 'd' });
    await Promise.resolve();
    transport.close();
    await expect(pending).rejects.toMatchObject({
      code: 'DISCONNECTED',
      message: 'storage.get: the connection to the back office is closed',
    });
    await expect(
      transport.storage('sharedStorage', { op: 'clear', collection: 'c' }),
    ).rejects.toMatchObject({ code: 'DISCONNECTED' });
    expect(storage.clear).not.toHaveBeenCalled();
  });
});
