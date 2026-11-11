import { MAX_ERROR_STACK_LENGTH } from './errorCapture.js';
import type { BoLogContext, BoLogger, BoLogLevel } from './types.js';

/** Longest message sent, in UTF-16 code units (the back office cuts at the same length). */
export const MAX_LOG_MESSAGE_LENGTH = 2048;

/**
 * Largest context sent, in bytes of its JSON. Below the 4 KB of the back office, which adds its
 * own data to the context.
 */
export const MAX_LOG_CONTEXT_BYTES = 3072;

/** Deepest context sent: an object of objects nested 5 levels at most. */
export const MAX_LOG_CONTEXT_DEPTH = 5;

/** Time during which the same log is counted instead of sent again, in ms. */
export const LOG_REPEAT_WINDOW_MS = 10_000;

/** Distinct logs followed for repeats at the same time; the oldest is closed beyond. */
export const MAX_LOG_REPEAT_KEYS = 100;

/** Message sent instead of a blank one, so that its context is not lost. */
export const EMPTY_LOG_MESSAGE = '(empty message)';

/** Message sent instead of one that cannot be turned into a string. */
export const UNPRINTABLE_LOG_MESSAGE = '(unprintable message)';

/** Why a context was replaced by `{ truncated: true, reason }`. */
export type TruncatedReason = 'not-an-object' | 'not-serializable' | 'too-big' | 'too-deep';

const truncated = (reason: TruncatedReason): BoLogContext => ({ truncated: true, reason });

/** Cuts `text` to `max` UTF-16 code units, the last one being `…`. */
const cut = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** The function a logger sends its logs with: the transport's `log`. */
export type LogSender = (
  level: BoLogLevel,
  message: string,
  context: BoLogContext | undefined,
) => void;

/**
 * The message of a log, as sent: a string, cut to {@link MAX_LOG_MESSAGE_LENGTH} with `…`. A
 * blank message becomes {@link EMPTY_LOG_MESSAGE}, and one that cannot be turned into a string
 * {@link UNPRINTABLE_LOG_MESSAGE}: the log and its context are still sent.
 */
export const toLogMessage = (message: unknown): string => {
  let text: string;
  try {
    text = String(message);
  } catch {
    // An object without `toString` (`Object.create(null)`), or whose `toString` throws.
    return UNPRINTABLE_LOG_MESSAGE;
  }
  if (!text.trim()) return EMPTY_LOG_MESSAGE;
  return cut(text, MAX_LOG_MESSAGE_LENGTH);
};

const isError = (value: unknown): value is Error =>
  Object.prototype.toString.call(value) === '[object Error]';

/**
 * Replacer of the context JSON: drops `__proto__` keys, and keeps the `name`, `message` and
 * stack (cut) of an `Error`, which JSON would turn into `{}`.
 */
const contextReplacer = (key: string, value: unknown): unknown => {
  if (key === '__proto__') return undefined;
  if (!isError(value)) return value;
  const stack =
    typeof value.stack === 'string' ? cut(value.stack, MAX_ERROR_STACK_LENGTH) : undefined;
  return { name: value.name, message: value.message, stack };
};

const depthOf = (value: unknown): number => {
  if (typeof value !== 'object' || value === null) return 0;
  let deepest = 0;
  for (const item of Object.values(value)) deepest = Math.max(deepest, depthOf(item));
  return deepest + 1;
};

const isPlainContext = (value: unknown): value is BoLogContext =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The context of a log, as sent: a JSON copy, which can be posted on a port and that the widget
 * can no longer change. An `Error`, in it or as the context itself, keeps its `name`, `message`
 * and stack. Keys named
 * `__proto__` are dropped.
 *
 * @returns `undefined` without context, or `{ truncated: true, reason }` for a context that is
 * not a plain object (an array, a string…: `not-an-object`), that JSON cannot serialize (circular,
 * a `BigInt`, a `toJSON` that throws: `not-serializable`), bigger than
 * {@link MAX_LOG_CONTEXT_BYTES} once serialized (`too-big`), or deeper than
 * {@link MAX_LOG_CONTEXT_DEPTH} (`too-deep`).
 */
