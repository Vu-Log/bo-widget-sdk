import { EventEmitter } from 'node:events';
import type { spawn } from 'node:child_process';
import { describe, expect, it, vi } from 'vitest';
import {
  chromeArgs,
  debugPort,
  DEFAULT_DEBUG_PORT,
  findChrome,
  launchChrome,
  type LaunchChromeOptions,
} from './chrome.js';

const WS_URL = 'ws://127.0.0.1:9333/devtools/browser/abc';

describe('findChrome', () => {
  it('takes BO_WIDGET_CHROME first', () => {
    const exists = vi.fn(() => true);

    expect(findChrome({ BO_WIDGET_CHROME: ' /opt/chrome ' }, 'darwin', exists)).toBe('/opt/chrome');
    expect(exists).not.toHaveBeenCalled();
  });

  it('finds the first usual install path that exists', () => {
    const exists = (path: string) => path === '/usr/bin/chromium';

    expect(findChrome({}, 'linux', exists)).toBe('/usr/bin/chromium');
  });

  it('fails with a hint when Chrome is not installed, or the platform is unknown', () => {
    expect(() => findChrome({}, 'darwin', () => false)).toThrow('set BO_WIDGET_CHROME');
    expect(() => findChrome({}, 'aix', () => true)).toThrow('Chrome not found');
  });
});

describe('debugPort', () => {
  it('defaults to 9333 and reads BO_WIDGET_DEBUG_PORT', () => {
    expect(debugPort({})).toBe(DEFAULT_DEBUG_PORT);
    expect(debugPort({ BO_WIDGET_DEBUG_PORT: ' ' })).toBe(DEFAULT_DEBUG_PORT);
    expect(debugPort({ BO_WIDGET_DEBUG_PORT: '9444' })).toBe(9444);
  });

  it.each([['80'], ['70000'], ['9333.5'], ['abc'], ['-1']])('refuses %s', (value) => {
    expect(() => debugPort({ BO_WIDGET_DEBUG_PORT: value })).toThrow(
      'BO_WIDGET_DEBUG_PORT must be a port between 1024 and 65535',
    );
  });
});

describe('chromeArgs', () => {
  it('uses its own profile and listens on 127.0.0.1 only', () => {
    expect(chromeArgs('/p/profile', 9333, 'https://bo.example.com/')).toEqual([
      '--user-data-dir=/p/profile',
      '--remote-debugging-address=127.0.0.1',
      '--remote-debugging-port=9333',
      '--no-first-run',
      '--no-default-browser-check',
      'https://bo.example.com/',
    ]);
  });
});

describe('launchChrome', () => {
  /** A child process that never ends, or ends / fails when told. */
  const fakeChild = () => Object.assign(new EventEmitter(), { unref: vi.fn() });

  const options = (overrides: Partial<LaunchChromeOptions> = {}): LaunchChromeOptions => ({
    executable: '/opt/chrome',
    profileDir: '/p/profile',
    port: 9333,
    url: 'https://bo.example.com/',
    timeoutMs: 1_000,
    ...overrides,
  });

  const versionAnswer = () => Response.json({ webSocketDebuggerUrl: WS_URL });

  it('reuses the Chrome already listening on the port, without starting another', async () => {
    const spawnMock = vi.fn();
    const fetchMock = vi.fn(() => Promise.resolve(versionAnswer()));

    const endpoint = await launchChrome(
      options({ spawn: spawnMock as unknown as typeof spawn, fetch: fetchMock }),
    );

    expect(endpoint).toEqual({ webSocketUrl: WS_URL, launched: false });
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:9333/json/version', {
      signal: expect.any(AbortSignal),
    });
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('starts Chrome and waits for its DevTools endpoint', async () => {
    const child = fakeChild();
    const spawnMock = vi.fn(() => child);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValue(versionAnswer());

    const endpoint = await launchChrome(
      options({ spawn: spawnMock as unknown as typeof spawn, fetch: fetchMock }),
    );

    expect(endpoint).toEqual({ webSocketUrl: WS_URL, launched: true });
    expect(spawnMock).toHaveBeenCalledWith(
      '/opt/chrome',
      chromeArgs('/p/profile', 9333, 'https://bo.example.com/'),
      { stdio: 'ignore' },
    );
    expect(child.unref).toHaveBeenCalled();
  });

  it('fails with a hint when Chrome cannot be started', async () => {
    const child = fakeChild();
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'));
    const spawnMock = vi.fn(() => {
      queueMicrotask(() => child.emit('error', new Error('spawn ENOENT')));
      return child;
    });

    await expect(
      launchChrome(options({ spawn: spawnMock as unknown as typeof spawn, fetch: fetchMock })),
    ).rejects.toThrow('cannot start Chrome (spawn ENOENT). Set BO_WIDGET_CHROME');
  });

  it('fails when Chrome stops at once, as when its profile is open elsewhere', async () => {
    const child = fakeChild();
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'));
    const spawnMock = vi.fn(() => {
      queueMicrotask(() => child.emit('exit', 0, null));
      return child;
    });

    await expect(
      launchChrome(options({ spawn: spawnMock as unknown as typeof spawn, fetch: fetchMock })),
    ).rejects.toThrow('Chrome stopped at once. Is its profile (/p/profile) open');
  });

  it('fails when the DevTools port never answers', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'));
    const spawnMock = vi.fn(() => fakeChild());

    await expect(
      launchChrome(
        options({ spawn: spawnMock as unknown as typeof spawn, fetch: fetchMock, timeoutMs: 300 }),
      ),
    ).rejects.toThrow('Chrome does not answer on 127.0.0.1:9333');
  });
});
