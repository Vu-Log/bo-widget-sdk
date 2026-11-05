import type { BoContext, BoCurrentUser, BoTheme } from '@vulog/bo-widget-sdk';
import { vi } from 'vitest';

type Listener = (data: unknown) => void;

export const context: BoContext = {
  fleetId: 'FLEET',
  host: 'bo.example.com',
  locale: 'en_GB',
  timezone: 'Europe/Paris',
  currency: 'EUR',
  boVersion: '1.86.0',
  basename: '/FLEET/app/widgets/fleet-report',
};

export const user: BoCurrentUser = {
  id: 'u1',
  userName: 'jdoe',
  firstName: 'Jane',
  lastName: 'Doe',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  currentFleetId: 'FLEET',
  originalFleetId: 'FLEET',
  roles: ['admin'],
  fleets: [{ fleetId: 'FLEET', profile: 'admin' }],
  isFranchiseOperator: false,
};

export const boTheme: BoTheme = {
  palette: { primary: { main: '#123456' } },
  typography: { fontFamily: 'Roboto, sans-serif' },
  mode: 'light',
};

/**
 * A fake of the API the back office injects into a Web Component (`element.vulogBo`), with a
 * `emit` to push events and the count of the listeners still registered.
 */
export const createFakeHostApi = (overrides: Record<string, unknown> = {}) => {
  const listeners = new Map<string, Set<Listener>>();
  const api = {
    protocolVersion: 2,
    getContext: vi.fn(async () => ({ ...context })),
    getCurrentUser: vi.fn(async () => ({ ...user })),
    getTheme: vi.fn(async () => ({ ...boTheme })),
    getApiInfo: vi.fn(async () => ({
      baseUrl: 'https://api.example.com/boapi/proxy/',
      apiKey: 'test-key',
    })),
    navigate: vi.fn(async ({ path }: { path: string }) => ({ path })),
    on: vi.fn((name: string, listener: Listener) => {
      listeners.set(name, (listeners.get(name) ?? new Set()).add(listener));
    }),
    off: vi.fn((name: string, listener: Listener) => {
      listeners.get(name)?.delete(listener);
    }),
    ...overrides,
  };
  const emit = (name: string, data: unknown) => listeners.get(name)?.forEach((l) => l(data));
  const listenerCount = () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0);
  return { api, emit, listenerCount };
};
