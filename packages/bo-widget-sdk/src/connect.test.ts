import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connect } from './connect.js';
import { BoError } from './errors.js';
import type { BoClient, BoContext } from './types.js';

const BASE_URL = 'https://api.example.com/boapi/proxy/';

const context: BoContext = {
  fleetId: 'FLEET-1',
  host: 'bo.example.com',
  locale: 'en',
  timezone: 'Europe/Paris',
  currency: 'EUR',
  boVersion: '1.86.0',
  basename: '/FLEET-1/app/widget/fleet-report',
};

class HostError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

/**
 * The back office side, as one object: the API it injects into a Web Component, and `emit` to push
 * an event. The iframe server below answers its port with the same API, like the real one does.
 */
const fakeBackOffice = () => {
  const listeners = new Map<string, Set<(data: unknown) => void>>();
  const hostApi = {
    protocolVersion: 2,
    getContext: async () => structuredClone(context),
    getCurrentUser: async () => ({ id: 'u1', fullName: 'Jane Doe' }),
    getSettings: async () => {
      throw new HostError('not installed', 'not-installed');
    },
    getApiInfo: async () => ({ baseUrl: BASE_URL, apiKey: 'api-key' }),
    getAccessToken: async () => ({ accessToken: 'token', expiresAt: Date.now() + 3_600_000 }),
    getTheme: async () => ({ palette: {}, typography: {}, mode: 'light' }),
    navigate: async ({ path }: { path: string }) => {
      if (path.startsWith('https:')) throw new HostError('external URL', 'invalid-payload');
      return { path };
    },
    notify: async () => null,
    on: (name: string, listener: (data: unknown) => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)?.add(listener);
    },
    off: (name: string, listener: (data: unknown) => void) => listeners.get(name)?.delete(listener),
  };
  const ports: MessagePort[] = [];
  const emit = (name: string, data: unknown) => {
    listeners.get(name)?.forEach((listener) => listener(data));
    ports.forEach((port) => port.postMessage({ type: 'event', name, data }));
  };
  const permissions: Record<string, string> = {
    getApiInfo: 'apiInfo',
    getAccessToken: 'accessToken',
    navigate: 'navigate',
    notify: 'notify',
  };
  /** Parent window of an iframe, serving the v2 port with `hostApi` and `granted` permissions. */
  const parentWindow = (granted: string[]) => ({
    postMessage(_hello: unknown, _origin: string, [port]: MessagePort[]) {
      if (!port) return;
      ports.push(port);
      port.postMessage({
        type: 'welcome',
        protocolVersion: 2,
        boVersion: '1.86.0',
        grantedPermissions: granted,
        context,
      });
      port.onmessage = async ({ data: { id, type, payload } }) => {
        const method = (hostApi as Record<string, unknown>)[type];
        if (typeof method !== 'function' || type === 'on' || type === 'off') {
          port.postMessage({ id, ok: false, error: { code: 'UNKNOWN_TYPE', message: type } });
          return;
        }
        const permission = permissions[type];
        if (permission && !granted.includes(permission)) {
          port.postMessage({ id, ok: false, error: { code: 'FORBIDDEN', message: type } });
          return;
        }
        try {
          port.postMessage({ id, ok: true, result: await method(payload) });
        } catch (error) {
          const { code, message } = error as HostError;
          port.postMessage(
            code === 'invalid-payload'
              ? { id, ok: false, error: { code: 'INVALID_PAYLOAD', message } }
              : { id, ok: false, error: { code: 'INTERNAL', message, reason: code } },
          );
        }
      };
    },
  });
  return { hostApi, emit, parentWindow, ports };
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response('[]'));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Widget code, written once: it must behave the same in both modes. */
const runWidget = async (bo: BoClient) => {
  const { fleetId } = await bo.getContext();
  const response = await bo.authFetch(`api/v1/fleets/${fleetId}/vehicles`);
  const locales: unknown[] = [];
  const stop = bo.on('localeChanged', ({ locale }) => locales.push(locale));
  const settingsError = await bo.getSettings().catch((error: unknown) => error);
  const navigateError = await bo
    .navigate({ path: 'https://evil.example' })
    .catch((e: unknown) => e);
  return { fleetId, status: response.status, locales, stop, settingsError, navigateError };
};

