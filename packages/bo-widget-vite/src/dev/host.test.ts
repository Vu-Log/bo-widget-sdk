// @vitest-environment happy-dom
import { BoError, connect, type BoClient } from '@vulog/bo-widget-sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildManifest } from '../manifest.js';
import { FAKE_BO_PATH, fakeBoConfig } from './server.js';
import {
  createFakeBackOffice,
  formatWidgetLog,
  isInView,
  parseWidgetLog,
  resolveRoute,
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
    locale: 'en_GB',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    boVersion: '1.86.0',
    basename: '/__bo-widget',
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
  auth: { kind: 'mock' },
  ...overrides,
});

const fakeUi = () => ({
  log: vi.fn<FakeBoUi['log']>(),
  notify: vi.fn<FakeBoUi['notify']>(),
  navigate: vi.fn<FakeBoUi['navigate']>(),
  resize: vi.fn<FakeBoUi['resize']>(),
  widgetLog: vi.fn<FakeBoUi['widgetLog']>(),
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
  history.replaceState(null, '', '/__bo-widget/');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
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
      path: '/__bo-widget/details/1',
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
    select.value = 'fr_FR';
    select.dispatchEvent(new Event('change'));
    (document.querySelector('button') as HTMLButtonElement).click();

    expect(locales).toEqual([{ locale: 'fr_FR' }]);
    expect(themes).toEqual(['dark']);
    expect((await bo.getContext()).locale).toBe('fr_FR');
    expect((await bo.getTheme()).mode).toBe('dark');
    expect(document.querySelector('button')?.textContent).toBe('Theme: dark');
  });

  it('pushes a route of the widget view to the history, with routeChanged, so that a reload opens it', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();
    const routes: unknown[] = [];
    bo.on('routeChanged', (data) => routes.push(data));

    await bo.navigate({ path: 'stations/1?week=2#today' });

    expect(`${location.pathname}${location.search}${location.hash}`).toBe(
      '/__bo-widget/stations/1?week=2#today',
    );
    expect(routes).toEqual([
      { pathname: '/__bo-widget/stations/1', search: '?week=2', hash: '#today' },
    ]);
    expect(document.querySelector('.bo-route')?.textContent).toBe(
      '/__bo-widget/stations/1?week=2#today',
    );
  });

  it('only shows a route outside the widget view, with a warning, as the back office would leave the widget', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();
    const routes: unknown[] = [];
    bo.on('routeChanged', (data) => routes.push(data));

    expect(await bo.navigate({ path: '../elsewhere' })).toEqual({ path: '/elsewhere' });

    expect(location.pathname).toBe('/__bo-widget/');
    expect(routes).toEqual([]);
    expect(document.querySelector('.bo-log .warning')?.textContent).toContain(
      "/elsewhere is outside the widget's view",
    );
  });

  it('pushes routeChanged when the user goes back in the history', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();
    const routes: unknown[] = [];
    bo.on('routeChanged', (data) => routes.push(data));

    history.replaceState(null, '', '/__bo-widget/stations/2');
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(routes).toEqual([{ pathname: '/__bo-widget/stations/2', search: '', hash: '' }]);
    expect(document.querySelector('.bo-route')?.textContent).toBe('/__bo-widget/stations/2');
  });

  it('shows the route of a reloaded sub-route in the bar', async () => {
    history.replaceState(null, '', '/__bo-widget/stations/3');
    const { Widget } = widgetClass();

    await startFakeBo(fakeConfig(), load(Widget));

    expect(document.querySelector('.bo-route')?.textContent).toBe('/__bo-widget/stations/3');
    expect(document.querySelector('.bo-log .warning')).toBeNull();
  });

  it('warns when the page is outside the basename, which a router would not match', async () => {
    const { Widget } = widgetClass();

    await startFakeBo(
      fakeConfig({ context: { ...fakeConfig().context, basename: '/widgets/fleet-report' } }),
      load(Widget),
    );

    expect(document.querySelector('.bo-log .warning')?.textContent).toContain(
      'the page /__bo-widget/ is outside the basename /widgets/fleet-report',
    );
  });

  it('offers the back office locales, in its language_COUNTRY format, and keeps another one first', async () => {
    const options = () =>
      [...document.querySelectorAll('select option')].map((option) => option.textContent);

    await startFakeBo(fakeConfig(), load(widgetClass().Widget));
    expect(options()).toEqual(['en_GB', 'fr_FR', 'es_ES', 'de_DE', 'it_IT']);
    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('en_GB');

    document.body.replaceChildren();
    await startFakeBo(
      fakeConfig({ context: { ...fakeConfig().context, locale: 'pt_PT' } }),
      load(widgetClass().Widget),
    );
    expect(options()[0]).toBe('pt_PT');
    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('pt_PT');
  });

  it('rejects a path that the browser would read as another host, backslashes included', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();

    for (const path of ['\\\\evil.example/x', '/\\evil.example/x', '//evil.example/x']) {
      await expect(bo.navigate({ path })).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
    }
    expect(location.pathname).toBe('/__bo-widget/');
  });

  it('pushes no routeChanged, with a warning, when the history goes back outside the widget view', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();
    const routes: unknown[] = [];
    bo.on('routeChanged', (data) => routes.push(data));

    history.replaceState(null, '', '/app/vehicles');
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(routes).toEqual([]);
    expect(document.querySelector('.bo-log .warning')?.textContent).toContain(
      "/app/vehicles is outside the widget's view: no routeChanged",
    );
  });

  it('warns about a locale that is not in the back office format', async () => {
    await startFakeBo(
      fakeConfig({ context: { ...fakeConfig().context, locale: 'en' } }),
      load(widgetClass().Widget),
    );

    expect(document.querySelector('.bo-log .warning')?.textContent).toContain(
      'the locale en is not in the format of the back office, language_COUNTRY',
    );
  });

  it('matches its page with the default context of the dev server, without warning', async () => {
    const manifest = buildManifest(
      { name: 'Fleet report' },
      { name: 'fleet-report', version: '1.0.0' },
    );
    history.replaceState(null, '', `${FAKE_BO_PATH}stations/1`);

    await startFakeBo(fakeBoConfig(manifest, {}, { mode: 'mock' }), load(widgetClass().Widget));

    expect(document.querySelector('.bo-log .warning')).toBeNull();
    expect(document.querySelector('.bo-route')?.textContent).toBe(`${FAKE_BO_PATH}stations/1`);
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
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(Response.json({ accessToken: 'secret-token-value', expiresAt: null })),
    );
    const { Widget, client } = widgetClass();
    await startFakeBo(
      fakeConfig({ mode: 'token', auth: { kind: 'server', tokenPath: '/__bo-widget/token' } }),
      load(Widget),
    );
    const bo = await client();

    expect((await bo.getAccessToken()).accessToken).toBe('secret-token-value');

    const log = document.querySelector('.bo-log')?.textContent ?? '';
    expect(log).toContain('getAccessToken');
    expect(log).toContain('"accessToken":"…"');
    expect(log).not.toContain('secret');
  });

  it('masks the API key in the log', async () => {
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig({ apiKey: 'secret-api-key' }), load(Widget));
    const bo = await client();

    expect((await bo.getApiInfo()).apiKey).toBe('secret-api-key');

    const log = document.querySelector('.bo-log')?.textContent ?? '';
    expect(log).toContain('getApiInfo');
    expect(log).toContain('"apiKey":"…"');
    expect(log).not.toContain('secret-api-key');
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

/** Posts a `hello` from the widget iframe, as the SDK does, from this dev server by default. */
const hello = (
  data: Record<string, unknown> = {},
  ports?: MessagePort[],
  origin = window.location.origin,
) => {
  const frame = document.querySelector('iframe') as HTMLIFrameElement;
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { protocol: 'vulog-bo', version: 2, type: 'hello', ...data },
      source: frame.contentWindow,
      origin,
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
    select.value = 'fr_FR';
    select.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(secondReceived).toHaveLength(2));

    expect(firstReceived).toHaveLength(1);
    expect(secondReceived[1]).toEqual({
      type: 'event',
      name: 'localeChanged',
      data: { locale: 'fr_FR' },
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

  it('logs once each kind of message from the widget page that is not a hello', async () => {
    await startFakeBo(iframeConfig());

    hello({ protocol: 'other' });
    hello({ protocol: 'other' });
    hello({ type: 'getContext' });

    const warnings = [...document.querySelectorAll('.bo-log .warning')].map(
      (line) => line.textContent,
    );
    expect(warnings).toEqual([
      'ignored a message from the widget page: no protocol "vulog-bo"',
      'ignored a message from the widget page: type getContext on the window: requests go on the MessagePort of the hello',
    ]);
  });

  it('says when the loaded widget page sends no hello', async () => {
    vi.useFakeTimers();
    await startFakeBo(iframeConfig());
    const frame = document.querySelector('iframe') as HTMLIFrameElement;

    frame.dispatchEvent(new Event('load'));
    vi.advanceTimersByTime(5000);

    expect(document.querySelector('.bo-log .warning')?.textContent).toMatch(
      /no hello from the widget page 5 s after it loaded: does it call connect\(\) of the SDK\?/,
    );
  });

  it('does not complain once the hello arrived', async () => {
    vi.useFakeTimers();
    await startFakeBo(iframeConfig());
    const frame = document.querySelector('iframe') as HTMLIFrameElement;
    const { port1, port2 } = new MessageChannel();

    frame.dispatchEvent(new Event('load'));
    hello({}, [port2]);
    vi.advanceTimersByTime(5000);

    expect(document.querySelector('.bo-log .warning')).toBeNull();
    port1.close();
  });

  it('ignores a hello from another origin, such as a page the widget frame was navigated to', async () => {
    await startFakeBo(iframeConfig());
    const { port1, port2 } = new MessageChannel();
    const received = collect(port1);

    hello({}, [port2], 'http://localhost:9999');
    hello({}, [], '');
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(received).toEqual([]);
    const warnings = [...document.querySelectorAll('.bo-log .warning')].map(
      (line) => line.textContent,
    );
    expect(warnings).toEqual([
      'ignored a message from the widget page: message from http://localhost:9999, not from this dev server',
      'ignored a message from the widget page: message from an opaque origin, not from this dev server',
    ]);
    port1.close();
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
        origin: window.location.origin,
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
      fakeConfig({
        runtime: 'iframe',
        mode: 'token',
        auth: { kind: 'server', tokenPath: '/__bo-widget/token' },
      }),
    );
    // After connectIframe, which removes the global stubs.
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: 'no-token', message: 'No token: the dev token expired.' },
            { status: 401 },
          ),
        ),
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
    await vi.waitFor(() => expect(answers).toHaveLength(4));
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
      {
        type: 'event',
        name: 'routeChanged',
        data: { pathname: '/__bo-widget/ok', search: '', hash: '' },
      },
      { id: '2', ok: true, result: { path: '/__bo-widget/ok' } },
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
});

