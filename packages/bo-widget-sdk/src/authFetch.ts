import { BoError } from './errors.js';
import type { AuthFetch, BoAccessToken, BoApiInfo, BoMode, BoRequests } from './types.js';

/** A token is renewed this long before it expires, so that a request never leaves with an expired one. */
export const TOKEN_REFRESH_MARGIN_MS = 60_000;

type AuthSource = Pick<BoRequests, 'getApiInfo' | 'getAccessToken'> & { readonly mode: BoMode };

const isAbsoluteUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const withTrailingSlash = (url: string): string => (url.endsWith('/') ? url : `${url}/`);

/**
 * Builds the `authFetch` of a client (see `BoClient.authFetch`).
 *
 * @param source - The requests of the transport, and its mode.
 * @returns `authFetch`, which keeps the API info and the access token of the widget in cache.
 */
export const createAuthFetch = (source: AuthSource): AuthFetch => {
  let apiInfo: Promise<BoApiInfo> | null = null;
  let apiInfoForbidden = false;
  let token: BoAccessToken | null = null;
  let tokenRequest: Promise<BoAccessToken> | null = null;

  const getApiInfo = (): Promise<BoApiInfo> => {
    apiInfo ??= source.getApiInfo().catch((error: unknown) => {
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

  /** Tells where `input` goes: the Vulog API (resolved URL) or a third-party API. */
  const resolve = async (input: string): Promise<{ url: string; apiKey: string | null }> => {
    if (!isAbsoluteUrl(input)) {
      const { baseUrl, apiKey } = await getApiInfo();
      const base = withTrailingSlash(baseUrl);
      const url = new URL(base + input.replace(/^\/+/, '')).href;
      if (!url.startsWith(base)) {
        throw new TypeError(`authFetch: "${input}" resolves outside the Vulog API base URL`);
      }
      return { url, apiKey };
    }
    const url = new URL(input).href;
    let info: BoApiInfo | null = null;
    if (!apiInfoForbidden) {
      try {
        info = await getApiInfo();
      } catch (error) {
        // Without the `apiInfo` permission, no URL is a Vulog API one: it is a third-party API.
        if (!(error instanceof BoError && error.code === 'FORBIDDEN')) throw error;
        apiInfoForbidden = true;
      }
    }
    if (info && url.startsWith(withTrailingSlash(info.baseUrl))) {
      return { url, apiKey: info.apiKey };
    }
    return { url, apiKey: null };
  };

  return async (input, init) => {
    const { url, apiKey } = await resolve(String(input));
    const isVulogApi = apiKey !== null;
    const headers = new Headers(init?.headers);
    if (isVulogApi) headers.set('X-API-Key', apiKey);

    // As a Web Component, the back office service worker adds the token to Vulog API calls.
    if (isVulogApi && source.mode === 'webcomponent') {
      return fetch(url, { ...init, headers });
    }

    const send = async (renew: boolean): Promise<Response> => {
      const { accessToken } = await getToken(renew);
      const signed = new Headers(headers);
      signed.set('Authorization', `Bearer ${accessToken}`);
      return fetch(url, { ...init, headers: signed });
    };
    const response = await send(false);
    return response.status === 401 ? send(true) : response;
  };
};
