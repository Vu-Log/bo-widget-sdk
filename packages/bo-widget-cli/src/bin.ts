#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { runCli } from './cli.js';
import { runVite } from './dev.js';

/** Reads one line from the standard input, prompting for it in a terminal. */
const readStdinLine = (): Promise<string> =>
  new Promise((resolve) => {
    if (process.stdin.isTTY) process.stderr.write('Paste the token, then press Enter: ');
    const lines = createInterface({ input: process.stdin, terminal: false });
    let line = '';
    lines.once('line', (first) => {
      line = first;
      lines.close();
    });
    lines.once('close', () => resolve(line));
  });

process.exitCode = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
  readStdinLine,
  runVite,
});
