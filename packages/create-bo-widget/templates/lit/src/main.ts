import { connect, type BoClient } from '@vulog/bo-widget-sdk';
import { css, html, LitElement } from 'lit';

/**
 * The widget. Export the class: the back office registers it under its own tag, so never call
 * `customElements.define`. Lit renders into an open shadow root, styles included.
 */
export default class Widget extends LitElement {
  static override properties = {
    fleetId: { state: true },
    userName: { state: true },
    error: { state: true },
  };

  // The element fills the content zone of the back office: the widget scrolls, not the back office.
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
    .root {
      height: 100%;
      display: flex;
      flex-direction: column;
      font-family: Roboto, sans-serif;
    }
    header {
      flex: none;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 20px;
    }
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 16px;
    }
    [role='alert'] {
      color: #d32f2f;
    }
  `;

  declare fleetId: string | null | undefined;
  declare userName: string | undefined;
  declare error: string | undefined;

  // Kept as a promise: the element may be removed before `connect` resolves.
  #bo: Promise<BoClient> | undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    const bo = connect(this);
    this.#bo = bo;
    void this.#load(bo);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // A failed connection has nothing to close (its error is shown while the element is in the page).
    void this.#bo?.then(
      (bo) => bo.disconnect(),
      () => undefined,
    );
    this.#bo = undefined;
  }

  async #load(bo: Promise<BoClient>): Promise<void> {
    try {
      const client = await bo;
      const [context, user] = await Promise.all([client.getContext(), client.getCurrentUser()]);
      if (this.#bo !== bo) return; // removed meanwhile
      this.fleetId = context.fleetId;
      this.userName = user.fullName;
      client.on('fleetChanged', ({ fleetId }) => {
        this.fleetId = fleetId;
      });
    } catch (error) {
      if (this.#bo !== bo) return; // removed meanwhile: the connection was closed on purpose
      // The back office only sees synchronous errors: show the others in the widget.
      console.error(error);
      this.error = error instanceof Error ? error.message : String(error);
    }
  }

  override render() {
    return html`
      <div class="root">
        <header>Fleet ${this.fleetId ?? '-'}</header>
        ${
          this.error === undefined
            ? html`<main>
                ${this.userName === undefined ? 'Loading…' : `Hello ${this.userName}`}
              </main>`
            : html`<main role="alert">The widget could not load: ${this.error}</main>`
        }
      </div>
    `;
  }
}
