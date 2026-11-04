import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { devEnv, resolveViteBin, runVite } from './dev.js';

let root: string;

/** A fake `vite` package in `root/node_modules`, whose bin runs `script`. */
const installFakeVite = async (bin: unknown, script = ''): Promise<void> => {
  const dir = join(root, 'node_modules', 'vite');
  await mkdir(join(dir, 'bin'), { recursive: true });
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'vite', bin }));
  await writeFile(join(dir, 'bin', 'vite.js'), script);
};

beforeEach(async () => {
  // Real path: on macOS the temporary folder is a symbolic link, which Node resolves.
  root = await realpath(await mkdtemp(join(tmpdir(), 'bo-widget-cli-dev-')));
  await writeFile(join(root, 'package.json'), '{}');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('devEnv', () => {
  it('sets the BO_WIDGET_* variables of the options given', () => {
    const env = devEnv(
      { PATH: '/bin' },
      { token: 'jwt', apiUrl: 'https://api.example.com/boapi/proxy/', apiKey: 'key' },
    );

    expect(env).toEqual({
      PATH: '/bin',
      BO_WIDGET_TOKEN: 'jwt',
      BO_WIDGET_API_URL: 'https://api.example.com/boapi/proxy/',
      BO_WIDGET_API_KEY: 'key',
    });
  });

  it('keeps the variables of the environment for the options not given, without mutating it', () => {
    const base = { BO_WIDGET_API_URL: 'from-shell', BO_WIDGET_API_KEY: 'from-shell' };

    const env = devEnv(base, { token: 'jwt' });

    expect(env).toEqual({ ...base, BO_WIDGET_TOKEN: 'jwt' });
    expect(base).not.toHaveProperty('BO_WIDGET_TOKEN');
  });
});

describe('resolveViteBin', () => {
  it('finds the vite executable of the project', async () => {
    await installFakeVite({ vite: 'bin/vite.js' });

    expect(resolveViteBin(root)).toBe(join(root, 'node_modules', 'vite', 'bin', 'vite.js'));
  });

  it('accepts a bin declared as a string', async () => {
    await installFakeVite('bin/vite.js');

    expect(resolveViteBin(root)).toBe(join(root, 'node_modules', 'vite', 'bin', 'vite.js'));
  });

  it('throws a clear error when vite is not installed', () => {
    expect(() => resolveViteBin(root)).toThrow(`vite is not installed in ${root}`);
  });

  it('throws when the vite package declares no executable', async () => {
    await installFakeVite(undefined);

    expect(() => resolveViteBin(root)).toThrow('declares no vite executable');
  });
});

describe('runVite', () => {
  it('runs vite in the project with the arguments and the environment, and returns its exit code', async () => {
    await installFakeVite(
      { vite: 'bin/vite.js' },
      `const { writeFileSync } = require('node:fs');
       writeFileSync('ran.json', JSON.stringify({ args: process.argv.slice(2), token: process.env.BO_WIDGET_TOKEN }));
       process.exit(3);`,
    );

    const code = await runVite(root, ['--port', '4000'], {
      ...process.env,
      BO_WIDGET_TOKEN: 'jwt',
    });

    expect(code).toBe(3);
    expect(JSON.parse(await readFile(join(root, 'ran.json'), 'utf8'))).toEqual({
      args: ['--port', '4000'],
      token: 'jwt',
    });
  });

  it('rejects when vite is not installed', async () => {
    await expect(runVite(root, [], {})).rejects.toThrow('vite is not installed');
  });
});
