import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { BoError, connect } from '@vulog/bo-widget-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBoContext, useBoRouter, useBoTheme, useCurrentUser } from './hooks.js';
import { context as baseContext, boTheme, createFakeHostApi, user } from './testing/fakeHostApi.js';
import { WidgetProvider } from './WidgetProvider.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const Probe = () => {
  const { locale, fleetId } = useBoContext();
  const { fullName } = useCurrentUser();
  return <p>{`${fullName} ${fleetId} ${locale}`}</p>;
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

describe('WidgetProvider', () => {
  it('shows the fallback, then the children once the initial state is loaded', async () => {
    const context = deferred<unknown>();
    const fake = createFakeHostApi({ getContext: () => context.promise });
    const client = await connect({ vulogBo: fake.api });
    render(
      <WidgetProvider client={client} fallback="Loading…">
        <Probe />
      </WidgetProvider>,
    );
    expect(screen.getByText('Loading…')).toBeDefined();

    await act(async () => context.resolve({ ...baseContext }));

    expect(screen.getByText('Jane Doe FLEET en')).toBeDefined();
  });

  it('applies the events received while loading', async () => {
    const context = deferred<unknown>();
    const fake = createFakeHostApi({ getContext: () => context.promise });
    const client = await connect({ vulogBo: fake.api });
    render(
      <WidgetProvider client={client}>
        <Probe />
      </WidgetProvider>,
    );

    fake.emit('localeChanged', { locale: 'fr' });
    fake.emit('userChanged', { ...user, fullName: 'John Roe' });
    await act(async () => context.resolve({ ...baseContext }));

    expect(screen.getByText('John Roe FLEET fr')).toBeDefined();
  });

  it('shows the error fallback with the BoError when the state cannot be loaded', async () => {
    const fake = createFakeHostApi({
      getTheme: async () => {
        throw Object.assign(new Error('boom'), { code: 'internal-failure' });
      },
    });
    const client = await connect({ vulogBo: fake.api });
    const errors: unknown[] = [];
    render(
      <WidgetProvider
        client={client}
        errorFallback={(error) => {
          errors.push(error);
          return 'Broken';
        }}
      >
        <Probe />
      </WidgetProvider>,
    );

    await waitFor(() => expect(screen.getByText('Broken')).toBeDefined());
    expect(errors[0]).toBeInstanceOf(BoError);
  });

  it('renders the default error message for a non-Error rejection', async () => {
    const client = await connect({ vulogBo: createFakeHostApi().api });
    const failing = { ...client, getContext: () => Promise.reject('offline') };
    render(
      <WidgetProvider client={failing}>
        <Probe />
      </WidgetProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('The widget cannot be displayed: offline'),
    );
  });

  it('removes its listeners on unmount and ignores a late answer', async () => {
    const context = deferred<unknown>();
    const fake = createFakeHostApi({ getContext: () => context.promise });
    const client = await connect({ vulogBo: fake.api });
    const { unmount, container } = render(
      <WidgetProvider client={client}>
        <Probe />
      </WidgetProvider>,
    );
    expect(fake.listenerCount()).toBe(5);

    unmount();
    await act(async () => context.resolve({ ...baseContext }));

    expect(fake.listenerCount()).toBe(0);
    expect(container.textContent).toBe('');
  });

  it('applies every kind of event received while loading', async () => {
    const context = deferred<unknown>();
    const fake = createFakeHostApi({ getContext: () => context.promise });
    const client = await connect({ vulogBo: fake.api });
    const Details = () => {
      const { fleetId } = useBoContext();
      const { location } = useBoRouter();
      const theme = useBoTheme();
      return <p>{`${fleetId} ${location?.pathname} ${theme.palette.mode}`}</p>;
    };
    render(
      <WidgetProvider client={client}>
        <Details />
      </WidgetProvider>,
    );

    fake.emit('fleetChanged', { fleetId: 'OTHER' });
    fake.emit('routeChanged', { pathname: '/route', search: '', hash: '' });
    fake.emit('themeChanged', { ...boTheme, mode: 'dark' });
    await act(async () => context.resolve({ ...baseContext }));

    expect(screen.getByText('OTHER /route dark')).toBeDefined();
  });

  it('never shows the state of the previous client, and reloads for the new one', async () => {
    const first = createFakeHostApi();
    const second = createFakeHostApi({
      getContext: async () => ({ ...baseContext, fleetId: 'SECOND' }),
    });
    const [client1, client2] = [
      await connect({ vulogBo: first.api }),
      await connect({ vulogBo: second.api }),
    ];
    const seen: string[] = [];
    const Spy = () => {
      const { fleetId } = useBoContext();
      seen.push(`${fleetId}`);
      return <p>{fleetId}</p>;
    };
    const { rerender } = render(
      <WidgetProvider client={client1}>
        <Spy />
      </WidgetProvider>,
    );
    await waitFor(() => expect(screen.getByText('FLEET')).toBeDefined());
    seen.length = 0;

    rerender(
      <WidgetProvider client={client2} fallback="Switching…">
        <Spy />
      </WidgetProvider>,
    );

    await waitFor(() => expect(screen.getByText('SECOND')).toBeDefined());
    expect(seen).toEqual(['SECOND']);
    expect(first.listenerCount()).toBe(0);
    expect(second.listenerCount()).toBe(5);
  });

  it('removes the listeners already added and shows the error when a subscription throws', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = createFakeHostApi();
    const on = fake.api.on;
    fake.api.on = vi.fn((name: string, listener: (data: unknown) => void) => {
      if (name === 'userChanged') throw new Error('unknown event');
      on(name, listener);
    });
    const client = await connect({ vulogBo: fake.api });
    render(
      <WidgetProvider client={client} errorFallback={(error) => `Failed: ${String(error)}`}>
        <Probe />
      </WidgetProvider>,
    );

    await waitFor(() => expect(screen.getByText(/^Failed:/)).toBeDefined());
    expect(fake.listenerCount()).toBe(0);
    expect(fake.api.getContext).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('cannot subscribe to the back office events'),
      expect.any(Error),
    );
  });

  it('logs a failure to load the initial state', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = await connect({ vulogBo: createFakeHostApi().api });
    const failing = { ...client, getTheme: () => Promise.reject(new Error('down')) };
    render(
      <WidgetProvider client={failing} errorFallback={() => 'Broken'}>
        <Probe />
      </WidgetProvider>,
    );
    await waitFor(() => expect(screen.getByText('Broken')).toBeDefined());
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('cannot load the back office state'),
      expect.any(Error),
    );
  });

  it('removes every listener even when removing one fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = createFakeHostApi();
    const off = fake.api.off;
    fake.api.off = vi.fn((name: string, listener: (data: unknown) => void) => {
      off(name, listener);
      if (name === 'localeChanged') throw new Error('off failed');
    });
    const client = await connect({ vulogBo: fake.api });
    const { unmount } = render(
      <WidgetProvider client={client}>
        <Probe />
      </WidgetProvider>,
    );
    await waitFor(() => expect(screen.getByText('Jane Doe FLEET en')).toBeDefined());

    unmount();

    expect(fake.listenerCount()).toBe(0);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('cannot remove a back office listener'),
      expect.any(Error),
    );
  });
});
