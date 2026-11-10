<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import LabelPreview from '$lib/components/LabelPreview.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';
  import { displayCode } from '$lib/codes';
  import type { LabelStock } from '$lib/labels/types';

  let { data, form } = $props();
  let status = $state<{ online: boolean; ready: boolean; problems: string[]; error?: string } | null>(null);
  let editingStock = $state<Partial<LabelStock> | null>(null);
  let newTpl = $state(false);
  let blankCount = $state(10);
  let blankOpen = $state(false);
  let detecting = $state(false);
  let dtLoc = $state('');

  const kinds = [
    { k: 'item', label: 'Item labels' },
    { k: 'box', label: 'Box labels' },
    { k: 'location', label: 'Place labels' }
  ] as const;
  const stockById = (id: number) => data.stocks.find((s) => s.id === id)!;

  async function refreshStatus() {
    if (!data.printerSet) return;
    status = await api<NonNullable<typeof status>>('/api/printer').catch(() => null);
  }
  onMount(() => {
    refreshStatus();
    const t = setInterval(refreshStatus, 15000);
    return () => clearInterval(t);
  });

  async function setLoaded(id: number) {
    await api('/api/printer', { action: 'loaded', stockId: id });
    await invalidateAll();
    toast(id ? `Loaded: ${stockById(id).name}. Held labels released.` : 'Any roll: nothing will be held', { icon: 'check' });
  }

  async function togglePause() {
    await api('/api/printer', { action: 'pause', paused: !data.paused });
    await invalidateAll();
  }

  async function job(id: number, action: 'retry' | 'cancel') {
    await api(`/api/print/${id}`, { action });
    await invalidateAll();
  }

  async function detect() {
    detecting = true;
    try {
      const d = await api<{ dpi: number | null; width_in: number | null; height_in: number | null; method: 'DT' | 'TT' | null }>('/api/printer', { action: 'detect' });
      editingStock = { ...editingStock, dpi: d.dpi ?? editingStock?.dpi, width_in: d.width_in ?? editingStock?.width_in, height_in: d.height_in ?? editingStock?.height_in, method: d.method ?? editingStock?.method };
      toast('Read the loaded roll from the printer', { icon: 'check' });
    } catch (e) {
      toast((e as Error).message, { tone: 'error', icon: 'warning' });
    } finally {
      detecting = false;
    }
  }

  async function batch(body: object, label: string) {
    const r = await api<{ queued: number; errors: string[] }>('/api/print/batch', body);
    toast(r.errors.length ? r.errors[0] : `${r.queued} ${label} queued`, { icon: r.errors.length ? 'warning' : 'printer', tone: r.errors.length ? 'error' : 'normal' });
    await invalidateAll();
  }

  const STATUS_TEXT: Record<string, string> = { pending: 'Waiting', sending: 'Printing', sent: 'Printed', held: 'Held', failed: 'Failed' };
  const fmt = (t: number) => new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<svelte:head><title>Labels · Storage</title></svelte:head>

