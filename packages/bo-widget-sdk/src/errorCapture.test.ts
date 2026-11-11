import { describe, expect, it, vi } from 'vitest';
import { MAX_ERROR_STACK_LENGTH, captureUncaughtErrors } from './errorCapture.js';
import type { BoLogger } from './types.js';

const fakeLogger = () =>
  ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }) satisfies BoLogger;

/** An event of the window, with the fields of `ErrorEvent` or `PromiseRejectionEvent`. */
const windowEvent = (type: string, fields: Record<string, unknown>): Event =>
  Object.assign(new Event(type), fields);

describe('captureUncaughtErrors', () => {
  it('sends an uncaught error with its file, line and stack', () => {
    const target = new EventTarget();
    const log = fakeLogger();
    captureUncaughtErrors(target, log);
    const error = new TypeError('x is undefined');
    target.dispatchEvent(
      windowEvent('error', {
        error,
        message: 'Uncaught TypeError: x is undefined',
        filename: 'https://widgets.example.com/fleet-report/index.js',
        lineno: 12,
        colno: 3,
      }),
    );
    expect(log.error).toHaveBeenCalledWith('Uncaught TypeError: x is undefined', {
      name: 'TypeError',
      stack: error.stack,
      filename: 'https://widgets.example.com/fleet-report/index.js',
      lineno: 12,
      colno: 3,
    });
  });

  it('describes the error when the event has no message, and skips what is unknown', () => {
    const target = new EventTarget();
    const log = fakeLogger();
    captureUncaughtErrors(target, log);
    target.dispatchEvent(
      windowEvent('error', { error: { name: 'Oops', message: 'bad' }, lineno: 0 }),
    );
    expect(log.error).toHaveBeenCalledWith('Oops: bad', { name: 'Oops' });
  });

  it('sends an uncaught error that is not an Error', () => {
    const target = new EventTarget();
    const log = fakeLogger();
    captureUncaughtErrors(target, log);
    target.dispatchEvent(windowEvent('error', { error: 'just a string' }));
    expect(log.error).toHaveBeenCalledWith('just a string', {});
  });

  it('sends an unhandled rejection', () => {
    const target = new EventTarget();
    const log = fakeLogger();
    captureUncaughtErrors(target, log);
    const reason = new Error('fetch failed');
    target.dispatchEvent(windowEvent('unhandledrejection', { reason }));
    expect(log.error).toHaveBeenCalledWith('Unhandled rejection: Error: fetch failed', {
      name: 'Error',
      stack: reason.stack,
    });
  });

  it('sends a rejection with a reason that is not an Error, even unprintable', () => {
    const target = new EventTarget();
    const log = fakeLogger();
    captureUncaughtErrors(target, log);
    target.dispatchEvent(windowEvent('unhandledrejection', { reason: 404 }));
    target.dispatchEvent(windowEvent('unhandledrejection', { reason: Object.create(null) }));
    expect(log.error).toHaveBeenNthCalledWith(1, 'Unhandled rejection: 404', {});
    expect(log.error).toHaveBeenNthCalledWith(2, 'Unhandled rejection: unprintable value', {});
  });

  it('cuts a long stack', () => {
    const target = new EventTarget();
    const log = fakeLogger();
    captureUncaughtErrors(target, log);
    const reason = {
      name: 'Error',
      message: 'deep',
      stack: 'x'.repeat(MAX_ERROR_STACK_LENGTH * 2),
    };
    target.dispatchEvent(windowEvent('unhandledrejection', { reason }));
    const context = log.error.mock.calls[0]?.[1] as { stack: string };
    expect(context.stack).toHaveLength(MAX_ERROR_STACK_LENGTH);
    expect(context.stack.endsWith('…')).toBe(true);
  });

  it('does not prevent the event: it still reaches the browser console', () => {
    const target = new EventTarget();
    captureUncaughtErrors(target, fakeLogger());
    const event = new Event('error', { cancelable: true });
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('stops capturing once stopped', () => {
    const target = new EventTarget();
    const log = fakeLogger();
    const stop = captureUncaughtErrors(target, log);
    stop();
    target.dispatchEvent(windowEvent('error', { error: new Error('late') }));
    target.dispatchEvent(windowEvent('unhandledrejection', { reason: new Error('late') }));
    expect(log.error).not.toHaveBeenCalled();
  });
});