describe('createFakeBackOffice host API in token and login modes', () => {
  const loginApi = (mode: 'token' | 'login' = 'login') =>
    createFakeBackOffice(
      fakeConfig({ mode, auth: { kind: 'server', tokenPath: '/__bo-widget/token' } }),
      fakeUi(),
    ).createHostApi();

  it('reads the pasted token from the dev server in token mode, never from its config', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ accessToken: 'pasted', expiresAt: 3000 }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await loginApi('token').getAccessToken()).toEqual({
      accessToken: 'pasted',
      expiresAt: 3000,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the latest token of the session from the dev server at each call', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ accessToken: 'first', expiresAt: 1000 }))
      .mockResolvedValueOnce(Response.json({ accessToken: 'renewed', expiresAt: 2000 }));
    vi.stubGlobal('fetch', fetchMock);
    const api = loginApi();

    expect(await api.getAccessToken()).toEqual({ accessToken: 'first', expiresAt: 1000 });
    expect(await api.getAccessToken()).toEqual({ accessToken: 'renewed', expiresAt: 2000 });
    expect(fetchMock).toHaveBeenCalledWith('/__bo-widget/token', {
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    });
  });

  it('keeps an unknown expiry as null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ accessToken: 'opaque' })));

    expect(await loginApi().getAccessToken()).toEqual({ accessToken: 'opaque', expiresAt: null });
  });

  it('rejects with no-token, the status and the reason of the dev server', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: 'no-token', message: 'No token: the Chrome of bo-widget was closed' },
            { status: 401 },
          ),
        ),
    );
    const error = await loginApi()
      .getAccessToken()
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WidgetHostError);
    expect(error).toMatchObject({ code: 'no-token', status: 401 });
    expect((error as Error).message).toBe(
      'No token: the Chrome of bo-widget was closed (see the terminal)',
    );
  });

  it('gives the status when the dev server answers an error without a message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 500 })));
    const error = await loginApi()
      .getAccessToken()
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'no-token', status: 500 });
    expect((error as Error).message).toContain('The dev server answered 500');
  });

  it('tells the dev server is waiting for Chrome when it answers late', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('signal timed out', 'TimeoutError')),
    );
    const error = await loginApi()
      .getAccessToken()
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'no-token' });
    expect((error as Error).message).toContain('still waiting for the tab of the back office');
  });

  it('gives up when the dev server answers late', async () => {
    const fetchMock = vi.fn((_path: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return Promise.reject(new DOMException('timed out', 'TimeoutError'));
    });
    vi.stubGlobal('fetch', fetchMock);
    const error = await loginApi()
      .getAccessToken()
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'no-token', status: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects with no-token when the dev server does not answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await loginApi()
      .getAccessToken()
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'no-token', status: null });
    expect((error as Error).message).toContain('vite');
  });

  it.each([
    ['not JSON', new Response('oops')],
    ['an empty token', Response.json({ accessToken: '' })],
    ['no token', Response.json({})],
  ])('rejects with no-token for %s', async (_, response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const error = await loginApi()
      .getAccessToken()
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'no-token' });
  });
});

