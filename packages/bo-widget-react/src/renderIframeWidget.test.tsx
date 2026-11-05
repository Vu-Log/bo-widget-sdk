import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { useBoContext, useBoRouter } from './hooks.js';
import { renderIframeWidget } from './renderIframeWidget.js';
import { createFakeHostApi } from './testing/fakeHostApi.js';

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

/**
 * Makes the page an iframe of a back office that answers the v2 handshake on a `MessagePort` with
 * the fake host API, and forwards its events, as the real one does.
 */
const iframeOf = (fake = createFakeHostApi()) => {
  const ports: MessagePort[] = [];
  const parent = {
    postMessage: vi.fn((_hello: unknown, _origin: string, [port]: MessagePort[]) => {
      if (!port) return;
      ports.push(port);
      port.postMessage({ type: 'welcome', protocolVersion: 2, grantedPermissions: ['navigate'] });
      port.onmessage = async ({ data: { id, type, payload } }) => {
        const method = (fake.api as Record<string, unknown>)[type] as (p: unknown) => unknown;
        port.postMessage({ id, ok: true, result: await method(payload) });
      };
    }),
  };
  Object.defineProperty(window, 'parent', { value: parent, configurable: true });
  const emit = (name: string, data: unknown) =>
    ports.forEach((port) => port.postMessage({ type: 'event', name, data }));
  return { parent, emit, ports };
};

const App = () => {
  const { fleetId, locale } = useBoContext();
  const { location } = useBoRouter();
  return <p>{`Fleet ${fleetId} ${locale} ${location?.pathname ?? 'no-route'}`}</p>;
};

let unmount: (() => void) | undefined;

afterEach(async () => {
  await act(async () => unmount?.());
  unmount = undefined;
  Reflect.deleteProperty(window, 'parent');
  document.body.replaceChildren();
});

describe('renderIframeWidget', () => {
  it('connects through the iframe channel and renders into #root', async () => {
    const backOffice = iframeOf();
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    await act(async () => {
      unmount = renderIframeWidget(App, { connect: { widgetId: 'fleet-report' } });
    });

    await waitFor(() => expect(root.textContent).toBe('Fleet FLEET en_GB no-route'));
    expect(backOffice.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'hello', widgetId: 'fleet-report' }),
      '*',
      expect.any(Array),
    );
    // No Shadow DOM in an iframe: the iframe isolates the widget.
    expect(root.shadowRoot).toBeNull();
  });

  it('follows the events pushed on the port', async () => {
    const backOffice = iframeOf();
    const container = document.createElement('main');
    document.body.appendChild(container);
    await act(async () => {
      unmount = renderIframeWidget(App, { container });
    });
    await waitFor(() => expect(container.textContent).toContain('Fleet FLEET'));

    backOffice.emit('localeChanged', { locale: 'fr' });
    backOffice.emit('routeChanged', { pathname: '/x', search: '', hash: '' });

    await waitFor(() => expect(container.textContent).toBe('Fleet FLEET fr /x'));
  });

  it('closes the channel when unmounted', async () => {
    const backOffice = iframeOf();
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      unmount = renderIframeWidget(App, { container });
    });
    await waitFor(() => expect(container.textContent).toContain('Fleet FLEET'));
    const [port] = backOffice.ports;
    const closed = new Promise((resolve) => port?.addEventListener('close', resolve));
    port?.start();

    await act(async () => unmount?.());
    unmount = undefined;

    expect(container.textContent).toBe('');
    await expect(closed).resolves.toBeDefined();
  });

  it('disconnects a connection that completes after the unmount', async () => {
    let welcome: (() => void) | undefined;
    let channel: MessagePort | undefined;
    const parent = {
      postMessage: (_hello: unknown, _origin: string, [port]: MessagePort[]) => {
        channel = port;
        welcome = () =>
          port?.postMessage({ type: 'welcome', protocolVersion: 2, grantedPermissions: [] });
      },
    };
    Object.defineProperty(window, 'parent', { value: parent, configurable: true });
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      unmount = renderIframeWidget(App, { container, fallback: 'Connecting…' });
    });
    expect(container.textContent).toBe('Connecting…');
    const closed = new Promise((resolve) => channel?.addEventListener('close', resolve));
    channel?.start();

    await act(async () => unmount?.());
    unmount = undefined;
    welcome?.();

    await expect(closed).resolves.toBeDefined();
    expect(container.textContent).toBe('');
  });

  it('shows the error fallback when the page is not in a back office iframe', async () => {
    Object.defineProperty(window, 'parent', { value: window, configurable: true });
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      unmount = renderIframeWidget(App, {
        container,
        errorFallback: (error) => `Failed: ${(error as Error).message}`,
      });
    });

    await waitFor(() => expect(container.textContent).toContain('Failed: Not displayed'));
  });

  it('throws when there is no #root and no container', () => {
    expect(() => renderIframeWidget(App)).toThrow(TypeError);
  });
});
