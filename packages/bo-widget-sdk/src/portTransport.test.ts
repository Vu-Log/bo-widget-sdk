import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoError } from './errors.js';
import { openPortTransport, type PortTransportOptions } from './portTransport.js';

interface Hello {
  protocol: string;
  version: number;
  type: string;
  widgetId: string | null;
  widgetVersion: string | null;
}

/**
 * A parent window that hands each `hello` and its port to `onHello`, as the back office does.
 * Records the hello messages and target origins it received.
 */
const fakeParent = (onHello: (port: MessagePort, hello: Hello) => void) => {
  const received: { hello: Hello; targetOrigin: string }[] = [];
  const target = {
    postMessage(message: unknown, targetOrigin: string, transfer: Transferable[]) {
      received.push({ hello: message as Hello, targetOrigin });
      onHello(transfer[0] as MessagePort, message as Hello);
    },
  };
  return { target, received };
};

const welcome = (port: MessagePort, extra: Record<string, unknown> = {}) =>
  port.postMessage({
    type: 'welcome',
    protocolVersion: 2,
    boVersion: '1.86.0',
    grantedPermissions: ['apiInfo', 'accessToken'],
    context: {},
    ...extra,
  });

/** Back office that answers `welcome`, then every request with `answer(request)`. */
const servingParent = (
  answer: (request: { id: string; type: string; payload?: unknown }) => unknown,
) => {
  let boPort: MessagePort | null = null;
  const parent = fakeParent((port) => {
    boPort = port;
    port.onmessage = ({ data }) => {
      const reply = answer(data);
      if (reply !== undefined) port.postMessage(reply);
    };
    welcome(port);
  });
  return { ...parent, getPort: () => boPort as MessagePort | null };
};

const options = (
  target: PortTransportOptions['target'],
  extra: Partial<PortTransportOptions> = {},
) => ({
  target,
  targetOrigin: '*',
  widgetId: 'fleet-report',
  widgetVersion: '1.0.0',
  handshakeTimeout: 1_000,
  requestTimeout: 1_000,
  ...extra,
});

const opened: { close(): void }[] = [];
const open = async (opts: PortTransportOptions) => {
  const transport = await openPortTransport(opts);
  opened.push(transport);
  return transport;
};

afterEach(() => {
  opened.splice(0).forEach((transport) => transport.close());
  vi.useRealTimers();
});

