import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOG_REPEAT_WINDOW_MS,
  MAX_LOG_CONTEXT_BYTES,
  MAX_LOG_MESSAGE_LENGTH,
  MAX_LOG_REPEAT_KEYS,
  createLogger,
  toLogContext,
  toLogMessage,
} from './log.js';
import type { BoLogContext, BoLogLevel } from './types.js';

describe('toLogMessage', () => {
  it('keeps a string message', () => {
    expect(toLogMessage('Export failed')).toBe('Export failed');
  });

  it('turns another value into a string', () => {
    expect(toLogMessage(404)).toBe('404');
    expect(toLogMessage(new Error('boom'))).toBe('Error: boom');
  });

  it('ignores a blank message', () => {
    expect(toLogMessage('')).toBeNull();
    expect(toLogMessage('  \n')).toBeNull();
  });

  it('ignores a value that cannot be turned into a string', () => {
    expect(toLogMessage(Object.create(null))).toBeNull();
    expect(
      toLogMessage({
        toString() {
          throw new Error('no');
        },
      }),
    ).toBeNull();
  });

  it('cuts a message longer than the limit, with an ellipsis', () => {
    const message = toLogMessage('x'.repeat(MAX_LOG_MESSAGE_LENGTH + 10));
    expect(message).toHaveLength(MAX_LOG_MESSAGE_LENGTH);
    expect(message?.endsWith('…')).toBe(true);
  });

  it('keeps a message of exactly the limit', () => {
    const text = 'x'.repeat(MAX_LOG_MESSAGE_LENGTH);
    expect(toLogMessage(text)).toBe(text);
  });
});

describe('toLogContext', () => {
  it('returns undefined without context', () => {
    expect(toLogContext(undefined)).toBeUndefined();
    expect(toLogContext(null)).toBeUndefined();
  });

  it('returns a JSON copy that the widget can no longer change', () => {
    const context = { status: 500, at: new Date('2026-11-11T10:00:00Z'), skip: () => 1 };
    const copy = toLogContext(context);
    expect(copy).toEqual({ status: 500, at: '2026-11-11T10:00:00.000Z' });
    context.status = 200;
    expect(copy?.status).toBe(500);
  });

  it('drops the keys named __proto__', () => {
    const context = JSON.parse('{"__proto__": {"polluted": true}, "ok": 1}') as BoLogContext;
    const copy = toLogContext(context);
    expect(copy).toEqual({ ok: 1 });
    expect(Object.hasOwn(copy ?? {}, '__proto__')).toBe(false);
  });

  it('truncates a context bigger than the limit', () => {
    expect(toLogContext({ data: 'x'.repeat(MAX_LOG_CONTEXT_BYTES) })).toEqual({ truncated: true });
  });

  it('counts the bytes, not the characters', () => {
    // 3 bytes each in UTF-8: fewer characters than the limit, more bytes.
    expect(toLogContext({ data: '€'.repeat(MAX_LOG_CONTEXT_BYTES / 2) })).toEqual({
      truncated: true,
    });
  });

  it('keeps a context of 5 levels and truncates a deeper one', () => {
    const five = { a: { b: { c: { d: { e: 1 } } } } };
    expect(toLogContext(five)).toEqual(five);
    expect(toLogContext({ a: { b: { c: { d: { e: { f: 1 } } } } } })).toEqual({ truncated: true });
  });

  it('truncates a circular context', () => {
    const context: Record<string, unknown> = {};
    context.self = context;
    expect(toLogContext(context)).toEqual({ truncated: true });
  });

  it('truncates a context JSON cannot serialize', () => {
    expect(toLogContext({ big: 1n })).toEqual({ truncated: true });
    expect(
      toLogContext({
        toJSON() {
          throw new Error('no');
        },
      }),
    ).toEqual({ truncated: true });
    expect(toLogContext({ toJSON: () => undefined })).toEqual({ truncated: true });
    expect(toLogContext({ toJSON: () => 'text' })).toEqual({ truncated: true });
  });

  it('truncates a context that is not an object', () => {
    expect(toLogContext('text')).toEqual({ truncated: true });
    expect(toLogContext(42)).toEqual({ truncated: true });
    expect(toLogContext([1, 2])).toEqual({ truncated: true });
  });
});

