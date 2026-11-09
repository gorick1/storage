<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { loginWithPasskey, prefetchLogin, describeError } from '$lib/client/passkey';
  import { api } from '$lib/client/api';
  import AuthCard from '$lib/components/AuthCard.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let { data } = $props();
  let busy = $state(false);
  let error = $state('');
  let showCode = $state(false);
  let code = $state('');
  onMount(prefetchLogin);

  async function done() {
    // Capture the destination first: once the session exists, this page's data changes underneath us.
    const next = data.next;
    await goto(next, { replaceState: true, invalidateAll: true });
  }

  async function passkey() {
    busy = true;
    error = '';
    try {
      await loginWithPasskey();
      await done();
    } catch (e) {
      error = describeError(e);
    } finally {
      busy = false;
    }
  }

  async function recovery(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    error = '';
    try {
      await api('/api/auth/recovery', { code });
      await done();
    } catch (err) {
      error = (err as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Sign in · Storage</title></svelte:head>

<AuthCard>
  <h1 class="large-title center">Storage</h1>
  {#if data.next !== '/'}<p class="muted center">Sign in to open what you scanned.</p>{/if}
  <button class="btn block" onclick={passkey} disabled={busy}><Icon name="key" size={20} stroke={2.2} /> Sign in with passkey</button>
  {#if showCode}
    <form onsubmit={recovery} class="stack">
      <div class="group"><label class="row"><span class="lbl">Recovery code</span><input bind:value={code} placeholder="XXXXX-XXXXX" autocapitalize="characters" autocomplete="one-time-code" /></label></div>
      <button class="btn gray block" disabled={busy || code.length < 10}>Use recovery code</button>
    </form>
  {:else}
    <button class="btn plain" onclick={() => (showCode = true)}>Use a recovery code</button>
  {/if}
  {#if error}<p class="error-text center">{error}</p>{/if}
  {#if data.setupOpen}<a class="btn plain" href="/setup">Finish setting up Storage</a>{/if}
  <p class="footnote muted center">New here? Ask whoever set up Storage for an invite link.</p>
</AuthCard>

<style>
  .center { text-align: center; margin: 0; }
  .stack { display: flex; flex-direction: column; gap: 12px; }
</style>
