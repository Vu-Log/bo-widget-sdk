import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOKEN_REFRESH_MARGIN_MS, createAuthFetch } from './authFetch.js';
import { BoError } from './errors.js';
import type { BoAccessToken, BoMode } from './types.js';

const BASE_URL = 'https://api.example.com/boapi/proxy/';
const NOW = Date.UTC(2026, 10, 3, 12);

const source = (mode: BoMode, tokens: BoAccessToken[] = []) => {
  let issued = 0;
  return {
    mode,
    getApiInfo: vi.fn(async () => ({ baseUrl: BASE_URL, apiKey: 'api-key' })),
    getAccessToken: vi.fn(async () => {
      const token = tokens[Math.min(issued, tokens.length - 1)];
      issued += 1;
      if (!token) throw new BoError('INTERNAL', 'no token', { reason: 'no-token' });
      return token;
    }),
  };
};

const token = (name: string, expiresInMs: number | null = 3_600_000): BoAccessToken => ({
  accessToken: name,
  expiresAt: expiresInMs === null ? null : NOW + expiresInMs,
});

const fetchMock = vi.fn<typeof fetch>();
const lastCall = (index = -1) => {
  const call = fetchMock.mock.calls.at(index);
  const headers = new Headers(call?.[1]?.headers);
  return {
    url: call?.[0],
    apiKey: headers.get('X-API-Key'),
    authorization: headers.get('Authorization'),
    init: call?.[1],
  };
};

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response('ok'));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('authFetch as a Web Component', () => {
  it('prefixes a Vulog API path with baseUrl and adds only X-API-Key', async () => {
    const src = source('webcomponent');
    await createAuthFetch(src)('api/v1/fleets/F1/vehicles?page=2');
    expect(lastCall()).toMatchObject({
      url: `${BASE_URL}api/v1/fleets/F1/vehicles?page=2`,
      apiKey: 'api-key',
      authorization: null,
    });
    expect(src.getAccessToken).not.toHaveBeenCalled();
  });

  it('reads a leading slash as relative to baseUrl', async () => {
    await createAuthFetch(source('webcomponent'))('/api/v1/me');
    expect(lastCall().url).toBe(`${BASE_URL}api/v1/me`);
  });

  it('accepts an absolute URL under baseUrl as a Vulog API', async () => {
    await createAuthFetch(source('webcomponent'))(new URL(`${BASE_URL}api/v1/me`));
    expect(lastCall()).toMatchObject({ url: `${BASE_URL}api/v1/me`, apiKey: 'api-key' });
  });

  it('does not retry a 401 on a Vulog API: the service worker owns the token', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }));
    const response = await createAuthFetch(source('webcomponent'))('api/v1/me');
    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the caller init and headers', async () => {
    await createAuthFetch(source('webcomponent'))('api/v1/vehicles', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });
    const { init } = lastCall();
    expect(init).toMatchObject({ method: 'POST', body: '{}' });
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
  });

  it('sends a token, never the API key, to a third-party API', async () => {
    const src = source('webcomponent', [token('t1')]);
    await createAuthFetch(src)('https://middleware.example.org/bookings');
    expect(lastCall()).toMatchObject({
      url: 'https://middleware.example.org/bookings',
      apiKey: null,
      authorization: 'Bearer t1',
    });
  });

  it('refuses a path that leaves baseUrl', async () => {
    await expect(createAuthFetch(source('webcomponent'))('../../admin')).rejects.toThrow(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for the API info once', async () => {
    const src = source('webcomponent');
    const authFetch = createAuthFetch(src);
    await Promise.all([authFetch('a'), authFetch('b')]);
    await authFetch('c');
    expect(src.getApiInfo).toHaveBeenCalledTimes(1);
  });

  it('asks for the API info again after a failure', async () => {
    const src = source('webcomponent');
    src.getApiInfo.mockRejectedValueOnce(new BoError('INTERNAL', 'down'));
    const authFetch = createAuthFetch(src);
    await expect(authFetch('a')).rejects.toMatchObject({ code: 'INTERNAL' });
    await expect(authFetch('a')).resolves.toBeInstanceOf(Response);
    expect(src.getApiInfo).toHaveBeenCalledTimes(2);
  });
});

