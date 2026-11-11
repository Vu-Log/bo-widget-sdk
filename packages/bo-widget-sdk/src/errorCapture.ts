import type { BoLogContext, BoLogger } from './types.js';

/** Longest stack sent with an uncaught error, in UTF-16 code units. */
export const MAX_ERROR_STACK_LENGTH = 1500;

/** The window whose uncaught errors are captured. */
export interface ErrorEventTarget {
  addEventListener(type: 'error' | 'unhandledrejection', listener: (event: Event) => void): void;
  removeEventListener(type: 'error' | 'unhandledrejection', listener: (event: Event) => void): void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

/** `name: message` of an error, or the value as a string. */
const describe = (value: unknown): string => {
  if (isRecord(value)) {
    const name = readString(value.name);
    const message = readString(value.message);
    if (message !== undefined) return name ? `${name}: ${message}` : message;
  }
  try {
    return String(value);
  } catch {
    return 'unprintable value';
  }
};

/** `name` and the stack, cut, of an error; nothing for another value. */
const errorDetails = (value: unknown): BoLogContext => {
  if (!isRecord(value)) return {};
  const details: BoLogContext = {};
  const name = readString(value.name);
  if (name) details.name = name;
  const stack = readString(value.stack);
  if (stack) {
    details.stack =
      stack.length > MAX_ERROR_STACK_LENGTH
        ? `${stack.slice(0, MAX_ERROR_STACK_LENGTH - 1)}…`
        : stack;
  }
  return details;
};

/**
 * Sends the errors nobody catches in the window of an iframe widget as `error` logs: `error`
 * events (with the file, line and column) and `unhandledrejection` events (message prefixed with
 * `Unhandled rejection:`). They are not prevented: they still show in the browser console.
 *
 * @param target - The window of the iframe.
 * @param log - The logger of the client.
 * @returns A function that stops the capture.
 */
export const captureUncaughtErrors = (target: ErrorEventTarget, log: BoLogger): (() => void) => {
  const onError = (event: Event): void => {
    const { error, message, filename, lineno, colno } = event as ErrorEvent;
    const context: BoLogContext = { ...errorDetails(error) };
    if (readString(filename)) context.filename = filename;
    if (typeof lineno === 'number' && lineno > 0) context.lineno = lineno;
    if (typeof colno === 'number' && colno > 0) context.colno = colno;
    log.error(readString(message) ?? describe(error), context);
  };
  const onRejection = (event: Event): void => {
    const { reason } = event as PromiseRejectionEvent;
    log.error(`Unhandled rejection: ${describe(reason)}`, errorDetails(reason));
  };
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
};
