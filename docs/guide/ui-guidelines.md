---
description: UI best practices for a BO widget - theme, locale, feedback with notify, loading and error states, navigation, accessibility, secrets, cleanup.
---

# UI guidelines

A widget is a page of the BO. These practices keep it consistent with the BO and robust when the BO changes around it.

## Follow the BO theme

Use the BO palette and typography, read with `getTheme()` and updated on `themeChanged`. Support the light and dark `mode`. See [Layout and isolation](./layout-and-isolation#follow-the-bo-theme).

## Follow the locale

Read the locale with `getContext()` and follow `localeChanged`: the user can switch it while the widget is open.

```ts
const { locale, timezone, currency } = await bo.getContext();
render(locale);
bo.on('localeChanged', ({ locale }) => render(locale));
```

`locale` is `language_COUNTRY` with an underscore (`en_GB`, `fr_FR`), not a BCP 47 tag. `Intl` refuses it as is: replace the underscore first.

```ts
const tag = (locale ?? 'en_GB').replace('_', '-'); // 'en-GB'
new Intl.DateTimeFormat(tag, { timeZone: timezone ?? undefined }).format(date);
new Intl.NumberFormat(tag, { style: 'currency', currency: currency ?? 'EUR' }).format(amount);
```

To pick your own translations, try the exact locale, then its language (`locale.split('_')[0]`), then a default.

`locale`, `timezone` and `currency` can be `null`: have a fallback.

Labels of the manifest (`menu.label`, `settings[].label`) are records keyed by language (`en`, `fr`) or by exact BO locale (`fr_FR`). The BO takes the exact locale, then its language, then `en`: give one per language your users use.

## Feedback

Show the result of an action with the BO snackbar rather than a custom toast or `alert`:

```ts
await bo.notify({ message: 'Report exported', severity: 'success' });
```

`severity` is `success`, `info` (default), `warning` or `error`. The widget needs the `notify` permission. An empty message rejects with `INVALID_PAYLOAD`.

## Loading and error states

Every request is async: show a loading state until the initial state is read, and an error state when a request fails.

The BO only sees the errors thrown synchronously when it inserts the element. **Show the others in the widget**: a failed `connect`, a rejected request, an API error. Every template has a `role="alert"` area for this. A widget that stays blank on an error is hard to support.

Ignore the errors of a widget being removed: `reason: 'disposed'`, or `DISCONNECTED` after your own `disconnect()`.

## Navigation

Move the BO with `navigate`, never with `window.location` or `history`:

```ts
await bo.navigate({ path: '/app/vehicles' }); // a BO route under the current fleet
await bo.navigate({ path: 'details/1' }); // relative to the widget's view
```

The widget needs the `navigate` permission. An external URL rejects with `INVALID_PAYLOAD`. For sub-routes of the widget, use `getContext().basename` as the base of your router and follow `routeChanged`. With React, `useBoRouter()` gives `basename`, `location` and `navigate`.

## Accessibility

- Use semantic elements (`header`, `main`, `button`, `label`) and the components of your UI library, which handle focus and keyboard.
- Give errors `role="alert"`, so that screen readers announce them.
- Keep dialogs inside the shadow root, so that focus stays in them. With MUI, use 7.3.6 or later.
- Respect the BO theme contrast in both modes.

## No secrets in the bundle

The widget bundle is public. Never put a secret, an API key or a token in the code, in `widget.config.ts` or in a setting. A setting that needs a secret belongs to your backend. `.env.local` holds your development values and is never committed.

Set texts with `textContent` or your framework's binding, never `innerHTML` with data of the BO or of an API.

## Clean up

When the widget is removed, release everything it holds:

- call `bo.disconnect()`;
- remove the listeners added with `on` (the function it returns), timers and observers;
- abort pending `authFetch` calls with an `AbortSignal`;
- unmount the framework root.

`connectedCallback` can run again when the element is moved: reuse `this.shadowRoot`, and expect `disconnectedCallback` to run before `connect()` resolves. The templates show how in each framework: see [Examples](../examples/react-mui).
