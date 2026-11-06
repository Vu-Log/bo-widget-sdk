/**
 * Follows the token of the back office session the user opened in the Chrome of login mode.
 *
 * The token stays in the auth service worker of the back office, which renews it only when asked
 * (it has no timer). So the dev server asks it, through CDP, in the tab of the back office:
 * `AUTH_GET_ACCESS_TOKEN` answers the valid token, renewing it first when it has expired, or
 * `null` without a session. The token is kept in memory only, and never logged.
 *
 * @packageDocumentation
 */
import { jwtExpiresAt } from '../jwt.js';
import type { CdpConnection } from './cdp.js';

/** The latest token of the session, as the proxy and `getAccessToken` read it. */
export interface TokenSource {
  /**
   * The latest token, asked again to the back office when it expires within a minute.
   *
   * @returns The token, without `Bearer ` prefix; `null` when there is no usable token (no
   * session, tab or Chrome closed, or the back office cannot be asked): {@link noTokenReason}
   * says why.
   */
  token(): Promise<string | null>;
  /**
   * Forgets `token` after the API refused it (401): the next call asks the back office again,
   * which may answer the same token while it considers it valid.
   */
  invalidate(token: string): void;
  /** Why {@link token} gives no token, for the answers of the dev server; never the token. */
  noTokenReason(): string;
  /** Stops following the session and closes the CDP connection. Chrome stays open. */
  close(): void;
}

/** State of the session, logged once per change. */
export type LoginState =
  'connected' | 'logged-out' | 'no-tab' | 'no-worker' | 'unreadable' | 'failed' | 'chrome-closed';

/** Where the session logs its state changes. */
export interface LoginLogger {
  info(message: string): void;
  warn(message: string): void;
}

/** What {@link createLoginSession} needs. */
export interface LoginSessionOptions {
  /** Host of the back office (`BO_WIDGET_HOST`), already checked. */
  readonly host: string;
  readonly cdp: CdpConnection;
  readonly logger: LoginLogger;
  /** Called on each state change, after its message (opens the fake back office tab). */
  readonly onState?: (state: LoginState) => void;
  readonly now?: () => number;
  /** Background check while not connected (ms): detects the login. */
  readonly loginPollMs?: number;
  /** Background check while connected (ms): detects a logout and keeps the session renewed. */
  readonly sessionPollMs?: number;
}

/** A token is asked again when it expires within this delay (ms). */
export const RENEW_MARGIN_MS = 60_000;
/** Without a session, the back office is asked at most once per this delay (ms). */
export const RETRY_MS = 2_000;
/** Wait for the script in the tab, which itself gives the worker 15 s (ms). */
export const EVALUATE_TIMEOUT_MS = 20_000;

/**
 * Runs in the tab of the back office: asks its auth service worker for the token, over a
 * `MessageChannel`, as the back office itself does. Answers `{ ok, data }` from the worker, or
 * `{ error }` without a controlling worker or an answer in time.
 */
export const GET_TOKEN_EXPRESSION = `(async () => {
  const controller = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (!controller) return { error: 'no-controller' };
  const channel = new MessageChannel();
  let timer;
  const reply = new Promise((resolve) => {
    channel.port1.onmessage = (event) => resolve(event.data);
    timer = setTimeout(() => resolve({ error: 'timeout' }), 15000);
  });
  controller.postMessage({ type: 'AUTH_GET_ACCESS_TOKEN', id: crypto.randomUUID() }, [channel.port2]);
  try {
    return await reply;
  } finally {
    clearTimeout(timer);
    channel.port1.close();
  }
})()`;

interface TargetInfo {
  targetId: string;
  type: string;
  url: string;
}

/** What the back office answered, read by {@link readTokenAnswer}. */
export type TokenAnswer =
  | { readonly state: 'connected'; readonly token: string; readonly expiresAt: number }
  | { readonly state: 'failed'; readonly detail: string }
  | { readonly state: Exclude<LoginState, 'connected' | 'failed'> };

