<script lang="ts">
  import { onMount } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';
  import { parseCode } from '$lib/codes';

  let { data } = $props();
  let seen = $state<number[]>([]);
  let strays = $state<{ id: number; number: number; name: string; box_name: string | null }[]>([]);
  let camOn = $state(false);
  let video: HTMLVideoElement;
  let controls: { stop: () => void } | null = null;
  let last = '';

  const count = $derived(seen.length);
  const total = $derived(data.items.length);
  const toggle = (id: number) => (seen = seen.includes(id) ? seen.filter((x) => x !== id) : [...seen, id]);

  async function onCode(code: string) {
    if (code === last) return;
    last = code;
    setTimeout(() => (last = ''), 1500);
    const c = parseCode(code);
    if (c?.kind !== 'item') return toast('Scan item labels to tick them off', { icon: 'warning', tone: 'error' });
    const hit = data.items.find((i) => i.number === c.number);
    navigator.vibrate?.(20);
    if (hit) {
      if (!seen.includes(hit.id)) seen = [...seen, hit.id];
      toast(`✓ ${hit.name}`, { icon: 'check', ms: 1500 });
      return;
    }
    // Found something that belongs in another box.
    const r = await api<{ record: { id: number; number: number; name: string; box_name: string | null } }>(`/api/lookup?code=${encodeURIComponent(code)}`).catch(() => null);
    if (r && !strays.some((s) => s.id === r.record.id)) strays = [...strays, r.record];
  }

  async function camera() {
    if (camOn) { controls?.stop(); camOn = false; return; }
    camOn = true;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      controls = await new BrowserMultiFormatReader().decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, video, (res) => res && onCode(res.getText()));
    } catch {
      camOn = false;
      toast('Camera unavailable', { icon: 'warning', tone: 'error' });
    }
  }

  async function moveHere(id: number, name: string) {
    await api(`/api/items/${id}`, { action: 'move', box_id: data.box.id });
    strays = strays.filter((s) => s.id !== id);
    await invalidateAll();
    seen = [...seen, id];
    toast(`${name} moved into ${data.box.name}`, { icon: 'move' });
  }

  async function finish() {
    const missing = data.items.filter((i) => !seen.includes(i.id)).map((i) => i.id);
    const found = data.items.filter((i) => seen.includes(i.id) && i.missing_at).map((i) => i.id);
    if (missing.length) await api('/api/items/bulk', { action: 'missing', ids: missing });
    if (found.length) await api('/api/items/bulk', { action: 'found', ids: found });
    toast(missing.length ? `${missing.length} marked missing` : 'Everything accounted for', { icon: missing.length ? 'warning' : 'check' });
    goto(`/boxes/${data.box.number}`, { invalidateAll: true });
  }

  onMount(() => {
    const onWedge = (e: Event) => onCode((e as CustomEvent<string>).detail);
    window.addEventListener('storage:scan', onWedge);
    return () => { window.removeEventListener('storage:scan', onWedge); controls?.stop(); };
  });
</script>

<svelte:head><title>Verify {data.box.name} · Storage</title></svelte:head>

<div class="page narrow" data-color={data.box.location_color ?? 'none'}>
  <PageHeader title={`Verify ${data.box.name}`} back={{ href: `/boxes/${data.box.number}`, label: data.box.name }} />
  <p class="muted lead">Tick off each item you can see, or scan its label. Anything left unticked gets marked missing.</p>

  <div class="progress"><span style:width={`${total ? (count / total) * 100 : 0}%`}></span></div>
  <p class="footnote muted num">{count} of {total} found</p>

  <button class="btn gray block" onclick={camera}><Icon name={camOn ? 'x' : 'scan'} size={18} /> {camOn ? 'Stop camera' : 'Scan labels with camera'}</button>
  <!-- svelte-ignore a11y_media_has_caption -->
  <video bind:this={video} class:on={camOn} playsinline muted></video>

  <div class="group list">
    {#each data.items as item (item.id)}
      <button class="row" type="button" onclick={() => toggle(item.id)} aria-pressed={seen.includes(item.id)}>
        <span class="check" class:on={seen.includes(item.id)}>{#if seen.includes(item.id)}<Icon name="check" size={15} stroke={3} />{/if}</span>
        {#if item.cover}<img class="thumb" src={`/photos/${item.cover}_t.jpg`} alt="" />{:else}<span class="thumb ph"><Icon name="photo" size={18} /></span>{/if}
        <span class="grow title">{item.name}{#if item.missing_at}<span class="was">{" · "}was missing</span>{/if}</span>
      </button>
    {:else}
      <p class="row muted">This box is empty.</p>
    {/each}
  </div>

  {#if strays.length}
    <h3 class="group-label">Found here, but listed elsewhere</h3>
    <div class="group">
      {#each strays as s (s.id)}
        <div class="row"><span class="grow"><span style="display:block">{s.name}</span><span class="sub">Listed in {s.box_name ?? 'no box'}</span></span><button class="btn small" onclick={() => moveHere(s.id, s.name)}>Move here</button></div>
      {/each}
    </div>
  {/if}

  <div class="savebar"><button class="btn block" onclick={finish}>Done{total - count ? ` · ${total - count} missing` : ''}</button></div>
</div>

<style>
  .narrow { max-width: 640px; }
  .lead { margin: 0 4px 14px; }
  .progress { height: 8px; border-radius: 4px; background: var(--fill); overflow: hidden; }
  .progress span { display: block; height: 100%; background: var(--loc-solid, var(--tint)); border-radius: 4px; transition: width 0.5s var(--spring); }
  .footnote { margin: 6px 4px 14px; }
  video { display: none; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 20px; margin-top: 12px; background: #000; }
  video.on { display: block; }
  .list { margin-top: 16px; }
  .check { width: 26px; height: 26px; border-radius: 13px; border: 2px solid var(--label-3); display: grid; place-items: center; color: #fff; flex: none; transition: transform 0.4s var(--spring), background 0.2s; }
  .check.on { background: var(--green); border-color: var(--green); transform: scale(1.08); }
  .was { color: var(--red); font-weight: 400; font-size: 14px; }
  .savebar { position: sticky; bottom: calc(var(--tabbar-h) + 10px); margin-top: 22px; }
</style>
