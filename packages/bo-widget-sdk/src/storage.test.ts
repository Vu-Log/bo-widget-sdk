import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { BoError } from './errors.js';
import { createStorage } from './storage.js';
import type { BoStorageDocument, BoStorageRequest, BoStorageSpace, BoTransport } from './types.js';

const doc = (id: string, value: object, version = 1): BoStorageDocument<object> => ({
  id,
  value,
  version,
  createdAt: '2026-11-12T08:00:00.000Z',
  createdBy: 'u1',
  updatedAt: '2026-11-12T08:00:00.000Z',
  updatedBy: 'u1',
});

/** A transport whose `storage` answers `answer(space, request)`. */
const fakeTransport = (answer: (space: BoStorageSpace, request: BoStorageRequest) => unknown) => {
  const storage = vi.fn(async (space: BoStorageSpace, request: BoStorageRequest) =>
    answer(space, request),
  );
  return { transport: { storage } as unknown as BoTransport, storage };
};

describe('createStorage', () => {
  it('sends each operation to its space, without the fields left out', async () => {
    const { transport, storage } = fakeTransport((_space, { op }) =>
      op === 'delete' ? null : { op },
    );
    const tickets = createStorage(transport, 'sharedStorage').collection('tickets');

    await tickets.get('t1');
    await tickets.set('t1', { status: 'open' });
    await tickets.set('t1', { status: 'open' }, { ifVersion: 0, ttlSeconds: 300 });
    await tickets.add({ status: 'open' }, { ttlSeconds: null });
    await tickets.update('t1', { status: 'closed' }, { ifVersion: 3 });
    await tickets.delete('t1');
    await tickets.list();
    await tickets.list({ limit: 10, cursor: 'abc' });
    await tickets.query({ where: { status: 'open' }, limit: 5 });
    await tickets.clear();

    expect(storage.mock.calls).toEqual([
      ['sharedStorage', { op: 'get', collection: 'tickets', id: 't1' }],
      ['sharedStorage', { op: 'set', collection: 'tickets', id: 't1', value: { status: 'open' } }],
      [
        'sharedStorage',
        {
          op: 'set',
          collection: 'tickets',
          id: 't1',
          value: { status: 'open' },
          options: { ifVersion: 0, ttlSeconds: 300 },
        },
      ],
      [
        'sharedStorage',
        {
          op: 'add',
          collection: 'tickets',
          value: { status: 'open' },
          options: { ttlSeconds: null },
        },
      ],
      [
        'sharedStorage',
        {
          op: 'update',
          collection: 'tickets',
          id: 't1',
          value: { status: 'closed' },
          options: { ifVersion: 3 },
        },
      ],
      ['sharedStorage', { op: 'delete', collection: 'tickets', id: 't1' }],
      ['sharedStorage', { op: 'list', collection: 'tickets' }],
      [
        'sharedStorage',
        { op: 'list', collection: 'tickets', options: { limit: 10, cursor: 'abc' } },
      ],
      [
        'sharedStorage',
        { op: 'query', collection: 'tickets', options: { where: { status: 'open' }, limit: 5 } },
      ],
      ['sharedStorage', { op: 'clear', collection: 'tickets' }],
    ]);
    for (const [, request] of storage.mock.calls) {
      expect(Object.values(request)).not.toContain(undefined);
    }
  });

  it('resolves what the back office answers', async () => {
    const stored = doc('columns', { list: ['plate'] }, 2);
    const page = { items: [stored], nextCursor: 'next' };
    const answers: Record<string, unknown> = {
      get: stored,
      set: stored,
      add: stored,
      update: stored,
      delete: null,
      list: page,
      query: page,
      clear: { deletedDocs: 3 },
    };
    const { transport } = fakeTransport((_space, { op }) => answers[op]);
    const prefs = createStorage(transport, 'storage').collection<{ list: string[] }>('prefs');

    await expect(prefs.get('columns')).resolves.toEqual(stored);
    await expect(prefs.set('columns', { list: ['plate'] })).resolves.toEqual(stored);
    await expect(prefs.add({ list: [] })).resolves.toEqual(stored);
    await expect(prefs.update('columns', { list: [] })).resolves.toEqual(stored);
    await expect(prefs.delete('columns')).resolves.toBeUndefined();
    await expect(prefs.list()).resolves.toEqual(page);
    await expect(prefs.query({ where: { a: 1 } })).resolves.toEqual(page);
    await expect(prefs.clear()).resolves.toEqual({ deletedDocs: 3 });
  });

  it('resolves get of a missing or expired document with null', async () => {
    const { transport } = fakeTransport(() => {
      throw new BoError('INTERNAL', 'absent', { reason: 'not-found', status: 404 });
    });
    await expect(createStorage(transport, 'storage').collection('prefs').get('x')).resolves.toBe(
      null,
    );
  });

  it.each([
    ['FORBIDDEN', new BoError('FORBIDDEN', 'no permission')],
    ['INVALID_PAYLOAD', new BoError('INVALID_PAYLOAD', 'bad id')],
    ['another reason', new BoError('INTERNAL', 'gone', { reason: 'not-installed', status: 404 })],
    ['no reason', new BoError('INTERNAL', 'failed')],
    ['DISCONNECTED', new BoError('DISCONNECTED', 'closed')],
  ])('rejects get with the error of the back office: %s', async (_name, error) => {
    const { transport } = fakeTransport(() => {
      throw error;
    });
    await expect(createStorage(transport, 'storage').collection('prefs').get('x')).rejects.toBe(
      error,
    );
  });

  it('keeps not-found for the other operations (update of a missing document)', async () => {
    const error = new BoError('INTERNAL', 'absent', { reason: 'not-found', status: 404 });
    const { transport } = fakeTransport(() => {
      throw error;
    });
    const prefs = createStorage(transport, 'storage').collection('prefs');
    await expect(prefs.update('x', { a: 1 })).rejects.toBe(error);
    await expect(prefs.delete('x')).rejects.toBe(error);
  });

  it('rejects with the reason and status of the server', async () => {
    const { transport } = fakeTransport(() => {
      throw new BoError('INTERNAL', 'conflict', { reason: 'version-conflict', status: 409 });
    });
    await expect(
      createStorage(transport, 'storage').collection('prefs').set('a', {}, { ifVersion: 2 }),
    ).rejects.toMatchObject({ code: 'INTERNAL', reason: 'version-conflict', status: 409 });
  });

  it('sends nothing until a method is called, and checks nothing itself', async () => {
    const { transport, storage } = fakeTransport(() => null);
    const collection = createStorage(transport, 'storage').collection('Not A Valid Name');
    expect(storage).not.toHaveBeenCalled();
    await collection.delete('');
    expect(storage).toHaveBeenCalledWith('storage', {
      op: 'delete',
      collection: 'Not A Valid Name',
      id: '',
    });
  });

  it('returns frozen objects that name their collection', () => {
    const { transport } = fakeTransport(() => null);
    const storage = createStorage(transport, 'storage');
    const prefs = storage.collection('prefs');
    expect(prefs.name).toBe('prefs');
    expect(Object.isFrozen(storage)).toBe(true);
    expect(Object.isFrozen(prefs)).toBe(true);
  });

  it('types the values of a collection', () => {
    const { transport } = fakeTransport(() => null);
    interface Ticket {
      status: 'open' | 'closed';
      priority: number;
    }
    const tickets = createStorage(transport, 'storage').collection<Ticket>('tickets');
    expectTypeOf(tickets.get).returns.resolves.toEqualTypeOf<BoStorageDocument<Ticket> | null>();
    expectTypeOf(tickets.update).parameter(1).toEqualTypeOf<Partial<Ticket>>();
    expectTypeOf(tickets.list).returns.resolves.toHaveProperty('items');
  });
});
