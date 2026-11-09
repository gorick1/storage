<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import ItemRow from '$lib/components/ItemRow.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import History from '$lib/components/History.svelte';
  import { toast } from '$lib/client/toast.svelte';
  import { displayCode } from '$lib/codes';
  import { formatMoney } from '$lib/money';
  import SelectBar from '$lib/components/SelectBar.svelte';
  import { rememberView } from '$lib/client/actions.svelte';
  import { api } from '$lib/client/api';
  import { invalidateAll } from '$app/navigation';

  let { data, form } = $props();
  let editing = $state(false);
  let confirmDelete = $state(false);
  let view = $state<'grid' | 'list'>('grid');
  let selecting = $state(false);
  let picked = $state<number[]>([]);
  const toggle = (id: number) => (picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const endSelect = () => { selecting = false; picked = []; };

  async function pin() {
    await api(`/api/boxes/${data.box.id}`, { pinned: !data.box.pinned });
    await invalidateAll();
    toast(data.box.pinned ? 'Unpinned from Home' : 'Pinned to Home', { icon: 'check' });
  }
  const loc = $derived(data.locations.find((l) => l.id === data.box.location_id));

  onMount(() => {
    const printed = page.url.searchParams.get('printed');
    if (printed) toast('Printing box label…', { icon: 'printer', printJob: Number(printed), action: { label: 'Cancel', run: () => fetch(`/api/print/${printed}`, { method: 'POST', body: JSON.stringify({ action: 'cancel' }) }).then(() => {}) } });
    rememberView({ kind: 'box', number: data.box.number, name: data.box.name });
    const deleted = page.url.searchParams.get('deleted');
    if (deleted) toast('Item moved to Recently Deleted', { icon: 'trash', action: { label: 'Undo', run: async () => { await api('/api/items/bulk', { action: 'restore', ids: [Number(deleted)] }); await invalidateAll(); } } });
    try {
      const v = localStorage.getItem('boxView');
      if (v === 'list' || v === 'grid') view = v;
    } catch {}
  });

  function setView(v: 'grid' | 'list') {
    view = v;
    try { localStorage.setItem('boxView', v); } catch {}
  }

  function useAsSticky() {
    try { localStorage.setItem('stickyBox', String(data.box.number)); } catch {}
  }
</script>

<svelte:head><title>{data.box.name} · Storage</title></svelte:head>

<div class="page" data-color={data.box.location_color ?? 'none'}>
  <PageHeader title={data.box.name} back={loc ? { href: `/locations/${loc.number}`, label: loc.name } : { href: '/', label: 'Storage' }} large={false} hero>
    {#snippet actions()}
      <button class="icon-btn glass" class:pinned={data.box.pinned} onclick={pin} aria-label={data.box.pinned ? 'Unpin from Home' : 'Pin to Home'} aria-pressed={!!data.box.pinned}><Icon name="tag" size={18} stroke={2.2} /></button>
      <button class="btn plain" onclick={() => (editing = true)}>Edit</button>
    {/snippet}
  </PageHeader>

  <section class="hero" style:view-transition-name={`box-${data.box.number}`}>
    <div class="hero-top">
      <span class="glyph"><Icon name="box" size={28} stroke={1.9} /></span>
      <span class="code-pill">{displayCode('box', data.box.number)}</span>
    </div>
    <h1 class="large-title">{data.box.name}</h1>
    <p class="where">
      {#if loc}<a href={`/locations/${loc.number}`}><span class="dot"></span>{loc.name}</a>{:else}<span>No place yet</span>{/if}
      <span class="num">&nbsp;· {data.items.length} {data.items.length === 1 ? 'item' : 'items'}{#if data.value}{' · '}about {formatMoney(data.value, { whole: true })}{/if}</span>
    </p>
  </section>

  <div class="actions">
    <a class="act" href={`/add?box=${data.box.number}`} onclick={useAsSticky}><Icon name="camera" size={22} /><span>Add item</span></a>
    <a class="act" href={`/scan?into=${data.box.number}`}><Icon name="scan" size={22} /><span>Scan in</span></a>
    <a class="act" href={`/boxes/${data.box.number}/verify`}><Icon name="check" size={22} /><span>Verify</span></a>
    <form method="POST" action="?/print" use:enhance={() => async ({ result }) => {
      if (result.type === 'success') toast(result.data?.held ? 'Label held until the right roll is loaded' : 'Printing box label…', { icon: 'printer', printJob: result.data?.held ? undefined : Number(result.data?.jobId) });
      else if (result.type === 'failure') toast(String(result.data?.error), { tone: 'error', icon: 'warning' });
    }}>
      <button class="act"><Icon name="printer" size={22} /><span>Print label</span></button>
    </form>
  </div>

  {#if data.items.length}
    <div class="section-head">
      <h2>Contents</h2>
      <div class="head-tools">
        {#if !selecting}
          <div class="segmented view-toggle" role="group" aria-label="View">
            <button aria-pressed={view === 'grid'} onclick={() => setView('grid')}>Photos</button>
            <button aria-pressed={view === 'list'} onclick={() => setView('list')}>List</button>
          </div>
        {/if}
        <button class="btn small gray" onclick={() => (selecting ? endSelect() : (selecting = true))}>{selecting ? 'Done' : 'Select'}</button>
      </div>
    </div>
    {#if selecting}
      <div class="group">{#each data.items as item (item.id)}<ItemRow {item} showPlace={false} selecting selected={picked.includes(item.id)} onToggle={toggle} />{/each}</div>
    {:else if view === 'grid'}
      <div class="photo-grid">
        {#each data.items as item (item.id)}
          <a class="ph-cell" href={`/items/${item.number}`} style:view-transition-name={`item-${item.number}`}>
            {#if item.cover}<img src={`/photos/${item.cover}_t.jpg`} alt="" loading="lazy" />{:else}<span class="noimg"><Icon name="camera" size={24} /><span class="footnote">No photo yet</span></span>{/if}
            <span class="plate">
              <span class="pname">{item.name}{#if item.track_quantity}{' '}<span class="num">×{item.quantity}</span>{/if}</span>
              {#if item.checked_out_at}<span class="pnote out">Checked out by {item.checked_out_name}</span>{:else if item.description}<span class="pnote">{item.description}</span>{/if}
            </span>
          </a>
        {/each}
      </div>
    {:else}
      <div class="group">{#each data.items as item (item.id)}<ItemRow {item} showPlace={false} />{/each}</div>
    {/if}
  {:else}
    <div class="empty">
      <Icon name="tray" size={40} stroke={1.5} />
      <h3>Empty box</h3>
      <p>Add items with a photo, or scan items that already have labels into this box.</p>
      <a class="btn" href={`/add?box=${data.box.number}`} onclick={useAsSticky}>Add first item</a>
    </div>
  {/if}

  {#if data.box.notes}
    <h3 class="group-label">Notes</h3>
    <div class="group"><p class="row">{data.box.notes}</p></div>
  {/if}

  <History events={data.history} />
</div>
{#if selecting}<SelectBar ids={picked} onDone={endSelect} />{/if}

<Sheet bind:open={editing} title="Edit Box">
  <form method="POST" action="?/edit" use:enhance={() => async ({ update, result }) => { await update({ reset: false }); if (result.type === 'success') { editing = false; toast('Box saved', { icon: 'check' }); } }}>
    <div class="group">
      <label class="row"><span class="lbl">Name</span><input name="name" value={data.box.name} required /></label>
      <label class="row"><span class="lbl">Place</span>
        <select name="location_id">
          <option value="">None</option>
          {#each data.locations as l}<option value={l.id} selected={l.id === data.box.location_id}>{l.name}</option>{/each}
        </select>
      </label>
    </div>
    <h3 class="group-label">Notes</h3>
    <div class="group"><label class="row"><textarea name="notes" rows="3">{data.box.notes}</textarea></label></div>
    {#if form?.error}<p class="error-text">{form.error}</p>{/if}
    <button class="btn block" style="margin-top:20px">Save</button>
  </form>
  <div class="group" style="margin-top:24px">
    {#if confirmDelete}
      <form method="POST" action="?/delete">
        <input type="hidden" name="dest" value="location" />
        <button class="row danger">Delete box. Its {data.items.length} items stay in {loc?.name ?? 'no place'}, loose.</button>
      </form>
    {:else}
      <button class="row danger" onclick={() => (confirmDelete = true)}>Delete box</button>
    {/if}
  </div>
</Sheet>

<style>
  .hero { margin-top: 6px; padding: 16px 18px 18px; border-radius: var(--r-tile); background: color-mix(in srgb, var(--loc, var(--label-3)) 14%, var(--bg-2)); box-shadow: var(--shadow); }
  .hero-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .glyph { width: 50px; height: 50px; border-radius: 14px; background: var(--loc-solid, var(--label-3)); color: #fff; display: grid; place-items: center; }
  .code-pill { font-family: var(--mono); font-size: 13px; padding: 5px 10px; border-radius: 8px; background: var(--bg-2); color: var(--label-2); }
  .hero h1 { font-size: 30px; overflow-wrap: anywhere; }
  .where { margin: 4px 0 0; color: var(--label-2); display: flex; align-items: center; flex-wrap: wrap; }
  .where a { display: inline-flex; align-items: center; gap: 6px; color: color-mix(in srgb, var(--loc) 50%, var(--label)); font-weight: 600; }
  .actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px; }
  .actions form { display: contents; }
  .act { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 6px; border-radius: 14px; background: var(--bg-2); color: var(--loc, var(--tint)); border: 0; font-size: 13px; font-weight: 500; cursor: pointer; }
  .act span { color: var(--label); }
  .view-toggle { width: 150px; }
  .head-tools { display: flex; align-items: center; gap: 8px; }
  .pinned { background: var(--tint) !important; color: #fff !important; }
  .photo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  @media (min-width: 640px) { .photo-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 1100px) { .photo-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .ph-cell { background: var(--bg-2); border-radius: 16px; overflow: hidden; color: var(--label); box-shadow: var(--shadow); display: flex; flex-direction: column; }
  .ph-cell img, .noimg { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
  .noimg { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: color-mix(in srgb, var(--loc, var(--label-3)) 35%, var(--label)); background: color-mix(in srgb, var(--loc, var(--label-3)) 14%, var(--bg-2)); }
  .plate { padding: 8px 11px 10px; display: flex; flex-direction: column; gap: 2px; border-top: 0.5px solid var(--sep); }
  .pname { font-weight: 600; font-size: 15px; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pnote { font-size: 13px; color: var(--label-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pnote.out { color: color-mix(in srgb, var(--c-orange) 50%, var(--label)); }
  .empty { background: var(--bg-2); border-radius: var(--r-tile); margin-top: 20px; }
  .empty :global(svg) { color: var(--loc, var(--label-3)); }
  .empty p { margin: 0 auto 16px; max-width: 34ch; }
</style>
