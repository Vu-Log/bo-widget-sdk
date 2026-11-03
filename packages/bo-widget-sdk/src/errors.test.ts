import { describe, expect, it } from 'vitest';
import { BoError, fromHostError, fromWireError } from './errors.js';

describe('BoError', () => {
  it('carries code, reason, status and cause', () => {
    const cause = new Error('root');
    const error = new BoError('INTERNAL', 'failed', { reason: 'no-token', status: 401, cause });
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: 'BoError',
      code: 'INTERNAL',
      message: 'failed',
      reason: 'no-token',
      status: 401,
      cause,
    });
  });

  it('defaults reason and status to null, and has no cause', () => {
    const error = new BoError('TIMEOUT', 'slow');
    expect(error.reason).toBeNull();
    expect(error.status).toBeNull();
    expect('cause' in error).toBe(false);
  });

  it.each([
    ['an empty reason', { reason: '' }],
    ['a non-integer status', { status: 4.5 }],
  ])('ignores %s', (_label, details) => {
    const error = new BoError('INTERNAL', 'x', details);
    expect(error.reason).toBeNull();
    expect(error.status).toBeNull();
  });
});

describe('fromWireError', () => {
  it.each(['UNKNOWN_TYPE', 'FORBIDDEN', 'INVALID_PAYLOAD', 'INTERNAL'] as const)(
    'keeps the %s code of the answer',
    (code) => {
      expect(fromWireError({ code, message: 'm' }, 'getContext')).toMatchObject({
        code,
        message: 'm',
      });
    },
  );

  it('keeps reason and status', () => {
    const error = fromWireError(
      { code: 'INTERNAL', message: 'm', reason: 'not-installed', status: 404 },
      'getSettings',
    );
    expect(error).toMatchObject({ reason: 'not-installed', status: 404 });
  });

  it('turns an unknown code into INTERNAL, keeping it as the reason', () => {
    expect(fromWireError({ code: 'RATE_LIMITED', message: 'm' }, 'getContext')).toMatchObject({
      code: 'INTERNAL',
      reason: 'RATE_LIMITED',
    });
  });

  it('prefers the reason of the answer to an unknown code', () => {
    expect(fromWireError({ code: 'NEW', reason: 'quota' }, 'getContext').reason).toBe('quota');
  });

  it('turns an answer without code into INTERNAL without reason', () => {
    expect(fromWireError({ message: 'm' }, 'getContext')).toMatchObject({
      code: 'INTERNAL',
      reason: null,
    });
  });

  it('writes a message when the answer has none', () => {
    expect(fromWireError(undefined, 'getTheme')).toMatchObject({
      code: 'INTERNAL',
      message: 'getTheme: the back office failed',
    });
  });
});

describe('fromHostError', () => {
  it('turns invalid-payload into INVALID_PAYLOAD, as on the port', () => {
    const hostError = Object.assign(new Error('navigate: bad path'), { code: 'invalid-payload' });
    expect(fromHostError(hostError, 'navigate')).toMatchObject({
      code: 'INVALID_PAYLOAD',
      message: 'navigate: bad path',
      reason: null,
      cause: hostError,
    });
  });

  it.each(['no-token', 'not-installed', 'disposed', 'ERR_NETWORK'])(
    'turns the host code %s into the reason of an INTERNAL error',
    (code) => {
      const hostError = Object.assign(new Error('failed'), { code, status: 503 });
      expect(fromHostError(hostError, 'getSettings')).toMatchObject({
        code: 'INTERNAL',
        reason: code,
        status: 503,
      });
    },
  );

  it('keeps a BoError as is', () => {
    const error = new BoError('FORBIDDEN', 'no');
    expect(fromHostError(error, 'getApiInfo')).toBe(error);
  });

  it('keeps the text of a string thrown by the host', () => {
    expect(fromHostError('boom', 'getContext')).toMatchObject({
      code: 'INTERNAL',
      message: 'boom',
    });
  });

  it.each([null, undefined, '', new Error('')])(
    'turns %j into a generic INTERNAL error',
    (value) => {
      expect(fromHostError(value, 'getContext')).toMatchObject({
        code: 'INTERNAL',
        message: 'getContext: the back office failed',
        reason: null,
      });
    },
  );
});

describe('fromHostError and fromWireError: edge cases', () => {
  it('keeps a code of the envelope thrown by the host, as on the port', () => {
    const hostError = Object.assign(new Error('no'), { code: 'FORBIDDEN', status: 403 });
    expect(fromHostError(hostError, 'getApiInfo')).toMatchObject({
      code: 'FORBIDDEN',
      reason: null,
      status: 403,
    });
  });

  it('falls back to the unknown code when the reason is empty', () => {
    expect(fromWireError({ code: 'NEW', reason: '' }, 'getContext').reason).toBe('NEW');
  });
});
