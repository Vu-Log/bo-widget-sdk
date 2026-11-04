import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

/** Options of `bo-widget dev`, as given on the command line. */
export interface DevOptions {
  /** Token pasted from the back office of a Vulog environment: the fake back office uses it. */
  token?: string;
  /** Base URL of the Vulog API of that environment, ending with `/boapi/proxy/`. */
  apiUrl?: string;
  /** API key of that environment. */
  apiKey?: string;
}

/**
 * Environment of the `vite` dev server: the `BO_WIDGET_*` variables that switch the fake back
 * office of `@vulog/bo-widget-vite` to token mode. A variable not given is left as is, so it can
 * also come from the shell or from `.env.local`, which Vite reads.
 *
 * @param base - The current environment.
 * @param options - The command line options.
 * @returns A new environment; `base` is not modified.
 */
export const devEnv = (base: NodeJS.ProcessEnv, options: DevOptions): NodeJS.ProcessEnv => {
  const env = { ...base };
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
 * @throws {Error} When Vite is not installed in the project.
 */
export const resolveViteBin = (cwd: string): string => {
  const require = createRequire(join(resolve(cwd), 'package.json'));
  let packageJsonPath: string;
  try {
    packageJsonPath = require.resolve('vite/package.json');
  } catch (error) {
    throw new Error(`vite is not installed in ${cwd}: run npm install first`, { cause: error });
  }
  const { bin } = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    bin?: string | Record<string, string>;
  };
  const script = typeof bin === 'string' ? bin : bin?.vite;
  if (!script) throw new Error(`${packageJsonPath} declares no vite executable`);
  return join(dirname(packageJsonPath), script);
};

/**
 * Runs `vite` (the dev server) in `cwd`, attached to the terminal.
 *
 * @param cwd - Folder of the project.
 * @param args - Arguments passed to `vite`.
 * @param env - Its environment.
 * @returns The exit code of `vite`: 1 when it was killed by a signal.
 * @throws {Error} When Vite is not installed, or cannot be started.
 */
export const runVite = async (
  cwd: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv,
): Promise<number> => {
  const bin = resolveViteBin(cwd);
  return new Promise<number>((resolvePromise, reject) => {
    const child = spawn(process.execPath, [bin, ...args], { cwd, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => resolvePromise(code ?? 1));
  });
};
