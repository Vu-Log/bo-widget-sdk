import { createHash } from 'node:crypto';
import {
  createServer as createHttpServer,
  request,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { buildManifest, type WidgetConfig } from '../manifest.js';
import { createLogger, createServer, type ViteDevServer } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boWidget } from '../plugin.js';
import {
  FAKE_API_PATH,
  FAKE_BO_MODULE_URL,
  FAKE_BO_PATH,
  fakeBoConfig,
  fakeBoModule,
  forwardedHeaders,
  isCrossSite,
  jwtExpiresAt,
  resolveDevMode,
  tokenWarnings,
  widgetTag,
} from './server.js';

const jwt = (payload: object): string =>
  ['e30', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'sig'].join('.');

const TOKEN_ENV = {
  BO_WIDGET_TOKEN: 'real-token',
  BO_WIDGET_API_URL: 'https://api.example.com/boapi/proxy',
  BO_WIDGET_API_KEY: 'real-key',
};

describe('widgetTag', () => {
  it('is widget- and the first 12 hex characters of sha256("{client}/{id}@{version}")', () => {
    const hash = createHash('sha256').update('acme/fleet-report@1.2.3').digest('hex');

    expect(widgetTag('acme', 'fleet-report', '1.2.3')).toBe(`widget-${hash.slice(0, 12)}`);
    expect(widgetTag('acme', 'fleet-report', '1.2.3')).toMatch(/^widget-[0-9a-f]{12}$/);
  });

  it('differs between versions', () => {
    expect(widgetTag('acme', 'a', '1.0.0')).not.toBe(widgetTag('acme', 'a', '1.0.1'));
  });
});

describe('jwtExpiresAt', () => {
  it('reads exp in milliseconds', () => {
    expect(jwtExpiresAt(jwt({ exp: 1_700_000_000 }))).toBe(1_700_000_000_000);
  });

  it.each([
    ['a token that is not a JWT', 'opaque'],
    ['a JWT without exp', jwt({ sub: 'x' })],
    ['a non-numeric exp', jwt({ exp: 'soon' })],
    ['an unreadable payload', 'a.%%%.c'],
  ])('is null for %s', (_label, token) => {
    expect(jwtExpiresAt(token)).toBeNull();
  });
});