/** Reads the result of {@link GET_TOKEN_EXPRESSION}; never puts the token in `detail`. */
export const readTokenAnswer = (value: unknown): TokenAnswer => {
  if (typeof value !== 'object' || value === null) {
    return { state: 'failed', detail: 'unexpected answer' };
  }
  const answer = value as { error?: unknown; ok?: unknown; code?: unknown; data?: unknown };
  if (answer.error === 'no-controller') return { state: 'no-worker' };
  if (answer.error === 'timeout') {
    return { state: 'failed', detail: 'the service worker did not answer in time' };
  }
  if (typeof answer.error === 'string') return { state: 'failed', detail: answer.error };
  if (answer.ok !== true) {
    return {
      state: 'failed',
      detail: typeof answer.code === 'string' ? answer.code : 'unexpected answer',
    };
  }
  if (answer.data === null || answer.data === undefined) return { state: 'logged-out' };
  if (typeof answer.data !== 'string') return { state: 'unreadable' };
  const expiresAt = jwtExpiresAt(answer.data);
  if (expiresAt === null) return { state: 'unreadable' };
  return { state: 'connected', token: answer.data, expiresAt };
};

/** Why there is no token, for the terminal and the answers of the dev server. */
const reason = (state: Exclude<LoginState, 'connected'>, host: string, detail = ''): string => {
  switch (state) {
    case 'logged-out':
      return `not logged in to ${host}: log in in the Chrome window of bo-widget`;
    case 'no-tab':
      return `no tab of ${host} in the Chrome of bo-widget: open https://${host}/ there and log in`;
    case 'no-worker':
      return `no service worker controls the tab of ${host} yet: wait for it to load, or reload it (without Shift)`;
    case 'unreadable':
      return `${host} gave a token that is not a JWT with an expiry`;
    case 'failed':
      return `cannot ask ${host} for its token (${detail})`;
    case 'chrome-closed':
      return 'the Chrome of bo-widget was closed: restart bo-widget dev --login';
  }
};

/** Message of a CDP failure, with a hint when Chrome did not answer in time. */
const failureDetail = (error: unknown): string => {
  const { message } = error as Error;
  return /timed out/.test(message)
    ? `${message}: is the tab of the back office paused in the debugger, or showing a dialog?`
    : message;
};

/**
 * Follows the session of the back office open in the Chrome of login mode.
 *
 * Asks the back office for its token in the background (every few seconds until the login, then
 * every 30 s, which also keeps the session renewed), and on demand when the cached one expires
 * within {@link RENEW_MARGIN_MS}. Concurrent demands share one request; without a session, the
 * back office is asked at most every {@link RETRY_MS}. Each state change is logged once, without
 * the token.
 *
 * An answer that may be passing keeps a cached token that is still valid: a failure (worker or
 * CDP not answering), a tab not controlled by the worker, or a first `null` (also the answer of a
 * failed renewal), confirmed by a second one a few seconds later. A failure while a token is
 * kept is logged once.
 *
 * @returns The token source; {@link TokenSource.close} stops it.
 */
