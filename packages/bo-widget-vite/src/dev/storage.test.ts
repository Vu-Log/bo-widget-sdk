import { describe, expect, it } from 'vitest';
import { WidgetHostError } from './hostError.js';
import { STORAGE_VALUE_MAX_BYTES, createFakeStorage, parseStorageRequest } from './storage.js';

const START = Date.parse('2026-11-12T08:00:00.000Z');

/** A storage on a clock the test moves, with predictable generated ids. */
const setup = (quotas = {}) => {
  let time = START;
  let generated = 0;
  const storage = createFakeStorage({
    userId: 'u1',
    now: () => time,
    generateId: () => `gen${++generated}`,
    quotas,
  });
  return {
    storage,
    run: (payload: unknown, space: 'storage' | 'sharedStorage' = 'storage') =>
      storage.run(space, payload),
    advance: (seconds: number) => {
      time += seconds * 1000;
    },
  };
};

/** What `run` throws, as `{ code, status }` (with the message when asked). */
const refusal = (run: () => unknown, withMessage = false) => {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(WidgetHostError);
    const { code, status, message } = error as WidgetHostError;
    return withMessage ? { code, status, message } : { code, status };
  }
  throw new Error('expected a refusal');
};

const invalid = { code: 'invalid-payload', status: null };

