---
description: bo.storage and bo.sharedStorage, the data a widget keeps without a backend - key/value, tables, locks with ifVersion and ttlSeconds, pages and queries, errors, limits and what the isolation guarantees.
---

# Storing data

A widget can keep its own data at Vulog, without a backend of its own: preferences, drafts, business state, a cache, data shared between widgets. The data belongs to the BO host the widget is installed on.

```ts
const bo = await connect(this);
const prefs = bo.storage.collection('prefs');
```

Two spaces, each with its permission in `widget.config.ts`:

| Space              | Permission      | Holds                                                                       |
| ------------------ | --------------- | --------------------------------------------------------------------------- |
| `bo.storage`       | `storage`       | The data of this widget, on this host                                       |
| `bo.sharedStorage` | `sharedStorage` | The data shared by the widgets of the same publisher installed on this host |

```ts
export default defineWidgetConfig({
  name: 'Planning',
  permissions: ['storage', 'sharedStorage'],
});
```

Unlike the other permissions, these two are **enforced in both modes**: without the permission, each call rejects with `BoError` code `FORBIDDEN`, as a Web Component too. `connect` itself never fails for it.

The settings of the widget (`getSettings`) do not change: they are written by an administrator. The storage holds data the widget writes while it runs.

## Collections and documents

A space holds **collections** of **documents**. A document is a JSON object, read and written by its id:

```ts
{
  id: 't-42',
  value: { vehicleId: 'V1', status: 'open', priority: 2 },
  version: 3,                              // 1 on creation, +1 on each write
  createdAt: '2026-11-12T08:00:00.000Z',
  createdBy: '6f1c…',                      // id of the user (getCurrentUser().id), never an email
  updatedAt: '2026-11-12T09:30:00.000Z',
  updatedBy: '6f1c…',
  expiresAt: '2026-11-13T09:30:00.000Z',   // only with ttlSeconds
}
```

- A collection is created on its first write. Its name matches `^[a-z0-9][a-z0-9_-]{0,63}$`.
- A document id is 1 to 128 letters, digits, `_` or `-`, and does not both start and end with `__`.
- A value is a plain object, 64 KB at most as UTF-8 JSON, 20 levels deep at most. Store a scalar in an object: `{ value: 42 }`. It cannot hold an array directly inside an array, a `Date` (store its ISO string), a function, `NaN`, an empty key or a `__proto__` key. A property set to `undefined` is dropped.

`collection<T>(name)` types the values of a collection. The type is not checked at runtime.

```ts
interface Ticket {
  vehicleId: string;
  status: 'open' | 'closed';
}
const tickets = bo.sharedStorage.collection<Ticket>('planning-tickets');
```

| Method                                           | Does                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `get(id)`                                        | The document, or `null` when it does not exist or expired                             |
| `set(id, value, { ifVersion?, ttlSeconds? })`    | Creates or replaces the document                                                      |
| `add(value, { ttlSeconds? })`                    | Creates a document under a generated id                                               |
| `update(id, patch, { ifVersion?, ttlSeconds? })` | Merges the first-level fields of `patch`; rejects with reason `not-found` when absent |
| `delete(id)`                                     | Deletes the document, even when absent                                                |
| `list({ limit?, cursor? })`                      | A page `{ items, nextCursor }`, in id order                                           |
| `query({ where, limit?, cursor? })`              | A page of the documents whose first-level fields equal `where`                        |
| `clear()`                                        | Deletes every document of the collection: `{ deletedDocs }`                           |

Nothing is cached: every call is sent to the BO, which checks it and relays it to Vulog.

## Key / value

```ts
const prefs = bo.storage.collection<{ list: string[] }>('prefs');

await prefs.set('columns', { list: ['plate', 'status'] });
const columns = (await prefs.get('columns'))?.value.list ?? DEFAULT_COLUMNS;
await prefs.delete('columns');
```

There is no data per user. For a value per user, put the id of `getCurrentUser()` in the document id (`columns-${user.id}`), and delete it yourself when it is no longer needed. Same for a value per fleet: put the `fleetId` in the id or in a field.

## Table

```ts
const tickets = bo.sharedStorage.collection<Ticket>('planning-tickets');

const { id } = await tickets.add({ vehicleId: 'V1', status: 'open' });
await tickets.update(id, { status: 'closed' });

const open = await tickets.query({ where: { status: 'open', vehicleId: 'V1' }, limit: 50 });

let cursor: string | undefined;
do {
  const page = await tickets.list({ limit: 100, ...(cursor ? { cursor } : {}) });
  render(page.items);
  cursor = page.nextCursor ?? undefined;
} while (cursor);
```

- `limit` is 1 to 100, 50 by default. Pass the `nextCursor` of a page as `cursor` to read the next one; it is `null` on the last page.
- Expired documents are left out of a page: a page may hold fewer than `limit` documents, or none, while `nextCursor` is not `null`. Keep reading until `nextCursor` is `null`.
- `where` holds 1 to 5 first-level fields, each compared for equality with a string (1 500 UTF-8 bytes at most), a number, a boolean or `null`. No range, no sort other than the id, no nested field.

## Concurrent writes: `ifVersion`

Several users may write the same document. Pass the version you read: the write is refused when someone wrote in between.

```ts
const doc = await counters.get('daily');
try {
  await counters.set(
    'daily',
    { count: (doc?.value.count ?? 0) + 1 },
    { ifVersion: doc?.version ?? 0 },
  );
} catch (error) {
  // `already-exists`: the document did not exist when read (`ifVersion: 0`), and someone created it.
  if (
    error instanceof BoError &&
    ['version-conflict', 'already-exists'].includes(error.reason ?? '')
  ) {
    retryLater();
  } else throw error;
}
```