describe('resolveDevMode', () => {
  it('is mock by default', () => {
    expect(resolveDevMode(undefined, {})).toEqual({ mode: 'mock' });
  });

  it('is token when BO_WIDGET_TOKEN is set, with a trailing slash on the API URL', () => {
    expect(resolveDevMode(undefined, TOKEN_ENV)).toEqual({
      mode: 'token',
      env: {
        token: 'real-token',
        apiUrl: 'https://api.example.com/boapi/proxy/',
        apiKey: 'real-key',
      },
    });
  });

  it('stays mock when asked, even with a token', () => {
    expect(resolveDevMode('mock', TOKEN_ENV)).toEqual({ mode: 'mock' });
  });

  it('lists the missing variables in token mode', () => {
    expect(() => resolveDevMode('token', { BO_WIDGET_TOKEN: 't' })).toThrow(
      /set BO_WIDGET_API_URL, BO_WIDGET_API_KEY/,
    );
  });

  it.each([
    ['not a url', /BO_WIDGET_API_URL is not a valid URL/],
    ['ftp://api.example.com/', /BO_WIDGET_API_URL must be an http\(s\) URL, not ftp:/],
    ['https://api.example.com/boapi/proxy/?a=1', /must have no query nor hash/],
    ['https://api.example.com/boapi/proxy/#x', /must have no query nor hash/],
  ])('refuses the API URL %s', (url, message) => {
    expect(() => resolveDevMode('token', { ...TOKEN_ENV, BO_WIDGET_API_URL: url })).toThrow(
      message,
    );
  });

  it('refuses an API URL with credentials', () => {
    expect(() =>
      resolveDevMode('token', { ...TOKEN_ENV, BO_WIDGET_API_URL: 'https://u:p@api.example.com/' }),
    ).toThrow(/must not contain credentials/);
  });

  it('shows the API URL it cannot parse', () => {
    expect(() =>
      resolveDevMode('token', { ...TOKEN_ENV, BO_WIDGET_API_URL: '"api.example.com"' }),
    ).toThrow('BO_WIDGET_API_URL is not a valid URL: ""api.example.com""');
  });

  it('trims the API key and the URL pasted with spaces', () => {
    expect(
      resolveDevMode('token', {
        ...TOKEN_ENV,
        BO_WIDGET_API_KEY: ' real-key\r',
        BO_WIDGET_API_URL: ' https://api.example.com/boapi/proxy/ ',
      }),
    ).toMatchObject({
      env: { apiKey: 'real-key', apiUrl: 'https://api.example.com/boapi/proxy/' },
    });
  });

  it.each([['   '], ['Bearer'], ['Bearer   ']])('counts the token %j as missing', (token) => {
    expect(() => resolveDevMode('token', { ...TOKEN_ENV, BO_WIDGET_TOKEN: token })).toThrow(
      /set BO_WIDGET_TOKEN \(/,
    );
  });

  it('keeps the API URL in its canonical form, the prefix the proxy checks', () => {
    const resolved = resolveDevMode('token', {
      ...TOKEN_ENV,
      BO_WIDGET_API_URL: 'https://API.Example.com:443/boapi/proxy',
    });

    expect(resolved).toMatchObject({ env: { apiUrl: 'https://api.example.com/boapi/proxy/' } });
  });

  it('removes a Bearer prefix and spaces pasted with the token', () => {
    const resolved = resolveDevMode('token', {
      ...TOKEN_ENV,
      BO_WIDGET_TOKEN: ' Bearer abc.def.ghi \n',
    });

    expect(resolved).toMatchObject({ env: { token: 'abc.def.ghi' } });
  });

  it('refuses an unknown mode', () => {
    expect(() => resolveDevMode('proxy' as 'token', {})).toThrow(/unknown dev\.mode "proxy"/);
  });
});

describe('isCrossSite', () => {
  it.each([
    ['same-origin', {}, false],
    ['none', {}, false],
    ['same-site', {}, true],
    ['cross-site', {}, true],
  ])('trusts Sec-Fetch-Site %s', (site, extra, expected) => {
    expect(isCrossSite({ headers: { 'sec-fetch-site': site, ...extra } })).toBe(expected);
  });

  it('trusts a same-origin Sec-Fetch-Site behind a proxy that rewrites Host', () => {
    expect(
      isCrossSite({
        headers: {
          'sec-fetch-site': 'same-origin',
          origin: 'https://tunnel.example',
          host: 'localhost:5173',
        },
      }),
    ).toBe(false);
  });

  it('compares Origin with :authority over HTTP/2, without Sec-Fetch-Site', () => {
    expect(
      isCrossSite({
        headers: { origin: 'https://localhost:5173', ':authority': 'localhost:5173' },
      }),
    ).toBe(false);
    expect(
      isCrossSite({ headers: { origin: 'https://evil.example', ':authority': 'localhost:5173' } }),
    ).toBe(true);
  });

  it('lets a call without Origin nor Sec-Fetch-Site through (curl, the dev server itself)', () => {
    expect(isCrossSite({ headers: { host: 'localhost:5173' } })).toBe(false);
  });
});

describe('forwardedHeaders', () => {
  it('drops HTTP/2 pseudo-headers, cookies and origin, and adds the Bearer token', () => {
    const headers = forwardedHeaders(
      {
        ':method': 'GET',
        ':path': '/x',
        ':authority': 'localhost:5173',
        cookie: 'session=1',
        origin: 'https://localhost:5173',
        'x-api-key': 'key',
        accept: ['application/json', 'text/plain'] as unknown as string,
      },
      'token',
    );

    expect(Object.fromEntries(headers)).toEqual({
      accept: 'application/json, text/plain',
      authorization: 'Bearer token',
      'x-api-key': 'key',
    });
  });

  it('keeps the Authorization the widget sends', () => {
    expect(forwardedHeaders({ authorization: 'Bearer mine' }, 'token').get('authorization')).toBe(
      'Bearer mine',
    );
  });
});

describe('tokenWarnings', () => {
  it('says nothing for a JWT that has not expired', () => {
    expect(tokenWarnings(jwt({ exp: 2_000 }), 1_000_000)).toEqual([]);
  });

  it('warns about a token that is not a JWT with an expiry', () => {
    expect(tokenWarnings('opaque')).toEqual([expect.stringMatching(/not a JWT with an expiry/)]);
  });

  it('warns about an expired token, with its expiry', () => {
    expect(tokenWarnings(jwt({ exp: 1_000 }), 2_000_000)).toEqual([
      expect.stringMatching(/expired at 1970-01-01T00:16:40\.000Z: paste a new one/),
    ]);
  });
});

describe('fakeBoConfig', () => {
  const manifest = buildManifest(
    {
      name: 'Fleet report',
      permissions: ['apiInfo'],
      settings: [
        { key: 'currency', type: 'string', default: 'CAD' },
        { key: 'apiBaseUrl', type: 'url', required: true },
      ],
    },
    { name: 'fleet-report', version: '1.2.3' },
  );

  it('gives mock fixtures, setting defaults and the widget tag', () => {
    const config = fakeBoConfig(manifest, {}, { mode: 'mock' });

    expect(config).toMatchObject({
      mode: 'mock',
      runtime: 'webcomponent',
      protocolVersion: 2,
      widget: {
        id: 'fleet-report',
        name: 'Fleet report',
        version: '1.2.3',
        permissions: ['apiInfo'],
      },
      tag: widgetTag('dev', 'fleet-report', '1.2.3'),
      context: { fleetId: 'DEV-FLEET', locale: 'en', basename: '/widgets/fleet-report' },
      user: { currentFleetId: 'DEV-FLEET', fleets: [{ fleetId: 'DEV-FLEET', profile: 'manager' }] },
      settings: { currency: 'CAD' },
      apiPath: FAKE_API_PATH,
      apiKey: 'mock-api-key',
      accessToken: 'mock-access-token',
      expiresAt: null,
    });
  });

  it('applies the dev overrides', () => {
    const config = fakeBoConfig(
      manifest,
      {
        context: { fleetId: 'FLEET-2', locale: 'fr' },
        user: { roles: ['fleetagent'] },
        settings: { currency: 'EUR', apiBaseUrl: 'https://mw.example.com' },
      },
      { mode: 'mock' },
    );

    expect(config.context).toMatchObject({ fleetId: 'FLEET-2', locale: 'fr' });
    expect(config.user).toMatchObject({ roles: ['fleetagent'], currentFleetId: 'FLEET-2' });
    expect(config.settings).toEqual({ currency: 'EUR', apiBaseUrl: 'https://mw.example.com' });
  });

  it('has no fleet in the user when the context has none', () => {
    expect(
      fakeBoConfig(manifest, { context: { fleetId: null } }, { mode: 'mock' }).user.fleets,
    ).toEqual([]);
  });

  it('passes the real token and API key in token mode, with the token expiry', () => {
    const token = jwt({ exp: 2_000_000_000 });
    const config = fakeBoConfig(
      manifest,
      {},
      resolveDevMode(undefined, { ...TOKEN_ENV, BO_WIDGET_TOKEN: token }),
    );

    expect(config).toMatchObject({
      mode: 'token',
      accessToken: token,
      apiKey: 'real-key',
      expiresAt: 2_000_000_000_000,
    });
  });
});

describe('fakeBoModule', () => {
  it('imports the widget entry and starts the fake back office with it', () => {
    const config = fakeBoConfig(
      buildManifest({ name: 'R' }, { name: 'r', version: '1.0.0' }),
      {},
      { mode: 'mock' },
    );

    const code = fakeBoModule('/pkg/host.js', config, '/app/src/main.ts');

    expect(code).toContain('import { startFakeBo } from "/pkg/host.js";');
    expect(code).toContain(
      `startFakeBo(${JSON.stringify(config)}, () => import("/app/src/main.ts")).catch(`,
    );
    expect(code).toContain('Fake back office failed to start');
  });

  it('imports no entry for an iframe', () => {
    const code = fakeBoModule(
      '/pkg/host.js',
      fakeBoConfig(
        buildManifest({ name: 'R', runtime: 'iframe' }, { name: 'r', version: '1.0.0' }),
        {},
        { mode: 'mock' },
      ),
      null,
    );

    expect(code).not.toContain('import(');
    expect(code).toMatch(/startFakeBo\(\{.*\}\)\.catch\(/);
  });
});

describe('fake back office dev server', () => {
  const roots: string[] = [];
  const servers: { close(): Promise<void> | void }[] = [];

  afterEach(async () => {
    vi.unstubAllEnvs();
    await Promise.all(servers.splice(0).map((server) => server.close()));
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  const project = async (files: Record<string, string> = {}): Promise<string> => {
    const root = await mkdtemp(join(tmpdir(), 'bo-widget-dev-'));
    roots.push(root);
    const all = {
      'package.json': JSON.stringify({ name: 'fleet-report', version: '1.2.3' }),
      'src/main.ts': 'export default class extends HTMLElement {}',
      ...files,
    };
    for (const [path, content] of Object.entries(all)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), content);
    }
    return root;
  };

  const serve = async (config: WidgetConfig, files?: Record<string, string>) => {
    const root = await project(files);
    const customLogger = createLogger('silent');
    const warn = vi.spyOn(customLogger, 'warn');
    const error = vi.spyOn(customLogger, 'error');
    const server: ViteDevServer = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      customLogger,
      server: { port: 0, strictPort: false, ws: false },
      plugins: [boWidget(config)],
    });
    servers.push(server);
    await server.listen();
    const { port } = server.httpServer?.address() as AddressInfo;
    const origin = `http://localhost:${port}`;
    return { server, origin, customLogger, warn, error };
  };

  /** An HTTP server standing for the Vulog API, recording what it receives. */
  const upstream = async (
    answer: (res: ServerResponse) => void = (res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Upstream', 'yes');
      res.end(JSON.stringify({ vehicles: 3 }));
    },
  ) => {
    const received: { url: string; method: string; headers: IncomingHttpHeaders; body: string }[] =
      [];
    const server: Server = createHttpServer((req: IncomingMessage, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => (body += chunk.toString()));
      req.on('end', () => {
        received.push({ url: req.url ?? '', method: req.method ?? '', headers: req.headers, body });
        answer(res);
      });
    });
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    servers.push({
      close: () =>
        new Promise<void>((done) => {
          server.closeAllConnections();
          server.close(() => done());
        }),
    });
    const { port } = server.address() as AddressInfo;
    return { url: `http://127.0.0.1:${port}/boapi/proxy/`, received };
  };

  const stubTokenEnv = (apiUrl: string, token = 'real-token') => {
    vi.stubEnv('BO_WIDGET_TOKEN', token);
    vi.stubEnv('BO_WIDGET_API_URL', apiUrl);
    vi.stubEnv('BO_WIDGET_API_KEY', 'real-key');
  };

  /** Sends a raw request, so that the path and headers reach the server as written (fetch normalizes them). */
  const rawGet = (origin: string, path: string, headers: Record<string, string> = {}) =>
    new Promise<number>((done, fail) => {
      const { hostname, port } = new URL(origin);
      request({ hostname, port, path, headers }, (res) => {
        res.resume();
        done(res.statusCode ?? 0);
      })
        .on('error', fail)
        .end();
    });

  it('serves the fake back office page, which loads its module', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_BO_PATH}`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/text\/html/);
    const html = await response.text();
    expect(html).toContain(`<script type="module" src="${FAKE_BO_MODULE_URL}"></script>`);
    expect(html).toContain('/@vite/client');
  });

  it('serves the module that registers the widget entry with the mock fixtures', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_BO_MODULE_URL}`);

    expect(response.status).toBe(200);
    const code = await response.text();
    expect(code).toContain('startFakeBo');
    expect(code).toContain('/src/main.ts');
    expect(code).toContain('"mode":"mock"');
  });

  it('serves the fake back office host module itself, without warning on its customElements.define', async () => {
    const { origin, customLogger } = await serve({ name: 'Fleet report' });
    const warn = vi.spyOn(customLogger, 'warn');
    const module = await (await fetch(`${origin}${FAKE_BO_MODULE_URL}`)).text();
    const hostUrl = /from\s+"([^"]*host\.[jt]s)"/.exec(module)?.[1];

    expect(hostUrl).toBeDefined();
    const response = await fetch(`${origin}${hostUrl}`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('createFakeBackOffice');
    expect(warn).not.toHaveBeenCalled();
  });

  it('redirects / to the fake back office for a Web Component', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}/`, { redirect: 'manual' });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(FAKE_BO_PATH);
  });

  it('keeps / as the widget page for an iframe', async () => {
    const { origin } = await serve(
      { name: 'Fleet report', runtime: 'iframe' },
      { 'index.html': '<!doctype html><html><body>widget page</body></html>' },
    );

    const response = await fetch(`${origin}/`, { redirect: 'manual' });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('widget page');
    const module = await (await fetch(`${origin}${FAKE_BO_MODULE_URL}`)).text();
    expect(module).toContain('"runtime":"iframe"');
    expect(module).not.toContain('/src/main.ts');
  });

  it('answers the Vulog API calls with the mock responses', async () => {
    const { origin } = await serve({
      name: 'Fleet report',
      dev: { responses: { 'GET fleetmanager/public/fleets/DEV-FLEET/vehicles': [{ id: 'v1' }] } },
    });

    const response = await fetch(
      `${origin}${FAKE_API_PATH}fleetmanager/public/fleets/DEV-FLEET/vehicles?page=0`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 'v1' }]);
  });

  it('answers 404 to a call without mock response, saying how to add one', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_API_PATH}fleetmanager/public/fleets`, {
      method: 'POST',
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'mock-not-found',
      message: expect.stringContaining('"POST fleetmanager/public/fleets"'),
    });
  });

  it('forwards the Vulog API calls in token mode, adding the Bearer token', async () => {
    const api = await upstream();
    vi.stubEnv('BO_WIDGET_TOKEN', 'real-token');
    vi.stubEnv('BO_WIDGET_API_URL', api.url);
    vi.stubEnv('BO_WIDGET_API_KEY', 'real-key');
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(
      `${origin}${FAKE_API_PATH}fleetmanager/public/fleets/F1/vehicles?page=2`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': 'real-key',
          'Content-Type': 'application/json',
          Cookie: 'session=1',
        },
        body: JSON.stringify({ q: 1 }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-upstream')).toBe('yes');
    expect(await response.json()).toEqual({ vehicles: 3 });
    expect(api.received).toEqual([
      expect.objectContaining({
        url: '/boapi/proxy/fleetmanager/public/fleets/F1/vehicles?page=2',
        method: 'POST',
        body: '{"q":1}',
        headers: expect.objectContaining({
          authorization: 'Bearer real-token',
          'x-api-key': 'real-key',
          'content-type': 'application/json',
        }),
      }),
    ]);
    expect(api.received[0]?.headers.cookie).toBeUndefined();
    const module = await (await fetch(`${origin}${FAKE_BO_MODULE_URL}`)).text();
    expect(module).toContain('"mode":"token"');
  });

  it('keeps the Authorization header the widget sends (iframe)', async () => {
    const api = await upstream();
    vi.stubEnv('BO_WIDGET_TOKEN', 'real-token');
    vi.stubEnv('BO_WIDGET_API_URL', api.url);
    vi.stubEnv('BO_WIDGET_API_KEY', 'real-key');
    const { origin } = await serve({ name: 'Fleet report' });

    await fetch(`${origin}${FAKE_API_PATH}x`, { headers: { Authorization: 'Bearer from-widget' } });

    expect(api.received[0]?.headers.authorization).toBe('Bearer from-widget');
  });

  it('refuses a path that leaves the API base URL', async () => {
    const api = await upstream();
    vi.stubEnv('BO_WIDGET_TOKEN', 'real-token');
    vi.stubEnv('BO_WIDGET_API_URL', api.url);
    vi.stubEnv('BO_WIDGET_API_KEY', 'real-key');
    const { origin, warn } = await serve({ name: 'Fleet report' });

    // `/admin` would resolve at the root of the API host, `//evil.example/x` on another host.
    const responses = await Promise.all(
      ['/admin', '//evil.example/x'].map((path) => fetch(`${origin}${FAKE_API_PATH}${path}`)),
    );

    expect(responses.map((response) => response.status)).toEqual([400, 400]);
    expect(api.received).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('/admin is outside BO_WIDGET_API_URL'),
    );
  });

  it('answers 502 when the Vulog API cannot be reached', async () => {
    vi.stubEnv('BO_WIDGET_TOKEN', 'real-token');
    vi.stubEnv('BO_WIDGET_API_URL', 'http://127.0.0.1:1/boapi/proxy/');
    vi.stubEnv('BO_WIDGET_API_KEY', 'real-key');
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_API_PATH}x`);

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: 'proxy-failed' });
  });

  it('fails to start in token mode without the API settings', async () => {
    await expect(serve({ name: 'Fleet report', dev: { mode: 'token' } })).rejects.toThrow(
      /set BO_WIDGET_TOKEN, BO_WIDGET_API_URL, BO_WIDGET_API_KEY/,
    );
  });

  it('fails to start on an invalid widget configuration', async () => {
    await expect(serve({ name: '' })).rejects.toThrow(/Invalid widget configuration/);
  });

  it('prints the fake back office URL with the server URLs', async () => {
    const { server, customLogger } = await serve({ name: 'Fleet report' });
    const info = vi.spyOn(customLogger, 'info');

    server.printUrls();

    expect(info).toHaveBeenCalledWith(
      expect.stringMatching(
        /Fake back office \(mock mode\): http:\/\/localhost:\d+\/__bo-widget\//,
      ),
    );
  });

  it.each([
    ['token mode, host: true', true, true],
    ['token mode, a LAN address', '0.0.0.0', true],
    ['token mode, localhost', 'localhost', false],
  ])('warns when the token mode is exposed on the network: %s', async (_label, host, warns) => {
    const api = await upstream();
    stubTokenEnv(api.url, jwt({ exp: 4_000_000_000 }));
    const root = await project();
    const customLogger = createLogger('silent');
    const warn = vi.spyOn(customLogger, 'warn');
    const server = await createServer({
      root,
      configFile: false,
      customLogger,
      server: { host, ws: false },
      plugins: [boWidget({ name: 'Fleet report' })],
    });
    servers.push(server);

    expect(warn.mock.calls.some(([message]) => message.includes('anyone on the network'))).toBe(
      warns,
    );
  });

  it('does not warn about the network in mock mode', async () => {
    const root = await project();
    const customLogger = createLogger('silent');
    const warn = vi.spyOn(customLogger, 'warn');
    const server = await createServer({
      root,
      configFile: false,
      customLogger,
      server: { host: true, ws: false },
      plugins: [boWidget({ name: 'Fleet report' })],
    });
    servers.push(server);

    expect(warn).not.toHaveBeenCalled();
  });

  it('warns at startup about a token that is not a JWT, and about ignored mock responses', async () => {
    const api = await upstream();
    stubTokenEnv(api.url, 'opaque-token');

    const { warn } = await serve({
      name: 'Fleet report',
      dev: { responses: { 'GET x': [] } },
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('BO_WIDGET_TOKEN is not a JWT'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('dev.responses are ignored'));
  });

  it('warns about dev settings the manifest does not declare', async () => {
    const { warn } = await serve({
      name: 'Fleet report',
      settings: [{ key: 'currency', type: 'string' }],
      dev: { settings: { currency: 'EUR', curency: 'CAD' } },
    });

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/dev\.settings curency: not declared/));
  });

  it('refuses the calls of a page from another origin', async () => {
    const api = await upstream();
    stubTokenEnv(api.url);
    const { origin, warn } = await serve({ name: 'Fleet report' });
    const { host } = new URL(origin);

    const statuses = await Promise.all([
      rawGet(origin, `${FAKE_API_PATH}x`, { 'Sec-Fetch-Site': 'cross-site' }),
      rawGet(origin, `${FAKE_API_PATH}x`, { 'Sec-Fetch-Site': 'same-site' }),
      rawGet(origin, `${FAKE_API_PATH}x`, { Origin: 'https://evil.example' }),
      rawGet(origin, `${FAKE_API_PATH}x`, { Origin: 'not a url' }),
      rawGet(origin, `${FAKE_API_PATH}x`, {
        Origin: `http://${host}`,
        'Sec-Fetch-Site': 'same-origin',
      }),
    ]);

    expect(statuses).toEqual([403, 403, 403, 403, 200]);
    expect(api.received).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('from another origin (https://evil.example)'),
    );
  });

  it('never forwards a path with encoded dot segments outside the API base URL', async () => {
    const api = await upstream();
    stubTokenEnv(api.url);
    const { origin } = await serve({ name: 'Fleet report' });

    const statuses = await Promise.all([
      rawGet(origin, `${FAKE_API_PATH}%2e%2e/admin`),
      rawGet(origin, `${FAKE_API_PATH}a/%2E%2E/%2E%2E/y`),
    ]);

    expect(statuses.every((status) => status !== 200)).toBe(true);
    expect(api.received).toEqual([]);
  });

  it('forwards to an API URL given without trailing slash', async () => {
    const api = await upstream();
    stubTokenEnv(api.url.replace(/\/$/, ''));
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_API_PATH}fleets`);

    expect(response.status).toBe(200);
    expect(api.received[0]?.url).toBe('/boapi/proxy/fleets');
  });

  it("drops the API's CORS headers and keeps each cookie", async () => {
    const api = await upstream((res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Set-Cookie', ['a=1', 'b=2']);
      res.end('{}');
    });
    stubTokenEnv(api.url);
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_API_PATH}x`);

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
    expect(response.headers.getSetCookie()).toEqual(['a=1', 'b=2']);
  });

  it('forwards a response without body', async () => {
    const api = await upstream((res) => {
      res.statusCode = 204;
      res.end();
    });
    stubTokenEnv(api.url);
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_API_PATH}x`, { method: 'DELETE' });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('hints at an expired token on a 401, and warns on a redirect', async () => {
    let status = 401;
    const api = await upstream((res) => {
      res.statusCode = status;
      if (status === 302) res.setHeader('Location', 'https://login.example/');
      res.end();
    });
    stubTokenEnv(api.url);
    const { origin, warn } = await serve({ name: 'Fleet report' });

    expect((await fetch(`${origin}${FAKE_API_PATH}x`)).status).toBe(401);
    status = 302;
    expect((await fetch(`${origin}${FAKE_API_PATH}y`, { redirect: 'manual' })).status).toBe(302);

    expect((await fetch(`${origin}${FAKE_API_PATH}y`, { redirect: 'manual' })).status).toBe(302);
    status = 401;
    await fetch(`${origin}${FAKE_API_PATH}z`);
    const hints = warn.mock.calls.filter(([message]) => message.includes('401 from the API'));
    expect(hints).toEqual([[expect.stringContaining('Has BO_WIDGET_TOKEN expired?')]]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('the API redirects (302)'));
  });

  it('survives an API response that breaks off, and logs it', async () => {
    const api = await upstream((res) => {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': '1000' });
      res.write('{"partial":');
      setTimeout(() => res.socket?.destroy(), 20);
    });
    stubTokenEnv(api.url);
    const { origin, error } = await serve({ name: 'Fleet report' });

    const broken = await fetch(`${origin}${FAKE_API_PATH}x`)
      .then((response) => response.text())
      .catch((caught: unknown) => caught);

    expect(broken).toBeInstanceOf(Error);
    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledWith(expect.stringContaining('the API response broke off')),
    );
    // The dev server is still up.
    expect((await fetch(`${origin}${FAKE_BO_PATH}`)).status).toBe(200);
  });

  it('logs why the API cannot be reached', async () => {
    // A port that was free a moment ago: nothing listens on it.
    const probe = createHttpServer();
    await new Promise<void>((done) => probe.listen(0, '127.0.0.1', done));
    const { port } = probe.address() as AddressInfo;
    await new Promise<void>((done) => probe.close(() => done()));
    stubTokenEnv(`http://127.0.0.1:${port}/boapi/proxy/`);
    const { origin, error } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_API_PATH}x`);

    expect(await response.json()).toEqual({
      error: 'proxy-failed',
      message: expect.stringContaining('ECONNREFUSED'),
    });
    expect(error).toHaveBeenCalledWith(
      expect.stringMatching(/cannot reach .*\(ECONNREFUSED\)\. Check BO_WIDGET_API_URL/),
    );
  });

  it('warns once about a missing mock response, listing the known ones', async () => {
    const { origin, warn } = await serve({
      name: 'Fleet report',
      dev: { responses: { 'GET fleets': [] } },
    });

    await fetch(`${origin}${FAKE_API_PATH}vehicles`);
    await fetch(`${origin}${FAKE_API_PATH}vehicles`);

    const warnings = warn.mock.calls.filter(([message]) => message.includes('no response for'));
    expect(warnings).toEqual([
      [expect.stringContaining('no response for "GET vehicles" (known: GET fleets)')],
    ]);
  });

  it('answers 400 to a malformed path in mock mode', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    expect(await rawGet(origin, `${FAKE_API_PATH}%E0%A4%A`)).toBe(400);
  });

  it('prints the fake back office URL on the network address when there is no local one', async () => {
    const { server, customLogger } = await serve({ name: 'Fleet report' });
    const info = vi.spyOn(customLogger, 'info');
    server.resolvedUrls = { local: [], network: ['http://192.168.1.10:5173/'] };

    server.printUrls();

    expect(info).toHaveBeenCalledWith(
      expect.stringContaining(
        'Fake back office (mock mode): http://192.168.1.10:5173/__bo-widget/',
      ),
    );
  });
});
