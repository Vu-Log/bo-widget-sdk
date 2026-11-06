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
    await createAuthFetch(src)('fleets/F1/vehicles?page=2');
    expect(lastCall()).toMatchObject({
      url: `${BASE_URL}fleets/F1/vehicles?page=2`,
      apiKey: 'api-key',
      authorization: null,
    });
    expect(src.getAccessToken).not.toHaveBeenCalled();
  });

  it('reads a leading slash as relative to baseUrl', async () => {
    await createAuthFetch(source('webcomponent'))('/fleets/F1/vehicles/V1');
    expect(lastCall().url).toBe(`${BASE_URL}fleets/F1/vehicles/V1`);
  });

  it('accepts an absolute URL under baseUrl as a Vulog API', async () => {
    await createAuthFetch(source('webcomponent'))(new URL(`${BASE_URL}fleets/F1/vehicles/V1`));
    expect(lastCall()).toMatchObject({
      url: `${BASE_URL}fleets/F1/vehicles/V1`,
      apiKey: 'api-key',
    });
  });

  it('does not retry a 401 on a Vulog API: the service worker owns the token', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }));
    const response = await createAuthFetch(source('webcomponent'))('fleets/F1/vehicles/V1');
    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the caller init and headers', async () => {
    await createAuthFetch(source('webcomponent'))('fleets/F1/vehicles', {
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

  it('rejects a third-party URL when the API info is invalid, without sending the token', async () => {
    const src = source('iframe', [token('t1')]);
    src.getApiInfo.mockResolvedValue({ baseUrl: 'file:///etc/boapi/', apiKey: 'k' });
    await expect(createAuthFetch(src)('https://third.example/x')).rejects.toMatchObject({
      code: 'INTERNAL',
      reason: 'invalid-api-info',
    });
    expect(src.getAccessToken).not.toHaveBeenCalled();
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
    await createAuthFetch(source('iframe', [token('t1')]))('fleets/F1/vehicles/V1');
    expect(lastCall()).toMatchObject({
      url: `${BASE_URL}fleets/F1/vehicles/V1`,
      apiKey: 'api-key',
      authorization: 'Bearer t1',
    });
  });

  it('retries a 401 once with a new token', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('ok'));
    const src = source('iframe', [token('old'), token('new')]);
    const response = await createAuthFetch(src)('fleets/F1/vehicles/V1');
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
    const error = await createAuthFetch(source('iframe', []))('fleets/F1/vehicles/V1').catch(
      (e: unknown) => e,
    );
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
    await authFetch(`${BASE_URL}fleets/F1/vehicles/V1`);
    await authFetch('https://middleware.example.org/x');
    expect(lastCall(0)).toMatchObject({ apiKey: null, authorization: 'Bearer t1' });
    expect(src.getApiInfo).toHaveBeenCalledTimes(1);
  });

  it('rejects a relative path without the apiInfo permission', async () => {
    const src = source('iframe', [token('t1')]);
    src.getApiInfo.mockRejectedValue(new BoError('FORBIDDEN', 'apiInfo required'));
    await expect(createAuthFetch(src)('fleets/F1/vehicles/V1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
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

describe('authFetch: URL resolution', () => {
  const withBase = (baseUrl: string) => {
    const src = source('iframe', [token('t1')]);
    src.getApiInfo.mockResolvedValue({ baseUrl, apiKey: 'api-key' });
    return createAuthFetch(src);
  };

  it('joins a relative path to a baseUrl without trailing slash', async () => {
    await withBase('https://api.example.com/boapi/proxy')('fleets/F1/vehicles/V1');
    expect(lastCall().url).toBe(`${BASE_URL}fleets/F1/vehicles/V1`);
  });

  it('never sends the API key to a sibling path of the base', async () => {
    await withBase('https://api.example.com/boapi/proxy')(
      'https://api.example.com/boapi/proxy-other/x',
    );
    expect(lastCall()).toMatchObject({ apiKey: null, authorization: 'Bearer t1' });
  });

  it('compares URLs with a non-canonical baseUrl', async () => {
    await withBase('HTTPS://API.EXAMPLE.COM:443/boapi/proxy/')('fleets/F1/vehicles/V1');
    expect(lastCall()).toMatchObject({
      url: `${BASE_URL}fleets/F1/vehicles/V1`,
      apiKey: 'api-key',
    });
  });

  it('accepts an http: baseUrl, as the dev server answers', async () => {
    await withBase('http://localhost:5173/__bo-widget/api/boapi/proxy/')('fleets/F1');
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:5173/__bo-widget/api/boapi/proxy/fleets/F1',
      apiKey: 'api-key',
    });
  });

  it('keeps a protocol-relative path under baseUrl', async () => {
    await withBase(BASE_URL)('//evil.example/x');
    expect(lastCall()).toMatchObject({ url: `${BASE_URL}evil.example/x`, apiKey: 'api-key' });
  });

  it.each(['../x', '%2e%2e/admin', '..\\admin'])('refuses %j', async (path) => {
    await expect(withBase('https://api.example.com/boapi/proxy')(path)).rejects.toThrow(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a Request input, whose body could not be sent twice', async () => {
    const request = new Request('https://middleware.example.org/x');
    await expect(withBase(BASE_URL)(request as unknown as string)).rejects.toThrow(TypeError);
  });
});

describe('authFetch: 401 retry', () => {
  it('keeps the method, body, caller headers and API key on the retry', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('ok'));
    await createAuthFetch(source('iframe', [token('old'), token('new')]))('fleets/F1/vehicles', {
      method: 'POST',
      body: '{"a":1}',
      headers: { 'Content-Type': 'application/json' },
    });
    const retry = lastCall(1);
    expect(retry).toMatchObject({ apiKey: 'api-key', authorization: 'Bearer new' });
    expect(retry.init).toMatchObject({ method: 'POST', body: '{"a":1}' });
    expect(new Headers(retry.init?.headers).get('Content-Type')).toBe('application/json');
  });

  it('releases the body of the dropped 401 answer', async () => {
    const dropped = new Response('expired', { status: 401 });
    const cancel = vi.spyOn(dropped.body as ReadableStream, 'cancel');
    fetchMock.mockResolvedValueOnce(dropped).mockResolvedValueOnce(new Response('ok'));
    await createAuthFetch(source('iframe', [token('a'), token('b')]))('x');
    expect(cancel).toHaveBeenCalled();
  });

  it('rejects with no-token when the new token cannot be had after a 401', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }));
    const src = source('iframe', [token('old')]);
    src.getAccessToken
      .mockResolvedValueOnce(token('old'))
      .mockRejectedValueOnce(new BoError('INTERNAL', 'expired', { reason: 'no-token' }));
    await expect(createAuthFetch(src)('x')).rejects.toMatchObject({ reason: 'no-token' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a 401 of a third-party API as a Web Component', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('ok'));
    const response = await createAuthFetch(source('webcomponent', [token('old'), token('new')]))(
      'https://middleware.example.org/x',
    );
    expect(response.status).toBe(200);
    expect(lastCall(0).authorization).toBe('Bearer old');
    expect(lastCall(1).authorization).toBe('Bearer new');
  });

  it('renews the token once for concurrent 401s', async () => {
    fetchMock.mockImplementation(async (_url, init) =>
      new Headers(init?.headers).get('Authorization') === 'Bearer old'
        ? new Response('', { status: 401 })
        : new Response('ok'),
    );
    const src = source('iframe', [token('old'), token('new'), token('third')]);
    const authFetch = createAuthFetch(src);
    await Promise.all([authFetch('a'), authFetch('b')]);
    expect(src.getAccessToken).toHaveBeenCalledTimes(2);
  });
});

