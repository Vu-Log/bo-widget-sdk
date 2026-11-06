import { describe, expect, it, vi } from 'vitest';
import { boConfUrl, fetchBoApi, fetchFailure, parseBoHost } from './boConf.js';

const HOST = 'bo.example.com';
const SECRET_KEY = 'secret-api-key-123';
const API_HOST = 'api.bo.example.com';

/** `fetch` answering the conf with `body` (an object as JSON, a string as is). */
const answering = (body: unknown, status = 200) =>
  vi.fn<typeof fetch>(() =>
    Promise.resolve(
      typeof body === 'string' ? new Response(body, { status }) : Response.json(body, { status }),
    ),
  );

const conf = (baseUrl: unknown, apiKey: unknown = SECRET_KEY) => ({
  'X-API-Key': apiKey,
  url: { baseUrl },
});

/** The error `fetchBoApi` rejects with. */
const failure = async (fetchImpl: typeof fetch): Promise<Error> => {
  try {
    await fetchBoApi(HOST, fetchImpl);
  } catch (error) {
    return error as Error;
  }
  throw new Error('fetchBoApi resolved');
};

describe('parseBoHost', () => {
  it.each([
    ['bo.example.com', 'bo.example.com'],
    ['BO.Example.com', 'bo.example.com'],
    ['localhost:8443', 'localhost:8443'],
  ])('accepts the host %s', (value, host) => {
    expect(parseBoHost(value)).toBe(host);
  });

  it.each([
    ['a scheme', 'https://bo.example.com'],
    ['a path', 'bo.example.com/fr'],
    ['a trailing slash', 'bo.example.com/'],
    ['credentials', 'user@bo.example.com'],
    ['a query', 'bo.example.com?x=1'],
    ['a space', 'bo example.com'],
    ['nothing', ''],
  ])('refuses a value with %s', (_label, value) => {
    expect(() => parseBoHost(value)).toThrow(/BO_WIDGET_HOST must be the host of a back office/);
  });
});

describe('boConfUrl', () => {
  it('is the anonymous conf of the host, on the host', () => {
    expect(boConfUrl(HOST)).toBe(`https://${HOST}/fe-api/anonymous/bo/${HOST}/conf`);
  });
});

describe('fetchFailure', () => {
  it.each([
    [
      'the code of the cause',
      new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } }),
      'ENOTFOUND',
    ],
    [
      'the message of the cause',
      new TypeError('fetch failed', { cause: new Error('bad cert') }),
      'bad cert',
    ],
    ['the message of the error', new Error('aborted'), 'aborted'],
    ['a thrown value', 'boom', 'boom'],
  ])('gives %s', (_label, error, reason) => {
    expect(fetchFailure(error)).toBe(reason);
  });
});

describe('fetchBoApi', () => {
  it('reads the API key and builds the API URL from the origin of url.baseUrl', async () => {
    const fetchImpl = answering(conf(`https://${API_HOST}/boapi/proxy/`));

    await expect(fetchBoApi(HOST, fetchImpl)).resolves.toEqual({
      apiUrl: `https://${API_HOST}/boapi/proxy/`,
      apiKey: SECRET_KEY,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      boConfUrl(HOST),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it.each([
    ['another path', `https://${API_HOST}/other/path/`],
    ['no trailing slash', `https://${API_HOST}/boapi/proxy`],
    ['no path', `https://${API_HOST}`],
    ['a query and a hash', `https://${API_HOST}/boapi/proxy/?a=1#x`],
    ['credentials', `https://user:pass@${API_HOST}/boapi/proxy/`],
    ['spaces around it', ` https://${API_HOST}/boapi/proxy/ `],
  ])('keeps {origin}/boapi/proxy/ for a url.baseUrl with %s', async (_label, baseUrl) => {
    await expect(fetchBoApi(HOST, answering(conf(baseUrl)))).resolves.toMatchObject({
      apiUrl: `https://${API_HOST}/boapi/proxy/`,
    });
  });

  it('keeps a non-default port of url.baseUrl', async () => {
    await expect(
      fetchBoApi(HOST, answering(conf(`https://${API_HOST}:8443/boapi/proxy/`))),
    ).resolves.toMatchObject({ apiUrl: `https://${API_HOST}:8443/boapi/proxy/` });
  });

  it('trims the API key', async () => {
    await expect(
      fetchBoApi(HOST, answering(conf(`https://${API_HOST}/`, ` ${SECRET_KEY}\n`))),
    ).resolves.toMatchObject({ apiKey: SECRET_KEY });
  });

  it.each([
    ['no url', { 'X-API-Key': SECRET_KEY }, 'has no url.baseUrl'],
    ['a url that is not an object', { 'X-API-Key': SECRET_KEY, url: 'x' }, 'has no url.baseUrl'],
    ['no url.baseUrl', conf(undefined), 'has no url.baseUrl'],
    ['an empty url.baseUrl', conf('  '), 'has no url.baseUrl'],
    ['a url.baseUrl that is not a string', conf(42), 'has no url.baseUrl'],
    ['a url.baseUrl that is not a URL', conf(`${API_HOST}/boapi/proxy/`), 'is not a URL'],
    ['an http: url.baseUrl', conf(`http://${API_HOST}/boapi/proxy/`), 'is not https:'],
    ['no X-API-Key', { url: { baseUrl: `https://${API_HOST}/` } }, 'has no X-API-Key'],
    ['an empty X-API-Key', conf(`https://${API_HOST}/`, ' '), 'has no X-API-Key'],
    ['an X-API-Key that is not a string', conf(`https://${API_HOST}/`, 42), 'has no X-API-Key'],
  ])(
    'fails on a conf with %s, naming the host and the field, never a value',
    async (_label, body, problem) => {
      const error = await failure(answering(body));

      expect(error.message).toContain(`the conf of the back office ${HOST}`);
      expect(error.message).toContain(problem);
      expect(error.message).not.toContain(SECRET_KEY);
      expect(error.message).not.toContain(API_HOST);
    },
  );

  it.each([
    ['answers 404', answering('Not found', 404), 'answered 404'],
    ['answers 500', answering({ error: 'x' }, 500), 'answered 500'],
    ['is not JSON', answering('<html>'), 'is not valid JSON'],
    ['is a JSON array', answering([conf(`https://${API_HOST}/`)]), 'is not a JSON object'],
    ['is null', answering('null'), 'is not a JSON object'],
    [
      'cannot be reached',
      vi.fn<typeof fetch>(() =>
        Promise.reject(new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } })),
      ),
      'cannot be reached (ENOTFOUND)',
    ],
  ])('fails when the conf %s', async (_label, fetchImpl, problem) => {
    const error = await failure(fetchImpl);

    expect(error.message).toBe(
      `Fake back office: the conf of the back office ${HOST} ${problem}. Check BO_WIDGET_HOST.`,
    );
  });
});
