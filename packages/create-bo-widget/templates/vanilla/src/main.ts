import { connect, type BoClient } from '@vulog/bo-widget-sdk';
// Inlined: the styles go into the shadow root, never into the page of the back office.
import css from './style.css?inline';

/**
 * The widget. Export the class: the back office registers it under its own tag, so never call
 * `customElements.define`.
 */
export default class Widget extends HTMLElement {
  // Kept as a promise: the element may be removed before `connect` resolves.
  #bo: Promise<BoClient> | undefined;

  connectedCallback(): void {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div class="root"><header></header><main></main></div>';
    const style = document.createElement('style');
    style.textContent = css;
    shadow.prepend(style);

    const bo = connect(this);
    this.#bo = bo;
    void this.#render(bo, shadow);
  }

  disconnectedCallback(): void {
    // A failed connection has nothing to close (its error is shown while the element is in the page).
    void this.#bo?.then(
      (bo) => bo.disconnect(),
      () => undefined,
    );
    this.#bo = undefined;
    this.shadowRoot?.replaceChildren();
  }

  async #render(bo: Promise<BoClient>, shadow: ShadowRoot): Promise<void> {
    const header = shadow.querySelector('header') as HTMLElement;
    const main = shadow.querySelector('main') as HTMLElement;
    try {
      const client = await bo;
      const [context, user] = await Promise.all([client.getContext(), client.getCurrentUser()]);
      if (this.#bo !== bo) return; // removed meanwhile
      header.textContent = `Fleet ${context.fleetId ?? '-'}`;
      main.textContent = `Hello ${user.fullName}`;
      client.on('fleetChanged', ({ fleetId }) => {
        header.textContent = `Fleet ${fleetId ?? '-'}`;
      });
    } catch (error) {
      if (this.#bo !== bo) return; // removed meanwhile: the connection was closed on purpose
      // The back office only sees synchronous errors: show the others in the widget.
      console.error(error);
      main.setAttribute('role', 'alert');
      main.textContent = `The widget could not load: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