describe('authFetch: answers of the back office', () => {
  it.each([
    ['no apiKey', { baseUrl: BASE_URL, apiKey: '' }],
    ['a relative baseUrl', { baseUrl: '/boapi/proxy/', apiKey: 'k' }],
    ['a file: baseUrl', { baseUrl: 'file:///etc/boapi/', apiKey: 'k' }],
    ['a javascript: baseUrl', { baseUrl: 'javascript:alert(1)', apiKey: 'k' }],
    ['a data: baseUrl', { baseUrl: 'data:text/plain,boapi', apiKey: 'k' }],
    ['a blob: baseUrl', { baseUrl: 'blob:https://api.example.com/1234', apiKey: 'k' }],
    ['nothing', undefined],
  ])('rejects API info with %s as invalid-api-info', async (_label, info) => {
    const src = source('webcomponent');
    src.getApiInfo.mockResolvedValue(info as never);
    await expect(createAuthFetch(src)('fleets/F1/vehicles/V1')).rejects.toMatchObject({
      code: 'INTERNAL',
      reason: 'invalid-api-info',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['an empty token', { accessToken: '', expiresAt: null }],
    ['no token', {}],
  ])('rejects %s as invalid-token, without calling the API', async (_label, answer) => {
    const src = source('iframe');
    src.getAccessToken.mockResolvedValue(answer as BoAccessToken);
    await expect(createAuthFetch(src)('x')).rejects.toMatchObject({ reason: 'invalid-token' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses a token whose expiry is not a number, without keeping it', async () => {
    const src = source('iframe');
    src.getAccessToken.mockResolvedValue({ accessToken: 't', expiresAt: 'soon' as never });
    const authFetch = createAuthFetch(src);
    await authFetch('a');
    await authFetch('b');
    expect(lastCall().authorization).toBe('Bearer t');
    expect(src.getAccessToken).toHaveBeenCalledTimes(2);
  });

  it('treats absolute URLs as third-party when an older back office has no getApiInfo', async () => {
    const src = source('iframe', [token('t1')]);
    src.getApiInfo.mockRejectedValue(new BoError('UNKNOWN_TYPE', 'getApiInfo'));
    await createAuthFetch(src)('https://middleware.example.org/x');
    expect(lastCall()).toMatchObject({ apiKey: null, authorization: 'Bearer t1' });
  });
});

describe('authFetch: stream body', () => {
  it('returns the 401 instead of retrying a stream body, which cannot be sent twice', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }));
    const body = new ReadableStream();
    const response = await createAuthFetch(source('iframe', [token('a'), token('b')]))('x', {
      method: 'POST',
      body,
    });
    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
