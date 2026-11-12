import { BoError } from './errors.js';
import type {
  BoStorage,
  BoStorageCollection,
  BoStorageDocument,
  BoStoragePage,
  BoStorageRequest,
  BoStorageSpace,
  BoStorageValue,
  BoTransport,
} from './types.js';

/** The answer of `get` for a missing or expired document, turned into `null`. */
const isNotFound = (error: unknown): boolean =>
  error instanceof BoError && error.code === 'INTERNAL' && error.reason === 'not-found';

/**
 * A storage request without the fields left `undefined`, so that the port carries only what the
 * widget passed. The back office checks everything else.
 */
const buildRequest = (
  op: BoStorageRequest['op'],
  collection: string,
  {
    id,
    value,
    options,
  }: { [K in 'id' | 'value' | 'options']?: BoStorageRequest[K] | undefined } = {},
): BoStorageRequest => ({
  op,
  collection,
  ...(id === undefined ? {} : { id }),
  ...(value === undefined ? {} : { value }),
  ...(options === undefined ? {} : { options }),
});

/**
 * Builds `bo.storage` or `bo.sharedStorage` over a transport. Each method of a collection sends
 * one request (`{ op, collection, id?, value?, options? }`) to the space: the back office checks
 * the permission and the request, relays it to Vulog and answers the result, which is returned as
 * is, except `get` of a missing document (`INTERNAL`, reason `not-found`), which resolves `null`,
 * and `delete`, which resolves `undefined`.
 *
 * @param transport - The transport of the client.
 * @param space - `storage` (the widget's space) or `sharedStorage` (its publisher's shared space).
 * @returns The frozen storage API.
 */
export const createStorage = (transport: BoTransport, space: BoStorageSpace): BoStorage =>
  Object.freeze({
    collection<T extends object = BoStorageValue>(name: string): BoStorageCollection<T> {
      const send = (request: BoStorageRequest): Promise<unknown> =>
        transport.storage(space, request);
      const collection: BoStorageCollection<T> = {
        name,
        get: async (id: string) => {
          try {
            return (await send(buildRequest('get', name, { id }))) as BoStorageDocument<T>;
          } catch (error) {
            if (isNotFound(error)) return null;
            throw error;
          }
        },
        set: async (id, value, options) =>
          (await send(buildRequest('set', name, { id, value, options }))) as BoStorageDocument<T>,
        add: async (value, options) =>
          (await send(buildRequest('add', name, { value, options }))) as BoStorageDocument<T>,
        update: async (id, patch, options) =>
          (await send(
            buildRequest('update', name, { id, value: patch, options }),
          )) as BoStorageDocument<T>,
        delete: async (id) => {
          await send(buildRequest('delete', name, { id }));
        },
        list: async (options) =>
          (await send(buildRequest('list', name, { options }))) as BoStoragePage<T>,
        query: async (options) =>
          (await send(buildRequest('query', name, { options }))) as BoStoragePage<T>,
        clear: async () => (await send(buildRequest('clear', name))) as { deletedDocs: number },
      };
      return Object.freeze(collection);
    },
  });