describe('parseStorageRequest', () => {
  it('keeps a valid request, its value copied as JSON and undefined options dropped', () => {
    const value = { a: 1, skipped: undefined, nested: { list: ['x', { y: null }] } };
    const request = parseStorageRequest(
      {
        op: 'set',
        collection: 'prefs',
        id: 'columns',
        value,
        options: { ttlSeconds: undefined, ifVersion: 2 },
      },
      'storage',
    );
    expect(request).toEqual({
      op: 'set',
      collection: 'prefs',
      id: 'columns',
      value: { a: 1, nested: { list: ['x', { y: null }] } },
      options: { ifVersion: 2 },
    });
    expect(request.value).not.toBe(value);
  });

  it.each([
    ['not an object', 'get', 'storage: the request must be an object { op, collection, … }'],
    [
      'an unknown op',
      { op: 'drop', collection: 'c' },
      'storage: op must be one of get, set, add, update, delete, list, query, clear',
    ],
    [
      'an unknown field',
      { op: 'clear', collection: 'c', space: 'x' },
      "storage.clear: unknown field 'space' in the request",
    ],
    [
      'an upper-case collection',
      { op: 'clear', collection: 'Prefs' },
      'storage.clear: collection must match /^[a-z0-9][a-z0-9_-]{0,63}$/',
    ],
    [
      'a collection of 65 characters',
      { op: 'clear', collection: 'a'.repeat(65) },
      'storage.clear: collection must match /^[a-z0-9][a-z0-9_-]{0,63}$/',
    ],
    [
      'a missing id',
      { op: 'get', collection: 'c' },
      'storage.get: id must be 1 to 128 letters, digits, _ or -, not starting and ending with __',
    ],
    [
      'a reserved id',
      { op: 'get', collection: 'c', id: '__x__' },
      'storage.get: id must be 1 to 128 letters, digits, _ or -, not starting and ending with __',
    ],
    [
      'an id of 129 characters',
      { op: 'delete', collection: 'c', id: 'a'.repeat(129) },
      'storage.delete: id must be 1 to 128 letters, digits, _ or -, not starting and ending with __',
    ],
    [
      'an id given to add',
      { op: 'add', collection: 'c', id: 'a', value: {} },
      'storage.add: this operation takes no id',
    ],
    [
      'a value given to get',
      { op: 'get', collection: 'c', id: 'a', value: {} },
      'storage.get: this operation takes no value',
    ],
    [
      'an array value',
      { op: 'add', collection: 'c', value: [1] },
      'storage.add: value must be a JSON object (store a scalar as { value: 42 })',
    ],
    [
      'a scalar value',
      { op: 'set', collection: 'c', id: 'a', value: 42 },
      'storage.set: value must be a JSON object (store a scalar as { value: 42 })',
    ],
    [
      'a Date',
      { op: 'add', collection: 'c', value: { at: new Date(0) } },
      'storage.add: value can only hold strings, finite numbers, booleans, null, arrays and plain objects',
    ],
    [
      'a function',
      { op: 'add', collection: 'c', value: { run: () => 1 } },
      'storage.add: value can only hold strings, finite numbers, booleans, null, arrays and plain objects',
    ],
    [
      'NaN',
      { op: 'add', collection: 'c', value: { n: Number.NaN } },
      'storage.add: a number must be finite',
    ],
    [
      'an array in an array',
      { op: 'add', collection: 'c', value: { m: [[1]] } },
      'storage.add: value cannot hold an array directly inside an array',
    ],
    [
      'an undefined array item',
      { op: 'add', collection: 'c', value: { m: [undefined] } },
      'storage.add: value can only hold strings, finite numbers, booleans, null, arrays and plain objects',
    ],
    [
      'an empty key',
      { op: 'add', collection: 'c', value: { '': 1 } },
      'storage.add: value cannot hold an empty key, nor a key path longer than 1500 bytes',
    ],
    [
      'a reserved key',
      { op: 'add', collection: 'c', value: { __x__: 1 } },
      'storage.add: value cannot hold a key that starts and ends with "__"',
    ],
    [
      'an unknown option',
      { op: 'get', collection: 'c', id: 'a', options: { ttlSeconds: 60 } },
      "storage.get: unknown option 'ttlSeconds' (accepted: none)",
    ],
    [
      'ifVersion given to add',
      { op: 'add', collection: 'c', value: {}, options: { ifVersion: 0 } },
      "storage.add: unknown option 'ifVersion' (accepted: ttlSeconds)",
    ],
    [
      'options that are not an object',
      { op: 'list', collection: 'c', options: 'all' },
      'storage.list: options must be an object',
    ],
    [
      'a negative ifVersion',
      { op: 'set', collection: 'c', id: 'a', value: {}, options: { ifVersion: -1 } },
      'storage.set: options.ifVersion must be an integer >= 0',
    ],
    [
      'a ttlSeconds of 59',
      { op: 'set', collection: 'c', id: 'a', value: {}, options: { ttlSeconds: 59 } },
      'storage.set: options.ttlSeconds must be an integer from 60 to 31536000, or null',
    ],
    [
      'a ttlSeconds over 365 days',
      { op: 'add', collection: 'c', value: {}, options: { ttlSeconds: 31_536_001 } },
      'storage.add: options.ttlSeconds must be an integer from 60 to 31536000, or null',
    ],
    [
      'a limit of 0',
      { op: 'list', collection: 'c', options: { limit: 0 } },
      'storage.list: options.limit must be an integer from 1 to 100',
    ],
    [
      'a limit of 101',
      { op: 'list', collection: 'c', options: { limit: 101 } },
      'storage.list: options.limit must be an integer from 1 to 100',
    ],
    [
      'an empty cursor',
      { op: 'list', collection: 'c', options: { cursor: '' } },
      'storage.list: options.cursor must be the nextCursor of the previous page',
    ],
    [
      'a query without where',
      { op: 'query', collection: 'c' },
      'storage.query: options.where is required',
    ],
    [
      'a query with an empty where',
      { op: 'query', collection: 'c', options: { where: {} } },
      'storage.query: options.where must hold 1 to 5 fields',
    ],
    [
      'a where of 6 fields',
      { op: 'query', collection: 'c', options: { where: { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 } } },
      'storage.query: options.where must hold 1 to 5 fields',
    ],
    [
      'a nested where field',
      { op: 'query', collection: 'c', options: { where: { 'a.b': 1 } } },
      'storage.query: options.where.a.b: the field must be a first-level name, and its value a string of 1500 bytes at most, a finite number, a boolean or null',
    ],
    [
      'a where value that is an object',
      { op: 'query', collection: 'c', options: { where: { a: {} } } },
      'storage.query: options.where.a: the field must be a first-level name, and its value a string of 1500 bytes at most, a finite number, a boolean or null',
    ],
    [
      'a where string over 1500 bytes',
      { op: 'query', collection: 'c', options: { where: { a: 'é'.repeat(751) } } },
      'storage.query: options.where.a: the field must be a first-level name, and its value a string of 1500 bytes at most, a finite number, a boolean or null',
    ],
  ])('refuses %s', (_name, payload, message) => {
    expect(refusal(() => parseStorageRequest(payload, 'storage'), true)).toEqual({
      ...invalid,
      message,
    });
  });

  it('refuses a value over 64 KB as UTF-8 JSON, and accepts one just under', () => {
    // `{"t":"…"}` is 8 bytes around the string.
    const fits = { t: 'x'.repeat(STORAGE_VALUE_MAX_BYTES - 8) };
    expect(
      parseStorageRequest({ op: 'add', collection: 'c', value: fits }, 'storage').value,
    ).toEqual(fits);
    const multiByte = { t: 'é'.repeat(STORAGE_VALUE_MAX_BYTES / 2) };
    expect(
      refusal(
        () => parseStorageRequest({ op: 'add', collection: 'c', value: multiByte }, 'storage'),
        true,
      ),
    ).toEqual({ ...invalid, message: 'storage.add: value is larger than 65536 bytes' });
  });

  it('refuses a value nested deeper than 20 levels, and a cyclic one, without overflowing', () => {
    let deep: Record<string, unknown> = { leaf: 1 };
    for (let level = 0; level < 20; level += 1) deep = { child: deep };
    expect(
      refusal(
        () => parseStorageRequest({ op: 'add', collection: 'c', value: deep }, 'storage'),
        true,
      ),
    ).toEqual({ ...invalid, message: 'storage.add: value is nested deeper than 20 levels' });
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(
      refusal(() => parseStorageRequest({ op: 'add', collection: 'c', value: cyclic }, 'storage')),
    ).toEqual(invalid);
  });

  it('refuses a value that shares one object everywhere, before walking all its paths', () => {
    let shared: Record<string, unknown> = { leaf: 1 };
    for (let level = 0; level < 19; level += 1) {
      shared = Object.fromEntries(Array.from({ length: 16 }, (_, key) => [`k${key}`, shared]));
    }
    expect(
      refusal(() => parseStorageRequest({ op: 'add', collection: 'c', value: shared }, 'storage')),
    ).toEqual(invalid);
  });

  it('refuses a __proto__ key', () => {
    const value = JSON.parse('{"__proto__": {"admin": true}}') as unknown;
    expect(
      refusal(
        () => parseStorageRequest({ op: 'add', collection: 'c', value }, 'sharedStorage'),
        true,
      ),
    ).toEqual({ ...invalid, message: 'sharedStorage.add: value cannot hold a __proto__ key' });
  });

  it('accepts null options, and a ttlSeconds of null', () => {
    expect(
      parseStorageRequest({ op: 'list', collection: 'c', options: null }, 'storage').options,
    ).toEqual({});
    expect(
      parseStorageRequest(
        { op: 'add', collection: 'c', value: {}, options: { ttlSeconds: null } },
        'storage',
      ).options,
    ).toEqual({ ttlSeconds: null });
  });
});

