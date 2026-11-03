// @vitest-environment happy-dom
import { BoError, connect, type BoClient } from '@vulog/bo-widget-sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createFakeBackOffice,
  startFakeBo,
  WidgetHostError,
  type FakeBoConfig,
  type FakeBoUi,
} from './host.js';

let tagCount = 0;

const fakeConfig = (overrides: Partial<FakeBoConfig> = {}): FakeBoConfig => ({
  mode: 'mock',
  runtime: 'webcomponent',
  protocolVersion: 2,
  widget: {
    id: 'fleet-report',
    name: 'Fleet report',
    version: '1.2.3',
    permissions: ['apiInfo', 'accessToken', 'navigate', 'notify'],
  },
  tag: `widget-${(++tagCount).toString(16).padStart(12, '0')}`,
  widgetUrl: '/',
  context: {
    fleetId: 'DEV-FLEET',
    host: 'localhost',
    locale: 'en',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    boVersion: '1.86.0',
    basename: '/widgets/fleet-report',
  },
  user: {
    id: 'dev-user',
    userName: 'dev',
    firstName: 'Dev',
    lastName: 'User',
    fullName: 'Dev User',
    email: 'dev@example.com',
    currentFleetId: 'DEV-FLEET',
    originalFleetId: 'DEV-FLEET',
    roles: ['manager'],
    fleets: [{ fleetId: 'DEV-FLEET', profile: 'manager' }],
    isFranchiseOperator: false,
  },
  settings: { currency: 'CAD' },
  apiPath: '/__bo-widget/api/boapi/proxy/',
  apiKey: 'mock-api-key',
  accessToken: 'mock-access-token',
  expiresAt: null,
  ...overrides,
});

const fakeUi = () => ({
  log: vi.fn<FakeBoUi['log']>(),
  notify: vi.fn<FakeBoUi['notify']>(),
  navigate: vi.fn<FakeBoUi['navigate']>(),
  resize: vi.fn<FakeBoUi['resize']>(),
});

/** A loader of the widget entry, as the dev server generates it. */
const load = (value: unknown) => async () => ({ default: value });

const flush = () => new Promise((done) => setTimeout(done, 0));

/** A widget class that connects with the real SDK and exposes its client. */
const widgetClass = () => {
  const connected: Promise<BoClient>[] = [];
  class Widget extends HTMLElement {
    connectedCallback() {
      connected.push(connect(this));
    }
  }
  return { Widget, client: () => connected[0] as Promise<BoClient> };
};

/**
 * Connects the real SDK as an iframe to a fake back office: the `hello` the SDK posts to its
 * parent is served by `servePort`.
 */
const connectIframe = async (config: FakeBoConfig, ui = fakeUi()) => {
  const backOffice = createFakeBackOffice(config, ui);
  vi.stubGlobal('window', {
    parent: {
      postMessage: (_message: unknown, _origin: string, [port]: MessagePort[]) => {
        if (port) backOffice.servePort(port);
      },
    },
  });
  try {
    return {
      client: await connect(undefined, { handshakeTimeout: 1000, requestTimeout: 1000 }),
      backOffice,
      ui,
    };
  } finally {
    vi.unstubAllGlobals();
  }
};

beforeEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('startFakeBo as a Web Component', () => {
  it('registers the class under the tag, injects vulogBo and displays the widget', async () => {
    const config = fakeConfig();
    const { Widget, client } = widgetClass();

    await startFakeBo(config, load(Widget));

    const element = document.querySelector(config.tag) as HTMLElement;
    expect(element).toBeInstanceOf(Widget);
    expect(element.dataset).toMatchObject({ widgetId: 'fleet-report', widgetVersion: '1.2.3' });
    expect(customElements.get(config.tag)).toBe(Widget);
    const bo = await client();
    expect(bo.mode).toBe('webcomponent');
    expect(bo.protocolVersion).toBe(2);
    expect(await bo.getContext()).toEqual(config.context);
    expect(await bo.getCurrentUser()).toEqual(config.user);
    expect(await bo.getSettings()).toEqual({ currency: 'CAD' });
    expect(await bo.getApiInfo()).toEqual({
      baseUrl: new URL(config.apiPath, location.href).href,
      apiKey: 'mock-api-key',
    });
    expect(await bo.getAccessToken()).toEqual({
      accessToken: 'mock-access-token',
      expiresAt: null,
    });
    expect((await bo.getTheme()).mode).toBe('light');
  });

  it('calls the local API through authFetch with the API key', async () => {
    const fetchMock = vi.fn(async () => new Response('[]'));
    vi.stubGlobal('fetch', fetchMock);
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();

    await bo.authFetch('fleetmanager/public/fleets/DEV-FLEET/vehicles');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toBe(
      new URL(
        '/__bo-widget/api/boapi/proxy/fleetmanager/public/fleets/DEV-FLEET/vehicles',
        location.href,
      ).href,
    );
    expect(new Headers(init.headers).get('X-API-Key')).toBe('mock-api-key');
  });

  it('shows the route asked by navigate, and a snackbar for notify', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();

    expect(await bo.navigate({ path: 'details/1' })).toEqual({
      path: '/widgets/fleet-report/details/1',
    });
    expect(await bo.navigate({ path: '/app/vehicles' })).toEqual({ path: '/app/vehicles' });
    await bo.notify({ message: 'Saved', severity: 'success' });

    expect(document.querySelector('.bo-route')?.textContent).toBe('/app/vehicles');
    expect(document.querySelector('.bo-toast.success')?.textContent).toBe('Saved');
  });

  it('pushes localeChanged and themeChanged from the bar', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();
    const locales: unknown[] = [];
    const themes: unknown[] = [];
    bo.on('localeChanged', (data) => locales.push(data));
    bo.on('themeChanged', (data) => themes.push(data.mode));

    const select = document.querySelector('select') as HTMLSelectElement;
    select.value = 'fr';
    select.dispatchEvent(new Event('change'));
    (document.querySelector('button') as HTMLButtonElement).click();

    expect(locales).toEqual([{ locale: 'fr' }]);
    expect(themes).toEqual(['dark']);
    expect((await bo.getContext()).locale).toBe('fr');
    expect((await bo.getTheme()).mode).toBe('dark');
    expect(document.querySelector('button')?.textContent).toBe('Theme: dark');
  });

  it('rejects an external URL to navigate with INVALID_PAYLOAD', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();

    await expect(bo.navigate({ path: 'https://evil.example' })).rejects.toMatchObject({
      code: 'INVALID_PAYLOAD',
    });
    await expect(bo.notify({ message: ' ' })).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
    expect(document.querySelector('.bo-log .error')).not.toBeNull();
  });

  it('serves a request the manifest does not allow, with a warning, as the back office does', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(
      fakeConfig({ widget: { ...fakeConfig().widget, permissions: [] } }),
      load(Widget),
    );
    const bo = await client();

    await bo.notify({ message: 'Hi' });

    expect(document.querySelector('.bo-log .warning')?.textContent).toMatch(
      /notify needs the "notify" permission/,
    );
  });

  it('shows an error when the default export is not an element class', async () => {
    await startFakeBo(fakeConfig(), load({ not: 'a class' }));

    expect(document.querySelector('.bo-error')?.textContent).toMatch(
      /default export of the entry is not an HTMLElement class \(got object\)/,
    );
  });

  it('shows an error when the entry has no default export', async () => {
    await startFakeBo(fakeConfig(), async () => ({}));

    expect(document.querySelector('.bo-error')?.textContent).toMatch(/\(got undefined\)/);
  });

  it('shows an error when the entry fails to load', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await startFakeBo(fakeConfig(), async () => {
      throw new SyntaxError('Unexpected token');
    });

    expect(document.querySelector('.bo-error')?.textContent).toMatch(
      /the entry failed to load: SyntaxError: Unexpected token/,
    );
    expect(consoleError).toHaveBeenCalled();
  });

  it('shows an error when the widget registered its class itself', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    class SelfRegistered extends HTMLElement {}
    customElements.define(`self-registered-${tagCount}`, SelfRegistered);

    await startFakeBo(fakeConfig(), load(SelfRegistered));

    expect(document.querySelector('.bo-error')?.textContent).toMatch(/cannot display the widget/);
  });

  it('displays the widget again when the page reruns with the tag already defined', async () => {
    const config = fakeConfig();
    const { Widget } = widgetClass();
    await startFakeBo(config, load(Widget));

    await startFakeBo(config, load(Widget));

    expect(document.querySelectorAll(config.tag)).toHaveLength(1);
    expect(document.querySelector('.bo-error')).toBeNull();
  });

  it('masks the access token in the log', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig({ accessToken: 'secret-token-value' }), load(Widget));
    const bo = await client();

    expect((await bo.getAccessToken()).accessToken).toBe('secret-token-value');

    const log = document.querySelector('.bo-log')?.textContent ?? '';
    expect(log).toContain('getAccessToken');
    expect(log).not.toContain('secret-token-value');
  });

  it('shows the errors the widget throws later in the log', async () => {
    await startFakeBo(fakeConfig(), load(widgetClass().Widget));

    window.dispatchEvent(new ErrorEvent('error', { error: new Error('render failed') }));

    expect(document.querySelector('.bo-log .error')?.textContent).toMatch(
      /uncaught error: Error: render failed/,
    );
  });
});

