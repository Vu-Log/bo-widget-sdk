import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { constants } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { BoWidgetCliError } from './errors.js';

/** Options of `bo-widget dev`, as given on the command line; `undefined` means not given. */
export interface DevOptions {
  /**
   * Login mode: the dev server opens the back office of `BO_WIDGET_HOST` in a dedicated Chrome and
   * follows the token of the session the user opens there.
   */
  login?: boolean | undefined;
  /** Token pasted from the back office of a Vulog environment: the fake back office uses it. */
  token?: string | undefined;
  /** Base URL of the Vulog API of that environment (`…/boapi/proxy/`). */
  apiUrl?: string | undefined;
  /** API key of that environment. */
  apiKey?: string | undefined;
}

/**
 * Environment of the `vite` dev server: the `BO_WIDGET_*` variables that switch the fake back
 * office of `@vulog/bo-widget-vite` to token mode, or to
 * login mode (`BO_WIDGET_LOGIN=1`). A variable not given is left as is, so it can
 * also come from the shell or from `.env.local`, which Vite reads.
 *
 * @param base - The current environment.
 * @param options - The command line options.
 * @returns A new environment; `base` is not modified.
 */
export const devEnv = (base: NodeJS.ProcessEnv, options: DevOptions): NodeJS.ProcessEnv => {
  const env = { ...base };
  if (options.login) env.BO_WIDGET_LOGIN = '1';
  if (options.token !== undefined) env.BO_WIDGET_TOKEN = options.token;
  if (options.apiUrl !== undefined) env.BO_WIDGET_API_URL = options.apiUrl;
  if (options.apiKey !== undefined) env.BO_WIDGET_API_KEY = options.apiKey;
  return env;
};

/**
 * Finds the `vite` executable installed in the project, the one its `vite.config.ts` expects.
 *
 * @param cwd - Folder of the project.
 * @returns The absolute path of Vite's bin script.
 * @throws {BoWidgetCliError} When Vite is not installed in the project or cannot be resolved
 * (invalid `package.json`), or declares no executable.
 */
export const resolveViteBin = (cwd: string): string => {
  const require = createRequire(join(resolve(cwd), 'package.json'));
  let packageJsonPath: string;
  try {
    packageJsonPath = require.resolve('vite/package.json');
  } catch (error) {
    const notFound = (error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND';
    throw new BoWidgetCliError(
      notFound
        ? `vite is not installed in ${cwd}: run npm install first`
        : `cannot resolve vite from ${cwd}: ${(error as Error).message}`,
      { cause: error },
    );
  }
  // Already parsed by the resolution above, which fails on invalid JSON.
  const { bin } = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    bin?: string | Record<string, string>;
  };
  const script = typeof bin === 'string' ? bin : bin?.vite;
  if (!script) throw new BoWidgetCliError(`${packageJsonPath} declares no vite executable`);
  return join(dirname(packageJsonPath), script);
};

/** Signals passed on to `vite`, so that it never outlives the command. */
const FORWARDED_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;

/**
 * Runs `vite` (the dev server) in `cwd`, attached to the terminal. `SIGINT`, `SIGTERM` and
 * `SIGHUP` received by this process are passed on to it.
 *
 * @param cwd - Folder of the project.
 * @param args - Arguments passed to `vite`.
 * @param env - Its environment.
 * @returns The exit code of `vite`, or 128 + the signal number when a signal stopped it (130 for
 * `SIGINT`), as shells report it.
 * @throws {BoWidgetCliError} When Vite is not installed.
 * @throws {Error} When the process cannot be started.
 */
export const runVite = async (
  cwd: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv,
): Promise<number> => {
  const bin = resolveViteBin(cwd);
  return new Promise<number>((resolvePromise, reject) => {
    const child = spawn(process.execPath, [bin, ...args], { cwd, env, stdio: 'inherit' });
    const forward = (signal: NodeJS.Signals) => child.kill(signal);
    for (const signal of FORWARDED_SIGNALS) process.on(signal, forward);
    const stopForwarding = () => {
      for (const signal of FORWARDED_SIGNALS) process.off(signal, forward);
    };
    child.once('error', (error) => {
      stopForwarding();
      reject(error);
    });
    child.once('exit', (code, signal) => {
      stopForwarding();
      resolvePromise(code ?? 128 + (signal ? constants.signals[signal] : 0));
    });
  });
};
