import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devEnv, resolveViteBin, runVite } from './dev.js';
import { BoWidgetCliError } from './errors.js';

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
  // A fake vite left running by a failed signal test.
  const ready = await readFile(join(root, 'ready'), 'utf8').catch(() => '');
  if (ready) {
    try {
      process.kill(Number(ready), 'SIGKILL');
    } catch {
      // Already stopped.
    }
  }
  await rm(root, { recursive: true, force: true });
});

describe('devEnv', () => {
  it('treats an option set to undefined as not given', () => {
    expect(devEnv({ BO_WIDGET_TOKEN: 'env' }, { token: undefined, apiUrl: undefined })).toEqual({
      BO_WIDGET_TOKEN: 'env',
    });
  });

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

  it('sets BO_WIDGET_LOGIN with login, and only then', () => {
    expect(devEnv({}, { login: true })).toEqual({ BO_WIDGET_LOGIN: '1' });
    expect(devEnv({ BO_WIDGET_LOGIN: '1' }, { login: false })).toEqual({ BO_WIDGET_LOGIN: '1' });
    expect(devEnv({}, { login: undefined })).toEqual({});
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
    expect(() => resolveViteBin(root)).toThrow(BoWidgetCliError);
    expect(() => resolveViteBin(root)).toThrow(`vite is not installed in ${root}`);
  });

  it('throws without blaming the install when the vite package.json is invalid', async () => {
    await installFakeVite({ vite: 'bin/vite.js' });
    await writeFile(join(root, 'node_modules', 'vite', 'package.json'), '{oops');

    expect(() => resolveViteBin(root)).toThrow(`cannot resolve vite from ${root}: `);
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

  it('returns 128 + the signal number when a signal stops vite', async () => {
    await installFakeVite({ vite: 'bin/vite.js' }, `process.kill(process.pid, 'SIGTERM');`);

    expect(await runVite(root, [], process.env)).toBe(143);
  });

  it('passes on a SIGTERM received while vite runs, and stops forwarding afterwards', async () => {
    await installFakeVite(
      { vite: 'bin/vite.js' },
      `require('node:fs').writeFileSync('ready', String(process.pid)); setInterval(() => {}, 1000);`,
    );
    const listeners = process.listenerCount('SIGTERM');

    const running = runVite(root, [], process.env);
    const { existsSync } = await import('node:fs');
    await vi.waitFor(() => expect(existsSync(join(root, 'ready'))).toBe(true), { timeout: 5000 });
    expect(process.listenerCount('SIGTERM')).toBe(listeners + 1);
    process.emit('SIGTERM', 'SIGTERM');

    expect(await running).toBe(143);
    expect(process.listenerCount('SIGTERM')).toBe(listeners);
  });

  it('rejects when vite is not installed', async () => {
    await expect(runVite(root, [], {})).rejects.toThrow('vite is not installed');
  });
});
