import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CdpConnection, CdpSendOptions } from './cdp.js';
import {
  createLoginSession,
  EVALUATE_TIMEOUT_MS,
  GET_TOKEN_EXPRESSION,
  readTokenAnswer,
  RENEW_MARGIN_MS,
  RETRY_MS,
  type LoginSessionOptions,
  type TokenSource,
} from './session.js';

const HOST = 'bo.example.com';
const START = Date.parse('2026-11-06T12:00:00Z');

/** A JWT expiring `inMs` after now (fake clock). */
const jwt = (name: string, inMs = 300_000): string =>
  [
    'e30',
    Buffer.from(JSON.stringify({ sub: name, exp: (Date.now() + inMs) / 1000 })).toString(
      'base64url',
    ),
    'sig',
  ].join('.');

type Call = [method: string, params?: Record<string, unknown>, options?: CdpSendOptions];

/**
 * Stands for Chrome on the other end of CDP: its tabs, and what the auth service worker of the
 * back office answers in the tab. Records the commands, checked after the fact.
 */
const fakeChrome = () => {
  const state = {
    tabs: [{ targetId: 'bo', type: 'page', url: `https://${HOST}/app/vehicles` }],
    answer: (): unknown => ({ ok: true, data: null }),
    evaluate: null as null | (() => Promise<unknown>),
    attachError: null as Error | null,
  };
  const listeners: (() => void)[] = [];
  const calls: Call[] = [];
  let closed = false;
  const send = async (...call: Call): Promise<unknown> => {
    calls.push(call);
    await Promise.resolve();
    if (closed) throw new Error('CDP connection closed');
    switch (call[0]) {
      case 'Target.getTargets':
        return { targetInfos: state.tabs };
      case 'Target.attachToTarget':
        if (state.attachError) throw state.attachError;
        return { sessionId: 'session-1' };
      case 'Runtime.evaluate':
        if (state.evaluate) return state.evaluate();
        return { result: { value: state.answer() } };
      case 'Target.detachFromTarget':
        return {};
      default:
        throw new Error(`unexpected ${call[0]}`);
    }
  };
  const cdp: CdpConnection = {
    send: send as CdpConnection['send'],
    onClose: (listener) => listeners.push(listener),
    get closed() {
      return closed;
    },
    close: () => {
      closed = true;
      for (const listener of listeners.splice(0)) listener();
    },
  };
  const asks = () => calls.filter(([method]) => method === 'Runtime.evaluate').length;
  return { cdp, state, calls, asks };
};

