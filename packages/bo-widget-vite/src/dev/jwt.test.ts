import { describe, expect, it } from 'vitest';
import { jwtExpiresAt } from './jwt.js';

const jwt = (payload: object): string =>
  ['e30', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'sig'].join('.');

describe('jwtExpiresAt', () => {
  it('reads exp in milliseconds', () => {
    expect(jwtExpiresAt(jwt({ exp: 1_700_000_000 }))).toBe(1_700_000_000_000);
  });

  it.each([
    ['a token that is not a JWT', 'opaque'],
    ['a JWT without exp', jwt({ sub: 'x' })],
    ['a non-numeric exp', jwt({ exp: 'soon' })],
    ['an unreadable payload', 'a.%%%.c'],
  ])('is null for %s', (_label, token) => {
    expect(jwtExpiresAt(token)).toBeNull();
  });
});
