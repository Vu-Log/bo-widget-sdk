/**
 * Login mode of the fake back office: the user logs in to the real back office in a dedicated
 * Chrome, and the dev server follows the token of that session.
 *
 * @packageDocumentation
 */
import { resolve } from 'node:path';
import { connectCdp, type CdpSocketFactory } from './cdp.js';
import { CHROME_PROFILE_DIR, debugPort, findChrome, launchChrome } from './chrome.js';
import { createLoginSession, type LoginLogger, type TokenSource } from './session.js';

export type { TokenSource } from './session.js';

/** What {@link startLogin} needs. */
export interface StartLoginOptions {
  /** Host of the back office (`BO_WIDGET_HOST`). */
  readonly host: string;
  /** Root of the project: the Chrome profile lives in its `node_modules/.cache`. */
  readonly root: string;
  /** Variables prefixed with `BO_WIDGET_` (`BO_WIDGET_CHROME`, `BO_WIDGET_DEBUG_PORT`). */
  readonly env: Record<string, string | undefined>;
  readonly logger: LoginLogger;
  /** URL of the fake back office, once the dev server listens; `null` when it has no URL. */
  readonly fakeBoUrl: () => Promise<string | null>;
  /** Replaced in tests: the browser and the network are the only edges. */
  readonly deps?: {
    readonly launchChrome?: typeof launchChrome;
    readonly socketFactory?: CdpSocketFactory;
    readonly findChrome?: typeof findChrome;
  };
}

/**
 * Starts login mode: launches the Chrome of login mode on `https://{host}/` (or reuses the one
 * already open), follows the token of its session, and opens the fake back office in a tab of
 * that Chrome after the first login.
 *
 * @returns The source of the latest token, for the proxy and `getAccessToken`.
 * @throws {Error} When Chrome is not found, cannot start or does not answer, when
 * `BO_WIDGET_DEBUG_PORT` is invalid, or without a global `WebSocket` (Node.js < 22).
 */
export const startLogin = async (options: StartLoginOptions): Promise<TokenSource> => {
  const { host, logger } = options;
  const port = debugPort(options.env);
  const profileDir = resolve(options.root, CHROME_PROFILE_DIR);
  const executable = (options.deps?.findChrome ?? findChrome)(options.env);
  const endpoint = await (options.deps?.launchChrome ?? launchChrome)({
    executable,
    profileDir,
    port,
    url: `https://${host}/`,
  });
  const cdp = await connectCdp(endpoint.webSocketUrl, options.deps?.socketFactory);
  logger.info(
    `[bo-widget] Login mode: log in to https://${host}/ in the Chrome of bo-widget (${endpoint.launched ? 'started' : 'already open'}, DevTools on 127.0.0.1:${port}).`,
  );

  let fakeBoOpened = false;
  const openFakeBo = async (): Promise<void> => {
    const url = await options.fakeBoUrl();
    if (!url) return;
    const { targetInfos } = await cdp.send<{ targetInfos: { type: string; url: string }[] }>(
      'Target.getTargets',
    );
    if (targetInfos.some((target) => target.type === 'page' && target.url.startsWith(url))) return;
    await cdp.send('Target.createTarget', { url });
  };

  return createLoginSession({
    host,
    cdp,
    logger,
    onState: (state) => {
      if (state !== 'connected' || fakeBoOpened) return;
      fakeBoOpened = true;
      openFakeBo().catch((error: unknown) => {
        logger.warn(
          `[bo-widget] Cannot open the fake back office in the Chrome of bo-widget (${(error as Error).message}): open it yourself.`,
        );
      });
    },
  });
};