describe('createLoginSession', () => {
  let sessions: TokenSource[];
  let logger: {
    info: ReturnType<typeof vi.fn<(message: string) => void>>;
    warn: ReturnType<typeof vi.fn<(message: string) => void>>;
  };
  const tokens: string[] = [];

  /** Every message logged so far. */
  const logged = (): string[] =>
    [...logger.info.mock.calls, ...logger.warn.mock.calls].map((call) => String(call[0]));

  const start = (
    chrome: ReturnType<typeof fakeChrome>,
    options: Partial<LoginSessionOptions> = {},
  ): TokenSource => {
    const session = createLoginSession({
      host: HOST,
      cdp: chrome.cdp,
      logger,
      loginPollMs: 3_600_000,
      sessionPollMs: 3_600_000,
      ...options,
    });
    sessions.push(session);
    return session;
  };

  /** Lets the request started with the session settle. */
  const settle = () => vi.advanceTimersByTimeAsync(0);

  const token = (name: string, inMs?: number): string => {
    const value = jwt(name, inMs);
    tokens.push(value);
    return value;
  };

  beforeEach(() => {
    vi.useFakeTimers({ now: START });
    sessions = [];
    logger = { info: vi.fn(), warn: vi.fn() };
  });

  afterEach(() => {
    for (const session of sessions) session.close();
    // The token never reaches the terminal, whatever happened.
    for (const message of logged()) {
      for (const value of tokens) expect(message).not.toContain(value);
    }
    tokens.length = 0;
    vi.useRealTimers();
  });

  it('gives the first token of the session, and logs the login once', async () => {
    const chrome = fakeChrome();
    const first = token('first');
    chrome.state.answer = () => ({ ok: true, data: first });
    const onState = vi.fn();
    const session = start(chrome, { onState });

    expect(await session.token()).toBe(first);
    expect(await session.token()).toBe(first);

    expect(chrome.asks()).toBe(1);
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(`Logged in to ${HOST}`));
    expect(onState).toHaveBeenCalledTimes(1);
    expect(onState).toHaveBeenCalledWith('connected');
  });

  it('asks the worker in the tab of the back office, then detaches', async () => {
    const chrome = fakeChrome();
    chrome.state.answer = () => ({ ok: true, data: token('first') });
    const session = start(chrome);
    await session.token();

    expect(chrome.calls).toEqual([
      ['Target.getTargets'],
      ['Target.attachToTarget', { targetId: 'bo', flatten: true }],
      [
        'Runtime.evaluate',
        { expression: GET_TOKEN_EXPRESSION, awaitPromise: true, returnByValue: true },
        { sessionId: 'session-1', timeoutMs: EVALUATE_TIMEOUT_MS },
      ],
      ['Target.detachFromTarget', { sessionId: 'session-1' }],
    ]);
  });

  it('asks again for the renewed token when the cached one expires within a minute', async () => {
    const chrome = fakeChrome();
    const first = token('first', 300_000);
    chrome.state.answer = () => ({ ok: true, data: first });
    const session = start(chrome);
    await settle();
    const renewed = token('renewed', 600_000);
    chrome.state.answer = () => ({ ok: true, data: renewed });

    vi.setSystemTime(START + 300_000 - RENEW_MARGIN_MS - 1);
    expect(await session.token()).toBe(first);
    vi.setSystemTime(START + 300_000 - RENEW_MARGIN_MS + 1);
    expect(await session.token()).toBe(renewed);

    expect(chrome.asks()).toBe(2);
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('shares one request between concurrent calls', async () => {
    const chrome = fakeChrome();
    const first = token('first');
    chrome.state.answer = () => ({ ok: true, data: first });
    const session = start(chrome);

    const all = await Promise.all([session.token(), session.token(), session.token()]);

    expect(all).toEqual([first, first, first]);
    expect(chrome.asks()).toBe(1);
  });

  it('gives null without a session, with one message, asking at most once per retry delay', async () => {
    const chrome = fakeChrome();
    const session = start(chrome);

    expect(await session.token()).toBeNull();
    expect(await session.token()).toBeNull();
    expect(chrome.asks()).toBe(1);
    vi.setSystemTime(Date.now() + RETRY_MS);
    expect(await session.token()).toBeNull();

    expect(chrome.asks()).toBe(2);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      `[bo-widget] No token: not logged in to ${HOST}: log in in the Chrome window of bo-widget.`,
    );
    expect(session.noTokenReason()).toBe(
      `not logged in to ${HOST}: log in in the Chrome window of bo-widget`,
    );
  });

  it('confirms a logout with a second answer a few seconds later', async () => {
    const chrome = fakeChrome();
    const first = token('first');
    chrome.state.answer = () => ({ ok: true, data: first });
    const onState = vi.fn();
    const session = start(chrome, { onState, loginPollMs: 2_000, sessionPollMs: 30_000 });
    await settle();
    chrome.state.answer = () => ({ ok: true, data: null });

    await vi.advanceTimersByTimeAsync(30_000);
    expect(await session.token()).toBe(first);
    expect(onState).toHaveBeenLastCalledWith('connected');

    await vi.advanceTimersByTimeAsync(2_000);
    expect(onState).toHaveBeenLastCalledWith('logged-out');
    expect(await session.token()).toBeNull();
    expect(chrome.asks()).toBe(3);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('keeps the token when the second answer brings it back (a failed renewal)', async () => {
    const chrome = fakeChrome();
    const first = token('first');
    chrome.state.answer = () => ({ ok: true, data: first });
    const onState = vi.fn();
    const session = start(chrome, { onState, loginPollMs: 2_000, sessionPollMs: 30_000 });
    await settle();
    chrome.state.answer = () => ({ ok: true, data: null });
    await vi.advanceTimersByTimeAsync(30_000);
    chrome.state.answer = () => ({ ok: true, data: first });

    await vi.advanceTimersByTimeAsync(2_000);

    expect(onState).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(await session.token()).toBe(first);
  });

  it('logs the login again after a logout', async () => {
    const chrome = fakeChrome();
    const session = start(chrome);
    await settle();
    const again = token('again');
    chrome.state.answer = () => ({ ok: true, data: again });
    vi.setSystemTime(Date.now() + RETRY_MS);

    expect(await session.token()).toBe(again);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('tells to reload a tab the auth worker does not control', async () => {
    const chrome = fakeChrome();
    chrome.state.answer = () => ({ error: 'no-controller' });
    const session = start(chrome);

    expect(await session.token()).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`no service worker controls the tab of ${HOST} yet`),
    );
  });

  it('keeps a valid token when the tab is not controlled for a while (hard reload)', async () => {
    const chrome = fakeChrome();
    const first = token('first');
    chrome.state.answer = () => ({ ok: true, data: first });
    const session = start(chrome, { sessionPollMs: 30_000 });
    await settle();
    chrome.state.answer = () => ({ error: 'no-controller' });

    await vi.advanceTimersByTimeAsync(30_000);

    expect(await session.token()).toBe(first);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('gives null for a token that is not a JWT with an expiry, without logging it', async () => {
    const chrome = fakeChrome();
    const unreadable = 'opaque-secret-value';
    tokens.push(unreadable);
    chrome.state.answer = () => ({ ok: true, data: unreadable });
    const session = start(chrome);

    expect(await session.token()).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('not a JWT with an expiry'));
  });

  it('asks the user to open the back office when no tab shows it', async () => {
    const chrome = fakeChrome();
    chrome.state.tabs = [
      { targetId: 'other', type: 'page', url: `https://${HOST}.evil.example/` },
      { targetId: 'worker', type: 'service_worker', url: `https://${HOST}/auth-sw.js` },
    ];
    const session = start(chrome);

    expect(await session.token()).toBeNull();
    expect(chrome.asks()).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `no tab of ${HOST} in the Chrome of bo-widget: open https://${HOST}/`,
      ),
    );
  });

  it.each([
    ['the worker fails', { ok: false, code: 'INTERNAL_ERROR' }, 'INTERNAL_ERROR'],
    [
      'the worker does not answer in time',
      { error: 'timeout' },
      'the service worker did not answer in time',
    ],
  ])('gives null with the reason when %s', async (_label, answer, detail) => {
    const chrome = fakeChrome();
    chrome.state.answer = () => answer;
    const session = start(chrome);

    expect(await session.token()).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`cannot ask ${HOST} for its token (${detail})`),
    );
  });

  it('gives null with the reason when the script throws in the tab', async () => {
    const chrome = fakeChrome();
    chrome.state.evaluate = () => Promise.resolve({ exceptionDetails: { text: 'boom' } });
    const session = start(chrome);

    expect(await session.token()).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('(script error in the tab)'));
  });

  it('points at a paused or blocked tab when CDP does not answer in time', async () => {
    const chrome = fakeChrome();
    chrome.state.evaluate = () =>
      Promise.reject(new Error('CDP Runtime.evaluate timed out after 20 s'));
    const session = start(chrome);

    expect(await session.token()).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('timed out after 20 s: is the tab of the back office paused'),
    );
    expect(chrome.calls.at(-1)?.[0]).toBe('Target.detachFromTarget');
  });

  it('reports a CDP error when the tab goes away between listing and attaching', async () => {
    const chrome = fakeChrome();
    chrome.state.attachError = new Error('CDP error: No target with given id');
    const session = start(chrome);

    expect(await session.token()).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('(CDP error: No target with given id)'),
    );
  });

  it('logs a new failure reason again, but not the same one', async () => {
    const chrome = fakeChrome();
    chrome.state.answer = () => ({ ok: false, code: 'A' });
    const session = start(chrome);
    await settle();
    vi.setSystemTime(Date.now() + RETRY_MS);
    await session.token();
    chrome.state.answer = () => ({ ok: false, code: 'B' });
    vi.setSystemTime(Date.now() + RETRY_MS);
    await session.token();

    expect(logger.warn.mock.calls.map(([message]) => message)).toEqual([
      expect.stringContaining('(A)'),
      expect.stringContaining('(B)'),
    ]);
  });

  it('keeps a valid token when the worker answers late, telling it once', async () => {
    const chrome = fakeChrome();
    const first = token('first');
    chrome.state.answer = () => ({ ok: true, data: first });
    const onState = vi.fn();
    const session = start(chrome, { onState, sessionPollMs: 30_000 });
    await settle();
    chrome.state.answer = () => ({ error: 'timeout' });

    await vi.advanceTimersByTimeAsync(60_000);

    expect(chrome.asks()).toBe(3);
    expect(onState).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('the current token is kept until 2026-11-06T12:05:00.000Z'),
    );
    expect(await session.token()).toBe(first);
  });

  it('does not ask again at each demand while it keeps a token after a failure', async () => {
    const chrome = fakeChrome();
    const first = token('first', 50_000);
    chrome.state.answer = () => ({ ok: true, data: first });
    const session = start(chrome);
    await settle();
    chrome.state.answer = () => ({ error: 'timeout' });

    expect(await session.token()).toBe(first);
    expect(await session.token()).toBe(first);
    expect(await session.token()).toBe(first);
    expect(chrome.asks()).toBe(2);
    vi.setSystemTime(Date.now() + RETRY_MS);
    expect(await session.token()).toBe(first);
    expect(chrome.asks()).toBe(3);
  });

  it('tells when the back office answers again after a failure', async () => {
    const chrome = fakeChrome();
    const first = token('first', 50_000);
    chrome.state.answer = () => ({ ok: true, data: first });
    const session = start(chrome);
    await settle();
    chrome.state.answer = () => ({ error: 'timeout' });
    await session.token();
    const renewed = token('renewed');
    chrome.state.answer = () => ({ ok: true, data: renewed });
    vi.setSystemTime(Date.now() + RETRY_MS);

    expect(await session.token()).toBe(renewed);
    expect(logger.info).toHaveBeenLastCalledWith(
      `[bo-widget] ${HOST} answers again: the token is renewed.`,
    );
  });

  it('logs an unexpected error of the background check instead of stopping the server', async () => {
    const chrome = fakeChrome();
    chrome.state.answer = () => ({ ok: true, data: token('first') });
    start(chrome, {
      onState: () => {
        throw new Error('bug in onState');
      },
    });
    await settle();

    expect(logger.warn).toHaveBeenCalledWith(
      '[bo-widget] Login mode: unexpected error (bug in onState).',
    );
  });

  it('gives null when the worker fails and the cached token has expired', async () => {
    const chrome = fakeChrome();
    chrome.state.answer = () => ({ ok: true, data: token('first', 30_000) });
    const session = start(chrome);
    await settle();
    chrome.state.answer = () => ({ error: 'timeout' });
    vi.setSystemTime(Date.now() + 31_000);

    expect(await session.token()).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('did not answer in time'));
  });

  it('gives null for good once Chrome is closed, with one message, and stops asking', async () => {
    const chrome = fakeChrome();
    chrome.state.answer = () => ({ ok: true, data: token('first') });
    const onState = vi.fn();
    const session = start(chrome, { onState, loginPollMs: 2_000, sessionPollMs: 2_000 });
    await settle();

    chrome.cdp.close();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await session.token()).toBeNull();
    expect(chrome.asks()).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(onState).toHaveBeenLastCalledWith('chrome-closed');
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('the Chrome of bo-widget was closed: restart bo-widget dev --login'),
    );
    expect(session.noTokenReason()).toContain('was closed');
  });

  it('reports Chrome closed when the connection breaks during a request', async () => {
    const chrome = fakeChrome();
    chrome.state.answer = () => {
      chrome.cdp.close();
      throw new Error('CDP connection closed');
    };
    const session = start(chrome);
    await settle();

    expect(await session.token()).toBeNull();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('was closed'));
  });

  it('forgets a token the API refused, and only that one', async () => {
    const chrome = fakeChrome();
    const first = token('first');
    chrome.state.answer = () => ({ ok: true, data: first });
    const session = start(chrome);
    await settle();

    session.invalidate('another-token');
    expect(await session.token()).toBe(first);
    expect(chrome.asks()).toBe(1);

    session.invalidate(first);
    expect(await session.token()).toBe(first);
    expect(chrome.asks()).toBe(2);
  });

  it('detects the login in the background', async () => {
    const chrome = fakeChrome();
    const onState = vi.fn();
    start(chrome, { onState, loginPollMs: 2_000, sessionPollMs: 30_000 });
    await settle();
    expect(onState).toHaveBeenLastCalledWith('logged-out');

    chrome.state.answer = () => ({ ok: true, data: token('first') });
    await vi.advanceTimersByTimeAsync(2_000);

    expect(onState).toHaveBeenLastCalledWith('connected');
  });

  it('stops asking and closes the connection on close, without a message', async () => {
    const chrome = fakeChrome();
    const session = start(chrome, { loginPollMs: 2_000 });
    await settle();
    const before = chrome.asks();

    session.close();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(chrome.cdp.closed).toBe(true);
    expect(chrome.asks()).toBe(before);
    expect(await session.token()).toBeNull();
    expect(logged().filter((message) => message.includes('closed'))).toEqual([]);
  });

  it('logs nothing when closed during a request', async () => {
    const chrome = fakeChrome();
    let answer: (value: unknown) => void = () => undefined;
    chrome.state.evaluate = () => new Promise((resolve) => (answer = resolve));
    const onState = vi.fn();
    const session = start(chrome, { onState });
    await settle();

    session.close();
    answer({ result: { value: { ok: true, data: token('late') } } });
    await settle();

    expect(onState).not.toHaveBeenCalled();
    expect(logged()).toEqual([]);
  });
});