describe('widget logs', () => {
  it('shows a log of a Web Component in the page, the console and the terminal', async () => {
    const terminal = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget), terminal);
    const bo = await client();

    bo.log.warn('Export failed', { status: 500 });

    const line = document.querySelector('.bo-log .warning:last-child');
    expect(line?.textContent).toBe('widget warn: Export failed {"status":500}');
    expect(warn).toHaveBeenCalledWith('[widget] Export failed', { status: 500 });
    expect(terminal).toHaveBeenCalledWith({
      level: 'warn',
      message: 'Export failed',
      context: { status: 500 },
    });
  });

  it('shows each level with its console method and line class', async () => {
    const methods = (['debug', 'info', 'warn', 'error'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => {}),
    );
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget));
    const bo = await client();

    bo.log.debug('d');
    bo.log.info('i');
    bo.log.warn('w');
    bo.log.error('e');

    for (const method of methods) expect(method).toHaveBeenCalledTimes(1);
    const lines = [...document.querySelectorAll('.bo-log > div')]
      .filter((line) => line.textContent?.startsWith('widget '))
      .map((line) => [line.className, line.textContent]);
    expect(lines).toEqual([
      ['info', 'widget debug: d'],
      ['info', 'widget info: i'],
      ['warning', 'widget warn: w'],
      ['error', 'widget error: e'],
    ]);
  });

  it('keeps showing the log when the terminal is gone', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { Widget, client } = widgetClass();
    await startFakeBo(fakeConfig(), load(Widget), () => {
      throw new Error('closed');
    });
    const bo = await client();

    expect(() => bo.log.error('still shown')).not.toThrow();
    expect(document.querySelector('.bo-log .error:last-child')?.textContent).toBe(
      'widget error: still shown',
    );
    expect(warn).toHaveBeenCalledWith(
      '[bo-widget] cannot show the log in the terminal',
      expect.any(Error),
    );
  });

  it('receives the logs of an iframe on the port, without a request line', async () => {
    const { client, ui } = await connectIframe(fakeConfig({ runtime: 'iframe' }));

    client.log.info('Loaded', { rows: 3 });

    await vi.waitFor(() =>
      expect(ui.widgetLog).toHaveBeenCalledWith({
        level: 'info',
        message: 'Loaded',
        context: { rows: 3 },
      }),
    );
    await flush();
    expect(ui.log).not.toHaveBeenCalledWith(expect.stringMatching(/^log →/), expect.anything());
    client.disconnect();
  });

  it('refuses a malformed log on the port, like the back office', async () => {
    const ui = fakeUi();
    const backOffice = createFakeBackOffice(fakeConfig({ runtime: 'iframe' }), ui);
    const { port1, port2 } = new MessageChannel();
    const answers = collect(port1);
    backOffice.servePort(port2);

    port1.postMessage({ id: '1', type: 'log', payload: { level: 'fatal', message: 'x' } });
    await vi.waitFor(() => expect(answers).toHaveLength(2));

    expect(answers[1]).toEqual({
      id: '1',
      ok: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'log: level must be one of debug, info, warn, error',
      },
    });
    expect(ui.widgetLog).not.toHaveBeenCalled();
    expect(ui.log).toHaveBeenCalledWith(expect.stringMatching(/^log → /), 'error');
  });

  it('never throws from the injected log, and shows its refusal', () => {
    const ui = fakeUi();
    const api = createFakeBackOffice(fakeConfig(), ui).createHostApi();

    expect(() => api.log.warn('   ')).not.toThrow();

    expect(ui.widgetLog).not.toHaveBeenCalled();
    expect(ui.log).toHaveBeenCalledWith(
      'log refused: log: message must be a non-blank string',
      'warning',
    );
  });
});

