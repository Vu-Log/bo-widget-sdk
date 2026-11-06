import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createLogger, createServer, type ViteDevServer } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boWidget } from '../../plugin.js';
import { FAKE_API_PATH, FAKE_BO_MODULE_URL, FAKE_BO_PATH, FAKE_TOKEN_PATH } from '../server.js';
import type { CdpSocket } from './cdp.js';
import { startLogin, type TokenSource } from './index.js';

const HOST = 'bo.example.com';
const API = 'https://api.bo.example.com/boapi/proxy/';
const BROWSER_WS = 'ws://127.0.0.1:9333/devtools/browser/fake';

const jwt = (name: string): string =>
  [
    'e30',
    Buffer.from(JSON.stringify({ sub: name, exp: Date.now() / 1000 + 300 })).toString('base64url'),
    'sig',
  ].join('.');

/**
 * Stands for Chrome behind its DevTools WebSocket: its tabs, the token the auth service worker of
 * the back office gives (`null` when logged out), and the tabs the dev server opens.
 */
const fakeChrome = () => {
  const chrome = {
    tabs: [{ targetId: 'bo', type: 'page', url: `https://${HOST}/` }],
    token: null as string | null,
    /** Replaces the answer of the worker when set. */
    answer: null as unknown,
    evaluations: 0,
    created: [] as string[],
    sockets: [] as FakeChromeSocket[],
  };

  const answer = (method: string, params: Record<string, unknown>): unknown => {
    switch (method) {
      case 'Target.getTargets':
        return { targetInfos: chrome.tabs };
      case 'Target.attachToTarget':
        return { sessionId: 'session' };
      case 'Runtime.evaluate':
        chrome.evaluations++;
        return { result: { value: chrome.answer ?? { ok: true, data: chrome.token } } };
      case 'Target.createTarget':
        chrome.created.push(String(params.url));
        chrome.tabs.push({ targetId: 'fake-bo', type: 'page', url: String(params.url) });
        return { targetId: 'fake-bo' };
      default:
        return {};
    }
  };

  class FakeChromeSocket implements CdpSocket {
    private readonly listeners = new Map<string, ((event: { data: unknown }) => void)[]>();
    closed = false;

    constructor(readonly url: string) {
      chrome.sockets.push(this);
      queueMicrotask(() => this.emit('open'));
    }

    addEventListener(type: string, listener: (event: { data: unknown }) => void): void {
      this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
    }

    send(data: string): void {
      const { id, method, params } = JSON.parse(data) as {
        id: number;
        method: string;
        params: Record<string, unknown>;
      };
      const result = answer(method, params);
      queueMicrotask(() => this.emit('message', JSON.stringify({ id, result })));
    }

    close(): void {
      if (this.closed) return;
      this.closed = true;
      this.emit('close');
    }

    emit(type: string, data?: unknown): void {
      for (const listener of this.listeners.get(type) ?? []) listener({ data });
    }
  }

  return { chrome, FakeChromeSocket };
};