describe('createLogger', () => {
  type Sent = [BoLogLevel, string, BoLogContext | undefined];
  let sent: Sent[];
  const send = (level: BoLogLevel, message: string, context: BoLogContext | undefined) => {
    sent.push([level, message, context]);
  };

  beforeEach(() => {
    sent = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends a log of each level', () => {
    const { api } = createLogger(send);
    api.debug('d');
    api.info('i', { step: 1 });
    api.warn('w');
    api.error('e', { status: 500 });
    expect(sent).toEqual([
      ['debug', 'd', undefined],
      ['info', 'i', { step: 1 }],
      ['warn', 'w', undefined],
      ['error', 'e', { status: 500 }],
    ]);
  });

  it('gives frozen methods that return nothing', () => {
    const { api } = createLogger(send);
    expect(Object.isFrozen(api)).toBe(true);
    expect(api.warn('w')).toBeUndefined();
  });

  it('never throws, even for a message or a context it cannot read', () => {
    const { api } = createLogger(send);
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => api.error(Object.create(null) as string)).not.toThrow();
    expect(() => api.error('circular', circular)).not.toThrow();
    expect(sent).toEqual([['error', 'circular', { truncated: true }]]);
  });

  it('ignores a blank message', () => {
    const { api } = createLogger(send);
    api.warn('   ');
    expect(sent).toEqual([]);
  });

  it('caps the message and the context it sends', () => {
    const { api } = createLogger(send);
    api.warn('x'.repeat(MAX_LOG_MESSAGE_LENGTH + 1), { data: 'x'.repeat(MAX_LOG_CONTEXT_BYTES) });
    expect(sent[0]?.[1]).toHaveLength(MAX_LOG_MESSAGE_LENGTH);
    expect(sent[0]?.[2]).toEqual({ truncated: true });
  });

  it('groups the repeats of a log and sends their count at the end of the window', () => {
    const { api } = createLogger(send);
    for (let i = 0; i < 5; i += 1) api.warn('Retrying', { attempt: 1 });
    expect(sent).toEqual([['warn', 'Retrying', { attempt: 1 }]]);
    vi.advanceTimersByTime(LOG_REPEAT_WINDOW_MS);
    expect(sent).toEqual([
      ['warn', 'Retrying', { attempt: 1 }],
      ['warn', 'Retrying', { attempt: 1, repeated: 4 }],
    ]);
  });

  it('sends nothing more at the end of the window without repeats, and starts over after it', () => {
    const { api } = createLogger(send);
    api.warn('Once');
    vi.advanceTimersByTime(LOG_REPEAT_WINDOW_MS);
    expect(sent).toHaveLength(1);
    api.warn('Once');
    expect(sent).toEqual([
      ['warn', 'Once', undefined],
      ['warn', 'Once', undefined],
    ]);
  });

  it('sends a log repeated without end once per window', () => {
    const { api } = createLogger(send);
    api.error('Loop');
    for (let window = 0; window < 3; window += 1) {
      api.error('Loop');
      api.error('Loop');
      vi.advanceTimersByTime(LOG_REPEAT_WINDOW_MS);
    }
    expect(sent).toEqual([
      ['error', 'Loop', undefined],
      ['error', 'Loop', { repeated: 2 }],
      ['error', 'Loop', { repeated: 2 }],
      ['error', 'Loop', { repeated: 2 }],
    ]);
    vi.advanceTimersByTime(LOG_REPEAT_WINDOW_MS);
    expect(sent).toHaveLength(4);
  });

  it('tells logs apart by level, message and context', () => {
    const { api } = createLogger(send);
    api.warn('Same');
    api.error('Same');
    api.warn('Other');
    api.warn('Same', { a: 1 });
    api.warn('Same', { a: 2 });
    expect(sent).toHaveLength(5);
  });

  it('replaces a repeated key of the context with the count', () => {
    const { api } = createLogger(send);
    api.info('Tick', { repeated: 'mine' });
    api.info('Tick', { repeated: 'mine' });
    vi.advanceTimersByTime(LOG_REPEAT_WINDOW_MS);
    expect(sent[1]).toEqual(['info', 'Tick', { repeated: 1 }]);
  });

  it('closes the oldest followed log beyond the limit, sending its repeats', () => {
    const { api } = createLogger(send);
    api.warn('first');
    api.warn('first');
    for (let i = 0; i < MAX_LOG_REPEAT_KEYS; i += 1) api.warn(`log ${i}`);
    expect(sent.at(-1)).toEqual(['warn', 'first', { repeated: 1 }]);
    // No longer followed: sent again at once.
    api.warn('first');
    expect(sent.at(-1)).toEqual(['warn', 'first', undefined]);
  });

  it('sends the counted repeats on stop, then drops every log', () => {
    const logger = createLogger(send);
    logger.api.warn('Bye');
    logger.api.warn('Bye');
    logger.stop();
    expect(sent).toEqual([
      ['warn', 'Bye', undefined],
      ['warn', 'Bye', { repeated: 1 }],
    ]);
    logger.api.error('After');
    vi.advanceTimersByTime(LOG_REPEAT_WINDOW_MS);
    logger.stop();
    expect(sent).toHaveLength(2);
  });
});