export const toLogContext = (context: unknown): BoLogContext | undefined => {
  if (context === undefined || context === null) return undefined;
  if (!isPlainContext(context)) return truncated('not-an-object');
  let json: string | undefined;
  try {
    json = JSON.stringify(context, contextReplacer);
  } catch {
    return truncated('not-serializable');
  }
  // A `toJSON` may turn the object into anything.
  if (json === undefined) return truncated('not-an-object');
  if (new TextEncoder().encode(json).length > MAX_LOG_CONTEXT_BYTES) return truncated('too-big');
  const copy: unknown = JSON.parse(json);
  if (!isPlainContext(copy)) return truncated('not-an-object');
  if (depthOf(copy) > MAX_LOG_CONTEXT_DEPTH) return truncated('too-deep');
  return copy;
};

/** A log sent, followed for {@link LOG_REPEAT_WINDOW_MS} to count its repeats. */
interface Followed {
  level: BoLogLevel;
  message: string;
  context: BoLogContext | undefined;
  repeats: number;
  timer: ReturnType<typeof setTimeout>;
}

/** A logger, with what its owner needs to end it. */
export interface Logger {
  /** The methods given to the widget, frozen. */
  readonly api: BoLogger;
  /** Sends the repeats counted so far, then drops every log taken afterwards. */
  stop(): void;
}

/**
 * Creates the logger of a client: caps each log ({@link toLogMessage}, {@link toLogContext}) and
 * groups the repeats of the same log (level, message and context).
 *
 * The first occurrence of a log is sent at once. Its repeats in the next
 * {@link LOG_REPEAT_WINDOW_MS} are only counted; at the end of that time, when there were any,
 * one more log is sent with `context.repeated` set to their number, and a new window starts. A log
 * repeated without end is thus sent once every {@link LOG_REPEAT_WINDOW_MS}. Beyond
 * {@link MAX_LOG_REPEAT_KEYS} distinct logs followed, the oldest one is closed early.
 *
 * @param send - Sends a capped log; must not throw.
 */
export const createLogger = (send: LogSender): Logger => {
  const followed = new Map<string, Followed>();
  let stopped = false;

  /** Sends the repeats of a log, if any. */
  const sendRepeats = (entry: Followed): void => {
    if (entry.repeats === 0) return;
    send(entry.level, entry.message, { ...entry.context, repeated: entry.repeats });
  };

  const endWindow = (key: string): void => {
    const entry = followed.get(key);
    if (!entry) return;
    if (entry.repeats === 0) {
      followed.delete(key);
      return;
    }
    sendRepeats(entry);
    entry.repeats = 0;
    entry.timer = setTimeout(() => endWindow(key), LOG_REPEAT_WINDOW_MS);
  };

  const close = (key: string, entry: Followed): void => {
    clearTimeout(entry.timer);
    followed.delete(key);
    sendRepeats(entry);
  };

  const log = (level: BoLogLevel, rawMessage: unknown, rawContext: unknown): void => {
    if (stopped) return;
    const message = toLogMessage(rawMessage);
    const context = toLogContext(rawContext);
    const key = JSON.stringify([level, message, context ?? null]);
    const entry = followed.get(key);
    if (entry) {
      entry.repeats += 1;
      return;
    }
    send(level, message, context);
    followed.set(key, {
      level,
      message,
      context,
      repeats: 0,
      timer: setTimeout(() => endWindow(key), LOG_REPEAT_WINDOW_MS),
    });
    if (followed.size > MAX_LOG_REPEAT_KEYS) {
      const [oldestKey, oldest] = followed.entries().next().value as [string, Followed];
      close(oldestKey, oldest);
    }
  };

  const api: BoLogger = Object.freeze({
    debug: (message: string, context?: BoLogContext) => log('debug', message, context),
    info: (message: string, context?: BoLogContext) => log('info', message, context),
    warn: (message: string, context?: BoLogContext) => log('warn', message, context),
    error: (message: string, context?: BoLogContext) => log('error', message, context),
  });

  return {
    api,
    stop() {
      if (stopped) return;
      for (const [key, entry] of [...followed]) close(key, entry);
      stopped = true;
    },
  };
};