describe('startLogin', () => {
  const sessions: TokenSource[] = [];

  afterEach(() => {
    for (const session of sessions.splice(0)) session.close();
  });

  const start = async (
    fake: ReturnType<typeof fakeChrome>,
    fakeBoUrl: () => Promise<string | null> = () =>
      Promise.resolve(`http://localhost:5173${FAKE_BO_PATH}`),
  ) => {
    const logger = { info: vi.fn<(m: string) => void>(), warn: vi.fn<(m: string) => void>() };
    const launch = vi.fn(() => Promise.resolve({ webSocketUrl: BROWSER_WS, launched: true }));
    const session = await startLogin({
      host: HOST,
      root: '/project',
      env: { BO_WIDGET_DEBUG_PORT: '9444' },
      logger,
      fakeBoUrl,
      deps: {
        findChrome: () => '/opt/chrome',
        launchChrome: launch,
        socketFactory: (url) => new fake.FakeChromeSocket(url),
      },
    });
    sessions.push(session);
    return { session, logger, launch };
  };

  it('launches Chrome on the back office with the project profile and the port', async () => {
    const fake = fakeChrome();
    const { launch, logger } = await start(fake);

    expect(launch).toHaveBeenCalledWith({
      executable: '/opt/chrome',
      profileDir: join('/project', 'node_modules', '.cache', 'bo-widget', 'chrome-profile'),
      port: 9444,
      url: `https://${HOST}/`,
    });
    expect(fake.chrome.sockets[0]?.url).toBe(BROWSER_WS);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`log in to https://${HOST}/ in the Chrome of bo-widget (started`),
    );
  });

  it('opens the fake back office once, after the login', async () => {
    const fake = fakeChrome();
    const { session } = await start(fake);
    await vi.waitFor(() => expect(fake.chrome.sockets).toHaveLength(1));
    expect(fake.chrome.created).toEqual([]);

    fake.chrome.token = jwt('a');
    await vi.waitFor(async () => expect(await session.token()).toBe(fake.chrome.token));
    await vi.waitFor(() =>
      expect(fake.chrome.created).toEqual([`http://localhost:5173${FAKE_BO_PATH}`]),
    );
  });

  it('does not open the fake back office again when a tab already shows it', async () => {
    const fake = fakeChrome();
    fake.chrome.tabs.push({
      targetId: 'old',
      type: 'page',
      url: `http://localhost:5173${FAKE_BO_PATH}details`,
    });
    fake.chrome.token = jwt('a');
    const fakeBoUrl = vi.fn(() => Promise.resolve(`http://localhost:5173${FAKE_BO_PATH}`));
    const { session } = await start(fake, fakeBoUrl);

    expect(await session.token()).toBe(fake.chrome.token);
    await vi.waitFor(() => expect(fakeBoUrl).toHaveBeenCalled());
    expect(fake.chrome.created).toEqual([]);
  });

  it('opens nothing without a URL for the fake back office', async () => {
    const fake = fakeChrome();
    fake.chrome.token = jwt('a');
    const fakeBoUrl = vi.fn(() => Promise.resolve(null));
    await start(fake, fakeBoUrl);

    await vi.waitFor(() => expect(fakeBoUrl).toHaveBeenCalled());
    expect(fake.chrome.created).toEqual([]);
  });

  it('tells the user to open the fake back office when the tab cannot be opened', async () => {
    const fake = fakeChrome();
    fake.chrome.token = jwt('a');
    const { logger } = await start(fake, () => Promise.reject(new Error('no server')));

    await vi.waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot open the fake back office in the Chrome of bo-widget'),
      ),
    );
  });

  it('fails when Chrome cannot be found, before launching anything', async () => {
    const launch = vi.fn();

    await expect(
      startLogin({
        host: HOST,
        root: '/project',
        env: {},
        logger: { info: vi.fn(), warn: vi.fn() },
        fakeBoUrl: () => Promise.resolve(null),
        deps: {
          findChrome: () => {
            throw new Error('Chrome not found');
          },
          launchChrome: launch,
        },
      }),
    ).rejects.toThrow('Chrome not found');
    expect(launch).not.toHaveBeenCalled();
  });
});

/**
 * The real plugin, dev server and session together: only Chrome (its DevTools WebSocket and
 * `/json/version`) and the network (conf and API of the back office) are stubbed.
 */
