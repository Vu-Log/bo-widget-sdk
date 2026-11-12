import { describe, expect, it } from 'vitest';
import { WidgetHostError, invalidPayload } from './hostError.js';

describe('WidgetHostError', () => {
  it('keeps its code, message and integer status', () => {
    const error = new WidgetHostError('version-conflict', 'conflict', 409);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: 'WidgetHostError',
      code: 'version-conflict',
      message: 'conflict',
      status: 409,
    });
  });

  it.each([undefined, null, 4.5, Number.NaN])('has a null status for %s', (status) => {
    expect(new WidgetHostError('no-token', 'x', status as number | null).status).toBeNull();
  });
});

describe('invalidPayload', () => {
  it('builds an invalid-payload error without status', () => {
    expect(invalidPayload('bad')).toMatchObject({
      code: 'invalid-payload',
      message: 'bad',
      status: null,
    });
  });
});
