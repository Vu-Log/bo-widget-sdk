/**
 * Error the API of the fake back office throws, with the codes of the real one. Runs in the
 * browser, like `host.ts`.
 *
 * @packageDocumentation
 */

/** Codes the server of the storage answers, kept as `reason` by the SDK. */
export type StorageServerErrorCode =
  | 'not-found'
  | 'version-conflict'
  | 'already-exists'
  | 'value-too-large'
  | 'quota-exceeded'
  | 'invalid-cursor';

/**
 * Codes of the errors the back office API throws. `invalid-payload` and `FORBIDDEN` become the
 * `INVALID_PAYLOAD` and `FORBIDDEN` codes of the SDK; the others become `INTERNAL` with the code
 * as `reason`.
 */
export type WidgetHostErrorCode =
  'invalid-payload' | 'no-token' | 'FORBIDDEN' | StorageServerErrorCode;

/** Error the back office API throws, with the codes of the real one. */
export class WidgetHostError extends Error {
  readonly code: WidgetHostErrorCode;
  readonly status: number | null;

  constructor(code: WidgetHostErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = 'WidgetHostError';
    this.code = code;
    this.status = Number.isInteger(status) ? status : null;
  }
}

/** A payload the back office refuses (`INVALID_PAYLOAD`). */
export const invalidPayload = (message: string): WidgetHostError =>
  new WidgetHostError('invalid-payload', message);