describe('createFakeStorage', () => {
  it('creates, reads, replaces and deletes a document', () => {
    const { run, advance } = setup();
    expect(refusal(() => run({ op: 'get', collection: 'prefs', id: 'columns' }))).toEqual({
      code: 'not-found',
      status: 404,
    });
    const created = run({
      op: 'set',
      collection: 'prefs',
      id: 'columns',
      value: { list: ['plate'] },
    });
    expect(created).toEqual({
      id: 'columns',
      value: { list: ['plate'] },
      version: 1,
      createdAt: '2026-11-12T08:00:00.000Z',
      createdBy: 'u1',
      updatedAt: '2026-11-12T08:00:00.000Z',
      updatedBy: 'u1',
    });
    advance(60);
    expect(
      run({ op: 'set', collection: 'prefs', id: 'columns', value: { list: [] } }),
    ).toMatchObject({
      value: { list: [] },
      version: 2,
      createdAt: '2026-11-12T08:00:00.000Z',
      updatedAt: '2026-11-12T08:01:00.000Z',
    });
    expect(run({ op: 'get', collection: 'prefs', id: 'columns' })).toMatchObject({ version: 2 });
    expect(run({ op: 'delete', collection: 'prefs', id: 'columns' })).toBeNull();
    expect(run({ op: 'delete', collection: 'prefs', id: 'columns' })).toBeNull();
    expect(refusal(() => run({ op: 'get', collection: 'prefs', id: 'columns' }))).toEqual({
      code: 'not-found',
      status: 404,
    });
  });

  it('answers copies: changing an answer or the written value changes nothing stored', () => {
    const { run } = setup();
    const value = { list: ['plate'] };
    const written = run({ op: 'set', collection: 'c', id: 'a', value }) as {
      value: { list: string[] };
    };
    value.list.push('status');
    written.value.list.push('other');
    expect(run({ op: 'get', collection: 'c', id: 'a' })).toMatchObject({
      value: { list: ['plate'] },
    });
  });

  it('adds a document under a generated id', () => {
    const { run } = setup();
    expect(run({ op: 'add', collection: 'tickets', value: { status: 'open' } })).toMatchObject({
      id: 'gen1',
      version: 1,
    });
    expect(run({ op: 'get', collection: 'tickets', id: 'gen1' })).toMatchObject({
      value: { status: 'open' },
    });
  });

  it('generates ids of 20 letters and digits by default', () => {
    const storage = createFakeStorage({ userId: 'u1' });
    const { id } = storage.run('storage', { op: 'add', collection: 'c', value: {} }) as {
      id: string;
    };
    expect(id).toMatch(/^[A-Za-z0-9]{20}$/);
  });

  it('merges the first-level fields on update, and needs the document', () => {
    const { run } = setup();
    expect(refusal(() => run({ op: 'update', collection: 't', id: 'a', value: { b: 1 } }))).toEqual(
      {
        code: 'not-found',
        status: 404,
      },
    );
    run({ op: 'set', collection: 't', id: 'a', value: { status: 'open', meta: { x: 1, y: 2 } } });
    expect(
      run({ op: 'update', collection: 't', id: 'a', value: { meta: { x: 3 }, closedBy: null } }),
    ).toMatchObject({ value: { status: 'open', meta: { x: 3 }, closedBy: null }, version: 2 });
  });

  it('refuses a merged value over 64 KB with value-too-large', () => {
    const { run } = setup();
    const half = 'x'.repeat(STORAGE_VALUE_MAX_BYTES / 2);
    run({ op: 'set', collection: 't', id: 'a', value: { a: half } });
    expect(
      refusal(() => run({ op: 'update', collection: 't', id: 'a', value: { b: half } })),
    ).toEqual({
      code: 'value-too-large',
      status: 413,
    });
    expect(run({ op: 'get', collection: 't', id: 'a' })).toMatchObject({ version: 1 });
  });

  it('writes only at the expected version with ifVersion', () => {
    const { run } = setup();
    expect(
      refusal(() =>
        run({ op: 'set', collection: 't', id: 'a', value: {}, options: { ifVersion: 1 } }),
      ),
    ).toEqual({ code: 'version-conflict', status: 409 });
    run({ op: 'set', collection: 't', id: 'a', value: { n: 1 } });
    expect(
      run({ op: 'set', collection: 't', id: 'a', value: { n: 2 }, options: { ifVersion: 1 } }),
    ).toMatchObject({ version: 2 });
    expect(
      refusal(() =>
        run({ op: 'update', collection: 't', id: 'a', value: { n: 3 }, options: { ifVersion: 1 } }),
      ),
    ).toEqual({ code: 'version-conflict', status: 409 });
    expect(
      run({ op: 'update', collection: 't', id: 'a', value: { n: 3 }, options: { ifVersion: 2 } }),
    ).toMatchObject({ version: 3, value: { n: 3 } });
  });

  it('makes a lock with ifVersion 0 and ttlSeconds: refused while held, free once expired', () => {
    const { run, advance } = setup();
    const lock = {
      op: 'set',
      collection: 'locks',
      id: 'vehicle-V1',
      value: { by: 'u1' },
      options: { ifVersion: 0, ttlSeconds: 300 },
    };
    expect(run(lock)).toMatchObject({ version: 1, expiresAt: '2026-11-12T08:05:00.000Z' });
    expect(refusal(() => run(lock))).toEqual({ code: 'already-exists', status: 409 });
    expect(
      refusal(() =>
        run({
          op: 'update',
          collection: 'locks',
          id: 'vehicle-V1',
          value: {},
          options: { ifVersion: 0 },
        }),
      ),
    ).toEqual({ code: 'already-exists', status: 409 });
    advance(299);
    expect(run({ op: 'get', collection: 'locks', id: 'vehicle-V1' })).toMatchObject({ version: 1 });
    advance(1);
    expect(refusal(() => run({ op: 'get', collection: 'locks', id: 'vehicle-V1' }))).toEqual({
      code: 'not-found',
      status: 404,
    });
    expect(run(lock)).toMatchObject({ version: 1, expiresAt: '2026-11-12T08:10:00.000Z' });
  });

  it('keeps the expiry on update, removes it with null and on set', () => {
    const { run } = setup();
    run({ op: 'add', collection: 'c', value: {}, options: { ttlSeconds: 60 } });
    expect(run({ op: 'update', collection: 'c', id: 'gen1', value: { a: 1 } })).toHaveProperty(
      'expiresAt',
    );
    expect(
      run({ op: 'update', collection: 'c', id: 'gen1', value: {}, options: { ttlSeconds: null } }),
    ).not.toHaveProperty('expiresAt');
    run({ op: 'update', collection: 'c', id: 'gen1', value: {}, options: { ttlSeconds: 120 } });
    expect(run({ op: 'set', collection: 'c', id: 'gen1', value: {} })).not.toHaveProperty(
      'expiresAt',
    );
  });

  it('treats an expired document as absent: update refused, list without it', () => {
    const { run, advance } = setup();
    run({ op: 'set', collection: 'c', id: 'a', value: {}, options: { ttlSeconds: 60 } });
    run({ op: 'set', collection: 'c', id: 'b', value: {} });
    advance(60);
    expect(refusal(() => run({ op: 'update', collection: 'c', id: 'a', value: {} }))).toEqual({
      code: 'not-found',
      status: 404,
    });
    expect(run({ op: 'list', collection: 'c' })).toMatchObject({
      items: [{ id: 'b' }],
      nextCursor: null,
    });
  });

  it('lists in id order, page by page, with the cursor', () => {
    const { run } = setup();
    for (const id of ['c', 'a', 'B', 'b', '1'])
      run({ op: 'set', collection: 'col', id, value: { id } });
    const ids = (page: unknown) => (page as { items: { id: string }[] }).items.map(({ id }) => id);
    const first = run({ op: 'list', collection: 'col', options: { limit: 2 } }) as {
      nextCursor: string;
    };
    expect(ids(first)).toEqual(['1', 'B']);
    expect(first.nextCursor).toBe('Qg'); // base64url of B, without padding
    const second = run({
      op: 'list',
      collection: 'col',
      options: { limit: 2, cursor: first.nextCursor },
    }) as {
      nextCursor: string;
    };
    expect(ids(second)).toEqual(['a', 'b']);
    const last = run({
      op: 'list',
      collection: 'col',
      options: { limit: 2, cursor: second.nextCursor },
    });
    expect(last).toMatchObject({ items: [{ id: 'c' }], nextCursor: null });
    expect(ids(run({ op: 'list', collection: 'col' }))).toEqual(['1', 'B', 'a', 'b', 'c']);
  });

  it('answers a full last page without nextCursor, and an unknown collection as empty', () => {
    const { run } = setup();
    run({ op: 'set', collection: 'col', id: 'a', value: {} });
    run({ op: 'set', collection: 'col', id: 'b', value: {} });
    expect(run({ op: 'list', collection: 'col', options: { limit: 2 } })).toMatchObject({
      nextCursor: null,
    });
    expect(run({ op: 'list', collection: 'none' })).toEqual({ items: [], nextCursor: null });
  });

  it('pages 50 documents by default', () => {
    const { run } = setup();
    for (let index = 0; index < 51; index += 1) {
      run({ op: 'set', collection: 'col', id: `d${String(index).padStart(2, '0')}`, value: {} });
    }
    const page = run({ op: 'list', collection: 'col' }) as {
      items: unknown[];
      nextCursor: string | null;
    };
    expect(page.items).toHaveLength(50);
    expect(page.nextCursor).toBe(btoa('d49'));
  });

  it.each(['not-base64!', 'QQ==', btoa('__x__'), 'QUJD' + 'x'])(
    'refuses a cursor it did not make (%s) with invalid-cursor',
    (cursor) => {
      const { run } = setup();
      expect(refusal(() => run({ op: 'list', collection: 'col', options: { cursor } }))).toEqual({
        code: 'invalid-cursor',
        status: 400,
      });
    },
  );

  it('queries by equality on first-level fields, page by page', () => {
    const { run } = setup();
    run({
      op: 'set',
      collection: 't',
      id: 't1',
      value: { status: 'open', vehicleId: 'V1', priority: 2 },
    });
    run({ op: 'set', collection: 't', id: 't2', value: { status: 'closed', vehicleId: 'V1' } });
    run({
      op: 'set',
      collection: 't',
      id: 't3',
      value: { status: 'open', vehicleId: 'V2', flag: null },
    });
    run({
      op: 'set',
      collection: 't',
      id: 't4',
      value: { status: 'open', vehicleId: 'V1', priority: 2 },
    });
    run({ op: 'set', collection: 't', id: 't5', value: { status: ['open'] } });
    const ids = (page: unknown) => (page as { items: { id: string }[] }).items.map(({ id }) => id);
    expect(
      ids(run({ op: 'query', collection: 't', options: { where: { status: 'open' } } })),
    ).toEqual(['t1', 't3', 't4']);
    expect(
      ids(
        run({
          op: 'query',
          collection: 't',
          options: { where: { status: 'open', vehicleId: 'V1', priority: 2 } },
        }),
      ),
    ).toEqual(['t1', 't4']);
    expect(ids(run({ op: 'query', collection: 't', options: { where: { flag: null } } }))).toEqual([
      't3',
    ]);
    expect(
      ids(run({ op: 'query', collection: 't', options: { where: { priority: '2' } } })),
    ).toEqual([]);
    const first = run({
      op: 'query',
      collection: 't',
      options: { where: { status: 'open' }, limit: 2 },
    }) as {
      nextCursor: string;
    };
    expect(ids(first)).toEqual(['t1', 't3']);
    expect(
      run({
        op: 'query',
        collection: 't',
        options: { where: { status: 'open' }, limit: 2, cursor: first.nextCursor },
      }),
    ).toMatchObject({ items: [{ id: 't4' }], nextCursor: null });
  });

  it('clears a collection, and only it', () => {
    const { run } = setup();
    run({ op: 'set', collection: 'a', id: '1', value: {} });
    run({ op: 'set', collection: 'a', id: '2', value: {} });
    run({ op: 'set', collection: 'b', id: '1', value: {} });
    expect(run({ op: 'clear', collection: 'a' })).toEqual({ deletedDocs: 2 });
    expect(run({ op: 'clear', collection: 'a' })).toEqual({ deletedDocs: 0 });
    expect(run({ op: 'get', collection: 'b', id: '1' })).toMatchObject({ id: '1' });
  });

  it('keeps the two spaces apart', () => {
    const { run, storage } = setup();
    run({ op: 'set', collection: 'prefs', id: 'a', value: { space: 'widget' } }, 'storage');
    expect(
      refusal(() => run({ op: 'get', collection: 'prefs', id: 'a' }, 'sharedStorage')),
    ).toEqual({
      code: 'not-found',
      status: 404,
    });
    run({ op: 'set', collection: 'prefs', id: 'a', value: { space: 'shared' } }, 'sharedStorage');
    expect(run({ op: 'get', collection: 'prefs', id: 'a' }, 'storage')).toMatchObject({
      value: { space: 'widget' },
    });
    expect(run({ op: 'clear', collection: 'prefs' }, 'sharedStorage')).toEqual({ deletedDocs: 1 });
    expect(run({ op: 'get', collection: 'prefs', id: 'a' }, 'storage')).toMatchObject({
      value: { space: 'widget' },
    });
    run({ op: 'set', collection: 'other', id: 'b', value: {} }, 'sharedStorage');
    expect(storage.clear()).toBe(2);
    expect(run({ op: 'list', collection: 'prefs' }, 'storage')).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('refuses a new collection past the collections quota', () => {
    const { run } = setup({ collectionsPerSpace: 2 });
    run({ op: 'set', collection: 'a', id: '1', value: {} });
    run({ op: 'set', collection: 'b', id: '1', value: {} });
    expect(refusal(() => run({ op: 'set', collection: 'c', id: '1', value: {} }))).toEqual({
      code: 'quota-exceeded',
      status: 422,
    });
    expect(run({ op: 'set', collection: 'c', id: '1', value: {} }, 'sharedStorage')).toMatchObject({
      version: 1,
    });
    run({ op: 'clear', collection: 'b' });
    expect(run({ op: 'set', collection: 'c', id: '1', value: {} })).toMatchObject({ version: 1 });
  });

  it('refuses a new document past the documents quota, not a replacement', () => {
    const { run } = setup({ docsPerCollection: 1 });
    run({ op: 'set', collection: 'a', id: '1', value: {} });
    expect(refusal(() => run({ op: 'add', collection: 'a', value: {} }))).toEqual({
      code: 'quota-exceeded',
      status: 422,
    });
    expect(run({ op: 'set', collection: 'a', id: '1', value: { n: 2 } })).toMatchObject({
      version: 2,
    });
  });

  it('refuses a growing write past the bytes quota, not a shrinking one nor a delete', () => {
    const { run } = setup({ bytesPerSpace: 30 });
    run({ op: 'set', collection: 'a', id: '1', value: { t: 'x'.repeat(10) } });
    expect(
      refusal(() => run({ op: 'set', collection: 'a', id: '2', value: { t: 'x'.repeat(10) } })),
    ).toEqual({
      code: 'quota-exceeded',
      status: 422,
    });
    expect(run({ op: 'set', collection: 'a', id: '1', value: { t: '' } })).toMatchObject({
      version: 2,
    });
    expect(run({ op: 'delete', collection: 'a', id: '1' })).toBeNull();
  });

  it('checks the request before the stored documents', () => {
    const { run } = setup();
    expect(refusal(() => run({ op: 'get', collection: 'Bad', id: 'a' }))).toEqual(invalid);
  });
});