<div class="page">
  <PageHeader title="Labels" />

  <section class="printer">
    <div class="pstate" class:ok={status?.ready} class:bad={status && !status.ready}>
      <Icon name="printer" size={26} />
    </div>
    <div class="grow">
      <strong>Zebra ZD420</strong>
      <span class="footnote muted">
        {#if !data.printerSet}Not set up. <a href="/settings#printer">Add its address</a>
        {:else if !status}Checking…
        {:else if status.ready}Ready{data.paused ? ' · auto-print paused' : ''}
        {:else if status.online}{status.problems.join(', ')}
        {:else}{status.error}{/if}
      </span>
    </div>
    <button class="btn small gray" onclick={togglePause}>{data.paused ? 'Resume' : 'Pause'}</button>
  </section>

  <h3 class="group-label">Roll in the printer</h3>
  <div class="group">
    <label class="row">
      <span class="grow">Loaded now</span>
      <select value={data.loadedStock} onchange={(e) => setLoaded(Number((e.target as HTMLSelectElement).value))}>
        <option value={0}>Any (don’t check)</option>
        {#each data.stocks as s}<option value={s.id}>{s.name}</option>{/each}
      </select>
    </label>
  </div>
  <p class="group-foot">Labels for a different roll wait in the queue instead of printing on the wrong size. {#if data.heldCount}<strong>{data.heldCount} waiting.</strong>{/if}</p>

  {#each kinds as { k, label }}
    <div class="section-head"><h2>{label}</h2></div>
    <div class="tpl-grid">
      {#each data.templates.filter((t) => t.kind === k) as t (t.id)}
        <a class="tpl" href={`/labels/templates/${t.id}`}>
          <div class="tpl-prev"><LabelPreview stock={stockById(t.stock_id)} elements={t.elements} data={data.samples[k]} /></div>
          <div class="tpl-meta">
            <span class="tname">{t.name}</span>
            <span class="badges">
              {#if t.is_default}<span class="b on">Default</span>{/if}
              {#if t.is_default && t.auto_print}<span class="b">Auto-prints</span>{/if}
              <span class="b">{t.stock_name}</span>
            </span>
          </div>
        </a>
      {:else}
        <p class="muted footnote">No {k} template yet.</p>
      {/each}
    </div>
  {/each}
  <button class="btn gray block new-tpl" onclick={() => (newTpl = true)}><Icon name="plus" size={18} stroke={2.4} /> New template</button>

  <div class="section-head"><h2>Label Stock</h2><button class="btn plain" onclick={() => (editingStock = { name: '', width_in: 2, height_in: 1, dpi: 203, media: 'gap', method: 'DT', darkness: 15, speed: 3 })}>Add</button></div>
  <div class="group">
    {#each data.stocks as s (s.id)}
      <button class="row" onclick={() => (editingStock = { ...s })}>
        <span class="stock-ic" style:aspect-ratio={`${s.width_in} / ${s.height_in}`}></span>
        <span class="grow"><span class="title" style="display:block">{s.name}</span><span class="sub">{s.width_in} × {s.height_in} in · {s.dpi} dpi · {s.method === 'DT' ? 'Direct thermal' : 'Ribbon'}</span></span>
        {#if data.loadedStock === s.id}<span class="detail footnote">Loaded</span>{/if}
        <span class="chev"><Icon name="chevron-right" size={16} stroke={2.4} /></span>
      </button>
    {/each}
  </div>

  <div class="section-head"><h2>Batch Printing</h2></div>
  <div class="group">
    <button class="row action" onclick={() => (blankOpen = true)}><Icon name="box" size={20} /> <span class="grow">Pre-print box labels</span></button>
    {#if data.dtCount}
      <div class="row dt">
        <Icon name="warning" size={20} />
        <span class="grow"><span style="display:block">{data.dtCount} labels printed without ribbon</span><span class="sub">Direct thermal fades in heat. Reprint them once ribbon stock is set up.</span></span>
      </div>
      <div class="row">
        <select bind:value={dtLoc} aria-label="Only this place" style="direction:ltr;text-align:left;flex:1">
          <option value="">Everywhere</option>
          {#each data.locations as l}<option value={l.id}>{l.name}</option>{/each}
        </select>
        <button class="btn small" disabled={!data.hasTT} onclick={() => batch({ mode: 'reprint-dt', locationId: dtLoc || null }, 'labels')}>Reprint</button>
      </div>
    {/if}
  </div>
  {#if data.dtCount && !data.hasTT}<p class="group-foot">Add a ribbon (thermal transfer) label stock and make it the default template's stock first.</p>{/if}

  <div class="section-head"><h2>Recent Prints</h2></div>
  {#if data.jobs.length}
    <div class="group">
      {#each data.jobs as j (j.id)}
        <div class="row">
          <span class="jstate" data-s={j.status}></span>
          <span class="grow">
            <span class="title" style="display:block">{j.record_name ?? 'Deleted record'} <span class="code">{j.record_number ? displayCode(j.entity as 'item', j.record_number) : ''}</span></span>
            <span class="sub">{STATUS_TEXT[j.status] ?? j.status}{j.error ? `: ${j.error}` : ''} · {fmt(j.created_at)}</span>
          </span>
          {#if j.status === 'failed' || j.status === 'held'}<button class="btn small gray" onclick={() => job(j.id, 'retry')}>Retry</button>{/if}
          {#if j.status !== 'sent'}<button class="btn plain" onclick={() => job(j.id, 'cancel')}>Cancel</button>{/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="muted footnote" style="padding: 0 4px">Nothing printed yet.</p>
  {/if}
</div>

<Sheet open={!!editingStock} title={editingStock?.id ? 'Edit Label Stock' : 'New Label Stock'} onclose={() => (editingStock = null)}>
  {#if editingStock}
    <form method="POST" action="?/stock" use:enhance={() => async ({ update, result }) => { await update({ reset: false }); if (result.type === 'success') editingStock = null; }}>
      <input type="hidden" name="id" value={editingStock.id ?? ''} />
      <button type="button" class="btn gray block" onclick={detect} disabled={detecting || !data.printerSet}><Icon name="ruler" size={18} /> {detecting ? 'Asking the printer…' : 'Read size from printer'}</button>
      <p class="group-foot" style="margin-bottom:14px">Load the roll and let the printer calibrate first (hold Feed until it flashes twice).</p>
      <div class="group">
        <label class="row"><span class="lbl">Name</span><input name="name" value={editingStock.name ?? ''} placeholder="e.g. 2 × 1 in white" /></label>
        <label class="row"><span class="lbl">Width (in)</span><input name="width_in" type="number" step="0.01" min="0.5" max="4.25" value={editingStock.width_in} inputmode="decimal" required /></label>
        <label class="row"><span class="lbl">Height (in)</span><input name="height_in" type="number" step="0.01" min="0.25" max="39" value={editingStock.height_in} inputmode="decimal" required /></label>
        <label class="row"><span class="lbl">Resolution</span><select name="dpi" value={String(editingStock.dpi ?? 203)}><option value="203">203 dpi</option><option value="300">300 dpi</option></select></label>
      </div>
      <div class="group" style="margin-top:20px">
        <label class="row"><span class="lbl">Print method</span><select name="method" value={editingStock.method ?? 'DT'}><option value="DT">Direct thermal (no ribbon)</option><option value="TT">Thermal transfer (ribbon)</option></select></label>
        <label class="row"><span class="lbl">Media</span><select name="media" value={editingStock.media ?? 'gap'}><option value="gap">Labels with gaps</option><option value="mark">Black mark</option><option value="continuous">Continuous</option></select></label>
        <label class="row"><span class="lbl">Darkness</span><input name="darkness" type="number" min="0" max="30" value={editingStock.darkness ?? 15} inputmode="numeric" /></label>
        <label class="row"><span class="lbl">Print speed</span>
          <select name="speed" value={String(editingStock.speed ?? 3)}>
            <option value="2">2 in/s (gentlest)</option><option value="3">3 in/s</option><option value="4">4 in/s</option><option value="5">5 in/s</option><option value="6">6 in/s (fastest)</option>
          </select>
        </label>
      </div>
      <p class="group-foot">Each print sends its method, darkness and speed, so swapping rolls never needs the printer's menus. Darkness 15 uses the printer's own setting. Labels with big black areas automatically print at 2 in/s.</p>
      {#if form?.error}<p class="error-text">{form.error}</p>{/if}
      <button class="btn block" style="margin-top:18px">Save</button>
    </form>
    {#if editingStock.id}
      <form method="POST" action="?/deleteStock" use:enhance={() => async ({ update, result }) => { await update(); if (result.type === 'success') editingStock = null; else if (result.type === 'failure') toast(String(result.data?.error), { tone: 'error', icon: 'warning' }); }}>
        <input type="hidden" name="id" value={editingStock.id} />
        <div class="group" style="margin-top:20px"><button class="row danger">Delete label stock</button></div>
      </form>
    {/if}
  {/if}
</Sheet>

<Sheet bind:open={newTpl} title="New Template">
  <form method="POST" action="?/newTemplate">
    <div class="group">
      <label class="row"><span class="lbl">For</span><select name="kind"><option value="item">Items</option><option value="box">Boxes</option><option value="location">Places</option></select></label>
      <label class="row"><span class="lbl">Label stock</span><select name="stock_id">{#each data.stocks as s}<option value={s.id}>{s.name}</option>{/each}</select></label>
    </div>
    <p class="group-foot">It starts from a ready-made layout sized to the stock. Change anything in the designer.</p>
    <button class="btn block" style="margin-top:18px">Create and open designer</button>
  </form>
</Sheet>

<Sheet bind:open={blankOpen} title="Pre-print Box Labels">
  <p class="muted">Creates numbered boxes with no place yet and prints their labels. Stick one on a box, then scan it to name it and fill it.</p>
  <div class="group">
    <label class="row"><span class="lbl">How many</span><input type="number" min="1" max="50" bind:value={blankCount} inputmode="numeric" /></label>
  </div>
  <button class="btn block" style="margin-top:18px" onclick={() => { blankOpen = false; batch({ mode: 'blank-boxes', count: blankCount }, 'box labels'); }}>Print {blankCount} box labels</button>
</Sheet>

<style>
  .printer { display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 12px 14px; background: var(--bg-2); border-radius: 16px; box-shadow: var(--shadow); }
  .pstate { width: 46px; height: 46px; border-radius: 13px; background: var(--fill); color: var(--label-2); display: grid; place-items: center; }
  .pstate.ok { background: oklch(from var(--green) min(l, 0.54) c h); color: #fff; }
  .pstate.bad { background: oklch(from var(--c-orange) min(l, 0.54) c h); color: #fff; }
  .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .tpl { background: var(--bg-2); border-radius: 18px; padding: 14px; color: var(--label); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12px; }
  .tpl-prev { background: var(--fill); border-radius: 12px; padding: 14px; display: grid; place-items: center; min-height: 120px; }
  .tpl-prev :global(svg) { max-height: 170px; width: auto; max-width: 100%; }
  .tname { font-weight: 600; display: block; }
  .badges { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
  .b { font-size: 12px; padding: 2px 8px; border-radius: 10px; background: var(--fill); color: var(--label-2); }
  .b.on { background: color-mix(in srgb, var(--tint) 16%, transparent); color: var(--tint); font-weight: 600; }
  .new-tpl { margin-top: 16px; }
  .stock-ic { width: 34px; max-height: 34px; border: 2px solid var(--label-3); border-radius: 4px; flex: none; }
  .dt :global(svg) { color: var(--c-orange); flex: none; }
  .dt .sub { white-space: normal; }
  .jstate { width: 10px; height: 10px; border-radius: 50%; background: var(--label-3); flex: none; }
  .jstate[data-s='sent'] { background: var(--green); }
  .jstate[data-s='failed'], .jstate[data-s='held'] { background: var(--c-orange); }
  .jstate[data-s='pending'], .jstate[data-s='sending'] { background: var(--tint); }
</style>
