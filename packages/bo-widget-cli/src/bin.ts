#!/usr/bin/env node
import { runCli } from './cli.js';
import { runVite } from './dev.js';
import { readFirstLine } from './stdin.js';

process.exitCode = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
  readStdinLine: () => {
    if (process.stdin.isTTY) process.stderr.write('Paste the token, then press Enter: ');
    return readFirstLine(process.stdin);
  },
  runVite,
});
