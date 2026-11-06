/**
 * The Chrome of login mode: a dedicated profile, kept between two runs, with its DevTools port
 * on `127.0.0.1` only.
 *
 * @packageDocumentation
 */
import { spawn as nodeSpawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

/** DevTools port of the Chrome of login mode, unless `BO_WIDGET_DEBUG_PORT` sets another. */
export const DEFAULT_DEBUG_PORT = 9333;

/** Profile of the Chrome of login mode, relative to the project root (ignored by git). */
export const CHROME_PROFILE_DIR = join('node_modules', '.cache', 'bo-widget', 'chrome-profile');

const CHROME_PATHS: Readonly<Record<string, readonly string[]>> = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
};

/**
 * Finds the Chrome executable: `BO_WIDGET_CHROME`, otherwise the usual install paths.
 *
 * @param env - Variables prefixed with `BO_WIDGET_`.
 * @param platform - `process.platform`.
 * @param exists - Tells whether a file exists; replaced in tests.
 * @returns The path of the executable.
 * @throws {Error} When no Chrome is found.
 */
export const findChrome = (
  env: Record<string, string | undefined>,
  platform: string = process.platform,
  exists: (path: string) => boolean = existsSync,
): string => {
  const custom = env.BO_WIDGET_CHROME?.trim();
  if (custom) return custom;
  const found = (CHROME_PATHS[platform] ?? []).find((path) => exists(path));
  if (!found) {
    throw new Error(
      'Fake back office in login mode: Chrome not found. Install Google Chrome or set BO_WIDGET_CHROME to its executable.',
    );
  }
  return found;
};

/**
 * Reads `BO_WIDGET_DEBUG_PORT`.
 *
 * @returns The port, {@link DEFAULT_DEBUG_PORT} when the variable is not set.
 * @throws {Error} When it is not an integer between 1024 and 65535.
 */
export const debugPort = (env: Record<string, string | undefined>): number => {
  const raw = env.BO_WIDGET_DEBUG_PORT?.trim();
  if (!raw) return DEFAULT_DEBUG_PORT;
  const port = Number(raw);
  if (!/^\d+$/.test(raw) || port < 1024 || port > 65535) {
    throw new Error(
      `Fake back office: BO_WIDGET_DEBUG_PORT must be a port between 1024 and 65535, not "${raw}"`,
    );
  }
  return port;
};

/**
 * Arguments of the Chrome of login mode: its own profile, the DevTools port on `127.0.0.1` only,
 * and the back office to log in to.
 */
export const chromeArgs = (profileDir: string, port: number, url: string): string[] => [
  `--user-data-dir=${profileDir}`,
  '--remote-debugging-address=127.0.0.1',
  `--remote-debugging-port=${port}`,
  '--no-first-run',
  '--no-default-browser-check',
  url,
];

/** What {@link launchChrome} needs; the defaults are the real ones. */
export interface LaunchChromeOptions {
  readonly executable: string;
  readonly profileDir: string;
  readonly port: number;
  /** Page opened at launch: the back office to log in to. */
  readonly url: string;
  readonly spawn?: typeof nodeSpawn;
  readonly fetch?: typeof fetch;
  /** How long to wait for the DevTools endpoint (ms). */
  readonly timeoutMs?: number;
}

/** The DevTools endpoint of a Chrome. */
export interface ChromeEndpoint {
  /** `webSocketDebuggerUrl` of the browser. */
  readonly webSocketUrl: string;
  /** `false` when a Chrome already listened on the port and was reused. */
  readonly launched: boolean;
}

const POLL_MS = 200;
const ENDPOINT_TIMEOUT_MS = 1_000;

/** `webSocketDebuggerUrl` of the Chrome listening on `port`, `null` when none answers. */
const browserEndpoint = async (port: number, fetchImpl: typeof fetch): Promise<string | null> => {
  try {
    // A program that accepts the connection but never answers must not hold the startup.
    const response = await fetchImpl(`http://127.0.0.1:${port}/json/version`, {
      signal: AbortSignal.timeout(ENDPOINT_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const { webSocketDebuggerUrl } = (await response.json()) as { webSocketDebuggerUrl?: unknown };
    return typeof webSocketDebuggerUrl === 'string' ? webSocketDebuggerUrl : null;
  } catch {
    return null;
  }
};

/**
 * Starts the Chrome of login mode, or reuses the one already listening on the port (a previous
 * run, or a restart of `vite`): its tabs and the login are kept. The process is not waited for:
 * closing Chrome is up to the user, and `Ctrl+C` in the terminal closes it with `vite`.
 *
 * @returns The DevTools endpoint of the browser.
 * @throws {Error} When Chrome cannot be started, or its DevTools port does not answer in time.
 */
export const launchChrome = async (options: LaunchChromeOptions): Promise<ChromeEndpoint> => {
  const fetchImpl = options.fetch ?? fetch;
  const existing = await browserEndpoint(options.port, fetchImpl);
  if (existing) return { webSocketUrl: existing, launched: false };
  const child = (options.spawn ?? nodeSpawn)(
    options.executable,
    chromeArgs(options.profileDir, options.port, options.url),
    { stdio: 'ignore' },
  );
  let failure: Error | null = null;
  let exited = false;
  child.once('error', (error) => {
    failure = error;
  });
  child.once('exit', () => {
    exited = true;
  });
  child.unref();
  const deadline = Date.now() + (options.timeoutMs ?? 15_000);
  while (Date.now() < deadline) {
    const endpoint = await browserEndpoint(options.port, fetchImpl);
    if (endpoint) return { webSocketUrl: endpoint, launched: true };
    if (failure) {
      throw new Error(
        `Fake back office in login mode: cannot start Chrome (${(failure as Error).message}). Set BO_WIDGET_CHROME to its executable.`,
        { cause: failure },
      );
    }
    if (exited) {
      throw new Error(
        `Fake back office in login mode: Chrome stopped at once. Is its profile (${options.profileDir}) open in another Chrome window? Close it and retry.`,
      );
    }
    await sleep(POLL_MS);
  }
  throw new Error(
    `Fake back office in login mode: Chrome does not answer on 127.0.0.1:${options.port}. Is another program using this port? Set BO_WIDGET_DEBUG_PORT to another one.`,
  );
};