export const createLoginSession = (options: LoginSessionOptions): TokenSource => {
  const { host, cdp, logger } = options;
  const now = options.now ?? Date.now;
  const origin = `https://${host}`;
  let cached: { token: string; expiresAt: number } | null = null;
  let state: LoginState | null = null;
  let lastReason = reason('logged-out', host);
  let logged = '';
  let missedOnce = false;
  let warnedKeeping = false;
  let lastMiss = Number.NEGATIVE_INFINITY;
  let inflight: Promise<string | null> | null = null;
  let timer: NodeJS.Timeout | undefined;
  let stopped = false;

  const setState = (next: LoginState, detail?: string): void => {
    if (stopped) return;
    state = next;
    const key = `${next} ${detail ?? ''}`;
    if (key === logged) return;
    logged = key;
    if (next === 'connected') {
      logger.info(
        `[bo-widget] Logged in to ${host}: the fake back office calls its API with your session.`,
      );
    } else {
      lastReason = reason(next, host, detail);
      logger.warn(`[bo-widget] No token: ${lastReason}.`);
    }
    options.onState?.(next);
  };

  const ask = async (): Promise<TokenAnswer> => {
    const { targetInfos } = await cdp.send<{ targetInfos: TargetInfo[] }>('Target.getTargets');
    const tab = targetInfos.find(
      (target) =>
        target.type === 'page' && (target.url === origin || target.url.startsWith(`${origin}/`)),
    );
    if (!tab) return { state: 'no-tab' };
    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
      targetId: tab.targetId,
      flatten: true,
    });
    try {
      const { result, exceptionDetails } = await cdp.send<{
        result?: { value?: unknown };
        exceptionDetails?: unknown;
      }>(
        'Runtime.evaluate',
        { expression: GET_TOKEN_EXPRESSION, awaitPromise: true, returnByValue: true },
        { sessionId, timeoutMs: EVALUATE_TIMEOUT_MS },
      );
      if (exceptionDetails) return { state: 'failed', detail: 'script error in the tab' };
      return readTokenAnswer(result?.value);
    } finally {
      // A detach that fails (tab gone meanwhile) leaves nothing to clean up.
      await cdp.send('Target.detachFromTarget', { sessionId }).catch(() => undefined);
    }
  };

  /** Whether `answer` may be passing, so that a still valid cached token is kept. */
  const mayBePassing = (answer: TokenAnswer): boolean => {
    if (answer.state === 'failed' || answer.state === 'no-worker') return true;
    if (answer.state !== 'logged-out' || missedOnce) return false;
    missedOnce = true;
    return true;
  };

  /** The cached token while it is valid, telling once why it is kept after a failure. */
  const keep = (answer: TokenAnswer): string | null => {
    if (!cached || cached.expiresAt <= now()) return null;
    if (answer.state === 'failed' && !warnedKeeping) {
      warnedKeeping = true;
      logger.warn(
        `[bo-widget] ${reason('failed', host, answer.detail)}: the current token is kept until ${new Date(cached.expiresAt).toISOString()}.`,
      );
    }
    return cached.token;
  };

  const refresh = async (): Promise<string | null> => {
    let answer: TokenAnswer;
    try {
      answer = await ask();
    } catch (error) {
      answer = cdp.closed
        ? { state: 'chrome-closed' }
        : { state: 'failed', detail: failureDetail(error) };
    }
    if (stopped) return null;
    if (answer.state === 'connected') {
      cached = { token: answer.token, expiresAt: answer.expiresAt };
      missedOnce = false;
      if (warnedKeeping) logger.info(`[bo-widget] ${host} answers again: the token is renewed.`);
      warnedKeeping = false;
      setState('connected');
      return answer.token;
    }
    if (cached && mayBePassing(answer)) {
      const kept = keep(answer);
      // Kept: the next demands use it without asking again for a while.
      lastMiss = now();
      if (kept !== null) return kept;
    }
    cached = null;
    missedOnce = false;
    lastMiss = now();
    setState(answer.state, answer.state === 'failed' ? answer.detail : undefined);
    return null;
  };

  /** Asks the back office, sharing a request already under way. */
  const askOnce = (): Promise<string | null> => {
    if (stopped || cdp.closed) return Promise.resolve(null);
    inflight ??= refresh().finally(() => {
      inflight = null;
    });
    return inflight;
  };

  const token = (): Promise<string | null> => {
    if (stopped || cdp.closed) return Promise.resolve(null);
    if (cached && cached.expiresAt - now() > RENEW_MARGIN_MS) {
      return Promise.resolve(cached.token);
    }
    if (now() - lastMiss < RETRY_MS) {
      return Promise.resolve(cached && cached.expiresAt > now() ? cached.token : null);
    }
    return askOnce();
  };

  const schedule = (): void => {
    if (stopped || cdp.closed) return;
    // A first `null` while connected is confirmed a few seconds later.
    const delay =
      state === 'connected' && !missedOnce
        ? (options.sessionPollMs ?? 30_000)
        : (options.loginPollMs ?? 2_000);
    timer = setTimeout(() => {
      // Asks even with a valid cached token: detects a logout.
      void askOnce().catch(logUnexpected).finally(schedule);
    }, delay);
    timer.unref();
  };

  /** A bug here (in a logger or `onState`) must not stop the dev server. */
  const logUnexpected = (error: unknown): null => {
    logger.warn(`[bo-widget] Login mode: unexpected error (${(error as Error).message}).`);
    return null;
  };

  cdp.onClose(() => {
    cached = null;
    clearTimeout(timer);
    setState('chrome-closed');
  });
  void token().catch(logUnexpected).finally(schedule);

  return {
    token,
    invalidate(refused) {
      if (cached?.token !== refused) return;
      cached = null;
      lastMiss = Number.NEGATIVE_INFINITY;
    },
    noTokenReason: () => (cdp.closed ? reason('chrome-closed', host) : lastReason),
    close() {
      stopped = true;
      cached = null;
      clearTimeout(timer);
      cdp.close();
    },
  };
};
