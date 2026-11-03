/**
 * Code of a {@link BoError}.
 *
 * - `UNKNOWN_TYPE`: the back office does not serve this request (older back office).
 * - `FORBIDDEN`: the widget's manifest does not declare the permission the request needs.
 * - `INVALID_PAYLOAD`: the back office refused the payload (external URL to `navigate`, empty
 *   `notify` message, invalid height).
 * - `INTERNAL`: the request failed in the back office; `reason` tells why when known.
 * - `TIMEOUT`: no answer in time (handshake or request).
 * - `DISCONNECTED`: the connection is closed, or the widget is not displayed by a back office.
 */
export type BoErrorCode = (typeof ERROR_CODES)[number];

const ERROR_CODES = [
  'UNKNOWN_TYPE',
  'FORBIDDEN',
  'INVALID_PAYLOAD',
  'INTERNAL',
  'TIMEOUT',
  'DISCONNECTED',
] as const;

const isErrorCode = (value: unknown): value is BoErrorCode =>
  (ERROR_CODES as readonly unknown[]).includes(value);

/** Details of a {@link BoError}. */
export interface BoErrorDetails {
  /** Why the request failed, when known (mostly on `INTERNAL`). */
  reason?: string | null;
  /** HTTP status behind the error, when known (mostly on `INTERNAL`). */
  status?: number | null;
  cause?: unknown;
}

/**
 * Error with which every request of a `BoClient` rejects, the same way as a Web Component and in an
 * iframe, so that a widget branches on `code` and `reason` only. `authFetch` may also reject with
 * the errors of `fetch` itself (`TypeError`, `AbortError`) and with a `TypeError` for an input it
 * refuses.
 *
 * Known `reason` values: `no-token` (session expired: no access token), `not-installed` (the
 * widget is not installed, so it has no settings), `disposed` (the widget was removed from the
 * page), `ERR_NETWORK` or another transport or server error code, and, for a back office that
 * answers something unexpected, `invalid-welcome`, `invalid-host-api`, `invalid-api-info`,
 * `invalid-token`, `malformed-answer` or `messageerror`. A wire code this SDK does not know becomes
 * `INTERNAL` with that code as `reason`.
 *
 * @example
 * ```ts
 * try {
 *   await bo.getSettings();
 * } catch (error) {
 *   if (error instanceof BoError && error.reason === 'not-installed') showSetupHint();
 *   else throw error;
 * }
 * ```
 */
export class BoError extends Error {
  readonly code: BoErrorCode;
  readonly reason: string | null;
  readonly status: number | null;

  constructor(code: BoErrorCode, message: string, details: BoErrorDetails = {}) {
    super(message, details.cause === undefined ? undefined : { cause: details.cause });
    this.name = 'BoError';
    this.code = code;
    this.reason = typeof details.reason === 'string' && details.reason ? details.reason : null;
    this.status = Number.isInteger(details.status) ? (details.status as number) : null;
  }
}

/** Error of a v2 answer, as the back office posts it on the port. */
export interface WireError {
  code?: unknown;
  message?: unknown;
  reason?: unknown;
  status?: unknown;
}

/** Builds the {@link BoError} of a failed answer posted on the port. */
export const fromWireError = (error: WireError | undefined, request: string): BoError => {
  const known = isErrorCode(error?.code);
  const code = known ? (error?.code as BoErrorCode) : 'INTERNAL';
  const message =
    typeof error?.message === 'string' && error.message
      ? error.message
      : `${request}: the back office failed`;
  // A code from a newer back office is kept as the reason, so that it is not lost.
  const fallbackReason = !known && typeof error?.code === 'string' ? error.code : null;
  return new BoError(code, message, {
    reason: typeof error?.reason === 'string' ? error.reason : fallbackReason,
    status: typeof error?.status === 'number' ? error.status : null,
  });
};

/**
 * Builds the {@link BoError} of an error thrown by the API the back office injects into a Web
 * Component: its `code` becomes `reason`, except `invalid-payload`, which becomes the
 * `INVALID_PAYLOAD` code, as on the port. Any other error becomes `INTERNAL`.
 */
export const fromHostError = (error: unknown, request: string): BoError => {
  if (error instanceof BoError) return error;
  const { code, status, message } = (error ?? {}) as {
    code?: unknown;
    status?: unknown;
    message?: unknown;
  };
  const text =
    typeof message === 'string' && message
      ? message
      : typeof error === 'string' && error
        ? error
        : `${request}: the back office failed`;
  if (code === 'invalid-payload') return new BoError('INVALID_PAYLOAD', text, { cause: error });
  return new BoError('INTERNAL', text, {
    reason: typeof code === 'string' ? code : null,
    status: typeof status === 'number' ? status : null,
    cause: error,
  });
};
