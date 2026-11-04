import { PassThrough, Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { BoWidgetCliError } from './errors.js';
import { readFirstLine } from './stdin.js';

describe('readFirstLine', () => {
  it('returns the first line, without its line ending', async () => {
    expect(await readFirstLine(Readable.from(['eyJ.a.b\r\n', 'second\n']))).toBe('eyJ.a.b');
  });

  it('returns a last line without line ending', async () => {
    expect(await readFirstLine(Readable.from(['eyJ', '.a.b']))).toBe('eyJ.a.b');
  });

  it('returns an empty string for an empty input', async () => {
    expect(await readFirstLine(Readable.from([]))).toBe('');
  });

  it('rejects with a clear error when the input fails', async () => {
    const input = new PassThrough();
    const reading = readFirstLine(input);

    input.destroy(new Error('EIO'));

    await expect(reading).rejects.toThrow(
      new BoWidgetCliError('cannot read the standard input: EIO'),
    );
  });
});
