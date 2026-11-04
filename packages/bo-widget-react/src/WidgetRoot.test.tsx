import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBoContext } from './hooks.js';
import { createFakeHostApi } from './testing/fakeHostApi.js';
import { WidgetRoot } from './WidgetRoot.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const FleetApp = () => <p>Fleet {useBoContext().fleetId}</p>;

// `connect` reads `vulogBo` from the element, as the back office injects it.
const elementWith = (vulogBo: unknown): HTMLElement =>
  Object.assign(document.createElement('div'), { vulogBo });

describe('WidgetRoot', () => {
  it('connects, then renders the app inside CssBaseline when no portal container is given', async () => {
    const fake = createFakeHostApi();
    render(<WidgetRoot App={FleetApp} element={elementWith(fake.api)} fallback="Connecting…" />);
    expect(screen.getByText('Connecting…')).toBeDefined();

    await waitFor(() => expect(screen.getByText('Fleet FLEET')).toBeDefined());
    expect(document.querySelector('.MuiScopedCssBaseline-root')).toBeNull();
  });

  it('wraps the app in ScopedCssBaseline when it renders into a shadow root', async () => {
    const fake = createFakeHostApi();
    render(
      <WidgetRoot
        App={FleetApp}
        element={elementWith(fake.api)}
        portalContainer={document.createElement('div')}
      />,
    );
    await waitFor(() => expect(screen.getByText('Fleet FLEET')).toBeDefined());
    expect(document.querySelector('.MuiScopedCssBaseline-root')).not.toBeNull();
  });

  it('applies customizeTheme', async () => {
    const fake = createFakeHostApi();
    const customizeTheme = vi.fn((theme) => theme);
    render(
      <WidgetRoot App={FleetApp} element={elementWith(fake.api)} customizeTheme={customizeTheme} />,
    );
    await waitFor(() => expect(screen.getByText('Fleet FLEET')).toBeDefined());
    expect(customizeTheme).toHaveBeenCalledWith(
      expect.objectContaining({ palette: expect.objectContaining({ mode: 'light' }) }),
    );
  });

  it('disconnects on unmount', async () => {
    const fake = createFakeHostApi();
    const { unmount } = render(<WidgetRoot App={FleetApp} element={elementWith(fake.api)} />);
    await waitFor(() => expect(screen.getByText('Fleet FLEET')).toBeDefined());

    unmount();

    expect(fake.listenerCount()).toBe(0);
  });

  it('reconnects to a new element and leaves the previous one', async () => {
    const first = createFakeHostApi();
    const second = createFakeHostApi();
    const { rerender } = render(<WidgetRoot App={FleetApp} element={elementWith(first.api)} />);
    await waitFor(() => expect(screen.getByText('Fleet FLEET')).toBeDefined());

    await act(async () =>
      rerender(<WidgetRoot App={FleetApp} element={elementWith(second.api)} />),
    );

    await waitFor(() => expect(second.api.getContext).toHaveBeenCalled());
    expect(first.listenerCount()).toBe(0);
    expect(second.listenerCount()).toBe(5);
  });

  it('shows errorFallback and logs when it cannot connect', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <WidgetRoot
        App={FleetApp}
        element={elementWith({ nope: true })}
        errorFallback={(error) => `Failed: ${(error as Error).message}`}
      />,
    );
    await waitFor(() => expect(screen.getByText(/^Failed: element.vulogBo/)).toBeDefined());
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('cannot connect to the back office'),
      expect.any(Error),
    );
  });
});
