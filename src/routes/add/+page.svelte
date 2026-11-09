<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { deserialize } from '$app/forms';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import BoxPicker from '$lib/components/BoxPicker.svelte';
  import { preparePhoto, blobToBase64, type PreparedPhoto } from '$lib/client/image';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';
  import { displayCode, parseCode } from '$lib/codes';

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
    ai = 'idle';
    aiNote = '';
    error = '';
    if (!keepDest) dest = {};
  }

  onMount(() => {
    if (data.prefill) {
      ({ name, description, tags, keywords } = data.prefill);
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
      const s = await api<{ name: string; description: string; tags: string[]; keywords: string[]; quantity: number; confident: boolean }>('/api/ai/identify', { image: await blobToBase64(p.full), mediaType: 'image/jpeg' });
      // Never overwrite what the person already typed.
      if (!name) name = s.name;
      if (!description) description = s.description;
      if (!tags) tags = s.tags.join(', ');
      keywords = s.keywords.join(' ');
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
    photos.forEach((p, i) => { fd.append(`full_${i}`, p.full, `p${i}.jpg`); fd.append(`thumb_${i}`, p.thumb, `t${i}.jpg`); });
    try {
      const res = await fetch(location.pathname, { method: 'POST', body: fd, headers: { accept: 'application/json', 'x-sveltekit-action': 'true' } });
      const out = deserialize(await res.text());
      if (out.type !== 'success') throw new Error((out.type === 'failure' && (out.data?.error as string)) || 'Could not save. Check your connection and try again.');
      const created = out.data!.created as { number: number; name: string };
      const job = out.data!.job as { id: number; held: boolean } | null;
      if (job?.held) toast(`Saved ${created.name}. Label held for the item roll.`, { icon: 'warning' });
      else if (job) toast(`Saved ${created.name}. Printing label…`, { icon: 'printer', printJob: job.id, ms: 7000, action: { label: 'Cancel print', run: () => api(`/api/print/${job.id}`, { action: 'cancel' }).then(() => {}) } });
      else toast(`Saved ${created.name}`, { icon: 'check', action: { label: 'View', run: () => goto(`/items/${created.number}`) } });
      reset();
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

    <div class="group fields" class:shimmer={ai === 'thinking'}>
      <label class="row"><input bind:this={nameInput} class="left name" placeholder="Name" bind:value={name} aria-label="Name" autocomplete="off" /></label>
      <label class="row"><textarea placeholder="Description" rows="2" bind:value={description} aria-label="Description"></textarea></label>
      <label class="row"><span class="lbl">Tags</span><input placeholder="tools, camping" bind:value={tags} autocapitalize="none" /></label>
    </div>

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
    </div>

    {#if error}<p class="error-text">{error}</p>{/if}
    <div class="savebar">
      <button class="btn block" disabled={saving}>
        <Icon name={printLabel ? 'printer' : 'check'} size={20} stroke={2.2} />
        {saving ? 'Saving…' : printLabel ? 'Save and print' : 'Save'}
      </button>
    </div>
  </form>
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
  .qty { width: 56px; text-align: center !important; flex: none !important; font-size: 18px; font-weight: 600; }
  .savebar { position: sticky; bottom: calc(var(--tabbar-h) + 10px); margin-top: 22px; z-index: 5; }
  .savebar .btn { box-shadow: 0 8px 24px color-mix(in srgb, var(--tint) 35%, transparent); }
  @keyframes pulse { 50% { opacity: 0.35; transform: scale(0.9); } }
</style>
