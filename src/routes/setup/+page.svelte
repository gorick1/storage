<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import AuthCard from '$lib/components/AuthCard.svelte';
  import PasskeyEnroll from '$lib/components/PasskeyEnroll.svelte';
  import { api } from '$lib/client/api';
  let { data, form } = $props();
  let resumeCodes = $state<string[] | null>(null);

  async function resume() {
    // Signed in from an unfinished setup: issue fresh recovery codes and try the passkey again.
    const r = await api<{ codes: string[] }>('/api/auth/recovery-codes', {});
    resumeCodes = r.codes;
  }
</script>

<svelte:head><title>Set up Storage</title></svelte:head>

<AuthCard>
  {#if form?.codes || resumeCodes}
    <PasskeyEnroll codes={form?.codes ?? resumeCodes ?? []} onDone={async () => { await invalidateAll(); goto('/'); }} />
  {:else if data.resume}
    <h1 class="title-2 center">Finish setting up</h1>
    <p class="muted center">Your account exists but doesn't have a passkey yet. Add one now so you can sign in later.</p>
    <button class="btn block" onclick={resume}>Continue</button>
  {:else}
    <h1 class="large-title center">Welcome to Storage</h1>
    <p class="muted center">
      {#if data.restarting}An earlier setup wasn't finished. Start again here; the unfinished account is replaced.{:else}Every item gets a label, every box gets a QR code, and anything is one scan away. You'll be the admin and can invite the household after.{/if}
    </p>
    <form method="POST" use:enhance={() => async ({ update }) => update({ reset: false })} class="stack">
      <div class="group">
        <label class="row"><span class="lbl">Your name</span><input name="name" autocomplete="name" placeholder="Garrett" required /></label>
        <label class="row"><span class="lbl">Setup code</span><input name="code" placeholder="XXXX-XXXX" autocapitalize="characters" autocomplete="off" required /></label>
      </div>
      <p class="footnote muted hint">Find the setup code in Home Assistant: Settings → Apps → Storage → Log. It proves you own this server.</p>
      {#if form?.error}<p class="error-text">{form.error}</p>{/if}
      <button class="btn block">Continue</button>
    </form>
  {/if}
</AuthCard>

<style>
  .center { text-align: center; margin: 0; }
  .stack { display: flex; flex-direction: column; gap: 14px; }
  .hint { margin: -4px 4px 0; }
</style>