describe('openPortTransport: handshake', () => {
  it('posts hello with a port, then resolves on welcome', async () => {
    const { target, received } = servingParent(() => undefined);
    const transport = await open(options(target, { targetOrigin: 'https://bo.example.com' }));
    expect(received).toEqual([
      {
        hello: {
          protocol: 'vulog-bo',
          version: 2,
          type: 'hello',
          widgetId: 'fleet-report',
          widgetVersion: '1.0.0',
        },
        targetOrigin: 'https://bo.example.com',
      },
    ]);
    expect(transport).toMatchObject({
      mode: 'iframe',
      protocolVersion: 2,
      grantedPermissions: ['apiInfo', 'accessToken'],
    });
  });

  it('keeps only the string permissions of welcome, frozen', async () => {
    const { target } = fakeParent((port) => welcome(port, { grantedPermissions: ['notify', 42] }));
    const transport = await open(options(target));
    expect(transport.grantedPermissions).toEqual(['notify']);
    expect(Object.isFrozen(transport.grantedPermissions)).toBe(true);
  });

  it('reads a welcome without permissions nor version as none, protocol 2', async () => {
    const { target } = fakeParent((port) => port.postMessage({ type: 'welcome' }));
    const transport = await open(options(target));
    expect(transport.grantedPermissions).toEqual([]);
    expect(transport.protocolVersion).toBe(2);
  });

  it('ignores other messages until welcome', async () => {
    const { target } = fakeParent((port) => {
      port.postMessage('noise');
      port.postMessage({ type: 'event', name: 'localeChanged', data: {} });
      welcome(port);
    });
    await expect(open(options(target))).resolves.toMatchObject({ mode: 'iframe' });
  });

  it('rejects with the error the back office answers instead of welcome', async () => {
    const { target } = fakeParent((port) =>
      port.postMessage({ type: 'error', error: { code: 'INTERNAL', message: 'Internal error' } }),
    );
    await expect(openPortTransport(options(target))).rejects.toMatchObject({
      code: 'INTERNAL',
      message: 'Internal error',
    });
  });

  it('rejects with TIMEOUT when the back office never answers', async () => {
    vi.useFakeTimers();
    const { target } = fakeParent(() => {});
    const promise = openPortTransport(options(target, { handshakeTimeout: 500 }));
    vi.advanceTimersByTime(500);
    await expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('rejects with DISCONNECTED when hello cannot be posted', async () => {
    const target = {
      postMessage() {
        throw new Error('cross-origin');
      },
    };
    await expect(openPortTransport(options(target))).rejects.toMatchObject({
      code: 'DISCONNECTED',
    });
  });
});

describe('openPortTransport: requests', () => {
  it('sends { id, type, payload } and resolves with the result', async () => {
    const requests: unknown[] = [];
    const { target } = servingParent((request) => {
      requests.push(request);
      return { id: request.id, ok: true, result: { path: '/app/details/1' } };
    });
    const transport = await open(options(target));
    await expect(transport.navigate({ path: 'details/1' })).resolves.toEqual({
      path: '/app/details/1',
    });
    expect(requests).toEqual([{ id: '1', type: 'navigate', payload: { path: 'details/1' } }]);
  });

  it('sends a request without payload as { id, type }', async () => {
    const requests: unknown[] = [];
    const { target } = servingParent((request) => {
      requests.push(request);
      return { id: request.id, ok: true, result: {} };
    });
    await (await open(options(target))).getContext();
    expect(requests).toEqual([{ id: '1', type: 'getContext' }]);
  });

  it('matches concurrent answers by id, whatever their order', async () => {
    const held: { id: string; type: string }[] = [];
    const { target, getPort } = servingParent((request) => {
      held.push(request);
      return undefined;
    });
    const transport = await open(options(target));
    const context = transport.getContext();
    const theme = transport.getTheme();
    await vi.waitFor(() => expect(held).toHaveLength(2));
    for (const request of [...held].reverse()) {
      getPort()?.postMessage({ id: request.id, ok: true, result: request.type });
    }
    await expect(context).resolves.toBe('getContext');
    await expect(theme).resolves.toBe('getTheme');
  });

  it.each(['UNKNOWN_TYPE', 'FORBIDDEN', 'INVALID_PAYLOAD', 'INTERNAL'])(
    'rejects with a BoError of code %s',
    async (code) => {
      const { target } = servingParent((request) => ({
        id: request.id,
        ok: false,
        error: { code, message: 'refused', reason: 'no-token', status: 401 },
      }));
      const error = await (await open(options(target))).getAccessToken().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(BoError);
      expect(error).toMatchObject({ code, message: 'refused', reason: 'no-token', status: 401 });
    },
  );

  it('ignores an answer to an unknown id', async () => {
    const { target, getPort } = servingParent((request) => {
      getPort()?.postMessage({ id: 'other', ok: true, result: 'wrong' });
      return { id: request.id, ok: true, result: 'right' };
    });
    await expect((await open(options(target))).getSettings()).resolves.toBe('right');
  });

  it('rejects with TIMEOUT when a request gets no answer', async () => {
    const { target } = servingParent(() => undefined);
    const transport = await open(options(target, { requestTimeout: 20 }));
    await expect(transport.getSettings()).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('rejects pending and later requests with DISCONNECTED once closed', async () => {
    const { target } = servingParent(() => undefined);
    const transport = await open(options(target));
    const pending = transport.getContext();
    transport.close();
    await expect(pending).rejects.toMatchObject({ code: 'DISCONNECTED' });
    await expect(transport.getContext()).rejects.toMatchObject({ code: 'DISCONNECTED' });
  });

  it('rejects with INTERNAL when the payload cannot be cloned', async () => {
    const { target } = servingParent(() => undefined);
    const transport = await open(options(target));
    const payload = { path: 'x', fn: () => {} } as unknown as { path: string };
    await expect(transport.navigate(payload)).rejects.toMatchObject({ code: 'INTERNAL' });
  });
});

describe('openPortTransport: events', () => {
  it('calls the listeners of the event pushed by the back office', async () => {
    const { target, getPort } = servingParent(() => undefined);
    const transport = await open(options(target));
    const onLocale = vi.fn();
    const onFleet = vi.fn();
    transport.on('localeChanged', onLocale);
    transport.on('fleetChanged', onFleet);
    getPort()?.postMessage({ type: 'event', name: 'localeChanged', data: { locale: 'fr' } });
    await vi.waitFor(() => expect(onLocale).toHaveBeenCalledWith({ locale: 'fr' }));
    expect(onFleet).not.toHaveBeenCalled();
  });

  it('stops calling a listener removed with off', async () => {
    const { target, getPort } = servingParent(() => undefined);
    const transport = await open(options(target));
    const removed = vi.fn();
    const kept = vi.fn();
    transport.on('routeChanged', removed);
    transport.on('routeChanged', kept);
    transport.off('routeChanged', removed);
    getPort()?.postMessage({ type: 'event', name: 'routeChanged', data: { pathname: '/a' } });
    await vi.waitFor(() => expect(kept).toHaveBeenCalled());
    expect(removed).not.toHaveBeenCalled();
  });

  it('still calls the other listeners when one throws, and rethrows its error', async () => {
    const thrown: unknown[] = [];
    const onError = (error: unknown) => thrown.push(error);
    process.on('uncaughtException', onError);
    try {
      const { target, getPort } = servingParent(() => undefined);
      const transport = await open(options(target));
      const failure = new Error('listener bug');
      const next = vi.fn();
      transport.on('themeChanged', () => {
        throw failure;
      });
      transport.on('themeChanged', next);
      getPort()?.postMessage({ type: 'event', name: 'themeChanged', data: {} });
      await vi.waitFor(() => expect(thrown).toEqual([failure]));
      expect(next).toHaveBeenCalled();
    } finally {
      process.off('uncaughtException', onError);
    }
  });

  it('adds no listener once closed', async () => {
    const { target } = servingParent(() => undefined);
    const transport = await open(options(target));
    transport.close();
    transport.close();
    expect(() => transport.on('localeChanged', vi.fn())).not.toThrow();
  });
});