describe('authFetch in an iframe', () => {
  it('adds X-API-Key and the Bearer token to a Vulog API call', async () => {
    await createAuthFetch(source('iframe', [token('t1')]))('api/v1/me');
    expect(lastCall()).toMatchObject({
      url: `${BASE_URL}api/v1/me`,
      apiKey: 'api-key',
      authorization: 'Bearer t1',
    });
  });

  it('retries a 401 once with a new token', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('ok'));
    const src = source('iframe', [token('old'), token('new')]);
    const response = await createAuthFetch(src)('api/v1/me');
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(lastCall(0).authorization).toBe('Bearer old');
    expect(lastCall(1).authorization).toBe('Bearer new');
  });

  it('returns the second 401 instead of retrying again', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }));
    const response = await createAuthFetch(source('iframe', [token('a'), token('b')]))('x');
    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the token in cache until a minute before it expires', async () => {
    const src = source('iframe', [token('t1', 10 * 60_000), token('t2')]);
    const authFetch = createAuthFetch(src);
    await authFetch('a');
    vi.setSystemTime(NOW + 10 * 60_000 - TOKEN_REFRESH_MARGIN_MS - 1);
    await authFetch('b');
    expect(lastCall().authorization).toBe('Bearer t1');
    vi.setSystemTime(NOW + 10 * 60_000 - TOKEN_REFRESH_MARGIN_MS);
    await authFetch('c');
    expect(lastCall().authorization).toBe('Bearer t2');
    expect(src.getAccessToken).toHaveBeenCalledTimes(2);
  });

  it('asks for the token once for concurrent calls', async () => {
    const src = source('iframe', [token('t1')]);
    const authFetch = createAuthFetch(src);
    await Promise.all([authFetch('a'), authFetch('b'), authFetch('c')]);
    expect(src.getAccessToken).toHaveBeenCalledTimes(1);
  });

  it('does not keep a token whose expiry is unknown', async () => {
    const src = source('iframe', [token('t1', null), token('t2', null)]);
    const authFetch = createAuthFetch(src);
    await authFetch('a');
    await authFetch('b');
    expect(src.getAccessToken).toHaveBeenCalledTimes(2);
    expect(lastCall().authorization).toBe('Bearer t2');
  });

  it('rejects with the no-token error of the back office, without calling the API', async () => {
    const error = await createAuthFetch(source('iframe', []))('api/v1/me').catch((e: unknown) => e);
    expect(error).toMatchObject({ code: 'INTERNAL', reason: 'no-token' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for a new token after a failed one', async () => {
    const src = source('iframe', [token('t1')]);
    src.getAccessToken.mockRejectedValueOnce(new BoError('INTERNAL', 'x', { reason: 'no-token' }));
    const authFetch = createAuthFetch(src);
    await expect(authFetch('a')).rejects.toBeInstanceOf(BoError);
    await authFetch('a');
    expect(lastCall().authorization).toBe('Bearer t1');
  });

  it('treats every absolute URL as third-party without the apiInfo permission, and asks once', async () => {
    const src = source('iframe', [token('t1')]);
    src.getApiInfo.mockRejectedValue(new BoError('FORBIDDEN', 'apiInfo required'));
    const authFetch = createAuthFetch(src);
    await authFetch(`${BASE_URL}api/v1/me`);
    await authFetch('https://middleware.example.org/x');
    expect(lastCall(0)).toMatchObject({ apiKey: null, authorization: 'Bearer t1' });
    expect(src.getApiInfo).toHaveBeenCalledTimes(1);
  });

  it('rejects a relative path without the apiInfo permission', async () => {
    const src = source('iframe', [token('t1')]);
    src.getApiInfo.mockRejectedValue(new BoError('FORBIDDEN', 'apiInfo required'));
    await expect(createAuthFetch(src)('api/v1/me')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('propagates an API info failure other than FORBIDDEN for an absolute URL', async () => {
    const src = source('iframe', [token('t1')]);
    src.getApiInfo.mockRejectedValue(new BoError('TIMEOUT', 'slow'));
    await expect(createAuthFetch(src)('https://middleware.example.org/x')).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('propagates a network failure of fetch', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(createAuthFetch(source('iframe', [token('t1')]))('a')).rejects.toThrow(
      'Failed to fetch',
    );
  });
});
