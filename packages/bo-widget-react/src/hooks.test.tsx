import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { connect, type BoClient } from '@vulog/bo-widget-sdk';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  useAuthFetch,
  useBoClient,
  useBoContext,
  useBoRouter,
  useBoTheme,
  useCurrentUser,
} from './hooks.js';
import { boTheme, createFakeHostApi, user } from './testing/fakeHostApi.js';
import { WidgetProvider } from './WidgetProvider.js';

const setup = async <T,>(hook: () => T, fake = createFakeHostApi()) => {
  const client = await connect({ vulogBo: fake.api });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WidgetProvider client={client}>{children}</WidgetProvider>
  );
  const rendered = renderHook(hook, { wrapper });
  await waitFor(() => expect(rendered.result.current).not.toBeNull());
  return { ...rendered, fake, client };
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('hooks', () => {
  it('useBoClient returns the client', async () => {
    const { result, client } = await setup(useBoClient);
    expect(result.current).toBe(client);
  });

  it('useBoContext follows localeChanged and fleetChanged', async () => {
    const { result, fake } = await setup(useBoContext);
    expect(result.current.fleetId).toBe('FLEET');

    act(() => fake.emit('localeChanged', { locale: 'fr' }));
    act(() => fake.emit('fleetChanged', { fleetId: 'OTHER' }));

    expect(result.current).toMatchObject({ locale: 'fr', fleetId: 'OTHER', currency: 'EUR' });
  });

  it('useCurrentUser follows userChanged', async () => {
    const { result, fake } = await setup(useCurrentUser);
    expect(result.current.fullName).toBe('Jane Doe');

    act(() => fake.emit('userChanged', { ...result.current, fullName: 'John Roe' }));

    expect(result.current.fullName).toBe('John Roe');
  });

  it('useAuthFetch calls the Vulog API with the client and keeps its identity', async () => {
    const fetch = vi.fn(async () => new Response('[]'));
    vi.stubGlobal('fetch', fetch);
    const { result, fake, rerender } = await setup(useAuthFetch);
    const first = result.current;

    await result.current('fleetmanager/public/fleets/FLEET/vehicles');
    act(() => fake.emit('localeChanged', { locale: 'fr' }));
    rerender();

    expect(result.current).toBe(first);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toBe(
      'https://api.example.com/boapi/proxy/fleetmanager/public/fleets/FLEET/vehicles',
    );
    expect(new Headers(init.headers).get('X-API-Key')).toBe('test-key');
  });

  it('useBoTheme builds a MUI theme from the back office theme and follows themeChanged', async () => {
    const { result, fake } = await setup(useBoTheme);
    expect(result.current.palette.primary.main).toBe('#123456');
    expect(result.current.palette.mode).toBe('light');

    act(() =>
      fake.emit('themeChanged', {
        ...boTheme,
        palette: { primary: { main: '#000' } },
        mode: 'dark',
      }),
    );

    expect(result.current.palette.primary.main).toBe('#000');
    expect(result.current.palette.mode).toBe('dark');
  });

  it('useBoTheme falls back to the default theme when the back office theme is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fake = createFakeHostApi({
      getTheme: async () => ({ ...boTheme, palette: { primary: { main: 'not-a-color' } } }),
    });
    const { result } = await setup(useBoTheme, fake);
    expect(result.current.palette.primary.main).toBe('#1976d2');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('useBoRouter gives the basename, follows routeChanged and navigates through the client', async () => {
    const { result, fake } = await setup(useBoRouter);
    expect(result.current.basename).toBe('/FLEET/app/widgets/fleet-report');
    expect(result.current.location?.pathname).toBe(window.location.pathname);

    const route = { pathname: '/FLEET/app/widgets/fleet-report/details/1', search: '', hash: '' };
    act(() => fake.emit('routeChanged', route));
    expect(result.current.location).toEqual(route);

    await expect(result.current.navigate('details/2')).resolves.toEqual({ path: 'details/2' });
    expect(fake.api.navigate).toHaveBeenCalledWith({ path: 'details/2' });
  });

  it('useBoRouter.navigate rejects with the BoError of the back office', async () => {
    const fake = createFakeHostApi({
      navigate: async () => {
        throw Object.assign(new Error('external URL'), { code: 'invalid-payload' });
      },
    });
    const { result } = await setup(useBoRouter, fake);
    await expect(result.current.navigate('https://example.com')).rejects.toMatchObject({
      name: 'BoError',
      code: 'INVALID_PAYLOAD',
    });
  });

  it('useBoRouter keeps its identity across unrelated updates', async () => {
    const { result, fake } = await setup(useBoRouter);
    const first = result.current;
    act(() => fake.emit('userChanged', { ...user, fullName: 'John Roe' }));
    expect(result.current).toBe(first);
  });

  it('useBoRouter has no location in an iframe until the first routeChanged', async () => {
    const fake = createFakeHostApi();
    const client = await connect({ vulogBo: fake.api });
    const iframeClient: BoClient = { ...client, mode: 'iframe' };
    const { result } = renderHook(useBoRouter, {
      wrapper: ({ children }) => <WidgetProvider client={iframeClient}>{children}</WidgetProvider>,
    });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.location).toBeNull();
  });

  it.each([
    ['useBoClient', useBoClient],
    ['useBoContext', useBoContext],
    ['useCurrentUser', useCurrentUser],
    ['useAuthFetch', useAuthFetch],
    ['useBoTheme', useBoTheme],
    ['useBoRouter', useBoRouter],
  ])('%s throws outside a widget', (name, hook) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Probe = () => {
      hook();
      return null;
    };
    expect(() => render(<Probe />)).toThrow(`${name} must be called inside a widget`);
  });
});