describe('GET_TOKEN_EXPRESSION', () => {
  /** Runs the script as the tab would, with `controller` as the worker controlling it. */
  const run = (controller: unknown): Promise<unknown> => {
    vi.stubGlobal('navigator', { serviceWorker: { controller } });
    return (new Function(`return ${GET_TOKEN_EXPRESSION}`) as () => Promise<unknown>)();
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('asks the worker over a transferred port and gives its answer', async () => {
    const postMessage = vi.fn((message: unknown, ports: MessagePort[]) => {
      ports[0]?.postMessage({ ok: true, data: 'answer-of-the-worker' });
    });

    expect(await run({ postMessage })).toEqual({ ok: true, data: 'answer-of-the-worker' });
    expect(postMessage).toHaveBeenCalledWith(
      { type: 'AUTH_GET_ACCESS_TOKEN', id: expect.any(String) },
      [expect.any(MessagePort)],
    );
  });

  it('tells when no worker controls the tab', async () => {
    expect(await run(null)).toEqual({ error: 'no-controller' });
  });

  it('gives up when the worker does not answer within 15 s', async () => {
    vi.useFakeTimers();
    const answer = run({ postMessage: vi.fn() });

    await vi.advanceTimersByTimeAsync(15_000);

    expect(await answer).toEqual({ error: 'timeout' });
  });
});

describe('readTokenAnswer', () => {
  it('reads a token and its expiry', () => {
    const value = jwt('x', 60_000);
    const answer = readTokenAnswer({ ok: true, data: value });

    expect(answer).toEqual({ state: 'connected', token: value, expiresAt: expect.any(Number) });
  });

  it.each([
    [null, 'failed'],
    ['text', 'failed'],
    [{ ok: true, data: null }, 'logged-out'],
    [{ ok: true }, 'logged-out'],
    [{ error: 'no-controller' }, 'no-worker'],
    [{ error: 'timeout' }, 'failed'],
    [{ error: 'other' }, 'failed'],
    [{ ok: true, data: 42 }, 'unreadable'],
    [{ ok: true, data: 'a.b.c' }, 'unreadable'],
    [{ ok: false }, 'failed'],
  ])('reads %j as %s', (value, state) => {
    expect(readTokenAnswer(value).state).toBe(state);
  });
});
