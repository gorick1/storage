<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Icon from '$lib/components/Icon.svelte';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';
  import { parseCode, pathFor, displayCode } from '$lib/codes';

  let { data } = $props();

  type Box = { id: number; number: number; name: string; location_name?: string | null; location_color?: string | null };
  let mode = $state<'find' | 'into'>(data.into ? 'into' : 'find');
  let target = $state<Box | null>(data.into);
  let moved = $state<{ id: number; number: number; name: string; from: { box_id: number | null; location_id: number | null } }[]>([]);
  let video: HTMLVideoElement;
  let camState = $state<'starting' | 'on' | 'denied' | 'none'>('starting');
  let lock = $state<{ x: number; y: number; w: number; h: number } | null>(null);
  let morph = $state<string | null>(null);
  let manual = $state('');
  let last = { code: '', at: 0 };
  let controls: { stop: () => void } | null = null;
  let track: MediaStreamTrack | null = null;
  let torchOk = $state(false);
  let torch = $state(false);
  let zoomRange = $state<{ min: number; max: number; step: number } | null>(null);
  let zoom = $state(1);

  function setupTrack() {
    track = (video.srcObject as MediaStream | null)?.getVideoTracks()[0] ?? null;
    const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean; zoom?: { min: number; max: number; step: number } };
    torchOk = !!caps.torch;
    if (caps.zoom && caps.zoom.max > caps.zoom.min) {
      zoomRange = { min: caps.zoom.min, max: Math.min(caps.zoom.max, caps.zoom.min * 8), step: caps.zoom.step || 0.1 };
      zoom = caps.zoom.min;
    }
  }
  async function toggleTorch() {
    torch = !torch;
    await track?.applyConstraints({ advanced: [{ torch } as MediaTrackConstraintSet] }).catch(() => (torch = false));
  }
  async function setZoom(z: number) {
    zoom = z;
    await track?.applyConstraints({ advanced: [{ zoom: z } as MediaTrackConstraintSet] }).catch(() => {});
  }

  async function handle(code: string, points?: { x: number; y: number }[]) {
    const t = Date.now();
    if (code === last.code && t - last.at < 2500) return; // same label still in frame
    last = { code, at: t };
    const c = parseCode(code);
    if (!c) {
      toast(`Not a Storage label`, { tone: 'error', icon: 'warning' });
      return;
    }
    if (points?.length && video) snap(points);
    navigator.vibrate?.(30);

    if (mode === 'find') {
      // The locked frame grows into the record's hero.
      morph = `${c.kind === 'location' ? 'loc' : c.kind}-${c.number}`;
      setTimeout(() => goto(pathFor(c.kind, c.number)), 260);
      return;
    }
    // Move mode: a box label sets the destination; item labels go into it.
    if (c.kind === 'box') {
      const r = await api<{ record: Box }>(`/api/lookup?code=${encodeURIComponent(code)}`).catch((e) => (toast(e.message, { tone: 'error', icon: 'warning' }), null));
      if (r) { target = r.record; moved = []; toast(`Now scanning items into ${r.record.name}`, { icon: 'box' }); }
      return;
    }
    if (c.kind !== 'item') return toast('Scan an item or a box label', { tone: 'error', icon: 'warning' });
    if (!target) return toast('Scan the box first', { tone: 'error', icon: 'warning' });
    const look = await api<{ record: { id: number; number: number; name: string; box_id: number | null } }>(`/api/lookup?code=${encodeURIComponent(code)}`).catch((e) => (toast(e.message, { tone: 'error', icon: 'warning' }), null));
    if (!look) return;
    if (look.record.box_id === target.id) return toast(`${look.record.name} is already in ${target.name}`, { icon: 'check' });
    const r = await api<{ from: { box_id: number | null; location_id: number | null }; labelStale: boolean }>(`/api/items/${look.record.id}`, { action: 'move', box_id: target.id });
    moved = [{ id: look.record.id, number: look.record.number, name: look.record.name, from: r.from }, ...moved];
    toast(`${look.record.name} → ${target.name}`, { icon: 'move' });
  }

  function snap(points: { x: number; y: number }[]) {
    const vw = video.videoWidth, vh = video.videoHeight;
    const rect = video.getBoundingClientRect();
    const scale = Math.max(rect.width / vw, rect.height / vh); // object-fit: cover
    const ox = (rect.width - vw * scale) / 2, oy = (rect.height - vh * scale) / 2;
    const xs = points.map((p) => p.x * scale + ox), ys = points.map((p) => p.y * scale + oy);
    const pad = 18;
    const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
    lock = { x, y, w: Math.max(...xs) - x + pad, h: Math.max(...ys) - y + pad };
    setTimeout(() => (lock = null), 900);
  }

  async function undo(m: (typeof moved)[number]) {
    await api(`/api/items/${m.id}`, { action: 'move', ...m.from });
    moved = moved.filter((x) => x !== m);
  }

  onMount(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { camState = 'none'; return; }
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const { BarcodeFormat, DecodeHintType } = await import('@zxing/library');
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128]);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        if (cancelled) return;
        controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } }, video, (result) => {
          if (result) handle(result.getText(), result.getResultPoints().map((p) => ({ x: p.getX(), y: p.getY() })));
        });
        camState = 'on';
        setTimeout(setupTrack, 300);
      } catch (e) {
        camState = (e as Error).name === 'NotAllowedError' ? 'denied' : 'none';
      }
    })();
    const onWedge = (e: Event) => handle((e as CustomEvent<string>).detail);
    window.addEventListener('storage:scan', onWedge);
    return () => { cancelled = true; controls?.stop(); window.removeEventListener('storage:scan', onWedge); };
  });