const iframeConfig = (overrides: Partial<FakeBoConfig> = {}) =>
  fakeConfig({ runtime: 'iframe', ...overrides });

/** Posts a `hello` from the widget iframe, as the SDK does. */
const hello = (data: Record<string, unknown> = {}, ports?: MessagePort[]) => {
  const frame = document.querySelector('iframe') as HTMLIFrameElement;
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { protocol: 'vulog-bo', version: 2, type: 'hello', ...data },
      source: frame.contentWindow,
      ports: ports ?? [],
    }),
  );
};

/** Collects what the back office posts on a port. */
const collect = (port: MessagePort): unknown[] => {
  const received: unknown[] = [];
  port.onmessage = (event) => received.push(event.data);
  return received;
};

describe('startFakeBo as an iframe', () => {
  it('serves only the port of the last hello after the widget page reloads', async () => {
    await startFakeBo(iframeConfig());
    const first = new MessageChannel();
    const second = new MessageChannel();
    const firstReceived = collect(first.port1);
    const secondReceived = collect(second.port1);
    hello({}, [first.port2]);
    await vi.waitFor(() => expect(firstReceived).toHaveLength(1));

    hello({}, [second.port2]);
    await vi.waitFor(() => expect(secondReceived).toHaveLength(1));
    const select = document.querySelector('select') as HTMLSelectElement;
    select.value = 'fr';
    select.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(secondReceived).toHaveLength(2));

    expect(firstReceived).toHaveLength(1);
    expect(secondReceived[1]).toEqual({
      type: 'event',
      name: 'localeChanged',
      data: { locale: 'fr' },
    });
    second.port1.close();
  });

  it('answers a hello for another protocol version with an error', async () => {
    await startFakeBo(iframeConfig());
    const { port1, port2 } = new MessageChannel();
    const received = collect(port1);

    hello({ version: 3 }, [port2]);
    await vi.waitFor(() => expect(received).toHaveLength(1));

    expect(received[0]).toMatchObject({
      type: 'error',
      error: { code: 'INTERNAL', reason: 'unsupported-version' },
    });
    expect(document.querySelector('.bo-log .error')?.textContent).toMatch(/hello for protocol 3/);
  });

  it('logs a hello without MessagePort', async () => {
    await startFakeBo(iframeConfig());

    hello();

    expect(document.querySelector('.bo-log .error')?.textContent).toMatch(
      /hello without MessagePort/,
    );
  });

  it('resizes the iframe on resize', async () => {
    await startFakeBo(iframeConfig());
    const { port1, port2 } = new MessageChannel();
    const received = collect(port1);
    hello({}, [port2]);

    port1.postMessage({ id: '1', type: 'resize', payload: { height: 480 } });
    await vi.waitFor(() => expect(received).toHaveLength(2));
    const frame = document.querySelector('iframe') as HTMLIFrameElement;
    expect(frame.style.height).toBe('480px');

    port1.postMessage({ id: '2', type: 'resize', payload: { height: null } });
    await vi.waitFor(() => expect(received).toHaveLength(3));
    expect(frame.style.height).toBe('100%');
    port1.close();
  });

  it('displays the widget page in an iframe and serves the port of its hello', async () => {
    const config = iframeConfig();
    await startFakeBo(config);
    const frame = document.querySelector('iframe') as HTMLIFrameElement;
    expect(frame.getAttribute('src')).toBe('/');
    const { port1, port2 } = new MessageChannel();
    const welcome = new Promise<unknown>((done) => {
      port1.onmessage = (event) => done(event.data);
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { protocol: 'vulog-bo', version: 2, type: 'hello', widgetId: 'fleet-report' },
        source: frame.contentWindow,
        ports: [port2],
      }),
    );

    expect(await welcome).toEqual({
      type: 'welcome',
      protocolVersion: 2,
      grantedPermissions: config.widget.permissions,
    });
    port1.close();
  });

  it('ignores a hello from another window', async () => {
    await startFakeBo(iframeConfig());
    const { port1, port2 } = new MessageChannel();
    const received = vi.fn();
    port1.onmessage = received;

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { protocol: 'vulog-bo', type: 'hello' },
        source: window,
        ports: [port2],
      }),
    );
    await flush();

    expect(received).not.toHaveBeenCalled();
    port1.close();
  });
});