describe('parseWidgetLog', () => {
  it('reads a log, with or without context', () => {
    expect(parseWidgetLog({ level: 'warn', message: 'w', context: { a: 1 } })).toEqual({
      level: 'warn',
      message: 'w',
      context: { a: 1 },
    });
    expect(parseWidgetLog({ level: 'error', message: 'e' })).toEqual({
      level: 'error',
      message: 'e',
    });
  });

  it.each([
    undefined,
    null,
    'warn',
    { level: 'trace', message: 'x' },
    { level: 'warn' },
    { level: 'warn', message: ' ' },
  ])('refuses %j', (payload) => {
    expect(() => parseWidgetLog(payload)).toThrow(WidgetHostError);
  });
});

describe('formatWidgetLog', () => {
  it('shows the level, the message and the context as JSON', () => {
    expect(formatWidgetLog({ level: 'info', message: 'i' })).toBe('widget info: i');
    expect(formatWidgetLog({ level: 'error', message: 'e', context: { a: 1 } })).toBe(
      'widget error: e {"a":1}',
    );
  });
});

describe('resolveRoute', () => {
  it('keeps a back office route, and resolves a relative path under the widget view', () => {
    expect(resolveRoute('/__bo-widget', '/app/vehicles')).toBe('/app/vehicles');
    expect(resolveRoute('/__bo-widget/', 'details/1?tab=2#top')).toBe(
      '/__bo-widget/details/1?tab=2#top',
    );
  });

  it('keeps a query or a hash alone under the widget view', () => {
    expect(resolveRoute('/__bo-widget', '?tab=2')).toBe('/__bo-widget/?tab=2');
    expect(resolveRoute('/__bo-widget', '#top')).toBe('/__bo-widget/#top');
    expect(isInView('/__bo-widget', '/__bo-widget/?tab=2')).toBe(true);
  });

  it('lets .. leave the widget view', () => {
    expect(resolveRoute('/widgets/fleet-report', '../other')).toBe('/widgets/other');
  });
});

describe('isInView', () => {
  it('accepts the view and its sub-routes only', () => {
    expect(isInView('/__bo-widget', '/__bo-widget')).toBe(true);
    expect(isInView('/__bo-widget/', '/__bo-widget/a?b#c')).toBe(true);
    expect(isInView('/__bo-widget', '/__bo-widget-other')).toBe(false);
    expect(isInView('/__bo-widget', '/app/vehicles')).toBe(false);
  });

  it('compares a basename that needs encoding with the encoded route', () => {
    expect(isInView('/w x', resolveRoute('/w x', 'a'))).toBe(true);
  });

  it('accepts every route for the root basename', () => {
    expect(isInView('/', '/anything')).toBe(true);
  });
});
