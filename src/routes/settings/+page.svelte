<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import { prefetchRegistration, registerPasskey, describeError } from '$lib/client/passkey';
  import { invalidateAll } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';
  import { qrUrl } from '$lib/codes';

  let { data, form } = $props();
  const admin = $derived(data.user?.role === 'admin');
  let qrBase = $state(data.qrBase);
  let testing = $state(false);
  onMount(prefetchRegistration);

  const saved = () => async ({ result, update }: { result: { type: string; data?: Record<string, unknown> }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
    await update({ reset: false });
    if (result.type === 'success' && result.data?.saved) toast('Saved', { icon: 'check' });
    if (result.type === 'failure') toast(String(result.data?.error), { tone: 'error', icon: 'warning' });
  };

  async function printerAction(action: string) {
    testing = true;
    try {
      await api('/api/printer', { action });
      toast(action === 'test' ? 'Test label sent' : 'Calibrating', { icon: 'printer' });
    } catch (e) {
      toast((e as Error).message, { tone: 'error', icon: 'warning' });
    } finally {
      testing = false;
    }
  }

  async function addPasskey() {
    try {
      await registerPasskey(navigator.platform || 'Device');
      await invalidateAll();
      toast('Passkey added', { icon: 'key' });
    } catch (e) {
      toast(describeError(e), { tone: 'error', icon: 'warning' });
    }
  }

  const example = $derived(qrUrl(qrBase || data.origin, 'item', 46655));
  const fmt = (t: number | null) => (t ? new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never');
</script>

<svelte:head><title>Settings · Storage</title></svelte:head>

<div class="page narrow">
  <PageHeader title="Settings" />

  <div class="me">
    <span class="avatar">{data.user?.name.slice(0, 1).toUpperCase()}</span>
    <div><strong>{data.user?.name}</strong><span class="footnote muted">{admin ? 'Admin' : 'Member'}</span></div>
    <form method="POST" action="/api/auth/logout"><button class="btn small gray">Sign out</button></form>
  </div>

  {#if admin}
    <h3 class="group-label" id="printer">Printer</h3>
    <form method="POST" action="?/printer" use:enhance={saved}>
      <div class="group">
        <label class="row"><span class="lbl">IP address</span><input name="host" value={data.printerHost} placeholder="192.168.0.50" inputmode="decimal" autocapitalize="none" /></label>
        <label class="row"><span class="lbl">Port</span><input name="port" value={data.printerPort} inputmode="numeric" /></label>
        <button class="row action">Save</button>
      </div>
    </form>
    <p class="group-foot">Print a configuration label to find the IP: hold Feed and Cancel together for 2 seconds. Reserve that address in your router so it never changes.</p>
    <div class="btn-row">
      <button class="btn gray" disabled={!data.printerHost || testing} onclick={() => printerAction('test')}><Icon name="printer" size={18} /> Test print</button>
      <button class="btn gray" disabled={!data.printerHost || testing} onclick={() => printerAction('calibrate')}><Icon name="ruler" size={18} /> Calibrate</button>
    </div>

    <h3 class="group-label">Photo suggestions (AI)</h3>
    <form method="POST" action="?/ai" use:enhance={saved}>
      <div class="group">
        <label class="row"><span class="lbl">API key</span><input name="key" type="password" placeholder={data.aiKeyHint || 'sk-ant-…'} autocomplete="off" /></label>
        <button class="row action">Save</button>
      </div>
    </form>
    <p class="group-foot">{data.aiReady ? 'On. ' : ''}Uses Claude to name and describe items from a photo. Get a key at console.anthropic.com. Each photo costs a fraction of a cent. Leave blank and save to turn it off.</p>

    <h3 class="group-label">QR code address</h3>
    <form method="POST" action="?/qr" use:enhance={saved}>
      <div class="group">
        <label class="row"><span class="lbl">Short link</span><input name="qr_base" bind:value={qrBase} placeholder={data.origin} autocapitalize="none" inputmode="url" /></label>
        <button class="row action">Save</button>
      </div>
    </form>
    <p class="group-foot">QR codes print as <span class="code">{example}</span> ({example.length} characters{example.length <= 20 ? ', the smallest QR size' : ''}). Your shortener must send these to this app. Changing it only affects labels printed afterwards.</p>

    <h3 class="group-label">Household</h3>
    <div class="group">
      {#each data.users as u (u.id)}
        <div class="row">
          <span class="avatar sm">{u.name.slice(0, 1).toUpperCase()}</span>
          <span class="grow"><span style="display:block">{u.name}{u.id === data.user?.id ? ' (you)' : ''}</span><span class="sub">{u.role === 'admin' ? 'Admin' : 'Member'} · {u.passkeys} passkey{u.passkeys === 1 ? '' : 's'} · {u.codes_left} recovery codes left</span></span>
          {#if u.id !== data.user?.id}
            <form method="POST" action="?/removeUser" use:enhance={saved} onsubmit={(e) => { if (!confirm(`Remove ${u.name}? They'll be signed out everywhere.`)) e.preventDefault(); }}>
              <input type="hidden" name="id" value={u.id} /><button class="btn plain" style="color:var(--red)">Remove</button>
            </form>
          {/if}
        </div>
      {/each}
    </div>
    <form method="POST" action="?/invite" use:enhance={() => async ({ update }) => update({ reset: false })} class="invite">
      <select name="role" class="field" aria-label="Role"><option value="member">Member</option><option value="admin">Admin</option></select>
      <button class="btn">Create invite link</button>
    </form>
    {#if form?.invite}
      <div class="group invite-link">
        <span class="code">{form.invite}</span>
        <button class="btn small" onclick={() => { navigator.clipboard?.writeText(String(form?.invite)); toast('Link copied', { icon: 'check' }); }}>Copy</button>
      </div>
      <p class="group-foot">Works once, for 7 days. Send it however you like.</p>
    {/if}
  {/if}

  <h3 class="group-label">Your passkeys</h3>
  <div class="group">
    {#each data.passkeys as p (p.id)}
      <div class="row">
        <Icon name="key" size={20} />
        <span class="grow"><span style="display:block">{p.device_name ?? 'Passkey'}</span><span class="sub">Added {fmt(p.created_at)} · last used {fmt(p.last_used_at)}</span></span>
        <form method="POST" action="?/removePasskey" use:enhance={saved}><input type="hidden" name="id" value={p.id} /><button class="btn plain" style="color:var(--red)">Remove</button></form>
      </div>
    {:else}
      <p class="row muted">No passkeys yet.</p>
    {/each}
    <button class="row action" onclick={addPasskey}><Icon name="plus" size={20} stroke={2.2} /> Add a passkey on this device</button>
  </div>

  <h3 class="group-label">Recovery codes</h3>
  <form method="POST" action="?/codes" use:enhance={() => async ({ update }) => update({ reset: false })} onsubmit={(e) => { if (!confirm('Make new recovery codes? Your old ones stop working.')) e.preventDefault(); }}>
    <div class="group"><button class="row action">Generate new codes</button></div>
  </form>
  {#if form?.codes}
    <div class="group codes">{#each form.codes as c}<span>{c}</span>{/each}</div>
    <p class="group-foot">Save these now. They won’t be shown again.</p>
  {/if}

  <p class="footnote muted about">Storage · labels by Zebra ZPL · photos stay on your server</p>
</div>

<style>
  .narrow { max-width: 680px; }
  .me { display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 12px 14px; border-radius: 16px; background: var(--bg-2); }
  .me div { flex: 1; display: flex; flex-direction: column; }
  .avatar { width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(180deg, #a5a5ad, #85858d); color: #fff; display: grid; place-items: center; font-weight: 600; font-size: 19px; flex: none; }
  .avatar.sm { width: 34px; height: 34px; font-size: 15px; }
  .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
  .grow { flex: 1; min-width: 0; }
  .invite { display: flex; gap: 10px; margin-top: 12px; }
  .invite select { width: 130px; }
  .invite .btn { flex: 1; height: 44px; }
  .invite-link { display: flex; align-items: center; gap: 10px; padding: 10px 12px 10px 16px; margin-top: 12px; }
  .invite-link .code { flex: 1; overflow-wrap: anywhere; }
  .codes { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--sep); margin-top: 12px; }
  .codes span { background: var(--bg-2); padding: 12px; text-align: center; font-family: var(--mono); }
  .about { text-align: center; margin-top: 36px; }
  .row :global(svg) { color: var(--tint); flex: none; }
</style>