</script>

<svelte:head><title>Scan · Storage</title></svelte:head>

<div class="scan">
  <div class="viewport">
    <!-- svelte-ignore a11y_media_has_caption -->
    <video bind:this={video} playsinline muted></video>
    {#if camState !== 'on'}
      <div class="cam-msg">
        <Icon name="camera" size={36} stroke={1.6} />
        <p>{camState === 'starting' ? 'Starting camera…' : camState === 'denied' ? 'Camera access is off. Allow it in your browser settings, or type a code below.' : 'No camera here. Use a barcode scanner or type a code below.'}</p>
      </div>
    {/if}
    <div class="reticle" class:locked={!!lock} style:view-transition-name={morph} style={lock ? `left:${lock.x}px;top:${lock.y}px;width:${lock.w}px;height:${lock.h}px;transform:none` : ''}></div>

    <div class="top">
      <a href="/" class="close" aria-label="Close"><Icon name="x" size={18} stroke={2.6} /></a>
      <div class="segmented modes" role="group" aria-label="Scan mode">
        <button aria-pressed={mode === 'find'} onclick={() => (mode = 'find')}>Find</button>
        <button aria-pressed={mode === 'into'} onclick={() => (mode = 'into')}>Pack a box</button>
      </div>
    </div>
    <div class="cam-tools">
      {#if torchOk}<button class="tool glass" class:on={torch} onclick={toggleTorch} aria-label={torch ? 'Turn off light' : 'Turn on light'} aria-pressed={torch}><Icon name="bolt" size={20} stroke={2.1} /></button>{/if}
      {#if zoomRange}
        <div class="zoom glass">
          {#each [zoomRange.min, Math.min(zoomRange.max, zoomRange.min * 2), Math.min(zoomRange.max, zoomRange.min * 4)] as z}
            <button class:on={Math.abs(zoom - z) < 0.05} onclick={() => setZoom(z)}>{(z / zoomRange.min).toFixed(0)}×</button>
          {/each}
        </div>
      {/if}
    </div>
    <p class="hint">
      {#if mode === 'find'}Point at any Storage label{:else if !target}Scan the box label first{:else}Scan items to put them in <strong>{target.name}</strong>{/if}
    </p>
  </div>

  <div class="panel">
    {#if mode === 'into'}
      {#if target}
        <div class="target" data-color={target.location_color ?? 'none'}>
          <span class="tglyph"><Icon name="box" size={20} /></span>
          <span class="grow"><span class="tname">{target.name}</span><span class="footnote muted">{target.location_name ?? 'No place'} · {displayCode('box', target.number)}</span></span>
          <a class="btn small gray" href={`/boxes/${target.number}`}>Open</a>
        </div>
      {/if}
      {#if moved.length}
        <div class="group moved">
          {#each moved as m (m.id + ':' + m.from.box_id)}
            <div class="row"><Icon name="check" size={18} stroke={2.4} /><span class="grow title">{m.name}</span><button class="btn plain" onclick={() => undo(m)}>Undo</button></div>
          {/each}
        </div>
      {/if}
    {/if}
    <form class="manual" onsubmit={(e) => { e.preventDefault(); if (manual.trim()) { handle(manual.trim()); manual = ''; } }}>
      <div class="search-field"><Icon name="keyboard" size={18} /><input placeholder="Type a code, e.g. I000042" bind:value={manual} autocapitalize="characters" /></div>
      <button class="btn small">Go</button>
    </form>
    <p class="footnote muted tip">A USB or Bluetooth barcode scanner works on any screen. Just scan.</p>
  </div>
</div>

<style>
  .scan { min-height: 100dvh; background: #000; color: #fff; display: flex; flex-direction: column; padding-bottom: var(--tabbar-h); }
  .viewport { position: relative; flex: 1; min-height: 52dvh; overflow: hidden; }
  video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cam-msg { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 32px; text-align: center; color: rgba(255,255,255,.75); }
  .cam-msg p { max-width: 30ch; margin: 0; }
  .cam-tools { position: absolute; left: 0; right: 0; bottom: 64px; display: flex; justify-content: center; align-items: center; gap: 12px; }
  .tool { width: 48px; height: 48px; border-radius: 24px; border: 0; display: grid; place-items: center; color: #fff; background: rgba(40,40,44,.45); cursor: pointer; }
  .tool.on { background: #fff; color: #000; }
  .zoom { display: flex; gap: 2px; padding: 4px; border-radius: 24px; background: rgba(40,40,44,.45); }
  .zoom button { width: 40px; height: 40px; border-radius: 20px; border: 0; background: transparent; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
  .zoom button.on { background: rgba(255,255,255,.9); color: #000; }
  .reticle { position: absolute; left: 50%; top: 44%; width: min(78vw, 340px); aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 28px;
    box-shadow: 0 0 0 4px rgba(255,255,255,.9), 0 0 0 100vmax rgba(0,0,0,.28); transition: all 0.35s var(--ease); pointer-events: none; }
  .reticle.locked { box-shadow: 0 0 0 4px var(--c-yellow), 0 0 0 100vmax rgba(0,0,0,.45); border-radius: 14px; }
  .top { position: absolute; top: calc(var(--safe-t) + 12px); left: 12px; right: 12px; display: flex; align-items: center; gap: 12px; }
  .close { width: 36px; height: 36px; border-radius: 18px; background: rgba(0,0,0,.45); color: #fff; display: grid; place-items: center; backdrop-filter: blur(10px); }
  .modes { flex: 1; max-width: 300px; margin: 0 auto; background: rgba(0,0,0,.45); backdrop-filter: blur(10px); }
  .modes button { color: #fff; }
  .modes button[aria-pressed='true'] { background: rgba(255,255,255,.92); color: #000; }
  .hint { position: absolute; left: 0; right: 0; bottom: 20px; text-align: center; margin: 0; font-weight: 600; text-shadow: 0 1px 8px rgba(0,0,0,.6); padding: 0 20px; }
  .panel { background: var(--bg); color: var(--label); border-radius: 18px 18px 0 0; margin-top: -16px; position: relative; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .target { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; background: color-mix(in srgb, var(--loc, var(--label-3)) 15%, var(--bg-2)); }
  .tglyph { width: 38px; height: 38px; border-radius: 11px; background: var(--loc-solid, var(--label-3)); color: #fff; display: grid; place-items: center; }
  .tname { display: block; font-weight: 600; }
  .grow { flex: 1; min-width: 0; }
  .moved .row :global(svg) { color: var(--green); }
  .manual { display: flex; gap: 8px; align-items: center; }
  .manual .search-field { flex: 1; }
  .tip { margin: 0; text-align: center; }
  @media (min-width: 900px) { .scan { padding-bottom: 0; } }
</style>