`ifVersion: 0` means "only if it does not exist": the write is refused with reason `already-exists` when the document exists. With `update`, which needs the document, `ifVersion: 0` always fails.

A single document takes about one write per second at most: do not count frequent events in one document.

## Lock with expiry

`ifVersion: 0` and `ttlSeconds` make a lock that frees itself:

```ts
const locks = bo.sharedStorage.collection<{ by: string }>('planning-locks');
try {
  await locks.set(`vehicle-${vehicleId}`, { by: user.id }, { ifVersion: 0, ttlSeconds: 300 });
  // the lock is ours for 5 minutes
} catch (error) {
  if (error instanceof BoError && error.reason === 'already-exists') showLockedBy();
  else throw error;
}
```

`ttlSeconds` is 60 to 31 536 000 (365 days), counted from the write. An expired document is gone for `get`, `set`, `update`, `list` and `query`, but it counts in the quotas until Vulog deletes it, usually within a day. Without `ttlSeconds`, `set` and `add` write a document that does not expire, and `update` keeps the expiry of the document; `ttlSeconds: null` removes it.

## The shared space

The shared space is common to all the widgets of the same publisher installed on the host. Collection names and ids are free: prefix them with your domain (`planning-stations`, `planning-tickets`) so that two widgets do not use the same collection by accident.

## Errors

Every method rejects with a [`BoError`](./protocol#errors). Branch on `code`, then on `reason`:

| `code`            | `reason`, `status`                       | When                                                                                                                                                                                  |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FORBIDDEN`       |                                          | The installation does not grant `storage` or `sharedStorage`: declare it in the manifest, then update the installation (as a Web Component, a refusal of Vulog comes with status 403) |
| `INVALID_PAYLOAD` |                                          | The BO refused the request: name, id, value, option                                                                                                                                   |
| `INTERNAL`        | `version-conflict`, 409                  | `ifVersion` does not match the stored version                                                                                                                                         |
| `INTERNAL`        | `already-exists`, 409                    | `ifVersion: 0` on an existing document                                                                                                                                                |
| `INTERNAL`        | `not-found`, 404                         | `update` of a missing or expired document (`get` resolves `null` instead)                                                                                                             |
| `INTERNAL`        | `value-too-large`, 413                   | The value of an `update`, once merged, is larger than 64 KB                                                                                                                           |
| `INTERNAL`        | `quota-exceeded`, 422                    | A quota of the host is reached: write less, or delete documents                                                                                                                       |
| `INTERNAL`        | `rate-limited`, 429                      | Too many requests: wait before retrying, never in a tight loop                                                                                                                        |
| `INTERNAL`        | `invalid-cursor`, 400                    | `cursor` is not a `nextCursor` answered by `list` or `query`                                                                                                                          |
| `INTERNAL`        | `not-installed`, 404 or none             | The widget is not installed (an iframe added by hand to the menu)                                                                                                                     |
| `INTERNAL`        | `disposed`                               | The widget was removed from the page while the request was pending: ignore it                                                                                                         |
| `INTERNAL`        | `ERR_NETWORK`, `ECONNABORTED`, no status | The BO could not reach Vulog                                                                                                                                                          |
| `TIMEOUT`         |                                          | No answer in time (iframe)                                                                                                                                                            |
| `DISCONNECTED`    |                                          | After `disconnect()`, or the BO closed the connection                                                                                                                                 |
| `UNKNOWN_TYPE`    |                                          | A BO without storage                                                                                                                                                                  |

The BO does not pass on the details of these refusals: the stored version of a `version-conflict`, the quota and limit of a `quota-exceeded`, the delay of a `rate-limited`. Read the document again after a conflict, and wait a few seconds before retrying after `rate-limited`.

After `TIMEOUT`, `DISCONNECTED` or a network error, a write may have been done anyway. Read before writing again, and prefer `set` with an id of your own to `add` when a retry must not create a second document.

## Limits

| Limit                    | Default |
| ------------------------ | ------- |
| Value of a document      | 64 KB   |
| Collections per space    | 20      |
| Documents per collection | 10 000  |
| Bytes per space          | 50 MB   |

The three volume quotas may be set otherwise for a host. Reads, `delete` and `clear` are never refused by a quota.

The number of requests is also limited, per user and per installation of the widget (`rate-limited`). Vulog can give these rates on request.

## What the isolation guarantees

- **Never store secrets.** Every user of the host can read and write the data of a widget installed on it, whatever the roles of its menu entry, even from the browser console.
- **Keep personal data to what the widget needs**, and delete it (`delete`, `clear`, `ttlSeconds`): the platform cannot check what you store.
- Data never leaves the host: another host, or another client, never sees it.
- The BO sends each request with the identity of the widget's installation, not one the widget gives. For an iframe without the `accessToken` permission, that is a real barrier between widgets. **A Web Component runs in the BO page with the user's session**: it could reach the data of another widget of the host. The isolation between widgets and between publishers is then a convention, not a guarantee.

## In the fake back office

`bo-widget dev` keeps both spaces in memory, with the checks and limits of the BO and of Vulog (names, 64 KB, `ifVersion`, `ttlSeconds`, `where`, pages, quotas), and the permissions enforced in both modes. Expired documents stay counted in the quotas until **Clear storage** (in the bar) empties both spaces, or the page reloads, which loses the data. There is no rate limit. To unit-test a widget without it, see [Testing](./testing).
