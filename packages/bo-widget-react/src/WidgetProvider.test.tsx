import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { BoError, connect } from '@vulog/bo-widget-sdk';
import { afterEach, describe, expect, it } from 'vitest';
import { useBoContext, useCurrentUser } from './hooks.js';
import { context as baseContext, createFakeHostApi, user } from './testing/fakeHostApi.js';
import { WidgetProvider } from './WidgetProvider.js';

afterEach(cleanup);

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
      expect(screen.getByRole('alert').textContent).toBe(
        'Unable to connect to the back office: offline',
      ),
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
});