describe('connect', () => {
  it('runs the same widget code as a Web Component and in an iframe', async () => {
    const backOffice = fakeBackOffice();

    const webComponentClient = await connect({ vulogBo: backOffice.hostApi });
    const asWebComponent = await runWidget(webComponentClient);

    vi.stubGlobal('window', {
      parent: backOffice.parentWindow(['apiInfo', 'accessToken', 'navigate']),
    });
    const iframeClient = await connect();
    const inIframe = await runWidget(iframeClient);

    for (const result of [asWebComponent, inIframe]) {
      expect(result.fleetId).toBe('FLEET-1');
      expect(result.status).toBe(200);
      expect(result.settingsError).toBeInstanceOf(BoError);
      expect(result.settingsError).toMatchObject({ code: 'INTERNAL', reason: 'not-installed' });
      expect(result.navigateError).toMatchObject({ code: 'INVALID_PAYLOAD' });
    }

    backOffice.emit('localeChanged', { locale: 'fr' });
    await vi.waitFor(() => expect(inIframe.locales).toEqual(['fr']));
    expect(asWebComponent.locales).toEqual(['fr']);

    asWebComponent.stop();
    inIframe.stop();
    backOffice.emit('localeChanged', { locale: 'de' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(asWebComponent.locales).toEqual(['fr']);
    expect(inIframe.locales).toEqual(['fr']);

    const [webComponentCall, iframeCall] = fetchMock.mock.calls;
    expect(webComponentCall?.[0]).toBe(`${BASE_URL}api/v1/fleets/FLEET-1/vehicles`);
    expect(iframeCall?.[0]).toBe(`${BASE_URL}api/v1/fleets/FLEET-1/vehicles`);
    expect(new Headers(webComponentCall?.[1]?.headers).get('Authorization')).toBeNull();
    expect(new Headers(iframeCall?.[1]?.headers).get('Authorization')).toBe('Bearer token');

    for (const client of [webComponentClient, iframeClient]) {
      client.disconnect();
      await expect(client.getContext()).rejects.toMatchObject({ code: 'DISCONNECTED' });
    }
  });

  it('disconnects the same way in both modes: no event, pending and later requests rejected', async () => {
    const backOffice = fakeBackOffice();
    let release: () => void = () => {};
    backOffice.hostApi.getTheme = () =>
      new Promise((resolve) => {
        release = () => resolve({ palette: {}, typography: {}, mode: 'light' });
      });
    vi.stubGlobal('window', { parent: backOffice.parentWindow([]) });
    for (const bo of [await connect({ vulogBo: backOffice.hostApi }), await connect()]) {
      const listener = vi.fn();
      bo.on('fleetChanged', listener);
      const pending = bo.getTheme();
      await new Promise((resolve) => setTimeout(resolve, 5));
      bo.disconnect();
      release();
      backOffice.emit('fleetChanged', { fleetId: 'FLEET-2' });
      await expect(pending).rejects.toMatchObject({ code: 'DISCONNECTED' });
      await expect(bo.getContext()).rejects.toMatchObject({ code: 'DISCONNECTED' });
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(listener).not.toHaveBeenCalled();
    }
  });

  it('renews the token through the real port after a 401', async () => {
    const backOffice = fakeBackOffice();
    let issued = 0;
    backOffice.hostApi.getAccessToken = async () => ({
      accessToken: `token-${++issued}`,
      expiresAt: Date.now() + 3_600_000,
    });
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('ok'));
    vi.stubGlobal('window', { parent: backOffice.parentWindow(['apiInfo', 'accessToken']) });
    const bo = await connect();
    const response = await bo.authFetch('api/v1/me');
    expect(response.status).toBe(200);
    const authorizations = fetchMock.mock.calls.map(([, init]) =>
      new Headers(init?.headers).get('Authorization'),
    );
    expect(authorizations).toEqual(['Bearer token-1', 'Bearer token-2']);
    bo.disconnect();
  });

  it('rejects a request with TIMEOUT after requestTimeout', async () => {
    const parent = {
      postMessage(_hello: unknown, _origin: string, [port]: MessagePort[]) {
        port?.postMessage({ type: 'welcome', protocolVersion: 2, grantedPermissions: [] });
      },
    };
    vi.stubGlobal('window', { parent });
    const bo = await connect(null, { requestTimeout: 10 });
    await expect(bo.getContext()).rejects.toMatchObject({ code: 'TIMEOUT' });
    bo.disconnect();
  });

  it.each([0, -1, Number.NaN, '10' as unknown as number])(
    'rejects a timeout option of %j with a TypeError',
    async (value) => {
      vi.stubGlobal('window', { parent: { postMessage: () => {} } });
      await expect(connect(null, { requestTimeout: value })).rejects.toThrow(TypeError);
      await expect(connect(null, { handshakeTimeout: value })).rejects.toThrow(/handshakeTimeout/);
    },
  );

  it('caps an Infinity timeout instead of firing at once', async () => {
    const backOffice = fakeBackOffice();
    vi.stubGlobal('window', { parent: backOffice.parentWindow([]) });
    const bo = await connect(null, { handshakeTimeout: Infinity, requestTimeout: Infinity });
    await expect(bo.getContext()).resolves.toMatchObject({ fleetId: 'FLEET-1' });
    bo.disconnect();
  });

  it('rejects an element whose vulogBo is not a back office API', async () => {
    vi.stubGlobal('window', { parent: { postMessage: vi.fn() } });
    await expect(connect({ vulogBo: { getContext: () => null } })).rejects.toMatchObject({
      code: 'INTERNAL',
      reason: 'invalid-host-api',
    });
    expect(window.parent.postMessage).not.toHaveBeenCalled();
  });

  it('prefers the injected API over postMessage', async () => {
    const backOffice = fakeBackOffice();
    const parent = backOffice.parentWindow([]);
    const postMessage = vi.spyOn(parent, 'postMessage');
    vi.stubGlobal('window', { parent });
    const bo = await connect({ vulogBo: backOffice.hostApi });
    expect(bo).toMatchObject({ mode: 'webcomponent', grantedPermissions: null });
    expect(postMessage).not.toHaveBeenCalled();
    bo.disconnect();
  });

  it('falls back to postMessage when the element has no injected API', async () => {
    const backOffice = fakeBackOffice();
    vi.stubGlobal('window', { parent: backOffice.parentWindow(['notify']) });
    const bo = await connect({}, { widgetId: 'fleet-report' });
    expect(bo).toMatchObject({ mode: 'iframe', grantedPermissions: ['notify'] });
    bo.disconnect();
  });

  it('enforces the iframe permissions: FORBIDDEN without apiInfo', async () => {
    const backOffice = fakeBackOffice();
    vi.stubGlobal('window', { parent: backOffice.parentWindow([]) });
    const bo = await connect();
    await expect(bo.getApiInfo()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    bo.disconnect();
  });

  it('returns a frozen client', async () => {
    const bo = await connect({ vulogBo: fakeBackOffice().hostApi });
    expect(Object.isFrozen(bo)).toBe(true);
  });

  it('rejects with DISCONNECTED outside an iframe and without injected API', async () => {
    const self = {} as { parent?: unknown };
    self.parent = self;
    vi.stubGlobal('window', self);
    await expect(connect()).rejects.toMatchObject({ code: 'DISCONNECTED' });
    await expect(connect({})).rejects.toThrow(/connectedCallback/);
  });

  it('rejects with DISCONNECTED without a window (server-side rendering)', async () => {
    vi.stubGlobal('window', undefined);
    await expect(connect()).rejects.toMatchObject({ code: 'DISCONNECTED' });
  });

  it('passes the handshake options to the iframe transport', async () => {
    const hellos: unknown[] = [];
    const origins: string[] = [];
    const parent = {
      postMessage(hello: unknown, origin: string, [port]: MessagePort[]) {
        hellos.push(hello);
        origins.push(origin);
        port?.postMessage({ type: 'welcome', protocolVersion: 2, grantedPermissions: [] });
      },
    };
    vi.stubGlobal('window', { parent });
    const bo = await connect(null, {
      widgetId: 'fleet-report',
      widgetVersion: '1.2.0',
      targetOrigin: 'https://bo.example.com',
    });
    expect(hellos).toEqual([
      expect.objectContaining({ widgetId: 'fleet-report', widgetVersion: '1.2.0' }),
    ]);
    expect(origins).toEqual(['https://bo.example.com']);
    bo.disconnect();
  });

  it('rejects with TIMEOUT when the back office does not answer in time', async () => {
    vi.stubGlobal('window', { parent: { postMessage: () => {} } });
    await expect(connect(undefined, { handshakeTimeout: 10 })).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('disconnect stops the Web Component listeners', async () => {
    const backOffice = fakeBackOffice();
    const bo = await connect({ vulogBo: backOffice.hostApi });
    const listener = vi.fn();
    bo.on('fleetChanged', listener);
    bo.disconnect();
    backOffice.emit('fleetChanged', { fleetId: 'FLEET-2' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('delegates every request to the transport', async () => {
    const backOffice = fakeBackOffice();
    const bo = await connect({ vulogBo: backOffice.hostApi });
    await expect(bo.getCurrentUser()).resolves.toMatchObject({ id: 'u1' });
    await expect(bo.getApiInfo()).resolves.toMatchObject({ apiKey: 'api-key' });
    await expect(bo.getAccessToken()).resolves.toMatchObject({ accessToken: 'token' });
    await expect(bo.getTheme()).resolves.toMatchObject({ mode: 'light' });
    await expect(bo.notify({ message: 'Saved' })).resolves.toBeNull();
    await expect(bo.resize({ height: 200 })).resolves.toEqual({ height: null });
    const listener = vi.fn();
    bo.on('userChanged', listener);
    bo.off('userChanged', listener);
    backOffice.emit('userChanged', { id: 'u2' });
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('connect: same contract in both modes', () => {
  it('rejects authFetch with DISCONNECTED after disconnect, even with a warm cache', async () => {
    const backOffice = fakeBackOffice();
    vi.stubGlobal('window', { parent: backOffice.parentWindow(['apiInfo', 'accessToken']) });
    for (const bo of [await connect({ vulogBo: backOffice.hostApi }), await connect()]) {
      await bo.authFetch('api/v1/me');
      bo.disconnect();
      await expect(bo.authFetch('api/v1/me')).rejects.toMatchObject({ code: 'DISCONNECTED' });
    }
  });

  it('validates the timeout options as a Web Component too', async () => {
    await expect(
      connect({ vulogBo: fakeBackOffice().hostApi }, { requestTimeout: -1 }),
    ).rejects.toThrow(TypeError);
  });
});
