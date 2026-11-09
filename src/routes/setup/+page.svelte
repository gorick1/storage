<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import AuthCard from '$lib/components/AuthCard.svelte';
  import PasskeyEnroll from '$lib/components/PasskeyEnroll.svelte';
  let { form } = $props();
</script>

<svelte:head><title>Set up Storage</title></svelte:head>

<AuthCard>
  {#if form?.codes}
    <PasskeyEnroll codes={form.codes} onDone={async () => { await invalidateAll(); goto('/'); }} />
  {:else}
    <h1 class="large-title center">Welcome to Storage</h1>
    <p class="muted center">Every item gets a label, every box gets a QR code, and anything is one scan away. You'll be the admin and can invite the household after.</p>
    <form method="POST" use:enhance class="stack">
      <div class="group"><label class="row"><span class="lbl">Your name</span><input name="name" autocomplete="name" placeholder="Garrett" required /></label></div>
      {#if form?.error}<p class="error-text">{form.error}</p>{/if}
      <button class="btn block">Continue</button>
    </form>
  {/if}
</AuthCard>

<style>
  .center { text-align: center; margin: 0; }
  .stack { display: flex; flex-direction: column; gap: 14px; }
</style>