describe('createFakeBackOffice on the iframe port', () => {
  it('serves the real SDK client: welcome, requests and events', async () => {
    const config = fakeConfig({ runtime: 'iframe' });
    const { client, backOffice, ui } = await connectIframe(config);

    expect(client.mode).toBe('iframe');
    expect(client.grantedPermissions).toEqual(config.widget.permissions);
    expect(await client.getContext()).toEqual(config.context);
    expect(await client.getSettings()).toEqual({ currency: 'CAD' });
    expect(await client.resize({ height: 480 })).toEqual({ height: 480 });
    expect(ui.resize).toHaveBeenCalledWith(480);
    const events: unknown[] = [];
    client.on('localeChanged', (data) => events.push(data));
    backOffice.setLocale('de');
    await vi.waitFor(() => expect(events).toEqual([{ locale: 'de' }]));
    client.disconnect();
  });

  it('refuses a request the manifest does not allow with FORBIDDEN', async () => {
    const { client } = await connectIframe(
      fakeConfig({ runtime: 'iframe', widget: { ...fakeConfig().widget, permissions: [] } }),
    );

    const error = await client.getAccessToken().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(BoError);
    expect(error).toMatchObject({ code: 'FORBIDDEN' });
    client.disconnect();
  });

  it('answers an expired dev token with INTERNAL, reason no-token', async () => {
    const { client } = await connectIframe(
      fakeConfig({ runtime: 'iframe', mode: 'token', expiresAt: Date.now() - 1000 }),
    );

    await expect(client.getAccessToken()).rejects.toMatchObject({
      code: 'INTERNAL',
      reason: 'no-token',
    });
    client.disconnect();
  });

  it('answers a valid payload error with INVALID_PAYLOAD', async () => {
    const { client } = await connectIframe(fakeConfig({ runtime: 'iframe' }));

    await expect(client.resize({ height: -1 })).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
    await expect(client.notify({ message: 'x', severity: 'loud' as 'info' })).rejects.toMatchObject(
      {
        code: 'INVALID_PAYLOAD',
      },
    );
    client.disconnect();
  });

  it('answers an unknown request with UNKNOWN_TYPE, and logs a message without id', async () => {
    const ui = fakeUi();
    const backOffice = createFakeBackOffice(fakeConfig({ runtime: 'iframe' }), ui);
    const { port1, port2 } = new MessageChannel();
    const answers = collect(port1);
    backOffice.servePort(port2);

    port1.postMessage({ id: '1', type: 'getSecrets' });
    port1.postMessage({ id: '2', type: 'navigate', payload: { path: 'ok' } });
    port1.postMessage('not a request');
    await vi.waitFor(() => expect(answers).toHaveLength(3));
    await vi.waitFor(() =>
      expect(ui.log).toHaveBeenCalledWith(
        expect.stringMatching(/ignored a message without id/),
        'warning',
      ),
    );

    expect(answers).toEqual([
      expect.objectContaining({ type: 'welcome' }),
      {
        id: '1',
        ok: false,
        error: { code: 'UNKNOWN_TYPE', message: 'Unknown request getSecrets' },
      },
      { id: '2', ok: true, result: { path: '/widgets/fleet-report/ok' } },
    ]);
    port1.close();
  });

  it('answers a failure of the fake back office itself with INTERNAL', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // `structuredClone` cannot clone a function: getSettings throws a DataCloneError.
    const config = fakeConfig({ runtime: 'iframe', settings: { broken: () => {} } });
    const backOffice = createFakeBackOffice(config, fakeUi());
    const { port1, port2 } = new MessageChannel();
    const answers = collect(port1);
    backOffice.servePort(port2);

    port1.postMessage({ id: '1', type: 'getSettings' });
    await vi.waitFor(() => expect(answers).toHaveLength(2));

    expect(answers[1]).toMatchObject({ id: '1', ok: false, error: { code: 'INTERNAL' } });
    expect(consoleError).toHaveBeenCalled();
    port1.close();
  });

  it('stops answering and pushing on a closed port', async () => {
    const backOffice = createFakeBackOffice(fakeConfig({ runtime: 'iframe' }), fakeUi());
    const { port1, port2 } = new MessageChannel();
    const received: unknown[] = [];
    port1.onmessage = (event) => received.push(event.data);
    const close = backOffice.servePort(port2);
    await vi.waitFor(() => expect(received).toHaveLength(1));

    close();
    backOffice.setLocale('fr');
    await flush();

    expect(received).toHaveLength(1);
    port1.close();
  });
});

