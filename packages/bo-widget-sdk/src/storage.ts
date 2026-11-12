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

/** Adds `options` to a request only when the widget passed them, so that the port carries no `undefined`. */
const withOptions = <R extends BoStorageRequest>(request: R, options: object | undefined): R =>
  options === undefined ? request : { ...request, options };

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
        get: async (id) => {
          try {
            return (await send({ op: 'get', collection: name, id })) as BoStorageDocument<T>;
          } catch (error) {
            if (isNotFound(error)) return null;
            throw error;
          }
        },
        set: async (id, value, options) =>
          (await send(
            withOptions({ op: 'set', collection: name, id, value }, options),
          )) as BoStorageDocument<T>,
        add: async (value, options) =>
          (await send(
            withOptions({ op: 'add', collection: name, value }, options),
          )) as BoStorageDocument<T>,
        update: async (id, patch, options) =>
          (await send(
            withOptions({ op: 'update', collection: name, id, value: patch }, options),
          )) as BoStorageDocument<T>,
        delete: async (id) => {
          await send({ op: 'delete', collection: name, id });
        },
        list: async (options) =>
          (await send(withOptions({ op: 'list', collection: name }, options))) as BoStoragePage<T>,
        query: async (options) =>
          (await send({ op: 'query', collection: name, options })) as BoStoragePage<T>,
        clear: async () =>
          (await send({ op: 'clear', collection: name })) as { deletedDocs: number },
      };
      return Object.freeze(collection);
    },
  });
