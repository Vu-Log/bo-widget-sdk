import { afterEach, describe, expect, it, vi } from 'vitest';
import { CDP_TIMEOUT_MS, connectCdp, type CdpSocket } from './cdp.js';

/** Stands for the WebSocket of Chrome: records what is sent, and plays its events. */
class FakeSocket implements CdpSocket {
  readonly sent: { id: number; method: string; params: unknown; sessionId?: string }[] = [];
  closed = false;
  private readonly listeners = new Map<string, ((event: { data: unknown }) => void)[]>();

  addEventListener(type: string, listener: (event: { data: unknown }) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data) as FakeSocket['sent'][number]);
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string, data?: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) listener({ data });
  }
}

const open = async () => {
  const socket = new FakeSocket();
  const factory = vi.fn(() => socket);
  const connecting = connectCdp('ws://127.0.0.1:9333/devtools/browser/x', factory);
  socket.emit('open');
  return { socket, factory, connection: await connecting };
};

describe('connectCdp', () => {
  it('sends numbered commands and resolves each with its own result', async () => {
    const { socket, factory, connection } = await open();

    const first = connection.send('Target.getTargets');
    const second = connection.send(
      'Runtime.evaluate',
      { expression: '1' },
      { sessionId: 'session-1' },
    );
    socket.emit('message', JSON.stringify({ id: 2, result: { value: 'second' } }));
    socket.emit('message', JSON.stringify({ id: 1, result: { targetInfos: [] } }));

    expect(await first).toEqual({ targetInfos: [] });
    expect(await second).toEqual({ value: 'second' });
    expect(factory).toHaveBeenCalledWith('ws://127.0.0.1:9333/devtools/browser/x');
    expect(socket.sent).toEqual([
      { id: 1, method: 'Target.getTargets', params: {} },
      { id: 2, method: 'Runtime.evaluate', params: { expression: '1' }, sessionId: 'session-1' },
    ]);
  });

  it('rejects a command CDP answers with an error', async () => {
    const { socket, connection } = await open();

    const sent = connection.send('Target.attachToTarget', { targetId: 'gone' });
    socket.emit(
      'message',
      JSON.stringify({ id: 1, error: { message: 'No target with given id' } }),
    );

    await expect(sent).rejects.toThrow('CDP error: No target with given id');
  });

  it('ignores events, unknown ids and frames that are not JSON', async () => {
    const { socket, connection } = await open();

    const sent = connection.send('Target.getTargets');
    socket.emit('message', 'not json');
    socket.emit('message', JSON.stringify({ method: 'Target.targetCreated', params: {} }));
    socket.emit('message', JSON.stringify({ id: 99, result: {} }));
    socket.emit('message', JSON.stringify({ id: 1, result: { ok: true } }));

    expect(await sent).toEqual({ ok: true });
  });

  it('fails the pending commands and tells the listeners when Chrome closes', async () => {
    const { socket, connection } = await open();
    const onClose = vi.fn();
    connection.onClose(onClose);

    const sent = connection.send('Target.getTargets');
    socket.emit('close');

    await expect(sent).rejects.toThrow('CDP connection closed');
    await expect(connection.send('Target.getTargets')).rejects.toThrow('CDP connection closed');
    expect(connection.closed).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
    socket.emit('error');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls a listener added after the close at once', async () => {
    const { connection } = await open();
    connection.close();
    const onClose = vi.fn();

    connection.onClose(onClose);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('timeouts', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('rejects a command Chrome does not answer in time, and ignores its late answer', async () => {
      vi.useFakeTimers();
      const { socket, connection } = await open();

      const sent = connection.send('Runtime.evaluate', {}, { timeoutMs: 20_000 });
      const failure = expect(sent).rejects.toThrow('CDP Runtime.evaluate timed out after 20 s');
      await vi.advanceTimersByTimeAsync(20_000);
      await failure;
      socket.emit('message', JSON.stringify({ id: 1, result: { late: true } }));

      const next = connection.send('Target.getTargets');
      socket.emit('message', JSON.stringify({ id: 2, result: { ok: true } }));
      expect(await next).toEqual({ ok: true });
      expect(connection.closed).toBe(false);
    });

    it('waits CDP_TIMEOUT_MS by default', async () => {
      vi.useFakeTimers();
      const { connection } = await open();

      const sent = connection.send('Target.getTargets');
      const failure = expect(sent).rejects.toThrow(`timed out after ${CDP_TIMEOUT_MS / 1000} s`);
      await vi.advanceTimersByTimeAsync(CDP_TIMEOUT_MS - 1);
      let settled = false;
      void sent.catch(() => (settled = true));
      await Promise.resolve();
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await failure;
    });

    it('does not fire after the answer', async () => {
      vi.useFakeTimers();
      const { socket, connection } = await open();

      const sent = connection.send('Target.getTargets');
      socket.emit('message', JSON.stringify({ id: 1, result: { ok: true } }));
      expect(await sent).toEqual({ ok: true });

      await vi.advanceTimersByTimeAsync(CDP_TIMEOUT_MS * 2);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it('rejects a command the socket cannot send', async () => {
    const { socket, connection } = await open();
    socket.send = () => {
      throw new Error('socket is closing');
    };

    await expect(connection.send('Target.getTargets')).rejects.toThrow('socket is closing');
  });

  it('closes the socket on close', async () => {
    const { socket, connection } = await open();

    connection.close();

    expect(socket.closed).toBe(true);
    expect(connection.closed).toBe(true);
  });

  it('rejects when the socket cannot be opened', async () => {
    const socket = new FakeSocket();
    const connecting = connectCdp('ws://127.0.0.1:9333/x', () => socket);
    socket.emit('error');

    await expect(connecting).rejects.toThrow('cannot connect to the Chrome DevTools');
  });

  it('needs a global WebSocket by default', async () => {
    vi.stubGlobal('WebSocket', undefined);
    try {
      await expect(connectCdp('ws://127.0.0.1:9333/x')).rejects.toThrow('Node.js 22 or later');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
