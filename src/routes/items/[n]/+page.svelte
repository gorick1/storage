<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import BoxPicker from '$lib/components/BoxPicker.svelte';
  import History from '$lib/components/History.svelte';
  import DetailFields from '$lib/components/DetailFields.svelte';
  import { formatMoney, CONDITION_LABEL } from '$lib/money';
  import { rememberView } from '$lib/client/actions.svelte';
  import { onMount } from 'svelte';
  import { toast } from '$lib/client/toast.svelte';
  import { api } from '$lib/client/api';
  import { preparePhoto } from '$lib/client/image';
  import { displayCode } from '$lib/codes';

  let { data, form } = $props();
  const item = $derived(data.item);
  let editing = $state(false);
  let moving = $state(false);
  let printing = $state(false);
  let checkingOut = $state(false);
  let outNote = $state('');
  let confirmDelete = $state(false);
  let photoIdx = $state(0);
  let fileInput: HTMLInputElement;

  async function act(body: Record<string, unknown>) {
    return api<{ ok: boolean; item: typeof data.item; from?: { box_id: number | null; location_id: number | null }; labelStale?: boolean }>(`/api/items/${item.id}`, body);
  }

  async function moveTo(p: { box?: { id: number; name: string }; location?: { id: number; name: string } }) {
    moving = false;
    const r = await act({ action: 'move', box_id: p.box?.id ?? null, location_id: p.location?.id ?? null });
    await invalidateAll();
    const dest = p.box?.name ?? `${p.location?.name} (loose)`;
    if (r.labelStale) {
      toast(`Moved to ${dest}. Reprint its label?`, { icon: 'move', ms: 9000, action: { label: 'Reprint', run: reprint } });
    } else {
      toast(`Moved to ${dest}`, { icon: 'move', action: { label: 'Undo', run: async () => { await act({ action: 'move', ...r.from }); await invalidateAll(); } } });
    }
  }

  async function reprint() {
    const r = await api<{ jobId?: number; held?: boolean; error?: string }>(`/api/print`, { kind: 'item', id: item.id, delayMs: 2500 });
    if (r.held) toast('Label held until the item roll is loaded', { icon: 'warning', tone: 'error' });
    else toast('Printing label…', { icon: 'printer', printJob: r.jobId, action: { label: 'Cancel', run: () => api(`/api/print/${r.jobId}`, { action: 'cancel' }).then(() => {}) } });
  }

  async function checkOut() {
    checkingOut = false;
    await act({ action: 'checkout', note: outNote });
    outNote = '';
    await invalidateAll();
    toast('Checked out to you', { icon: 'out', action: { label: 'Undo', run: async () => { await act({ action: 'checkin' }); await invalidateAll(); } } });
  }

  async function checkIn() {
    await act({ action: 'checkin' });
    await invalidateAll();
    toast(`Returned to ${item.box_name ?? item.location_name ?? 'storage'}`, { icon: 'in' });
  }

  async function qty(delta: number) {
    await act({ action: 'qty', delta });
    await invalidateAll();
  }

  async function addPhoto(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const p = await preparePhoto(f);
    const fd = new FormData();
    fd.append('full', p.full, 'photo.jpg');
    fd.append('thumb', p.thumb, 'thumb.jpg');
    await fetch('?/photo', { method: 'POST', body: fd, headers: { 'x-sveltekit-action': 'true', accept: 'application/json' } });
    await invalidateAll();
    photoIdx = data.photos.length - 1;
  }

  const fmtDate = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  onMount(() => rememberView({ kind: 'item', number: data.item.number, name: data.item.name }));

  // While a price lookup runs on the server, refresh until it lands.
  $effect(() => {
    if (item.price_status !== 'pending') return;
    const t = setInterval(() => invalidateAll(), 3000);
    return () => clearInterval(t);
  });

  const details = $derived(
    [
      ['Brand', item.brand],
      ['Model', item.model],
      ['Category', item.category],
      ['Condition', CONDITION_LABEL[item.condition] ?? ''],
      ['Serial number', item.serial_number]
    ].filter(([, v]) => v) as [string, string][]
  );
  const unit = $derived(item.track_quantity ? ' each' : '');
