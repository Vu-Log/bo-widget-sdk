---
description: Test a BO widget with a fake injected API, mount it as the BO does, emit events and stub fetch; what the tests of each template check.
---

# Testing

A widget is tested without a BO: give it a fake of the API the BO injects. The SDK uses any object with `getContext`, `on` and `off` methods as the BO, in Web Component mode.

Every template runs its tests with Vitest in happy-dom:

```bash
npm test
```

## A fake of the BO API

```ts
import { vi } from 'vitest';

type Listener = (data: unknown) => void;

const fakeBo = (overrides: Record<string, unknown> = {}) => {
  const listeners = new Map<string, Set<Listener>>();
  const api = {
    protocolVersion: 2,
    getContext: async () => ({ fleetId: 'FLEET-1', locale: 'en', basename: '/' }),
    getCurrentUser: async () => ({ fullName: 'Jane Doe', roles: [] }),
    getTheme: async () => ({ palette: {}, typography: {}, mode: 'light' }),
    on: (name: string, listener: Listener) => {
      listeners.set(name, (listeners.get(name) ?? new Set()).add(listener));
    },
    off: vi.fn((name: string, listener: Listener) => {
      listeners.get(name)?.delete(listener);
    }),
    ...overrides,
  };
  const emit = (name: string, data: unknown) => listeners.get(name)?.forEach((l) => l(data));
  return { api, emit };
};
```

With this fake:

- a request the fake does not define rejects with `UNKNOWN_TYPE`;
- a method that rejects gives a `BoError`, as in the BO: test the error state with `fakeBo({ getContext: () => Promise.reject(new Error('boom')) })`;
- `resize` resolves `{ height: null }`;
- the kept listeners let you `emit` events.

## Mount the element as the BO does

The BO registers the class under its own tag and sets `vulogBo` before inserting the element. A test does the same. Registering the class is fine in a test: the widget itself never calls `customElements.define`, and `@vulog/bo-widget-vite` does not warn under Vitest.

```ts
import Widget from './main';

customElements.define('test-widget', Widget);

const mount = (api: object): HTMLElement => {
  const element = Object.assign(document.createElement('test-widget'), { vulogBo: api });
  document.body.append(element);
  return element;
};

it('follows the fleet the back office switches to', async () => {
  const { api, emit } = fakeBo();
  const element = mount(api);
  await vi.waitFor(() => expect(element.shadowRoot?.textContent).toContain('Fleet FLEET-1'));

  emit('fleetChanged', { fleetId: 'FLEET-2' });

  await vi.waitFor(() => expect(element.shadowRoot?.textContent).toContain('Fleet FLEET-2'));
});
```

Query the content through `element.shadowRoot`. Clean the page after each test with `document.body.replaceChildren()`.

To test code that only needs the client, call `connect` with an object that holds the fake:

```ts
const bo = await connect({ vulogBo: fakeBo().api });
```

With React, render a component inside `<WidgetProvider client={await connect({ vulogBo: api })}>`.

## Stub `fetch` for `authFetch`

Give the fake a `getApiInfo`, and stub `fetch`. As a Web Component, the Vulog API calls get `X-API-Key` but no `Authorization` header: the BO service worker adds it.

```ts
const { api } = fakeBo({
  getApiInfo: async () => ({ baseUrl: 'https://api.example.com/boapi/proxy/', apiKey: 'test' }),
});
const fetchMock = vi
  .spyOn(globalThis, 'fetch')
  .mockResolvedValue(new Response(JSON.stringify([{ id: 'v1' }])));

// … mount the widget, then:
expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
  'https://api.example.com/boapi/proxy/fleetmanager/public/fleets/FLEET-1/vehicles?page=0',
);
```

Restore the mocks after each test with `vi.restoreAllMocks()`.

## What the templates test

Each template has one test file, `src/main.test.ts` (`src/main.test.tsx` for React), that mounts the element with a fake of the BO API. They check that the widget:

| Test                                              | react-mui | svelte | vue | lit | vanilla |
| ------------------------------------------------- | :-------: | :----: | :-: | :-: | :-----: |
| shows the fleet and the user of the BO            |     ✓     |   ✓    |  ✓  |  ✓  |    ✓    |
| follows `fleetChanged`                            |     ✓     |   ✓    |  ✓  |  ✓  |    ✓    |
| shows an error when the BO state cannot be loaded |     ✓     |   ✓    |  ✓  |  ✓  |    ✓    |
| closes the connection once removed (`off` called) |     ✓     |   ✓    |  ✓  |  ✓  |    ✓    |
| empties its shadow root once removed              |           |        |     |     |    ✓    |
| opens its dialog inside the shadow root           |     ✓     |        |     |     |         |

Extend them for every behavior you add: the nominal case, a `BoError` from a request, an event that changes the display, the cleanup on removal.
