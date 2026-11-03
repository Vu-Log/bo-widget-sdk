import { describe, expect, it } from 'vitest';
import * as sdk from './index.js';

describe('@vulog/bo-widget-sdk', () => {
  it('exposes the protocol client and nothing else at runtime', () => {
    expect(Object.keys(sdk).sort()).toEqual([
      'BoError',
      'PROTOCOL_VERSION',
      'TOKEN_REFRESH_MARGIN_MS',
      'connect',
    ]);
  });

  it('speaks version 2 of the protocol', () => {
    expect(sdk.PROTOCOL_VERSION).toBe(2);
  });
});
