<script setup lang="ts">
import { connect, type BoClient } from '@vulog/bo-widget-sdk';
import { onMounted, onUnmounted, ref, useHost } from 'vue';

// The element, on which the back office set its API (vulogBo).
const element = useHost();

const fleetId = ref<string | null>(null);
const userName = ref<string>();
const error = ref<string>();

// Kept as a promise: the element may be removed before `connect` resolves.
let bo: Promise<BoClient> | undefined;

onMounted(async () => {
  if (!element) throw new Error('App must be rendered as a custom element (defineCustomElement)');
  const current = connect(element);
  bo = current;
  try {
    const client = await current;
    const [context, user] = await Promise.all([client.getContext(), client.getCurrentUser()]);
    if (bo !== current) return; // removed meanwhile
    fleetId.value = context.fleetId;
    userName.value = user.fullName;
    client.on('fleetChanged', (event) => {
      fleetId.value = event.fleetId;
    });
  } catch (cause) {
    if (bo !== current) return; // removed meanwhile: the connection was closed on purpose
    // The back office only sees synchronous errors: show the others in the widget.
    console.error(cause);
    error.value = cause instanceof Error ? cause.message : String(cause);
  }
});

onUnmounted(() => {
  // A failed connection has nothing to close (its error is shown while the element is in the page).
  void bo?.then(
    (client) => client.disconnect(),
    () => undefined,
  );
  bo = undefined;
});
</script>

<template>
  <div class="root">
    <header>Fleet {{ fleetId ?? '-' }}</header>
    <main v-if="error !== undefined" role="alert">The widget could not load: {{ error }}</main>
    <main v-else>{{ userName === undefined ? 'Loading…' : `Hello ${userName}` }}</main>
  </div>
</template>

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
