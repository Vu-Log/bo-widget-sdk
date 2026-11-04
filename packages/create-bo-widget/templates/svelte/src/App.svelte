<!-- No tag: the back office registers the class under its own tag. The shadow root is open. -->
<svelte:options customElement={{}} />

<script lang="ts">
  import { connect } from '@vulog/bo-widget-sdk';
  import { onMount } from 'svelte';

  // The element, on which the back office set its API (vulogBo). Not named `host`: Svelte would
  // read `$host` as the store subscription of that variable.
  const element = $host();

  let fleetId = $state<string | null>(null);
  let userName = $state<string>();
  let error = $state<string>();

  onMount(() => {
    // Kept as a promise: the element may be removed before `connect` resolves.
    const bo = connect(element);
    let mounted = true;

    (async () => {
      try {
        const client = await bo;
        const [context, user] = await Promise.all([client.getContext(), client.getCurrentUser()]);
        if (!mounted) return;
        fleetId = context.fleetId;
        userName = user.fullName;
        client.on('fleetChanged', (event) => {
          fleetId = event.fleetId;
        });
      } catch (cause) {
        if (!mounted) return; // removed meanwhile: the connection was closed on purpose
        // The back office only sees synchronous errors: show the others in the widget.
        console.error(cause);
        error = cause instanceof Error ? cause.message : String(cause);
      }
    })();

    return () => {
      mounted = false;
      // A failed connection has nothing to close (its error is shown while the element is in the page).
      void bo.then(
        (client) => client.disconnect(),
        () => undefined,
      );
    };
  });
</script>

<div class="root">
  <header>Fleet {fleetId ?? '-'}</header>
  {#if error !== undefined}
    <main role="alert">The widget could not load: {error}</main>
  {:else}
    <main>{userName === undefined ? 'Loading…' : `Hello ${userName}`}</main>
  {/if}
</div>

<style>
  /* The element fills the content zone of the back office: the widget scrolls, not the back office. */
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
</style>
