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
  FAKE_BO_BASENAME,
  FAKE_BO_MODULE_URL,
  FAKE_BO_PATH,
  FAKE_TOKEN_PATH,
  answerToken,
  assertLoginServerHost,
  fakeBoConfig,
  installFakeBo,
  isLocalRequest,
  isLoopbackAddress,
  isFakeBoPage,
  fakeBoModule,
  forwardedHeaders,
  isCrossSite,
  pastedTokenSource,
  resolveDevMode,
  tokenWarnings,
  widgetTag,
} from './server.js';

const jwt = (payload: object): string =>
  ['e30', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'sig'].join('.');

/** Anonymous conf of a back office, as `fe-api` serves it. */
const BO_CONF = {
  'X-API-Key': 'conf-key',
  url: { baseUrl: 'https://api.bo.example.com/boapi/proxy/' },
};

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

describe('resolveDevMode', () => {
  it('is mock by default', async () => {
    await expect(resolveDevMode(undefined, {})).resolves.toEqual({ mode: 'mock' });
  });

  it('is token when BO_WIDGET_TOKEN is set, with a trailing slash on the API URL', async () => {
    await expect(resolveDevMode(undefined, TOKEN_ENV)).resolves.toEqual({
      mode: 'token',
      env: {
        token: 'real-token',
        apiUrl: 'https://api.example.com/boapi/proxy/',
        apiKey: 'real-key',
      },
    });
  });

  it('stays mock when asked, even with a token', async () => {
    await expect(resolveDevMode('mock', TOKEN_ENV)).resolves.toEqual({ mode: 'mock' });
  });

  it('lists the missing variables in token mode', async () => {
    await expect(resolveDevMode('token', { BO_WIDGET_TOKEN: 't' })).rejects.toThrow(
      /set BO_WIDGET_API_URL, BO_WIDGET_API_KEY/,
    );
  });

  it.each([
    ['not a url', /BO_WIDGET_API_URL is not a valid URL/],
    ['ftp://api.example.com/', /BO_WIDGET_API_URL must be an http\(s\) URL, not ftp:/],
    ['https://api.example.com/boapi/proxy/?a=1', /must have no query nor hash/],
    ['https://api.example.com/boapi/proxy/#x', /must have no query nor hash/],
  ])('refuses the API URL %s', async (url, message) => {
    await expect(resolveDevMode('token', { ...TOKEN_ENV, BO_WIDGET_API_URL: url })).rejects.toThrow(
      message,
    );
  });

  it('refuses an API URL with credentials', async () => {
    await expect(
      resolveDevMode('token', { ...TOKEN_ENV, BO_WIDGET_API_URL: 'https://u:p@api.example.com/' }),
    ).rejects.toThrow(/must not contain credentials/);
  });

  it('shows the API URL it cannot parse', async () => {
    await expect(
      resolveDevMode('token', { ...TOKEN_ENV, BO_WIDGET_API_URL: '"api.example.com"' }),
    ).rejects.toThrow('BO_WIDGET_API_URL is not a valid URL: ""api.example.com""');
  });

  it('trims the API key and the URL pasted with spaces', async () => {
    await expect(
      resolveDevMode('token', {
        ...TOKEN_ENV,
        BO_WIDGET_API_KEY: ' real-key\r',
        BO_WIDGET_API_URL: ' https://api.example.com/boapi/proxy/ ',
      }),
    ).resolves.toMatchObject({
      env: { apiKey: 'real-key', apiUrl: 'https://api.example.com/boapi/proxy/' },
    });
  });

  it.each([['   '], ['Bearer'], ['Bearer   ']])('counts the token %j as missing', async (token) => {
    await expect(resolveDevMode('token', { ...TOKEN_ENV, BO_WIDGET_TOKEN: token })).rejects.toThrow(
      /set BO_WIDGET_TOKEN \(/,
    );
  });

  it('keeps the API URL in its canonical form, the prefix the proxy checks', async () => {
    const resolved = await resolveDevMode('token', {
      ...TOKEN_ENV,
      BO_WIDGET_API_URL: 'https://API.Example.com:443/boapi/proxy',
    });

    expect(resolved).toMatchObject({ env: { apiUrl: 'https://api.example.com/boapi/proxy/' } });
  });

  it('removes a Bearer prefix and spaces pasted with the token', async () => {
    const resolved = await resolveDevMode('token', {
      ...TOKEN_ENV,
      BO_WIDGET_TOKEN: ' Bearer abc.def.ghi \n',
    });

    expect(resolved).toMatchObject({ env: { token: 'abc.def.ghi' } });
  });

  it('refuses an unknown mode', async () => {
    await expect(resolveDevMode('proxy' as 'token', {})).rejects.toThrow(
      /unknown dev\.mode "proxy"/,
    );
  });

  describe('with BO_WIDGET_HOST', () => {
    const HOST = 'bo.example.com';
    const confFetch = (conf: unknown = BO_CONF) =>
      vi.fn<typeof fetch>(() => Promise.resolve(Response.json(conf)));

    it('reads the API URL and key from the conf of the host', async () => {
      const fetchConf = confFetch();
      const warn = vi.fn();

      const resolved = await resolveDevMode(
        undefined,
        { BO_WIDGET_TOKEN: 'real-token', BO_WIDGET_HOST: ` ${HOST} ` },
        { fetch: fetchConf, warn },
      );

      expect(resolved).toEqual({
        mode: 'token',
        env: {
          token: 'real-token',
          apiUrl: 'https://api.bo.example.com/boapi/proxy/',
          apiKey: 'conf-key',
          host: HOST,
        },
      });
      expect(fetchConf).toHaveBeenCalledWith(
        `https://${HOST}/fe-api/anonymous/bo/${HOST}/conf`,
        expect.anything(),
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('takes precedence over BO_WIDGET_API_URL and BO_WIDGET_API_KEY, with a warning', async () => {
      const warn = vi.fn();

      const resolved = await resolveDevMode(
        undefined,
        { ...TOKEN_ENV, BO_WIDGET_HOST: HOST },
        { fetch: confFetch(), warn },
      );

      expect(resolved).toMatchObject({
        env: { apiUrl: 'https://api.bo.example.com/boapi/proxy/', apiKey: 'conf-key' },
      });
      expect(warn).toHaveBeenCalledOnce();
      const [message] = warn.mock.calls[0] as [string];
      expect(message).toMatch(/BO_WIDGET_API_URL and BO_WIDGET_API_KEY ignored/);
      expect(message).toContain(HOST);
      for (const value of ['conf-key', 'real-key', 'api.example.com', 'api.bo.example.com']) {
        expect(message).not.toContain(value);
      }
    });

    it('warns about the one variable also set', async () => {
      const warn = vi.fn();

      await resolveDevMode(
        undefined,
        { BO_WIDGET_TOKEN: 't', BO_WIDGET_API_KEY: 'real-key', BO_WIDGET_HOST: HOST },
        { fetch: confFetch(), warn },
      );

      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/^\[bo-widget\] BO_WIDGET_API_KEY ignored/),
      );
    });

    it('does not warn about blank BO_WIDGET_API_URL and BO_WIDGET_API_KEY', async () => {
      const warn = vi.fn();

      await resolveDevMode(
        undefined,
        {
          BO_WIDGET_TOKEN: 't',
          BO_WIDGET_API_URL: '  ',
          BO_WIDGET_API_KEY: '',
          BO_WIDGET_HOST: HOST,
        },
        { fetch: confFetch(), warn },
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('stays mock when asked, with the host and without reading the conf', async () => {
      const fetchConf = confFetch();

      await expect(
        resolveDevMode('mock', { ...TOKEN_ENV, BO_WIDGET_HOST: HOST }, { fetch: fetchConf }),
      ).resolves.toEqual({ mode: 'mock', host: HOST });
      expect(fetchConf).not.toHaveBeenCalled();
    });

    it('stays mock offline, keeping the host, with a warning when token mode was asked for', async () => {
      const fetchConf = confFetch();
      const warn = vi.fn();

      await expect(
        resolveDevMode(
          undefined,
          { BO_WIDGET_TOKEN: 't', BO_WIDGET_HOST: HOST },
          { fetch: fetchConf, warn, offline: true },
        ),
      ).resolves.toEqual({ mode: 'mock', host: HOST });
      expect(fetchConf).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Test mode: .* stays in mock mode/));
    });

    it('still checks the mode and the host offline, without a warning in mock mode', async () => {
      const warn = vi.fn();

      await expect(resolveDevMode('proxy' as 'token', {}, { offline: true })).rejects.toThrow(
        /unknown dev\.mode "proxy"/,
      );
      await expect(
        resolveDevMode(undefined, { BO_WIDGET_HOST: 'bo.example.com/x' }, { offline: true }),
      ).rejects.toThrow(/BO_WIDGET_HOST must be the host/);
      await expect(resolveDevMode(undefined, {}, { warn, offline: true })).resolves.toEqual({
        mode: 'mock',
      });
      expect(warn).not.toHaveBeenCalled();
    });

    it('still needs a token in token mode, without reading the conf', async () => {
      const fetchConf = confFetch();

      await expect(
        resolveDevMode('token', { BO_WIDGET_HOST: HOST }, { fetch: fetchConf }),
      ).rejects.toThrow(/set BO_WIDGET_TOKEN/);
      expect(fetchConf).not.toHaveBeenCalled();
    });

    it('only sets the host in mock mode, without reading the conf', async () => {
      const fetchConf = confFetch();

      await expect(
        resolveDevMode(undefined, { BO_WIDGET_HOST: HOST }, { fetch: fetchConf }),
      ).resolves.toEqual({ mode: 'mock', host: HOST });
      expect(fetchConf).not.toHaveBeenCalled();
    });

    it('refuses an invalid host, even in mock mode', async () => {
      await expect(
        resolveDevMode(undefined, { BO_WIDGET_HOST: 'https://bo.example.com/' }),
      ).rejects.toThrow(/BO_WIDGET_HOST must be the host of a back office/);
    });

    it('fails with the error of the conf', async () => {
      await expect(
        resolveDevMode(
          undefined,
          { BO_WIDGET_TOKEN: 't', BO_WIDGET_HOST: HOST },
          { fetch: confFetch({ url: {} }) },
        ),
      ).rejects.toThrow(`the conf of the back office ${HOST} has no url.baseUrl`);
    });

    describe('in login mode', () => {
      it('reads the API URL and key from the conf, without any token', async () => {
        const fetchConf = confFetch();
        const warn = vi.fn();

        await expect(
          resolveDevMode(
            undefined,
            { BO_WIDGET_LOGIN: '1', BO_WIDGET_HOST: HOST },
            { fetch: fetchConf, warn },
          ),
        ).resolves.toEqual({
          mode: 'login',
          env: {
            apiUrl: 'https://api.bo.example.com/boapi/proxy/',
            apiKey: 'conf-key',
            host: HOST,
          },
        });
        expect(warn).not.toHaveBeenCalled();
      });

      it('wins over dev.mode, BO_WIDGET_TOKEN and the API variables, with warnings', async () => {
        const warn = vi.fn();

        const resolved = await resolveDevMode(
          'mock',
          { ...TOKEN_ENV, BO_WIDGET_LOGIN: ' TRUE ', BO_WIDGET_HOST: HOST },
          { fetch: confFetch(), warn },
        );

        expect(resolved.mode).toBe('login');
        const warnings = warn.mock.calls.map((call) => String(call[0])).join('\n');
        expect(warnings).toContain('dev.mode "mock" ignored: bo-widget dev --login is used');
        expect(warnings).toContain('BO_WIDGET_TOKEN ignored: in login mode');
        expect(warnings).toContain('BO_WIDGET_API_URL and BO_WIDGET_API_KEY ignored');
        expect(warnings).not.toContain('real-token');
      });

      it.each([[''], ['0'], ['no']])('is not asked for by BO_WIDGET_LOGIN=%j', async (value) => {
        await expect(resolveDevMode(undefined, { BO_WIDGET_LOGIN: value })).resolves.toEqual({
          mode: 'mock',
        });
      });

      it('needs BO_WIDGET_HOST', async () => {
        await expect(resolveDevMode(undefined, { BO_WIDGET_LOGIN: '1' })).rejects.toThrow(
          /login mode: set BO_WIDGET_HOST/,
        );
      });

      it('fails with the error of the conf', async () => {
        await expect(
          resolveDevMode(
            undefined,
            { BO_WIDGET_LOGIN: '1', BO_WIDGET_HOST: HOST },
            { fetch: confFetch({ url: {} }) },
          ),
        ).rejects.toThrow(`the conf of the back office ${HOST} has no url.baseUrl`);
      });

      it('stays mock offline, with a warning, without reading the conf', async () => {
        const fetchConf = confFetch();
        const warn = vi.fn();

        await expect(
          resolveDevMode(
            undefined,
            { BO_WIDGET_LOGIN: '1', BO_WIDGET_HOST: HOST },
            { fetch: fetchConf, warn, offline: true },
          ),
        ).resolves.toEqual({ mode: 'mock', host: HOST });
        expect(fetchConf).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('without login mode'));
      });
    });
  });
});

describe('assertLoginServerHost', () => {
  it.each([[undefined], [false], ['localhost'], ['127.0.0.1'], ['::1']])(
    'accepts the local host %j',
    (host) => {
      expect(() => assertLoginServerHost(host)).not.toThrow();
    },
  );

  it.each([[true], ['0.0.0.0'], ['192.168.1.2']])('refuses the exposed host %j', (host) => {
    expect(() => assertLoginServerHost(host)).toThrow(/login mode: remove server.host/);
  });
});

describe('pastedTokenSource', () => {
  it('gives the pasted token until its expiry', async () => {
    let now = 1_000_000;
    const source = pastedTokenSource(jwt({ exp: 2_000 }), () => now);

    expect(await source.token()).toBe(jwt({ exp: 2_000 }));
    now = 2_000_000;
    expect(await source.token()).toBeNull();
    expect(source.noTokenReason()).toBe(
      'the dev token expired, paste a new one in BO_WIDGET_TOKEN and restart vite',
    );
  });

  it('keeps a token without a readable expiry, which the API judges', async () => {
    const source = pastedTokenSource('opaque', () => Number.MAX_SAFE_INTEGER);

    expect(await source.token()).toBe('opaque');
    expect(source.noTokenReason()).toBe('no dev token');
  });
});

describe('installFakeBo', () => {
  it('refuses login mode without a session, as an untyped caller could ask', () => {
    const server = { config: { logger: createLogger('silent'), server: {} } } as ViteDevServer;
    const options = {
      runtime: 'webcomponent',
      responses: {},
      resolved: {
        mode: 'login',
        env: { apiUrl: 'https://api.example.com/', apiKey: 'k', host: 'bo.example.com' },
      },
    } as unknown as Parameters<typeof installFakeBo>[1];

    expect(() => installFakeBo(server, options)).toThrow('login mode: no session to follow');
  });
});

describe('isLocalRequest', () => {
  it.each([['localhost:5173'], ['127.0.0.1:5173'], ['[::1]:5173'], ['localhost']])(
    'accepts the Host %s',
    (host) => {
      expect(isLocalRequest({ headers: { host } })).toBe(true);
    },
  );

  it('reads :authority over HTTP/2', () => {
    expect(isLocalRequest({ headers: { ':authority': 'localhost:5173' } })).toBe(true);
  });

  it.each([
    ['a rebound domain', 'attacker.example:5173'],
    ['a LAN address', '192.168.1.2:5173'],
    ['a look-alike', 'localhost.attacker.example'],
    ['a malformed host', 'local host'],
  ])('refuses %s', (_label, host) => {
    expect(isLocalRequest({ headers: { host } })).toBe(false);
  });

  it('refuses a request without Host', () => {
    expect(isLocalRequest({ headers: {} })).toBe(false);
  });
});

describe('isLoopbackAddress', () => {
  it.each([['127.0.0.1'], ['127.1.2.3'], ['::1'], ['::ffff:127.0.0.1'], ['::FFFF:127.0.0.1']])(
    'accepts %s',
    (address) => {
      expect(isLoopbackAddress(address)).toBe(true);
    },
  );

  it.each([
    ['a LAN address', '192.168.1.20'],
    ['a mapped LAN address', '::ffff:192.168.1.20'],
    ['an IPv6 address', 'fe80::1'],
    ['a look-alike', '127.0.0.1.example'],
    ['no address', undefined],
    ['an empty address', ''],
  ])('refuses %s', (_label, address) => {
    expect(isLoopbackAddress(address)).toBe(false);
  });
});

describe('answerToken', () => {
  /** A request of the fake back office page for the token, from `remoteAddress`. */
  const request = (remoteAddress: string | undefined, host = 'localhost:5173') =>
    ({
      method: 'GET',
      headers: { host, 'sec-fetch-site': 'same-origin' },
      socket: { remoteAddress },
    }) as unknown as IncomingMessage;

  /** Records the status, headers and JSON body sent. */
  const response = () => {
    const sent = { status: 0, headers: {} as Record<string, unknown>, body: undefined as unknown };
    const res = {
      set statusCode(status: number) {
        sent.status = status;
      },
      setHeader: (name: string, value: unknown) => {
        sent.headers[name.toLowerCase()] = value;
      },
      end: (body: string) => {
        sent.body = JSON.parse(body);
      },
    } as unknown as ServerResponse;
    return { res, sent };
  };

  const session = { token: () => Promise.resolve('real-token'), noTokenReason: () => 'none' };

  it('answers the token to a page of this machine', async () => {
    const { res, sent } = response();

    await answerToken(request('127.0.0.1'), res, session);

    expect(sent.status).toBe(200);
    expect(sent.headers['cache-control']).toBe('no-store');
    expect(sent.body).toEqual({ accessToken: 'real-token', expiresAt: null });
  });

  it('refuses a client of the network that sends Host: localhost (server.host set)', async () => {
    const { res, sent } = response();
    const token = vi.fn(session.token);

    await answerToken(request('192.168.1.20'), res, { ...session, token });

    expect(sent.status).toBe(403);
    expect(sent.body).toMatchObject({ error: 'not-local' });
    expect(token).not.toHaveBeenCalled();
  });

  it('refuses another host than localhost, even from this machine (DNS rebinding)', async () => {
    const { res, sent } = response();

    await answerToken(request('127.0.0.1', 'attacker.example:5173'), res, session);

    expect(sent.status).toBe(403);
    expect(sent.body).toMatchObject({ error: 'not-local' });
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

  it('adds no Authorization without a token (login mode without a session)', () => {
    expect(forwardedHeaders({ accept: '*/*' }, null).has('authorization')).toBe(false);
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
      context: { fleetId: 'DEV-FLEET', locale: 'en_GB', basename: FAKE_BO_BASENAME },
      user: { currentFleetId: 'DEV-FLEET', fleets: [{ fleetId: 'DEV-FLEET', profile: 'manager' }] },
      settings: { currency: 'CAD' },
      apiPath: FAKE_API_PATH,
      apiKey: 'mock-api-key',
      auth: { kind: 'mock' },
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

  it('gives BO_WIDGET_HOST as the host of the context, in both modes', () => {
    const env = {
      token: 't',
      apiUrl: 'https://api.example.com/',
      apiKey: 'k',
      host: 'bo.example.com',
    };

    expect(fakeBoConfig(manifest, {}, { mode: 'mock', host: 'bo.example.com' }).context.host).toBe(
      'bo.example.com',
    );
    expect(fakeBoConfig(manifest, {}, { mode: 'token', env }).context.host).toBe('bo.example.com');
    expect(fakeBoConfig(manifest, {}, { mode: 'mock' }).context.host).toBe('localhost');
  });

  it('keeps dev.context.host over BO_WIDGET_HOST', () => {
    expect(
      fakeBoConfig(
        manifest,
        { context: { host: 'other.example.com' } },
        {
          mode: 'mock',
          host: 'bo.example.com',
        },
      ).context.host,
    ).toBe('other.example.com');
  });

  it('has no fleet in the user when the context has none', () => {
    expect(
      fakeBoConfig(manifest, { context: { fleetId: null } }, { mode: 'mock' }).user.fleets,
    ).toEqual([]);
  });

  it('passes the real token and API key in token mode, the token staying on the server', async () => {
    const token = jwt({ exp: 2_000_000_000 });
    const config = fakeBoConfig(
      manifest,
      {},
      await resolveDevMode(undefined, { ...TOKEN_ENV, BO_WIDGET_TOKEN: token }),
    );

    expect(config).toMatchObject({
      mode: 'token',
      apiKey: 'real-key',
      auth: { kind: 'server', tokenPath: FAKE_TOKEN_PATH },
    });
    // The module of the page is readable by any page of localhost: the token stays on the server.
    expect(JSON.stringify(config)).not.toContain(token);
    expect(fakeBoModule('/host.js', config, '/src/main.ts')).not.toContain(token);
  });

  it('passes no token in login mode, only the path to read the latest one from', () => {
    const config = fakeBoConfig(
      manifest,
      {},
      {
        mode: 'login',
        env: { apiUrl: 'https://api.example.com/', apiKey: 'conf-key', host: 'bo.example.com' },
      },
    );

    expect(config).toMatchObject({
      mode: 'login',
      auth: { kind: 'server', tokenPath: FAKE_TOKEN_PATH },
      apiKey: 'conf-key',
      context: { host: 'bo.example.com' },
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
    vi.unstubAllGlobals();
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

  const serve = async (config: WidgetConfig, files?: Record<string, string>, mode?: string) => {
    const root = await project(files);
    const customLogger = createLogger('silent');
    const warn = vi.spyOn(customLogger, 'warn');
    const error = vi.spyOn(customLogger, 'error');
    const server: ViteDevServer = await createServer({
      root,
      configFile: false,
      ...(mode ? { mode } : {}),
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

  it('serves the fake back office page on a sub-route, which a widget router reloads', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_BO_PATH}stations/1?week=2`, {
      headers: { accept: 'text/html,application/xhtml+xml' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/text\/html/);
    expect(await response.text()).toContain(`src="${FAKE_BO_MODULE_URL}"`);
  });

  it('leaves a sub-route that is not a page request to Vite', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_BO_PATH}stations/1`, {
      headers: { accept: 'application/json' },
    });

    expect(response.status).toBe(404);
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

  it('keeps the pasted token out of the page module, and gives it to the local pages only', async () => {
    const token = jwt({ exp: 2_000_000_000 });
    vi.stubEnv('BO_WIDGET_TOKEN', token);
    vi.stubEnv('BO_WIDGET_API_URL', 'https://api.example.com/');
    vi.stubEnv('BO_WIDGET_API_KEY', 'real-key');
    const { origin } = await serve({ name: 'Fleet report' });
    // Vite answers the modules to any page of localhost (its default CORS): never the token.
    const module = await fetch(`${origin}${FAKE_BO_MODULE_URL}`, {
      headers: { Origin: 'http://localhost:9999' },
    });
    expect(await module.text()).not.toContain(token);

    const answer = await fetch(`${origin}${FAKE_TOKEN_PATH}`, {
      headers: { 'Sec-Fetch-Site': 'same-origin' },
    });
    expect(answer.status).toBe(200);
    expect(answer.headers.get('cache-control')).toBe('no-store');
    expect(await answer.json()).toEqual({ accessToken: token, expiresAt: 2_000_000_000_000 });

    const otherPort = await fetch(`${origin}${FAKE_TOKEN_PATH}`, {
      headers: { Origin: 'http://localhost:9999' },
    });
    expect(otherPort.status).toBe(403);
    expect(await otherPort.text()).not.toContain(token);
    expect(
      (await fetch(`${origin}${FAKE_TOKEN_PATH}`, { headers: { 'Sec-Fetch-Site': 'same-site' } }))
        .status,
    ).toBe(403);
    expect((await fetch(`${origin}${FAKE_TOKEN_PATH}`, { method: 'POST' })).status).toBe(405);
  });

  it('answers 401 no-token once the pasted token has expired', async () => {
    vi.stubEnv('BO_WIDGET_TOKEN', jwt({ exp: 1_000 }));
    vi.stubEnv('BO_WIDGET_API_URL', 'https://api.example.com/');
    vi.stubEnv('BO_WIDGET_API_KEY', 'real-key');
    const { origin } = await serve({ name: 'Fleet report' });

    const answer = await fetch(`${origin}${FAKE_TOKEN_PATH}`);

    expect(answer.status).toBe(401);
    expect(await answer.json()).toEqual({
      error: 'no-token',
      message:
        'No token: the dev token expired, paste a new one in BO_WIDGET_TOKEN and restart vite.',
    });
  });

  it('serves no token route in mock mode: the path is left to Vite', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    const answer = await fetch(`${origin}${FAKE_TOKEN_PATH}`, {
      headers: { Accept: 'application/json', 'Sec-Fetch-Site': 'same-origin' },
    });
    const body = await answer.text();

    expect(answer.headers.get('content-type') ?? '').not.toContain('application/json');
    expect(answer.headers.get('cache-control')).not.toBe('no-store');
    expect(body).not.toMatch(/accessToken|no-token|cross-site|not-local/);
  });

  it('lets only the pages of the dev server frame the fake back office and the widget page', async () => {
    const { origin } = await serve({ name: 'Fleet report', runtime: 'iframe' });
    const page = (path: string) => fetch(`${origin}${path}`, { headers: { Accept: 'text/html' } });

    expect((await page('/__bo-widget/')).headers.get('content-security-policy')).toBe(
      "frame-ancestors 'self'",
    );
    expect((await page('/')).headers.get('content-security-policy')).toBe("frame-ancestors 'self'");
    expect((await page('/reports/2')).headers.get('content-security-policy')).toBe(
      "frame-ancestors 'self'",
    );
    // Modules and the local API are not pages.
    expect(
      (await fetch(`${origin}${FAKE_BO_MODULE_URL}`)).headers.get('content-security-policy'),
    ).toBeNull();
  });

  it('leaves the widget page of a Web Component without frame-ancestors (it redirects)', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    const answer = await fetch(`${origin}/`, {
      headers: { Accept: 'text/html' },
      redirect: 'manual',
    });

    expect(answer.status).toBe(302);
    expect(answer.headers.get('content-security-policy')).toBeNull();
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

  describe('with BO_WIDGET_HOST', () => {
    const HOST = 'bo.example.com';
    const API = 'https://api.bo.example.com/boapi/proxy/';

    /**
     * Stands for the network outside the test: the conf of the back office and its API. The calls
     * to the dev server itself go through the real `fetch`.
     */
    const stubNetwork = (
      conf: () => Promise<Response> = () => Promise.resolve(Response.json(BO_CONF)),
      api: () => Promise<Response> = () => Promise.resolve(Response.json({ vehicles: 3 })),
    ) => {
      const realFetch = globalThis.fetch;
      const calls: { url: string; headers: Headers }[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn((input: string | URL | Request, init?: RequestInit) => {
          const url = input instanceof Request ? input.url : String(input);
          if (url.startsWith(`https://${HOST}/`)) return conf();
          if (url.startsWith(API)) {
            calls.push({ url, headers: new Headers(init?.headers) });
            return api();
          }
          return realFetch(input, init);
        }),
      );
      vi.stubEnv('BO_WIDGET_HOST', HOST);
      vi.stubEnv('BO_WIDGET_TOKEN', 'real-token');
      return calls;
    };

    const logged = (...spies: { mock: { calls: unknown[][] } }[]): string =>
      spies.flatMap((spy) => spy.mock.calls.map((call) => String(call[0]))).join('\n');

    it('forwards the calls to the API of the conf, with the host in the context', async () => {
      const calls = stubNetwork();
      vi.stubEnv('BO_WIDGET_API_URL', 'https://other.example.com/boapi/proxy/');
      vi.stubEnv('BO_WIDGET_API_KEY', 'env-key');
      const { server, origin, customLogger, warn, error } = await serve({ name: 'Fleet report' });
      const info = vi.spyOn(customLogger, 'info');
      server.printUrls();

      const response = await fetch(`${origin}${FAKE_API_PATH}fleetmanager/public/fleets/F1`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ vehicles: 3 });
      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toBe(`${API}fleetmanager/public/fleets/F1`);
      expect(calls[0]?.headers.get('authorization')).toBe('Bearer real-token');
      const module = await (await fetch(`${origin}${FAKE_BO_MODULE_URL}`)).text();
      expect(module).toContain('"mode":"token"');
      expect(module).toContain(`"host":"${HOST}"`);
      expect(module).toContain('"apiKey":"conf-key"');
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('BO_WIDGET_API_URL and BO_WIDGET_API_KEY ignored'),
      );
      expect(info).toHaveBeenCalledWith(expect.stringContaining(`token mode, API of ${HOST}`));
      const logs = logged(warn, error, info);
      expect(logs).not.toContain('conf-key');
      expect(logs).not.toContain('api.bo.example.com');
    });

    it('names the host, not the API origin, when the API cannot be reached', async () => {
      stubNetwork(undefined, () =>
        Promise.reject(new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } })),
      );
      const { origin, error } = await serve({ name: 'Fleet report' });

      const response = await fetch(`${origin}${FAKE_API_PATH}x`);

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({
        error: 'proxy-failed',
        message: `Cannot reach the API of ${HOST}: ENOTFOUND`,
      });
      expect(error).toHaveBeenCalledWith(
        expect.stringContaining(
          `cannot reach the API of ${HOST} (ENOTFOUND). Check BO_WIDGET_HOST`,
        ),
      );
      expect(logged(error)).not.toContain('api.bo.example.com');
    });

    it('gives only the error code when the API fails, never a message that may name its origin', async () => {
      stubNetwork(undefined, () =>
        Promise.reject(new TypeError(`fetch failed: ${API}`, { cause: { message: `bad ${API}` } })),
      );
      const { origin, error } = await serve({ name: 'Fleet report' });

      const response = await fetch(`${origin}${FAKE_API_PATH}x`);

      expect(await response.json()).toEqual({
        error: 'proxy-failed',
        message: `Cannot reach the API of ${HOST}: TypeError`,
      });
      expect(logged(error)).not.toContain('api.bo.example.com');
    });

    it('names the host, not the API URL, for a path outside the API', async () => {
      const calls = stubNetwork();
      const { origin, warn } = await serve({ name: 'Fleet report' });

      const response = await fetch(`${origin}${FAKE_API_PATH}/admin`);

      expect(response.status).toBe(400);
      expect(calls).toEqual([]);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(`/admin is outside the API of ${HOST}: not forwarded`),
      );
      expect(logged(warn)).not.toContain('api.bo.example.com');
    });

    it('stays in mock mode in the test mode of Vitest, without reading the conf', async () => {
      stubNetwork(() => Promise.reject(new Error('the conf must not be read')));

      const { origin, warn } = await serve({ name: 'Fleet report' }, undefined, 'test');

      const module = await (await fetch(`${origin}${FAKE_BO_MODULE_URL}`)).text();
      expect(module).toContain('"mode":"mock"');
      expect(module).toContain(`"host":"${HOST}"`);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('stays in mock mode'));
      const urls = vi.mocked(globalThis.fetch).mock.calls.map(([input]) => String(input));
      expect(urls.filter((url) => url.includes(HOST))).toEqual([]);
    });

    it.each([
      [
        'answers 404',
        () => Promise.resolve(new Response('Not found', { status: 404 })),
        /answered 404/,
      ],
      [
        'cannot be reached',
        () => Promise.reject(new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } })),
        /cannot be reached \(ENOTFOUND\)/,
      ],
      ['is not JSON', () => Promise.resolve(new Response('<html>')), /is not valid JSON/],
      [
        'has no API key',
        () => Promise.resolve(Response.json({ url: BO_CONF.url })),
        /has no X-API-Key/,
      ],
    ])('fails to start when the conf %s', async (_label, conf, message) => {
      stubNetwork(conf);

      const failure = serve({ name: 'Fleet report' });

      await expect(failure).rejects.toThrow(message);
      await expect(failure).rejects.toThrow(`the conf of the back office ${HOST}`);
    });
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

  it.each<[string, true | string[] | undefined, boolean]>([
    ['allowedHosts: true', true, true],
    ['an allowedHosts list', ['dev.example.com'], false],
    ['the default allowedHosts', undefined, false],
  ])('warns about DNS rebinding in token mode with %s', async (_label, allowedHosts, warns) => {
    const api = await upstream();
    stubTokenEnv(api.url, jwt({ exp: 4_000_000_000 }));
    const root = await project();
    const customLogger = createLogger('silent');
    const warn = vi.spyOn(customLogger, 'warn');
    const server = await createServer({
      root,
      configFile: false,
      customLogger,
      server: { ...(allowedHosts !== undefined && { allowedHosts }), ws: false },
      plugins: [boWidget({ name: 'Fleet report' })],
    });
    servers.push(server);

    expect(warn.mock.calls.some(([message]) => message.includes('DNS rebinding'))).toBe(warns);
  });

  it('does not warn about DNS rebinding in mock mode', async () => {
    const root = await project();
    const customLogger = createLogger('silent');
    const warn = vi.spyOn(customLogger, 'warn');
    const server = await createServer({
      root,
      configFile: false,
      customLogger,
      server: { allowedHosts: true, ws: false },
      plugins: [boWidget({ name: 'Fleet report' })],
    });
    servers.push(server);

    expect(warn).not.toHaveBeenCalled();
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

  it('warns about a dev basename outside the fake back office page, but not about one under it', async () => {
    const outside = await serve({
      name: 'Fleet report',
      dev: { context: { basename: '/widgets/fleet-report' } },
    });
    const under = await serve({
      name: 'Fleet report',
      dev: { context: { basename: `${FAKE_BO_BASENAME}/report` } },
    });

    expect(outside.warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /dev\.context\.basename \/widgets\/fleet-report is outside \/__bo-widget/,
      ),
    );
    expect(under.warn).not.toHaveBeenCalled();
  });

  it('answers the local API, not the page, to a browser tab that asks for HTML', async () => {
    const { origin } = await serve({ name: 'Fleet report' });

    const response = await fetch(`${origin}${FAKE_API_PATH}fleets`, {
      headers: { accept: 'text/html' },
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: 'mock-not-found' });
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

describe('isFakeBoPage', () => {
  const page = { method: 'GET', headers: { accept: 'text/html' } };

  it('accepts the page path, with or without its slash, whatever the request', () => {
    expect(isFakeBoPage({ method: 'POST', headers: {} }, FAKE_BO_PATH)).toBe(true);
    expect(isFakeBoPage({ method: 'GET', headers: {} }, FAKE_BO_BASENAME)).toBe(true);
  });

  it('accepts a page request of a sub-route', () => {
    expect(isFakeBoPage(page, `${FAKE_BO_PATH}stations/1`)).toBe(true);
    expect(isFakeBoPage({ ...page, method: 'HEAD' }, `${FAKE_BO_PATH}stations/1`)).toBe(true);
  });

  it('refuses the module, the local API, another method or a request without HTML', () => {
    expect(isFakeBoPage(page, FAKE_BO_MODULE_URL)).toBe(false);
    expect(isFakeBoPage(page, `${FAKE_API_PATH}fleets`)).toBe(false);
    expect(isFakeBoPage({ ...page, method: 'POST' }, `${FAKE_BO_PATH}stations/1`)).toBe(false);
    expect(isFakeBoPage({ method: 'GET', headers: {} }, `${FAKE_BO_PATH}stations/1`)).toBe(false);
    expect(isFakeBoPage(page, '/__bo-widget-other/x')).toBe(false);
    expect(isFakeBoPage(page, '/src/main.ts')).toBe(false);
  });
});
