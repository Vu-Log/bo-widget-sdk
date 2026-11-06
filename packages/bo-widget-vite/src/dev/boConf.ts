/** API of a back office, read from its anonymous conf. */
export interface BoApi {
  /** `{origin}/boapi/proxy/`, the origin taken from `url.baseUrl` of the conf. */
  readonly apiUrl: string;
  /** `X-API-Key` of the conf. */
  readonly apiKey: string;
}

/** Path of the Vulog API under the origin of `url.baseUrl`. */
const API_PATH = '/boapi/proxy/';

/** Time given to the back office to answer its conf. */
const CONF_TIMEOUT_MS = 10_000;

/** The reason behind a `fetch` failure: Node puts it in `cause` (`ECONNREFUSED`, `ENOTFOUND`…). */
export const fetchFailure = (error: unknown): string => {
  const cause = (error as { cause?: { code?: unknown; message?: unknown } } | null)?.cause;
  if (typeof cause?.code === 'string') return cause.code;
  if (typeof cause?.message === 'string') return cause.message;
  return error instanceof Error ? error.message : String(error);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Checks `BO_WIDGET_HOST`: the host name of a back office, with an optional port, without scheme
 * nor path (`bo.example.com`).
 *
 * @param value - The variable, trimmed.
 * @returns The host, lower-cased.
 * @throws {Error} When it is not a bare host.
 */
export const parseBoHost = (value: string): string => {
  let url: URL | undefined;
  try {
    url = new URL(`https://${value}`);
  } catch {
    // Reported below.
  }
  const host = value.toLowerCase();
  if (!url || url.host !== host || /[/?#@\\]/.test(value)) {
    throw new Error(
      `Fake back office: BO_WIDGET_HOST must be the host of a back office, without scheme nor path (e.g. bo.example.com), not "${value}"`,
    );
  }
  return host;
};

/** URL of the anonymous conf the back office of `host` (checked by {@link parseBoHost}) reads at startup. */
export const boConfUrl = (host: string): string =>
  `https://${host}/fe-api/anonymous/bo/${host}/conf`;

const confError = (host: string, problem: string): Error =>
  new Error(
    `Fake back office: the conf of the back office ${host} ${problem}. Check BO_WIDGET_HOST.`,
  );

/**
 * Reads the API base URL and the API key from the anonymous conf of a back office, as the back
 * office does at startup. Only the origin of `url.baseUrl` is kept: the API URL is always
 * `{origin}/boapi/proxy/`. The error messages name the host and the field, never a value of the
 * conf.
 *
 * @param host - A host checked by {@link parseBoHost}.
 * @param fetchImpl - `fetch`, replaced in tests.
 * @returns The API base URL and the API key.
 * @throws {Error} When the conf cannot be fetched (network, timeout, non-2xx status), is not a
 * JSON object, has no `https:` URL in `url.baseUrl`, or no non-empty string in `X-API-Key`.
 */
export const fetchBoApi = async (host: string, fetchImpl: typeof fetch = fetch): Promise<BoApi> => {
  let response: Response;
  try {
    response = await fetchImpl(boConfUrl(host), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(CONF_TIMEOUT_MS),
    });
  } catch (error) {
    throw confError(host, `cannot be reached (${fetchFailure(error)})`);
  }
  if (!response.ok) throw confError(host, `answered ${response.status}`);
  let conf: unknown;
  try {
    conf = await response.json();
  } catch {
    throw confError(host, 'is not valid JSON');
  }
  if (!isPlainObject(conf)) throw confError(host, 'is not a JSON object');

  const baseUrl = isPlainObject(conf.url) ? conf.url.baseUrl : undefined;
  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    throw confError(host, 'has no url.baseUrl');
  }
  let url: URL;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    throw confError(host, 'has a url.baseUrl that is not a URL');
  }
  if (url.protocol !== 'https:') throw confError(host, 'has a url.baseUrl that is not https:');

  const apiKey = conf['X-API-Key'];
  if (typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw confError(host, 'has no X-API-Key');
  }
  return { apiUrl: `${url.origin}${API_PATH}`, apiKey: apiKey.trim() };
};