describe('login mode in the dev server', () => {
  const roots: string[] = [];
  const servers: ViteDevServer[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const serve = async (server: Record<string, unknown> = {}) => {
    const root = await mkdtemp(join(tmpdir(), 'bo-widget-login-'));
    roots.push(root);
    const files = {
      'package.json': JSON.stringify({ name: 'fleet-report', version: '1.2.3' }),
      'src/main.ts': 'export default class extends HTMLElement {}',
    };
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), content);
    }
    const customLogger = createLogger('silent');
    const spies = {
      info: vi.spyOn(customLogger, 'info'),
      warn: vi.spyOn(customLogger, 'warn'),
      error: vi.spyOn(customLogger, 'error'),
    };
    const vite = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      customLogger,
      server: { port: 0, strictPort: false, ws: false, ...server },
      plugins: [boWidget({ name: 'Fleet report' })],
    });
    servers.push(vite);
    await vite.listen();
    const { port } = vite.httpServer?.address() as AddressInfo;
    const logs = () =>
      Object.values(spies)
        .flatMap((spy) => spy.mock.calls.map((call) => String(call[0])))
        .join('\n');
    return { vite, origin: `http://localhost:${port}`, spies, logs };
  };

  /** Stubs Chrome and the network; the calls to the dev server go through the real `fetch`. */
  const stubEdges = () => {
    const fake = fakeChrome();
    const realFetch = globalThis.fetch;
    const api = { calls: [] as Headers[], status: 200 };
    vi.stubGlobal('WebSocket', fake.FakeChromeSocket);
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string | URL | Request, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url === 'http://127.0.0.1:9333/json/version') {
          return Promise.resolve(Response.json({ webSocketDebuggerUrl: BROWSER_WS }));
        }
        if (url.startsWith(`https://${HOST}/`)) {
          return Promise.resolve(Response.json({ 'X-API-Key': 'conf-key', url: { baseUrl: API } }));
        }
        if (url.startsWith(API)) {
          api.calls.push(new Headers(init?.headers));
          return Promise.resolve(Response.json({ vehicles: 3 }, { status: api.status }));
        }
        return realFetch(input, init);
      }),
    );
    vi.stubEnv('BO_WIDGET_LOGIN', '1');
    vi.stubEnv('BO_WIDGET_HOST', HOST);
    vi.stubEnv('BO_WIDGET_CHROME', '/opt/chrome');
    return { ...fake, api };
  };

  const getStatus = (origin: string, path: string, headers: Record<string, string>) =>
    new Promise<number>((done, fail) => {
      const { hostname, port } = new URL(origin);
      request({ hostname, port, path, headers }, (res) => {
        res.resume();
        done(res.statusCode ?? 0);
      })
        .on('error', fail)
        .end();
    });

  it('follows the session: login, renewal after a 401, logout, Chrome closed', async () => {
    const { chrome, api } = stubEdges();
    vi.stubEnv('BO_WIDGET_TOKEN', 'pasted-token');
    const first = jwt('first');
    const renewed = jwt('renewed');
    chrome.token = first;
    const { vite, origin, spies, logs } = await serve();

    // Login: the fake back office opens in the same Chrome, and the calls carry the session token.
    await vi.waitFor(() => expect(chrome.created).toEqual([`${origin}${FAKE_BO_PATH}`]));
    const module = await (await fetch(`${origin}${FAKE_BO_MODULE_URL}`)).text();
    expect(module).toContain('"mode":"login"');
    expect(module).toContain(`"tokenPath":"${FAKE_TOKEN_PATH}"`);
    expect(module).toContain(`"host":"${HOST}"`);
    expect(module).not.toContain(first);
    const tokenResponse = await fetch(`${origin}${FAKE_TOKEN_PATH}`);
    expect(tokenResponse.headers.get('cache-control')).toBe('no-store');
    expect(await tokenResponse.json()).toEqual({
      accessToken: first,
      expiresAt: expect.any(Number),
    });
    expect((await fetch(`${origin}${FAKE_API_PATH}fleets`)).status).toBe(200);
    expect(api.calls.at(-1)?.get('authorization')).toBe(`Bearer ${first}`);

    // The API refuses the token: the session asks the back office again, and gets the renewed one.
    chrome.token = renewed;
    api.status = 401;
    expect((await fetch(`${origin}${FAKE_API_PATH}fleets`)).status).toBe(401);
    api.status = 200;
    expect((await fetch(`${origin}${FAKE_API_PATH}fleets`)).status).toBe(200);
    expect(api.calls.at(-1)?.get('authorization')).toBe(`Bearer ${renewed}`);

    // Logout: no token, and the calls stop before the API.
    chrome.token = null;
    api.status = 401;
    expect((await fetch(`${origin}${FAKE_API_PATH}fleets`)).status).toBe(401);
    const callsBefore = api.calls.length;
    const noSession = await fetch(`${origin}${FAKE_API_PATH}fleets`);
    expect(noSession.status).toBe(401);
    expect(await noSession.json()).toEqual({
      error: 'no-token',
      message: `No token: not logged in to ${HOST}: log in in the Chrome window of bo-widget.`,
    });
    expect(api.calls).toHaveLength(callsBefore);
    expect((await fetch(`${origin}${FAKE_TOKEN_PATH}`)).status).toBe(401);

    // Chrome closed: one message, and still no token, with the reason.
    chrome.sockets[0]?.close();
    const closed = await fetch(`${origin}${FAKE_TOKEN_PATH}`);
    expect(closed.status).toBe(401);
    expect(await closed.json()).toMatchObject({ message: expect.stringContaining('was closed') });
    expect(spies.warn).toHaveBeenCalledWith(
      expect.stringContaining('BO_WIDGET_TOKEN ignored: in login mode'),
    );
    expect(spies.info).toHaveBeenCalledWith(expect.stringContaining(`Logged in to ${HOST}`));
    expect(spies.warn).toHaveBeenCalledWith(expect.stringContaining(`not logged in to ${HOST}`));
    expect(spies.warn).toHaveBeenCalledWith(
      expect.stringContaining('the API refused the token of your session (401)'),
    );
    expect(logs().match(/was closed/g)).toHaveLength(1);
    for (const secret of [first, renewed, 'conf-key']) expect(logs()).not.toContain(secret);

    await vite.close();
    servers.splice(servers.indexOf(vite), 1);
  });

  it('gives the token to the pages of the dev server only', async () => {
    const { chrome } = stubEdges();
    chrome.token = jwt('first');
    const { origin } = await serve();
    await vi.waitFor(() => expect(chrome.created).toHaveLength(1));

    expect(await getStatus(origin, FAKE_TOKEN_PATH, { 'Sec-Fetch-Site': 'same-origin' })).toBe(200);
    expect(await getStatus(origin, FAKE_TOKEN_PATH, { 'Sec-Fetch-Site': 'cross-site' })).toBe(403);
    expect(await getStatus(origin, FAKE_TOKEN_PATH, { Origin: 'https://evil.example' })).toBe(403);
    expect((await fetch(`${origin}${FAKE_TOKEN_PATH}`, { method: 'POST' })).status).toBe(405);
  });

  it('refuses another host than localhost, as a rebound domain sends (DNS rebinding)', async () => {
    const { chrome, api } = stubEdges();
    chrome.token = jwt('first');
    const { origin, spies } = await serve({ allowedHosts: true });
    await vi.waitFor(() => expect(chrome.created).toHaveLength(1));
    const rebound = { Host: 'attacker.example:5173', 'Sec-Fetch-Site': 'same-origin' };

    expect(await getStatus(origin, FAKE_TOKEN_PATH, rebound)).toBe(403);
    expect(await getStatus(origin, `${FAKE_API_PATH}fleets`, rebound)).toBe(403);
    expect(api.calls).toHaveLength(0);
    expect(spies.warn).toHaveBeenCalledWith(
      expect.stringContaining('for another host than localhost'),
    );
  });

  it('asks again after a 401 on the token the widget sent itself (iframe)', async () => {
    const { chrome, api } = stubEdges();
    const first = jwt('first');
    const renewed = jwt('renewed');
    chrome.token = first;
    const { origin } = await serve();
    await vi.waitFor(() => expect(chrome.created).toHaveLength(1));
    const { accessToken } = (await (await fetch(`${origin}${FAKE_TOKEN_PATH}`)).json()) as {
      accessToken: string;
    };
    expect(accessToken).toBe(first);
    const asked = chrome.evaluations;

    chrome.token = renewed;
    api.status = 401;
    const refused = await fetch(`${origin}${FAKE_API_PATH}fleets`, {
      headers: { Authorization: `Bearer ${first}` },
    });
    expect(refused.status).toBe(401);
    expect(api.calls.at(-1)?.get('authorization')).toBe(`Bearer ${first}`);

    const retry = (await (await fetch(`${origin}${FAKE_TOKEN_PATH}`)).json()) as {
      accessToken: string;
    };
    expect(retry.accessToken).toBe(renewed);
    expect(chrome.evaluations).toBe(asked + 1);
  });

  it('tells apart a 401 on an Authorization that is not a Bearer token', async () => {
    const { chrome, api } = stubEdges();
    chrome.token = jwt('first');
    const { origin, spies } = await serve();
    await vi.waitFor(() => expect(chrome.created).toHaveLength(1));
    api.status = 401;

    await fetch(`${origin}${FAKE_API_PATH}fleets`, { headers: { Authorization: 'Basic abc' } });

    expect(spies.warn).toHaveBeenCalledWith(
      expect.stringContaining('refused the Authorization header the widget sent (401)'),
    );
    expect(spies.warn).not.toHaveBeenCalledWith(expect.stringContaining('token of your session'));
  });

  it('gives no token, once, for an answer it cannot read', async () => {
    const { chrome } = stubEdges();
    chrome.answer = { ok: true, data: 'not-a-jwt-secret' };
    const { origin, logs } = await serve();
    await vi.waitFor(() => expect(logs()).toContain('not a JWT with an expiry'));

    const response = await fetch(`${origin}${FAKE_TOKEN_PATH}`);

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      message: expect.stringContaining('not a JWT with an expiry'),
    });
    expect(logs().match(/not a JWT/g)).toHaveLength(1);
    expect(logs()).not.toContain('not-a-jwt-secret');
    expect(chrome.created).toEqual([]);
  });

  it('closes the CDP connection, not Chrome, when the dev server stops', async () => {
    const { chrome } = stubEdges();
    chrome.token = jwt('first');
    const { vite } = await serve();
    await vi.waitFor(() => expect(chrome.sockets).toHaveLength(1));

    await vite.close();
    servers.splice(servers.indexOf(vite), 1);

    expect(chrome.sockets[0]?.closed).toBe(true);
  });

  it('refuses to start when the dev server is exposed to the network', async () => {
    const { chrome } = stubEdges();

    await expect(serve({ host: '0.0.0.0' })).rejects.toThrow(
      'remove server.host (or --host), the token of your session would be served',
    );
    expect(chrome.sockets).toHaveLength(0);
  });

  it('refuses to start without BO_WIDGET_HOST', async () => {
    stubEdges();
    vi.stubEnv('BO_WIDGET_HOST', '');

    await expect(serve()).rejects.toThrow('Fake back office in login mode: set BO_WIDGET_HOST');
  });
});