</script>

<svelte:head><title>{item.name} · Storage</title></svelte:head>

<div class="page" data-color={item.location_color ?? 'none'}>
  <PageHeader title={item.name} back={item.box_number ? { href: `/boxes/${item.box_number}`, label: item.box_name ?? 'Box' } : { href: '/', label: 'Storage' }} large={false} hero>
    {#snippet actions()}<button class="btn plain" onclick={() => (editing = true)}>Edit</button>{/snippet}
  </PageHeader>

  <div class="layout">
    <div class="media" style:view-transition-name={`item-${item.number}`}>
      {#if data.photos.length}
        <div class="carousel" onscroll={(e) => (photoIdx = Math.round((e.currentTarget as HTMLElement).scrollLeft / (e.currentTarget as HTMLElement).clientWidth))}>
          {#each data.photos as p (p.id)}<img src={`/photos/${p.file}.jpg`} alt={item.name} />{/each}
        </div>
        {#if data.photos.length > 1}
          <div class="dots">{#each data.photos as _, i}<span class:on={i === photoIdx}></span>{/each}</div>
        {/if}
      {:else}
        <button class="no-photo" onclick={() => fileInput.click()}><Icon name="camera" size={34} stroke={1.6} /><span>Add a photo</span></button>
      {/if}
      <input bind:this={fileInput} type="file" accept="image/*" capture="environment" class="sr-only" onchange={addPhoto} />
    </div>

    <div class="info">
      <div class="title-block">
        <h1 class="title-2">{item.name}</h1>
        {#if item.description}<p class="desc">{item.description}</p>{/if}
        <div class="tags">
          <span class="code-pill">{displayCode('item', item.number)}</span>
          {#each item.tags.split(',').map((t) => t.trim()).filter(Boolean) as t}<a class="tag" href={`/search?q=${encodeURIComponent(t)}`}>{t}</a>{/each}
        </div>
      </div>

      {#if item.checked_out_at}
        <div class="out-banner">
          <Icon name="out" size={22} stroke={2.1} />
          <div class="grow"><strong>Checked out by {item.checked_out_name}</strong><span class="footnote">{item.checked_out_note ? `${item.checked_out_note} · ` : ''}since {fmtDate(item.checked_out_at)}</span></div>
          <button class="btn small" onclick={checkIn}>Return</button>
        </div>
      {/if}

      <h3 class="group-label">Stored in</h3>
      <div class="where-card">
        {#if item.box_number}
          <a class="where-main" href={`/boxes/${item.box_number}`}>
            <span class="wglyph"><Icon name="box" size={22} /></span>
            <span class="grow"><span class="wname">{item.box_name}</span><span class="wsub"><span class="dot"></span>{item.location_name ?? 'No place'} · <span class="code">{displayCode('box', item.box_number)}</span></span></span>
            <Icon name="chevron-right" size={16} stroke={2.4} />
          </a>
        {:else if item.location_name}
          <div class="where-main"><span class="wglyph"><Icon name="tray" size={22} /></span><span class="grow"><span class="wname">Loose in {item.location_name}</span><span class="wsub">Not in a box</span></span></div>
        {:else}
          <div class="where-main"><span class="wglyph"><Icon name="warning" size={22} /></span><span class="grow"><span class="wname">Not put away</span><span class="wsub">Pick a box so you can find it later</span></span></div>
        {/if}
      </div>

      {#if item.track_quantity}
        <div class="qty-card">
          <span class="grow"><span class="footnote muted">Quantity</span><span class="qn num">{item.quantity}</span></span>
          <button class="icon-btn" aria-label="Take one" onclick={() => qty(-1)} disabled={item.quantity <= 0}><Icon name="minus" size={18} stroke={2.6} /></button>
          <button class="icon-btn" aria-label="Add one" onclick={() => qty(1)}><Icon name="plus" size={18} stroke={2.6} /></button>
        </div>
      {/if}

      {#if details.length}
        <h3 class="group-label">Details</h3>
        <div class="group">
          {#each details as [k, v]}<div class="row"><span class="grow muted">{k}</span><span class={k === 'Model' || k === 'Serial number' ? 'mono-val' : ''}>{v}</span></div>{/each}
        </div>
      {/if}

      <h3 class="group-label">Value</h3>
      <div class="group value">
        <div class="row">
          <span class="grow">
            <span class="vlabel muted">Retail price (MSRP)</span>
            {#if item.price_status === 'pending'}
              <span class="vbig searching">Searching the web…</span>
            {:else if item.msrp_cents != null}
              <span class="vbig num">{formatMoney(item.msrp_cents)}<span class="unit">{unit}</span></span>
            {:else}
              <span class="vbig none">{item.price_status === 'not_found' ? 'No price found' : item.price_status === 'error' ? 'Lookup failed' : 'Not looked up'}</span>
            {/if}
          </span>
          {#if data.aiReady && item.price_status !== 'pending'}
            <form method="POST" action="?/price" use:enhance={() => async ({ result, update }) => { await update(); if (result.type === 'failure') toast(String(result.data?.error), { tone: 'error', icon: 'warning' }); }}>
              <button class="btn small gray"><Icon name="search" size={15} stroke={2.4} /> {item.msrp_checked_at ? 'Check again' : 'Look up'}</button>
            </form>
          {/if}
        </div>
        {#if item.msrp_note && item.price_status !== 'pending'}
          <p class="row vnote footnote">
            {item.msrp_note}
            {#if item.msrp_source_url}<br /><a href={item.msrp_source_url} target="_blank" rel="noopener noreferrer">{item.msrp_source_name || 'Source'}</a>{/if}
            {#if item.msrp_checked_at}<span class="muted"> · checked {fmtDate(item.msrp_checked_at)}</span>{/if}
          </p>
        {/if}
        {#if item.purchase_price_cents != null || item.purchase_date}
          <div class="row"><span class="grow muted">Paid</span><span class="num">{formatMoney(item.purchase_price_cents)}{item.purchase_date ? `${item.purchase_price_cents != null ? ' · ' : ''}${fmtDay(item.purchase_date)}` : ''}</span></div>
        {/if}
      </div>

      <div class="actions">
        <button class="act" onclick={() => (moving = true)}><Icon name="move" size={22} /><span>Move</span></button>
        {#if !item.checked_out_at}<button class="act" onclick={() => (checkingOut = true)}><Icon name="out" size={22} /><span>Check out</span></button>{/if}
        <button class="act" onclick={() => (printing = true)}><Icon name="printer" size={22} /><span>Label</span></button>
        <a class="act" href={`/add?from=${item.number}`}><Icon name="copy" size={22} /><span>Duplicate</span></a>
      </div>

      {#if item.notes}
        <h3 class="group-label">Notes</h3>
        <div class="group"><p class="row">{item.notes}</p></div>
      {/if}

      {#if data.photos.length}
        <h3 class="group-label">Photos</h3>
        <div class="group photo-strip">
          {#each data.photos as p, i (p.id)}
            <div class="ps">
              <img src={`/photos/${p.file}_t.jpg`} alt="" />
              <div class="ps-actions">
                {#if i > 0}<form method="POST" action="?/cover" use:enhance><input type="hidden" name="photo" value={p.id} /><button class="mini">Make cover</button></form>{/if}
                <form method="POST" action="?/deletePhoto" use:enhance><input type="hidden" name="photo" value={p.id} /><button class="mini danger" aria-label="Delete photo"><Icon name="trash" size={14} /></button></form>
              </div>
            </div>
          {/each}
          <button class="ps add" onclick={() => fileInput.click()}><Icon name="plus" size={22} /></button>
        </div>
      {/if}

      <History events={data.history} />
    </div>
  </div>
</div>

<Sheet bind:open={moving} title="Move to…">
  <BoxPicker current={item.box_id} onPick={moveTo} />
</Sheet>

<Sheet bind:open={checkingOut} title="Check Out">
  <p class="muted">It keeps its home in {item.box_name ?? item.location_name ?? 'storage'}, so you know where it goes back.</p>
  <div class="group"><label class="row"><input class="left" placeholder="Note (optional), e.g. lent to Sam" bind:value={outNote} /></label></div>
  <button class="btn block" style="margin-top:16px" onclick={checkOut}>Check out to me</button>
</Sheet>

<Sheet bind:open={printing} title="Print Label">
  <form method="POST" action="?/print" use:enhance={() => async ({ result }) => {
    printing = false;
    if (result.type === 'success') toast(result.data?.held ? 'Label held until the right roll is loaded' : 'Printing label…', { icon: 'printer', printJob: result.data?.held ? undefined : Number(result.data?.jobId) });
    else if (result.type === 'failure') toast(String(result.data?.error), { tone: 'error', icon: 'warning' });
  }}>
    <div class="group">
      <label class="row"><span class="lbl">Template</span>
        <select name="template">{#each data.templates as t}<option value={t.id} selected={t.is_default}>{t.name}</option>{/each}</select>
      </label>
      <label class="row"><span class="lbl">Copies</span><input name="copies" type="number" min="1" max="50" value="1" inputmode="numeric" /></label>
    </div>
    <button class="btn block" style="margin-top:16px"><Icon name="printer" size={20} /> Print</button>
  </form>
</Sheet>

<Sheet bind:open={editing} title="Edit Item">
  <form method="POST" action="?/edit" use:enhance={() => async ({ update, result }) => { await update({ reset: false }); if (result.type === 'success') { editing = false; toast('Saved', { icon: 'check' }); } }}>
    <div class="group">
      <label class="row"><input class="left" name="name" value={item.name} required aria-label="Name" /></label>
      <label class="row"><textarea name="description" rows="2" placeholder="Description">{item.description}</textarea></label>
      <label class="row"><span class="lbl">Tags</span><input name="tags" value={item.tags} placeholder="tools, camping" /></label>
    </div>
    <h3 class="group-label">Details</h3>
    <DetailFields brand={item.brand} model={item.model} category={item.category} condition={item.condition} serial_number={item.serial_number}
      purchase_price={item.purchase_price_cents != null ? (item.purchase_price_cents / 100).toFixed(2) : ''} purchase_date={item.purchase_date ?? ''} categories={data.categories} />
    <div class="group" style="margin-top:20px">
      <label class="row"><span class="grow">Track quantity</span><input type="checkbox" class="switch" name="track_quantity" checked={!!item.track_quantity} /></label>
      <label class="row"><span class="lbl">Quantity</span><input name="quantity" type="number" min="0" value={item.quantity} inputmode="numeric" /></label>
    </div>
    <h3 class="group-label">Notes</h3>
    <div class="group"><label class="row"><textarea name="notes" rows="3">{item.notes}</textarea></label></div>
    {#if form?.error}<p class="error-text">{form.error}</p>{/if}
    <button class="btn block" style="margin-top:20px">Save</button>
  </form>
  <div class="group" style="margin-top:24px">
    {#if confirmDelete}
      <form method="POST" action="?/delete"><button class="row danger">Delete {item.name} and its photos</button></form>
    {:else}
      <button class="row danger" onclick={() => (confirmDelete = true)}>Delete item</button>
    {/if}
  </div>
</Sheet>

<style>
  .layout { display: grid; gap: 16px; margin-top: 6px; }
  @media (min-width: 900px) { .layout { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; } .media { position: sticky; top: 64px; } }
  .media { position: relative; }
  .carousel { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; border-radius: var(--r-tile); background: var(--fill); scrollbar-width: none; box-shadow: var(--shadow); }
  .carousel img { flex: none; width: 100%; aspect-ratio: 1; object-fit: cover; scroll-snap-align: center; }
  .dots { display: flex; justify-content: center; gap: 6px; margin-top: 8px; }
  .dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--fill-2); }
  .dots span.on { background: var(--label-2); }
  .no-photo { width: 100%; aspect-ratio: 4 / 3; border-radius: var(--r-tile); border: 1.5px dashed var(--fill-2); background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--label-2); cursor: pointer; }
  .title-block { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
  .title-block h1 { font-size: 26px; overflow-wrap: anywhere; }
  .code-pill { font-family: var(--mono); font-size: 13px; padding: 4px 9px; border-radius: 7px; background: var(--fill); color: var(--label-2); }
  .desc { margin: 0; color: var(--label-2); max-width: 60ch; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .tag { font-size: 13px; padding: 4px 10px; border-radius: 12px; background: var(--fill); color: var(--label); }
  .out-banner { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 12px 14px; border-radius: 14px; background: color-mix(in srgb, var(--c-orange) 16%, var(--bg-2)); color: color-mix(in srgb, var(--c-orange) 70%, var(--label)); }
  .out-banner .grow { display: flex; flex-direction: column; flex: 1; color: var(--label); }
  .where-card { margin-top: 0; background: var(--bg-2); border-radius: 16px; padding: 12px 14px; box-shadow: var(--shadow); }
  .where-main { display: flex; align-items: center; gap: 12px; color: var(--label); }
  .where-main > :global(svg:last-child) { color: var(--label-3); }
  .wglyph { width: 46px; height: 46px; border-radius: 13px; background: var(--loc-solid, var(--label-3)); color: #fff; display: grid; place-items: center; flex: none; }
  .grow { flex: 1; min-width: 0; }
  .wname { display: block; font-weight: 600; font-size: 18px; }
  .wsub { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--label-2); }
  .mono-val { font-family: var(--mono); font-size: 15px; }
  .value .grow { display: flex; flex-direction: column; }
  .vlabel { font-size: 13px; }
  .vbig { font: 600 22px/1.25 var(--font-display); }
  .vbig .unit { font: 400 15px var(--font); color: var(--label-2); }
  .vbig.none { font: 400 17px var(--font); color: var(--label-2); }
  .vbig.searching { font: 500 17px var(--font); color: var(--label-2); animation: breathe 1.4s ease-in-out infinite; }
  .vnote { display: block; color: var(--label-2); padding-top: 0; }
  @keyframes breathe { 50% { opacity: 0.45; } }
  .qty-card { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 10px 14px; border-radius: 16px; background: var(--bg-2); }
  .qty-card .grow { display: flex; flex-direction: column; }
  .qn { font: 700 28px/1.1 var(--font-display); }
  .actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(72px, 1fr)); gap: 10px; margin-top: 12px; }
  .act { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 4px; border-radius: 14px; background: var(--bg-2); color: var(--tint); border: 0; font-size: 13px; font-weight: 500; cursor: pointer; }
  .act span { color: var(--label); }
  .act:active { transform: scale(0.97); }
  .photo-strip { display: flex; gap: 10px; padding: 12px; overflow-x: auto; }
  .ps { flex: none; width: 96px; display: flex; flex-direction: column; gap: 6px; }
  .ps img { width: 96px; height: 96px; border-radius: 10px; object-fit: cover; }
  .ps-actions { display: flex; gap: 4px; }
  .mini { border: 0; background: var(--fill); color: var(--tint); font-size: 12px; height: 26px; padding: 0 8px; border-radius: 13px; cursor: pointer; display: grid; place-items: center; }
  .mini.danger { color: var(--red); }
  .ps.add { height: 96px; border-radius: 10px; border: 1.5px dashed var(--fill-2); background: transparent; color: var(--label-2); display: grid; place-items: center; cursor: pointer; }
</style>
