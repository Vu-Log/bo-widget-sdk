/**
 * Reads the expiry of a JWT, without checking its signature: the dev server only needs to know
 * when to renew it.
 *
 * @packageDocumentation
 */

/**
 * Expiry of a JWT (`exp` × 1000).
 *
 * @returns Milliseconds since the epoch; `null` when the token is not a readable JWT or has no
 * numeric `exp`.
 */
export const jwtExpiresAt = (token: string): number | null => {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: unknown;
    };
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
};
