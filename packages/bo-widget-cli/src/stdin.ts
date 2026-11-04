import { createInterface } from 'node:readline';
import type { Readable } from 'node:stream';
import { BoWidgetCliError } from './errors.js';

/**
 * Reads the first line of a stream (`bo-widget dev --token -`), without its line ending.
 *
 * @param input - Usually `process.stdin`.
 * @returns The first line; `''` when the stream ends without any.
 * @throws {BoWidgetCliError} When the stream cannot be read.
 */
export const readFirstLine = (input: Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    const lines = createInterface({ input, terminal: false, crlfDelay: Infinity });
    let first = '';
    const fail = (error: Error) => {
      // Rejected before closing: the `close` listener then resolves a settled promise, a no-op.
      reject(
        new BoWidgetCliError(`cannot read the standard input: ${error.message}`, { cause: error }),
      );
      lines.close();
    };
    // readline passes the errors of its input on to the interface.
    lines.once('error', fail);
    lines.once('line', (line) => {
      first = line;
      lines.close();
    });
    lines.once('close', () => resolve(first));
  });
