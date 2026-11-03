import { BoError, fromHostError } from './errors.js';
import type { BoEventListener, BoEventName, BoRequests, BoTransport } from './types.js';

/**
 * API the back office injects into a Web Component as `element.vulogBo`, before inserting it. It
 * has no `resize`: a Web Component already fills the content zone.
 */
export interface InjectedHostApi extends Omit<BoRequests, 'resize'> {
  readonly protocolVersion: number;
  on(name: string, listener: (data: unknown) => void): void;
  off(name: string, listener: (data: unknown) => void): void;
}

type HostRequest =
  | 'getContext'
  | 'getCurrentUser'
  | 'getSettings'
  | 'getApiInfo'
  | 'getAccessToken'
  | 'getTheme'
  | 'navigate'
  | 'notify';

/** Tells whether `value` looks like the API the back office injects into a Web Component. */
export const isInjectedHostApi = (value: unknown): value is InjectedHostApi => {
  if (typeof value !== 'object' || value === null) return false;
  const api = value as Record<string, unknown>;
  return typeof api.getContext === 'function' && typeof api.on === 'function';
};

/**
 * Wraps the API injected into a Web Component as a transport: same requests as the port, errors
 * converted to `BoError`, `resize` answered `{ height: null }`.
 */
export const createInjectedTransport = (hostApi: InjectedHostApi): BoTransport => {
  // Listeners added through this transport, so that `close` removes them from the host API.
  const added = new Set<[string, (data: unknown) => void]>();

  const call =
    (request: HostRequest) =>
    async (payload?: unknown): Promise<never> => {
      const method = hostApi[request] as ((payload?: unknown) => Promise<never>) | undefined;
      if (typeof method !== 'function') {
        throw new BoError('UNKNOWN_TYPE', `${request}: not served by this back office`);
      }
      try {
        return await method.call(hostApi, payload);
      } catch (error) {
        throw fromHostError(error, request);
      }
    };

  return {
    mode: 'webcomponent',
    protocolVersion: hostApi.protocolVersion,
    grantedPermissions: null,
    getContext: call('getContext'),
    getCurrentUser: call('getCurrentUser'),
    getSettings: call('getSettings'),
    getApiInfo: call('getApiInfo'),
    getAccessToken: call('getAccessToken'),
    getTheme: call('getTheme'),
    navigate: call('navigate'),
    notify: call('notify'),
    resize: async () => ({ height: null }),
    on<K extends BoEventName>(name: K, listener: BoEventListener<K>) {
      const entry: [string, (data: unknown) => void] = [name, listener as (data: unknown) => void];
      hostApi.on(name, entry[1]);
      added.add(entry);
    },
    off<K extends BoEventName>(name: K, listener: BoEventListener<K>) {
      hostApi.off(name, listener as (data: unknown) => void);
      for (const entry of added) {
        if (entry[0] === name && entry[1] === listener) added.delete(entry);
      }
    },
    close() {
      for (const [name, listener] of added) hostApi.off(name, listener);
      added.clear();
    },
  };
};
