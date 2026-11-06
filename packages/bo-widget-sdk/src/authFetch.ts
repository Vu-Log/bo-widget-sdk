import { BoError, type BoErrorCode } from './errors.js';
import type { AuthFetch, BoAccessToken, BoApiInfo, BoMode, BoRequests } from './types.js';

/** A token is renewed when it expires within this delay, so that a request does not leave with a token about to expire. */
export const TOKEN_REFRESH_MARGIN_MS = 60_000;

type AuthSource = Pick<BoRequests, 'getApiInfo' | 'getAccessToken'> & { readonly mode: BoMode };

/** Where a call goes: the Vulog API, with its key, or a third-party API (`vulogApiKey: null`). */
interface Destination {
  url: string;
  vulogApiKey: string | null;
}

const isAbsoluteUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/** `baseUrl` in the canonical form of `URL`, ending with `/`, so that resolved URLs can be compared with it. */
const toBase = (baseUrl: string): string => {
  const { href } = new URL(baseUrl);
  return href.endsWith('/') ? href : `${href}/`;
};

/** True for an absolute `http:` or `https:` URL: the only schemes a Vulog API can be served on. */
const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
};

const checkApiInfo = (info: unknown): BoApiInfo => {
  const { baseUrl, apiKey } = (info ?? {}) as Partial<BoApiInfo>;
  if (typeof baseUrl === 'string' && isHttpUrl(baseUrl) && typeof apiKey === 'string' && apiKey) {
    return { baseUrl, apiKey };
  }
  throw new BoError(
    'INTERNAL',
    'getApiInfo: the back office answered no usable baseUrl and apiKey',
    {
      reason: 'invalid-api-info',
    },
  );
};

const checkToken = (result: unknown): BoAccessToken => {
  const { accessToken, expiresAt } = (result ?? {}) as Partial<BoAccessToken>;
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new BoError('INTERNAL', 'getAccessToken: the back office answered no token', {
      reason: 'invalid-token',
    });
  }
  // An expiry that is not a number is unknown: the token is used, but not kept in cache.
  return { accessToken, expiresAt: Number.isFinite(expiresAt) ? (expiresAt as number) : null };
};

/** Answers to `getApiInfo` meaning that no URL is a Vulog API one: every absolute URL is then a third-party API. */
const NO_API_INFO: readonly BoErrorCode[] = ['FORBIDDEN', 'UNKNOWN_TYPE'];

/**
 * Builds the `authFetch` of a client (see `BoClient.authFetch`).
 *
 * @param source - The requests of the transport, and its mode.
 * @returns `authFetch`, which keeps the API info and the access token of the widget in cache.
 */
export const createAuthFetch = (source: AuthSource): AuthFetch => {
  let apiInfo: Promise<BoApiInfo> | null = null;
  let apiInfoRefused = false;
  let token: BoAccessToken | null = null;
  let tokenRequest: Promise<BoAccessToken> | null = null;

  const getApiInfo = (): Promise<BoApiInfo> => {
    apiInfo ??= source
      .getApiInfo()
      .then(checkApiInfo)
      .catch((error: unknown) => {
        apiInfo = null;
        throw error;
      });
    return apiInfo;
  };

  const isFresh = (candidate: BoAccessToken | null): candidate is BoAccessToken =>
    candidate !== null &&
    candidate.expiresAt !== null &&
    candidate.expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS;

  const getToken = (renew: boolean): Promise<BoAccessToken> => {
    if (renew) token = null;
    if (isFresh(token)) return Promise.resolve(token);
    tokenRequest ??= source
      .getAccessToken()
      .then(checkToken)
      .then((result) => {
        // A token whose expiry is unknown is not kept: it is asked for again on the next call.
        token = result.expiresAt === null ? null : result;
        return result;
      })
      .finally(() => {
        tokenRequest = null;
      });
    return tokenRequest;
  };

  const resolve = async (input: string): Promise<Destination> => {
    if (!isAbsoluteUrl(input)) {
      const { baseUrl, apiKey } = await getApiInfo();
      const base = toBase(baseUrl);
      const url = new URL(base + input.replace(/^\/+/, '')).href;
      if (!url.startsWith(base)) {
        throw new TypeError(`authFetch: "${input}" resolves outside the Vulog API base URL`);
      }
      return { url, vulogApiKey: apiKey };
    }
    const url = new URL(input).href;
    if (apiInfoRefused) return { url, vulogApiKey: null };
    let info: BoApiInfo;
    try {
      info = await getApiInfo();
    } catch (error) {
      if (!(error instanceof BoError && NO_API_INFO.includes(error.code))) throw error;
      apiInfoRefused = true;
      return { url, vulogApiKey: null };
    }
    return { url, vulogApiKey: url.startsWith(toBase(info.baseUrl)) ? info.apiKey : null };
  };

  return async (input, init) => {
    if (typeof input !== 'string' && !(input instanceof URL)) {
      throw new TypeError('authFetch: input must be a string or a URL, not a Request');
    }
    const { url, vulogApiKey } = await resolve(String(input));
    const headers = new Headers(init?.headers);
    if (vulogApiKey !== null) {
      headers.set('X-API-Key', vulogApiKey);
      // As a Web Component, the back office service worker adds the token to Vulog API calls.
      if (source.mode === 'webcomponent') return fetch(url, { ...init, headers });
    }

    const send = async (renew: boolean): Promise<Response> => {
      const { accessToken } = await getToken(renew);
      const signed = new Headers(headers);
      signed.set('Authorization', `Bearer ${accessToken}`);
      return fetch(url, { ...init, headers: signed });
    };
    const response = await send(false);
    // A stream body is consumed by the first call: it cannot be sent again.
    if (response.status !== 401 || init?.body instanceof ReadableStream) return response;
    // The first answer is dropped: release its body before asking again with a new token.
    await response.body?.cancel().catch(() => {});
    return send(true);
  };
};
