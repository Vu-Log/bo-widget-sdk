#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { runCli } from './cli.js';

/**
 * Asks a question in the terminal. The terminal is only read during the question: Ctrl+C then
 * cancels it (an `AbortError`, as Ctrl+D), and keeps its usual effect afterwards.
 */
const ask = async (question: string): Promise<string> => {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  const controller = new AbortController();
  readline.on('SIGINT', () => controller.abort());
  try {
    return await readline.question(question, { signal: controller.signal });
  } finally {
    readline.close();
  }
};

process.exitCode = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
  ask: process.stdin.isTTY && process.stdout.isTTY ? ask : undefined,
});
