<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { deserialize } from '$app/forms';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import BoxPicker from '$lib/components/BoxPicker.svelte';
  import DetailFields from '$lib/components/DetailFields.svelte';
  import { preparePhoto, blobToBase64, type PreparedPhoto } from '$lib/client/image';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';
  import { displayCode, parseCode } from '$lib/codes';
  import { queueAdd } from '$lib/client/offline.svelte';

  let { data } = $props();

  type Dest = { box?: { id: number; number: number; name: string; location_name?: string | null; location_color?: string | null }; location?: { id: number; number: number; name: string; color: string } };
  let dest = $state<Dest>({});
  let photos = $state<PreparedPhoto[]>([]);
  let name = $state('');
  let description = $state('');
  let tags = $state('');
  let keywords = $state('');
  let quantity = $state(1);
  let track = $state(false);
  let brand = $state('');
  let model = $state('');
  let category = $state('');
  let condition = $state('');
  let serial = $state('');
  let paid = $state('');
  let paidOn = $state('');
  let lookupPrice = $state(true);
  let showDetails = $state(false);
  let mode = $state<'one' | 'box'>('one');
  let saved = $state(false);

  // Whole-box capture
  type Draft = { keep: boolean; name: string; brand: string; model: string; category: string; quantity: number; description: string };
  let boxPhoto = $state<PreparedPhoto | null>(null);
  let drafts = $state<Draft[]>([]);
  let boxAi = $state<'idle' | 'thinking' | 'done' | 'error'>('idle');
  let boxCamera: HTMLInputElement;

  // Duplicate check while typing
  type Similar = { id: number; number: number; name: string; box_name: string | null; location_name: string | null; cover: string | null };
  let similar = $state<Similar[]>([]);
  let simTimer: ReturnType<typeof setTimeout>;
  $effect(() => {
    const n = name.trim(), b = brand.trim();
    clearTimeout(simTimer);
    if (n.length < 3) { similar = []; return; }
    simTimer = setTimeout(async () => {
      try {
        const r = await api<{ items: Similar[] }>(`/api/items/similar?name=${encodeURIComponent(n)}&brand=${encodeURIComponent(b)}`);
        similar = r.items;
      } catch { similar = []; }
    }, 450);
  });

  async function onBoxPhoto(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    boxPhoto = await preparePhoto(f);
    boxAi = 'thinking';
    drafts = [];
    try {
      const r = await api<{ items: Omit<Draft, 'keep'>[] }>('/api/ai/identify-many', { image: await blobToBase64(boxPhoto.full), mediaType: 'image/jpeg' });
      drafts = r.items.map((i) => ({ ...i, keep: true }));
      boxAi = 'done';
    } catch (err) {
      boxAi = 'error';
      aiNote = (err as Error).message;
    }
  }

  async function saveBox() {
    const keep = drafts.filter((d) => d.keep && d.name.trim());
    if (!keep.length || !boxPhoto) return;
    saving = true;
    const fd = new FormData();
    fd.set('items', JSON.stringify(keep));
    if (dest.box) fd.set('box_id', String(dest.box.id));
    if (dest.location) fd.set('location_id', String(dest.location.id));
    fd.set('print', printLabel ? 'on' : 'off');
    fd.set('lookup_price', lookupPrice ? 'on' : 'off');
    fd.append('full', boxPhoto.full, 'box.jpg');
    fd.append('thumb', boxPhoto.thumb, 'box_t.jpg');
    try {
      const r = await api<{ created: { number: number; name: string }[] }>('/api/items/batch', fd);
      toast(`Added ${r.created.length} items${dest.box ? ` to ${dest.box.name}` : ''}${printLabel ? '. Printing labels…' : ''}`, { icon: 'check' });
      boxPhoto = null;
      drafts = [];
      boxAi = 'idle';
      saved = true;
      setTimeout(() => (saved = false), 1400);
    } catch (err) {
      error = (err as Error).message;
    } finally {
      saving = false;
    }
  }
  let printLabel = $state(true);
  let picking = $state(false);
  let ai = $state<'idle' | 'thinking' | 'done' | 'error'>('idle');
  let aiNote = $state('');
  let saving = $state(false);
  let error = $state('');
  let camera: HTMLInputElement;
  let nameInput: HTMLInputElement;

  function reset(keepDest = true) {
    photos = [];
    name = description = tags = keywords = '';
    quantity = 1;
    track = false;
    brand = model = category = condition = serial = paid = paidOn = '';
    showDetails = false;
    ai = 'idle';
    aiNote = '';
    error = '';
    if (!keepDest) dest = {};
  }

  onMount(() => {
    if (data.prefill) {
      ({ name, description, tags, keywords, brand, model, category, condition } = data.prefill);
      showDetails = !!(brand || model);
      quantity = data.prefill.quantity;
      track = data.prefill.track_quantity;
    }
    if (data.box) dest = { box: data.box };
    else if (data.location) dest = { location: data.location };
    else {
      // Sticky box: keep adding to the box you used last.
      try {
        const n = localStorage.getItem('stickyBox');
        if (n) api<{ kind: string; record: Dest['box'] }>(`/api/lookup?code=${displayCode('box', Number(n))}`).then((r) => (dest = { box: r.record })).catch(() => localStorage.removeItem('stickyBox'));
      } catch {}
    }
    // A hardware scan of a box label on this screen picks the box.
    const onScan = async (e: Event) => {
      const code = (e as CustomEvent<string>).detail;
      const c = parseCode(code);
      if (c?.kind !== 'box') return toast('Scan a box label to choose where this goes', { icon: 'warning', tone: 'error' });
      const r = await api<{ record: Dest['box'] }>(`/api/lookup?code=${encodeURIComponent(code)}`).catch(() => null);
      if (r) setBox(r.record!);
    };
    window.addEventListener('storage:scan', onScan);
    return () => window.removeEventListener('storage:scan', onScan);
  });

  function setBox(b: NonNullable<Dest['box']>) {
    dest = { box: b };
    try { localStorage.setItem('stickyBox', String(b.number)); } catch {}
  }

  function pick(p: Dest) {
    picking = false;
    if (p.box) setBox(p.box);
    else dest = p;
  }

  async function onPhoto(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    if (!files.length) return;
    const prepared = await Promise.all(files.map(preparePhoto));
    const first = photos.length === 0;
    photos = [...photos, ...prepared].slice(0, 8);
    if (first && data.aiReady && !name) identify(prepared[0]);
  }

  async function identify(p: PreparedPhoto) {
    ai = 'thinking';
    aiNote = '';
    try {
      const s = await api<{ name: string; description: string; tags: string[]; keywords: string[]; quantity: number; confident: boolean; brand: string; model: string; category: string; condition: string }>('/api/ai/identify', { image: await blobToBase64(p.full), mediaType: 'image/jpeg' });
      // Never overwrite what the person already typed.
      if (!name) name = s.name;
      if (!description) description = s.description;
      if (!tags) tags = s.tags.join(', ');
      keywords = s.keywords.join(' ');
      if (!brand) brand = s.brand;
      if (!model) model = s.model;
      if (!category) category = s.category;
      if (!condition && s.condition !== 'unknown') condition = s.condition;
      if (brand || model) showDetails = true;
      if (s.quantity > 1) { quantity = s.quantity; track = true; }
      ai = 'done';
      aiNote = s.confident ? 'Filled in from your photo. Check it over.' : 'Not sure about this one. Check the name.';
    } catch (e) {
      ai = 'error';
      aiNote = (e as Error).message;
    }
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) {
      error = 'Give the item a name.';
      nameInput?.focus();
      return;
    }
    saving = true;
    error = '';
    const fd = new FormData();
    fd.set('name', name);
    fd.set('description', description);
    fd.set('tags', tags);
    fd.set('keywords', keywords);
    fd.set('quantity', String(quantity));
    if (track) fd.set('track_quantity', 'on');
    if (dest.box) fd.set('box_id', String(dest.box.id));
    if (dest.location) fd.set('location_id', String(dest.location.id));
    fd.set('print', printLabel ? 'on' : 'off');
    fd.set('lookup_price', lookupPrice ? 'on' : 'off');
    for (const [k, v] of Object.entries({ brand, model, category, condition, serial_number: serial, purchase_price: paid, purchase_date: paidOn })) fd.set(k, v);
    photos.forEach((p, i) => { fd.append(`full_${i}`, p.full, `p${i}.jpg`); fd.append(`thumb_${i}`, p.thumb, `t${i}.jpg`); });
    let res: Response;
    try {
      res = await fetch(location.pathname, { method: 'POST', body: fd, headers: { accept: 'application/json', 'x-sveltekit-action': 'true' } });
    } catch {
      // No connection: keep it on the device and upload when the signal comes back.
      try {
        await queueAdd(fd, name);
        toast(`No signal. ${name} is saved on this phone and will upload automatically.`, { icon: 'clock', ms: 6000 });
        reset();
      } catch {
        error = 'No connection, and this browser can’t store it offline. Try again when you have signal.';
      }
      saving = false;
      return;
    }
    try {
      const out = deserialize(await res.text());
      if (out.type !== 'success') throw new Error((out.type === 'failure' && (out.data?.error as string)) || 'Could not save. Check your connection and try again.');
      const created = out.data!.created as { number: number; name: string };
      const job = out.data!.job as { id: number; held: boolean } | null;
      if (out.data!.pricing) setTimeout(() => toast(`Looking up the price of ${created.name}`, { icon: 'search', ms: 4000 }), 400);
      if (job?.held) toast(`Saved ${created.name}. Label held for the item roll.`, { icon: 'warning' });
      else if (job) toast(`Saved ${created.name}. Printing label…`, { icon: 'printer', printJob: job.id, ms: 7000, action: { label: 'Cancel print', run: () => api(`/api/print/${job.id}`, { action: 'cancel' }).then(() => {}) } });
      else toast(`Saved ${created.name}`, { icon: 'check', action: { label: 'View', run: () => goto(`/items/${created.number}`) } });
      reset();
      saved = true;
      setTimeout(() => (saved = false), 1400);
      await tick();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      // The draft stays on screen so nothing typed is lost.
      error = (err as Error).message;
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>Add item · Storage</title></svelte:head>

<div class="page narrow">
  <PageHeader title="Add Item" large={false} back={{ href: dest.box ? `/boxes/${dest.box.number}` : '/', label: dest.box ? dest.box.name : 'Storage' }} />

  <button class="dest" type="button" onclick={() => (picking = true)} data-color={dest.box?.location_color ?? dest.location?.color ?? 'none'}>
    <span class="dglyph"><Icon name={dest.box ? 'box' : dest.location ? 'tray' : 'warning'} size={20} /></span>
    <span class="grow">
      <span class="dlabel">Adding to</span>
      <span class="dname">{dest.box ? dest.box.name : dest.location ? `${dest.location.name}, loose` : 'Choose a box'}</span>
    </span>
    <span class="change">Change</span>
  </button>

  <div class="segmented mode" role="group" aria-label="Add mode">
    <button type="button" aria-pressed={mode === 'one'} onclick={() => (mode = 'one')}>One item</button>
    <button type="button" aria-pressed={mode === 'box'} onclick={() => (mode = 'box')}>Whole box</button>
  </div>

  {#if mode === 'box'}
    <div class="boxmode">
      {#if !boxPhoto}
        <button type="button" class="shutter big" onclick={() => boxCamera.click()} disabled={!data.aiReady}>
          <Icon name="camera" size={34} stroke={1.8} />
          <span>Photograph the open box</span>
          <small>{data.aiReady ? 'The AI lists everything inside. You pick what to keep.' : 'Needs your Anthropic API key in Settings.'}</small>
        </button>
      {:else}
        <div class="boxshot"><img src={boxPhoto.url} alt="Box contents" /><button type="button" class="btn small gray retake" onclick={() => boxCamera.click()}>Retake</button></div>
      {/if}
      <input bind:this={boxCamera} type="file" accept="image/*" capture="environment" class="sr-only" onchange={onBoxPhoto} />

      {#if boxAi === 'thinking'}
        <div class="ai thinking"><Icon name="sparkles" size={18} stroke={2} /><span>Finding everything in the photo…</span></div>
      {:else if boxAi === 'error'}
        <div class="ai err"><Icon name="sparkles" size={18} stroke={2} /><span>{aiNote}</span></div>
      {:else if drafts.length}
        <h3 class="group-label">{drafts.filter((d) => d.keep).length} of {drafts.length} selected</h3>
        <div class="group">
          {#each drafts as d, i}
            <div class="row draft" class:off={!d.keep}>
              <button type="button" class="check" class:on={d.keep} aria-pressed={d.keep} aria-label={d.keep ? 'Skip' : 'Keep'} onclick={() => (drafts[i].keep = !d.keep)}>{#if d.keep}<Icon name="check" size={14} stroke={3} />{/if}</button>
              <span class="grow">
                <input class="left dname-in" bind:value={drafts[i].name} aria-label="Item name" />
                <span class="sub">{[d.brand, d.category].filter(Boolean).join(' · ') || ' '}</span>
              </span>
              <span class="dq num">×{d.quantity}</span>
            </div>
          {/each}
        </div>
        <div class="group" style="margin-top:16px">
          <label class="row"><span class="grow">Print a label for each</span><input type="checkbox" class="switch" bind:checked={printLabel} /></label>
          <label class="row"><span class="grow">Look up prices online</span><input type="checkbox" class="switch" bind:checked={lookupPrice} /></label>
        </div>
        <div class="savebar">
          <button type="button" class="btn block morph" class:done={saved} disabled={saving || !drafts.some((d) => d.keep)} onclick={saveBox}>
            {#if saving}<span class="spinner"></span>{:else}<Icon name="check" size={20} stroke={2.4} />{/if}
            {saving ? 'Adding…' : `Add ${drafts.filter((d) => d.keep).length} items`}
          </button>
        </div>
      {/if}
      {#if error}<p class="error-text">{error}</p>{/if}
    </div>
  {:else}
  <form onsubmit={save}>
    <div class="shots">
      {#each photos as p, i}
        <div class="shot">
          <img src={p.url} alt="" />
          <button type="button" class="rm" aria-label="Remove photo" onclick={() => (photos = photos.filter((_, j) => j !== i))}><Icon name="x" size={13} stroke={3} /></button>
        </div>
      {/each}
      <button type="button" class="shutter" class:big={!photos.length} onclick={() => camera.click()}>
        <Icon name="camera" size={photos.length ? 24 : 34} stroke={1.8} />
        {#if !photos.length}<span>Take a photo</span><small>{data.aiReady ? 'The AI will fill in the details' : 'Optional, but it helps you find things'}</small>{/if}
      </button>
      <input bind:this={camera} type="file" accept="image/*" capture="environment" multiple class="sr-only" onchange={onPhoto} />
    </div>

    {#if ai !== 'idle'}
      <div class="ai" class:thinking={ai === 'thinking'} class:err={ai === 'error'}>
        <Icon name="sparkles" size={18} stroke={2} />
        <span>{ai === 'thinking' ? 'Looking at your photo…' : aiNote}</span>
        {#if ai === 'error' && photos[0]}<button type="button" class="btn small gray" onclick={() => identify(photos[0])}>Retry</button>{/if}
      </div>
    {/if}

    {#if similar.length}
      <div class="dupe">
        <Icon name="copy" size={18} />
        <span class="grow">Already in Storage: {#each similar as s, i}<a href={`/items/${s.number}`}>{s.name}</a><span class="muted"> in {s.box_name ?? s.location_name ?? 'no box'}</span>{i < similar.length - 1 ? ', ' : ''}{/each}</span>
        <button type="button" class="x" aria-label="Dismiss" onclick={() => (similar = [])}><Icon name="x" size={14} stroke={2.6} /></button>
      </div>
    {/if}

    <div class="group fields" class:shimmer={ai === 'thinking'}>
      <label class="row"><input bind:this={nameInput} class="left name" placeholder="Name" bind:value={name} aria-label="Name" autocomplete="off" /></label>
      <label class="row"><textarea placeholder="Description" rows="2" bind:value={description} aria-label="Description"></textarea></label>
      <label class="row"><span class="lbl">Tags</span><input placeholder="tools, camping" bind:value={tags} autocapitalize="none" /></label>
    </div>

    {#if showDetails}
      <h3 class="group-label">Details</h3>
      <DetailFields bind:brand bind:model bind:category bind:condition bind:serial_number={serial} bind:purchase_price={paid} bind:purchase_date={paidOn} categories={data.categories} />
    {:else}
      <button type="button" class="btn plain more" onclick={() => (showDetails = true)}><Icon name="plus" size={18} stroke={2.2} /> Brand, model, price…</button>
    {/if}

    <div class="group" style="margin-top:20px">
      <label class="row"><span class="grow">Track quantity</span><input type="checkbox" class="switch" bind:checked={track} /></label>
      {#if track}
        <div class="row">
          <span class="grow">Quantity</span>
          <button type="button" class="icon-btn" aria-label="Fewer" onclick={() => (quantity = Math.max(0, quantity - 1))}><Icon name="minus" size={16} stroke={2.6} /></button>
          <input class="qty num" type="number" min="0" bind:value={quantity} inputmode="numeric" aria-label="Quantity" />
          <button type="button" class="icon-btn" aria-label="More" onclick={() => quantity++}><Icon name="plus" size={16} stroke={2.6} /></button>
        </div>
      {/if}
      <label class="row"><span class="grow">Print label when saved</span><input type="checkbox" class="switch" bind:checked={printLabel} /></label>
      {#if data.aiReady}<label class="row"><span class="grow">Look up price online<span class="sub" style="display:block">Branded items only</span></span><input type="checkbox" class="switch" bind:checked={lookupPrice} /></label>{/if}
    </div>

    {#if error}<p class="error-text">{error}</p>{/if}
    <div class="savebar">
      <button class="btn block morph" class:done={saved} disabled={saving}>
        {#if saving}<span class="spinner"></span>{:else if saved}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path class="draw" d="M5 12.5 10 17.5 19 7" /></svg>{:else}<Icon name={printLabel ? 'printer' : 'check'} size={20} stroke={2.2} />{/if}
        {saving ? 'Saving…' : saved ? 'Saved' : printLabel ? 'Save and print' : 'Save'}
      </button>
    </div>
  </form>
  {/if}
</div>

<Sheet bind:open={picking} title="Where does it go?">
  <BoxPicker onPick={pick} current={dest.box?.id} />
</Sheet>

<style>
  .narrow { max-width: 600px; }
  .dest { display: flex; align-items: center; gap: 12px; width: 100%; margin-top: 6px; padding: 10px 14px; border: 0; border-radius: 16px; text-align: left; cursor: pointer;
    background: color-mix(in srgb, var(--loc, var(--label-3)) 15%, var(--bg-2)); }
  .dglyph { width: 40px; height: 40px; border-radius: 12px; background: var(--loc-solid, var(--label-3)); color: #fff; display: grid; place-items: center; flex: none; }
  .grow { flex: 1; min-width: 0; }
  .dlabel { display: block; font-size: 13px; color: var(--label-2); }
  .dname { display: block; font-weight: 600; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .change { color: var(--tint); font-size: 15px; }
  .shots { display: flex; gap: 10px; margin: 16px 0; overflow-x: auto; padding-bottom: 2px; }
  .shot { position: relative; flex: none; }
  .shot img { width: 104px; height: 104px; border-radius: 14px; object-fit: cover; }
  .rm { position: absolute; top: 5px; right: 5px; width: 24px; height: 24px; border-radius: 12px; border: 0; background: rgba(0,0,0,.6); color: #fff; display: grid; place-items: center; cursor: pointer; }
  .shutter { flex: none; width: 104px; height: 104px; border-radius: 14px; border: 0; background: var(--fill); color: var(--tint); display: grid; place-items: center; cursor: pointer; }
  .shutter.big { width: 100%; height: auto; aspect-ratio: 16 / 10; display: flex; flex-direction: column; justify-content: center; gap: 6px; border-radius: var(--r-tile); background: var(--bg-2); box-shadow: var(--shadow); font-weight: 600; font-size: 17px; }
  .shutter.big :global(svg) { width: 64px; height: 64px; padding: 15px; border-radius: 50%; background: var(--tint); color: #fff; margin-bottom: 4px; }
  .shutter.big small { font-weight: 400; font-size: 14px; color: var(--label-2); }
  .shutter:active { transform: scale(0.98); }
  .ai { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 10px 14px; border-radius: 12px; font-size: 15px; background: color-mix(in srgb, var(--c-purple) 12%, var(--bg-2)); color: var(--label); }
  .ai :global(svg) { color: var(--c-purple); flex: none; }
  .ai span { flex: 1; }
  .ai.err :global(svg) { color: var(--red); }
  .ai.thinking :global(svg) { animation: pulse 1.2s ease-in-out infinite; }
  .fields { transition: opacity 0.3s; }
  .fields.shimmer { opacity: 0.6; }
  .name { font-size: 20px; font-weight: 600; }
  .more { margin-top: 6px; padding-left: 4px; }
  .mode { margin-top: 14px; }
  .boxmode { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
  .boxshot { position: relative; }
  .boxshot img { width: 100%; max-height: 300px; object-fit: cover; border-radius: var(--r-tile); }
  .retake { position: absolute; right: 10px; bottom: 10px; background: var(--glass-bg-strong); backdrop-filter: blur(16px); }
  .draft .check { width: 26px; height: 26px; border-radius: 13px; border: 2px solid var(--label-3); background: transparent; display: grid; place-items: center; color: #fff; flex: none; cursor: pointer; transition: transform 0.4s var(--spring), background 0.2s; }
  .draft .check.on { background: var(--tint); border-color: var(--tint); }
  .draft.off .grow { opacity: 0.45; }
  .dname-in { display: block; width: 100%; font-weight: 600; }
  .dq { color: var(--label-2); }
  .dupe { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; padding: 10px 12px 10px 14px; border-radius: 16px; font-size: 15px; background: color-mix(in srgb, var(--tint) 10%, var(--bg-2)); }
  .dupe :global(svg) { color: var(--tint); flex: none; margin-top: 2px; }
  .dupe .x { border: 0; background: transparent; color: var(--label-3); cursor: pointer; padding: 2px; }
  .morph { transition: background 0.35s, transform 0.45s var(--spring), width 0.4s var(--spring); }
  .morph.done { background: var(--green); }
  .spinner { width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.35); border-top-color: #fff; animation: spin 0.7s linear infinite; }
  .draw { stroke-dasharray: 24; stroke-dashoffset: 24; animation: draw 0.4s var(--ease) forwards; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  .qty { width: 56px; text-align: center !important; flex: none !important; font-size: 18px; font-weight: 600; }
  .savebar { position: sticky; bottom: calc(var(--tabbar-h) + 10px); margin-top: 22px; z-index: 5; }
  .savebar .btn { box-shadow: 0 8px 24px color-mix(in srgb, var(--tint) 35%, transparent); }
  @keyframes pulse { 50% { opacity: 0.35; transform: scale(0.9); } }
</style>