describe('createFakeBackOffice host API', () => {
  it('is frozen and returns copies', async () => {
    const config = fakeConfig();
    const api = createFakeBackOffice(config, fakeUi()).createHostApi();

    expect(Object.isFrozen(api)).toBe(true);
    const context = await api.getContext();
    (context as { locale: string }).locale = 'xx';
    expect((await api.getContext()) as unknown).toEqual(config.context);
  });

  it('keeps calling the other listeners when one throws, and logs it', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const ui = fakeUi();
    const backOffice = createFakeBackOffice(fakeConfig(), ui);
    const api = backOffice.createHostApi();
    const second = vi.fn();
    api.on('localeChanged', () => {
      throw new Error('boom');
    });
    api.on('localeChanged', second);

    backOffice.setLocale('it');

    expect(second).toHaveBeenCalledWith({ locale: 'it' });
    expect(ui.log).toHaveBeenCalledWith(
      expect.stringContaining('listener of localeChanged failed'),
      'error',
    );
  });

  it('stops calling a listener removed with off', () => {
    const backOffice = createFakeBackOffice(fakeConfig(), fakeUi());
    const api = backOffice.createHostApi();
    const listener = vi.fn();
    api.on('localeChanged', listener);
    api.off('localeChanged', listener);

    backOffice.setLocale('it');

    expect(listener).not.toHaveBeenCalled();
  });

  it('throws a WidgetHostError no-token once the dev token expired', async () => {
    const api = createFakeBackOffice(
      fakeConfig({ mode: 'token', expiresAt: Date.now() - 1 }),
      fakeUi(),
    ).createHostApi();

    const error = await api.getAccessToken().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WidgetHostError);
    expect(error).toMatchObject({ code: 'no-token', status: null });
  });

  it('serves a dev token that has not expired', async () => {
    const expiresAt = Date.now() + 60_000;
    const api = createFakeBackOffice(
      fakeConfig({ mode: 'token', accessToken: 'real', expiresAt }),
      fakeUi(),
    ).createHostApi();

    expect(await api.getAccessToken()).toEqual({ accessToken: 'real', expiresAt });
  });
});
