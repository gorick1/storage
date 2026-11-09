<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import AuthCard from '$lib/components/AuthCard.svelte';
  import PasskeyEnroll from '$lib/components/PasskeyEnroll.svelte';
  let { data, form } = $props();
</script>

<svelte:head><title>Join Storage</title></svelte:head>

<AuthCard>
  {#if form?.codes}
    <PasskeyEnroll codes={form.codes} onDone={async () => { await invalidateAll(); goto('/'); }} />
  {:else if !data.valid}
    <h1 class="title-2 center">This invite has expired</h1>
    <p class="muted center">Invites last 7 days and work once. Ask for a new link.</p>
  {:else}
    <h1 class="large-title center">Join Storage</h1>
    <p class="muted center">You've been invited to the household catalog.</p>
    <form method="POST" use:enhance class="stack">
      <div class="group"><label class="row"><span class="lbl">Your name</span><input name="name" autocomplete="name" required /></label></div>
      {#if form?.error}<p class="error-text">{form.error}</p>{/if}
      <button class="btn block">Continue</button>
    </form>
  {/if}
</AuthCard>

<style>
  .center { text-align: center; margin: 0; }
  .stack { display: flex; flex-direction: column; gap: 14px; }
</style>
