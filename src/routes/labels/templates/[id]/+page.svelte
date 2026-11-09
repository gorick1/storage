<script lang="ts">
  import { enhance } from '$app/forms';
  import { beforeNavigate } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import LabelPreview from '$lib/components/LabelPreview.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { toast } from '$lib/client/toast.svelte';
  import { FIELDS, dots, type LabelElement, type Align } from '$lib/labels/types';
  import { renderZpl, barcodeModule } from '$lib/labels/zpl';
  import QRCode from 'qrcode';

  let { data } = $props();

  let name = $state(data.template.name);
  let kind = $state(data.template.kind);
  let stockId = $state(data.template.stock_id);
  let elements = $state<LabelElement[]>(structuredClone(data.template.elements));
  let isDefault = $state(data.template.is_default);
  let autoPrint = $state(data.template.auto_print);
  let selected = $state<string | null>(null);
  let dirty = $state(false);
  let showZpl = $state(false);
  let history: string[] = [];

  const stock = $derived(data.stocks.find((s) => s.id === stockId)!);
  const W = $derived(dots(stock.width_in, stock.dpi));
  const H = $derived(dots(stock.height_in, stock.dpi));
  const sample = $derived(data.samples[kind]);
  const sel = $derived(elements.find((e) => e.id === selected) ?? null);
  const payload = $derived(JSON.stringify({ name, kind, stock_id: stockId, elements, is_default: isDefault, auto_print: autoPrint }));
  const zpl = $derived(renderZpl(stock, elements, sample));
  const qrN = $derived.by(() => { try { return QRCode.create(sample.qr, { errorCorrectionLevel: 'M' }).modules.size; } catch { return 21; } });

  // Scannability and fit checks, in plain words.
  const warnings = $derived.by(() => {
    const w: string[] = [];
    for (const e of elements) {
      if (e.type === 'qr') {
        const size = qrN * e.size;
        if (e.size < 3) w.push(`The QR code's squares are ${e.size} dot${e.size === 1 ? '' : 's'} wide. Phones struggle below 3; make it larger.`);
        if (e.x + size > W || e.y + size > H) w.push('The QR code runs off the label.');
      } else if (e.type === 'barcode') {
        const m = barcodeModule(sample.code, e.w);
        if (m < 2) w.push(`The barcode is too narrow for ${sample.code}. Widen it to at least ${Math.ceil((e.w / Math.max(1, m)) * 2 / 2) + 1} dots or scanners may miss it.`);
        if (e.h < 30) w.push('The barcode is very short. Give it at least 30 dots of height.');
      }
      if (e.type !== 'qr' && (e.x < 0 || e.y < 0 || e.x + e.w > W + 1 || e.y + (e.type === 'text' ? e.size * e.maxLines : e.h) > H + 1)) {
        w.push(`${e.type === 'text' ? `“${e.text.slice(0, 20)}”` : 'An element'} runs past the label edge.`);
      }
    }
    if (!elements.some((e) => e.type === 'qr')) w.push('No QR code. Phones won’t be able to open this record from the label.');
    return [...new Set(w)];
  });

  function snapshot() {
    history.push(JSON.stringify(elements));
    if (history.length > 50) history.shift();
  }
  function undo() {
    const prev = history.pop();
    if (prev) { elements = JSON.parse(prev); dirty = true; }
  }
  function touch() { dirty = true; }

  let n = Date.now();
  const nid = () => `e${(n++).toString(36)}`;

  function add(type: LabelElement['type'], text?: string) {
    snapshot();
    const pad = Math.round(Math.min(W, H) * 0.06);
    let el: LabelElement;
    if (type === 'text') el = { id: nid(), type, x: pad, y: pad, w: Math.round(W * 0.6), h: 40, text: text ?? 'Text', size: Math.max(18, Math.round(H * 0.1)), align: 'left', maxLines: 1 };
    else if (type === 'qr') el = { id: nid(), type, x: pad, y: pad, size: 4 };
    else if (type === 'barcode') el = { id: nid(), type, x: pad, y: H - pad - 60, w: Math.round(W * 0.7), h: 50 };
    else el = { id: nid(), type, x: pad, y: pad, w: Math.round(W * 0.5), h: 4, thickness: 4 };
    elements = [...elements, el];
    selected = el.id;
    touch();
  }

  function onDrag(id: string, dx: number, dy: number, mode: 'move' | 'resize') {
    if (!dirty) snapshot();
    elements = elements.map((e) => {
      if (e.id !== id) return e;
      if (mode === 'move') return { ...e, x: Math.round(e.x + dx), y: Math.round(e.y + dy) };
      if (e.type === 'text') return { ...e, w: Math.max(20, e.w + dx), size: Math.max(10, Math.round(e.size + dy / Math.max(1, e.maxLines))) };
      if (e.type === 'barcode' || e.type === 'box') return { ...e, w: Math.max(4, e.w + dx), h: Math.max(2, e.h + dy) };
      return e;
    });
    touch();
  }

  function patch(p: Partial<LabelElement>) {
    if (!sel) return;
    snapshot();
    elements = elements.map((e) => (e.id === sel.id ? ({ ...e, ...p } as LabelElement) : e));
    touch();
  }

  function remove() {
    if (!sel) return;
    snapshot();
    elements = elements.filter((e) => e.id !== sel.id);
    selected = null;
    touch();
  }

  function layer(dir: 1 | -1) {
    if (!sel) return;
    const i = elements.findIndex((e) => e.id === sel.id);
    const j = i + dir;
    if (j < 0 || j >= elements.length) return;
    snapshot();
    const copy = [...elements];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    elements = copy;
    touch();
  }

  function changeStock(id: number) {
    const next = data.stocks.find((s) => s.id === id)!;
    const nw = dots(next.width_in, next.dpi), nh = dots(next.height_in, next.dpi);
    const sx = nw / W, sy = nh / H, s = Math.min(sx, sy);
    snapshot();
    // Keep the layout: scale everything into the new label.
    elements = elements.map((e) => {
      const base = { ...e, x: Math.round(e.x * sx), y: Math.round(e.y * sy) };
      if (e.type === 'qr') return { ...base, size: Math.max(1, Math.round(e.size * s)) } as LabelElement;
      if (e.type === 'text') return { ...base, w: Math.round(e.w * sx), h: Math.round(e.h * sy), size: Math.max(10, Math.round(e.size * s)) } as LabelElement;
      if (e.type === 'box') return { ...base, w: Math.round(e.w * sx), h: Math.round(e.h * sy), thickness: Math.max(1, Math.round(e.thickness * s)) } as LabelElement;
      return { ...base, w: Math.round((e as { w: number }).w * sx), h: Math.round((e as { h: number }).h * sy) } as LabelElement;
    });
    stockId = id;
    touch();
  }

  function keydown(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t.matches('input, textarea, select')) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
    if (!sel) return;
    const step = e.shiftKey ? 10 : 1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) { e.preventDefault(); onDrag(sel.id, moves[e.key][0], moves[e.key][1], 'move'); }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); remove(); }
    if (e.key === 'Escape') selected = null;
  }

  beforeNavigate(({ cancel, type }) => {
    if (dirty && type !== 'form' && !confirm('Leave without saving your label changes?')) cancel();
  });

  const fieldsFor = $derived(FIELDS.filter((f) => f.kinds.includes(kind)));
  const inch = (d: number) => (d / stock.dpi).toFixed(2);
</script>

<svelte:window onkeydown={keydown} />
<svelte:head><title>{name} · Labels</title></svelte:head>

<div class="page wide">
  <PageHeader title={name || 'Template'} back={{ href: '/labels', label: 'Labels' }} large={false}>
    {#snippet actions()}
      <form method="POST" action="?/save" use:enhance={() => async ({ result }) => {
        if (result.type === 'success') { dirty = false; toast('Template saved', { icon: 'check' }); }
        else if (result.type === 'failure') toast(String(result.data?.error), { tone: 'error', icon: 'warning' });
      }}>
        <input type="hidden" name="payload" value={payload} />
        <button class="btn small" disabled={!dirty}>Save</button>
      </form>
    {/snippet}
  </PageHeader>

  <div class="designer">
    <div class="canvas-col">
      <div class="toolbar" role="toolbar" aria-label="Add to label">
        <button onclick={() => add('text', '{name}')}><Icon name="text" size={20} /><span>Text</span></button>
        <button onclick={() => add('qr')}><Icon name="qr" size={20} /><span>QR</span></button>
        <button onclick={() => add('barcode')}><Icon name="barcode" size={20} /><span>Barcode</span></button>
        <button onclick={() => add('box')}><Icon name="square" size={20} /><span>Line/Box</span></button>
        <span class="sp"></span>
        <button onclick={undo} aria-label="Undo"><Icon name="undo" size={20} /><span>Undo</span></button>
      </div>
      <div class="canvas" style:--ar={`${W} / ${H}`}>
        <LabelPreview {stock} {elements} data={sample} {selected} interactive onSelect={(id) => (selected = id)} {onDrag} />
      </div>
      <p class="footnote muted dims num">{stock.width_in} × {stock.height_in} in · {W} × {H} dots · preview uses your latest {kind}</p>
      {#if warnings.length}
        <div class="warn">
          {#each warnings as w}<p><Icon name="warning" size={16} stroke={2.2} /> {w}</p>{/each}
        </div>
      {/if}
    </div>

    <aside class="inspector">
      {#if sel}
        <div class="insp-head">
          <h2 class="headline">{sel.type === 'text' ? 'Text' : sel.type === 'qr' ? 'QR code' : sel.type === 'barcode' ? 'Barcode' : 'Line / box'}</h2>
          <button class="btn plain" onclick={() => (selected = null)}>Done</button>
        </div>

        {#if sel.type === 'text'}
          <div class="group">
            <label class="row"><textarea rows="2" value={sel.text} oninput={(e) => patch({ text: (e.target as HTMLTextAreaElement).value })} aria-label="Text"></textarea></label>
          </div>
          <div class="fields-chips">
            {#each fieldsFor as f}
              <button class="chip" onclick={() => patch({ text: `${(sel as { text: string }).text}${(sel as { text: string }).text ? ' ' : ''}{${f.key}}` })}>{f.label}</button>
            {/each}
          </div>
          <div class="segmented" role="group" aria-label="Alignment" style="margin-top:14px">
            {#each ['left', 'center', 'right'] as a}<button aria-pressed={sel.align === a} onclick={() => patch({ align: a as Align })}>{a[0].toUpperCase() + a.slice(1)}</button>{/each}
          </div>
          <div class="group" style="margin-top:14px">
            <label class="row"><span class="lbl">Size</span><input type="number" min="10" max="400" value={sel.size} oninput={(e) => patch({ size: Number((e.target as HTMLInputElement).value) || 10 })} /></label>
            <label class="row"><span class="lbl">Width</span><input type="number" min="10" value={sel.w} oninput={(e) => patch({ w: Number((e.target as HTMLInputElement).value) || 10 })} /></label>
            <label class="row"><span class="lbl">Max lines</span><input type="number" min="1" max="12" value={sel.maxLines} oninput={(e) => patch({ maxLines: Number((e.target as HTMLInputElement).value) || 1 })} /></label>
            <label class="row"><span class="grow">White on black</span><input type="checkbox" class="switch" checked={!!sel.invert} onchange={(e) => patch({ invert: (e.target as HTMLInputElement).checked })} /></label>
          </div>
          {#if sel.invert}<p class="group-foot">Put a filled box underneath; the printer reverses the text where they overlap.</p>{/if}
        {:else if sel.type === 'qr'}
          <div class="group">
            <label class="row"><span class="lbl">Square size</span><input type="number" min="1" max="10" value={sel.size} oninput={(e) => patch({ size: Math.min(10, Math.max(1, Number((e.target as HTMLInputElement).value) || 1)) })} /></label>
            <div class="row"><span class="grow muted">Printed size</span><span class="num">{inch(qrN * sel.size)} in</span></div>
          </div>
          <p class="group-foot">Encodes <span class="code">{sample.qr}</span>. Any phone camera opens it.</p>
        {:else if sel.type === 'barcode'}
          <div class="group">
            <label class="row"><span class="lbl">Width</span><input type="number" min="20" value={sel.w} oninput={(e) => patch({ w: Number((e.target as HTMLInputElement).value) || 20 })} /></label>
            <label class="row"><span class="lbl">Height</span><input type="number" min="10" value={sel.h} oninput={(e) => patch({ h: Number((e.target as HTMLInputElement).value) || 10 })} /></label>
          </div>
          <p class="group-foot">Code 128 of <span class="code">{sample.code}</span>. Only Storage understands it, so a handheld scanner jumps straight to the record.</p>
        {:else if sel.type === 'box'}
          <div class="group">
            <label class="row"><span class="lbl">Width</span><input type="number" min="1" value={sel.w} oninput={(e) => patch({ w: Number((e.target as HTMLInputElement).value) || 1 })} /></label>
            <label class="row"><span class="lbl">Height</span><input type="number" min="1" value={sel.h} oninput={(e) => patch({ h: Number((e.target as HTMLInputElement).value) || 1 })} /></label>
            <label class="row"><span class="lbl">Line</span><input type="number" min="1" max="40" value={sel.thickness} oninput={(e) => patch({ thickness: Number((e.target as HTMLInputElement).value) || 1 })} /></label>
            <label class="row"><span class="grow">Filled</span><input type="checkbox" class="switch" checked={!!sel.fill} onchange={(e) => patch({ fill: (e.target as HTMLInputElement).checked })} /></label>
          </div>
        {/if}

        <div class="group" style="margin-top:14px">
          <label class="row"><span class="lbl">X</span><input type="number" value={sel.x} oninput={(e) => patch({ x: Number((e.target as HTMLInputElement).value) || 0 })} /></label>
          <label class="row"><span class="lbl">Y</span><input type="number" value={sel.y} oninput={(e) => patch({ y: Number((e.target as HTMLInputElement).value) || 0 })} /></label>
        </div>
        <p class="group-foot">In printer dots ({stock.dpi} per inch). Drag on the label, or use arrow keys (Shift for 10).</p>
        <div class="layer-btns">
          <button class="btn small gray" onclick={() => layer(-1)}>Send back</button>
          <button class="btn small gray" onclick={() => layer(1)}>Bring forward</button>
          <button class="btn small danger" onclick={remove}><Icon name="trash" size={16} /> Delete</button>
        </div>
      {:else}
        <h3 class="group-label first">Template</h3>
        <div class="group">
          <label class="row"><span class="lbl">Name</span><input bind:value={name} oninput={touch} /></label>
          <label class="row"><span class="lbl">For</span>
            <select bind:value={kind} onchange={touch}><option value="item">Items</option><option value="box">Boxes</option><option value="location">Places</option></select>
          </label>
          <label class="row"><span class="lbl">Label stock</span>
            <select value={stockId} onchange={(e) => changeStock(Number((e.target as HTMLSelectElement).value))}>
              {#each data.stocks as s}<option value={s.id}>{s.name}</option>{/each}
            </select>
          </label>
        </div>
        <p class="group-foot">Switching stock rescales the layout to fit.</p>
        <div class="group" style="margin-top:20px">
          <label class="row"><span class="grow">Default for {({ item: 'items', box: 'boxes', location: 'places' })[kind]}</span><input type="checkbox" class="switch" bind:checked={isDefault} onchange={touch} /></label>
          <label class="row"><span class="grow">Print automatically when created</span><input type="checkbox" class="switch" bind:checked={autoPrint} onchange={touch} disabled={!isDefault} /></label>
        </div>
        <p class="group-foot">Only the default template auto-prints. You get a few seconds to cancel each one.</p>

        <h3 class="group-label">Layers</h3>
        <div class="group">
          {#each [...elements].reverse() as e (e.id)}
            <button class="row" onclick={() => (selected = e.id)}>
              <Icon name={e.type === 'text' ? 'text' : e.type === 'qr' ? 'qr' : e.type === 'barcode' ? 'barcode' : 'square'} size={18} />
              <span class="grow title">{e.type === 'text' ? e.text : e.type === 'qr' ? 'QR code' : e.type === 'barcode' ? 'Barcode' : e.fill ? 'Filled box' : 'Line / box'}</span>
              <span class="chev"><Icon name="chevron-right" size={14} stroke={2.4} /></span>
            </button>
          {/each}
        </div>

        <div class="test">
          <form method="POST" action="?/test" use:enhance={() => async ({ result }) => {
            if (result.type === 'success') toast('Test label sent', { icon: 'printer', printJob: Number(result.data?.jobId) });
            else if (result.type === 'failure') toast(String(result.data?.error), { tone: 'error', icon: 'warning' });
          }}>
            <input type="hidden" name="payload" value={payload} />
            <button class="btn gray block"><Icon name="printer" size={18} /> Test print</button>
          </form>
          <form method="POST" action="?/duplicate"><button class="btn gray block">Duplicate</button></form>
        </div>
        <button class="btn plain zpl-toggle" onclick={() => (showZpl = !showZpl)}>{showZpl ? 'Hide' : 'Show'} ZPL</button>
        {#if showZpl}<pre class="zpl">{zpl}</pre>{/if}
        <form method="POST" action="?/delete" onsubmit={(e) => { if (!confirm('Delete this template?')) e.preventDefault(); else dirty = false; }}>
          <div class="group" style="margin-top:16px"><button class="row danger">Delete template</button></div>
        </form>
      {/if}
    </aside>
  </div>
</div>

<style>
  .wide { max-width: 1280px; }
  .designer { display: grid; gap: 20px; margin-top: 8px; }
  @media (min-width: 1000px) { .designer { grid-template-columns: minmax(0, 1fr) 340px; align-items: start; } .inspector { position: sticky; top: 64px; max-height: calc(100dvh - 80px); overflow-y: auto; } }
  .toolbar { display: flex; gap: 6px; margin-bottom: 12px; overflow-x: auto; }
  .toolbar button { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 64px; padding: 8px 10px; border: 0; border-radius: 12px; background: var(--bg-2); color: var(--tint); font-size: 12px; cursor: pointer; }
  .toolbar button span { color: var(--label); }
  .toolbar .sp { flex: 1; }
  .canvas { background: repeating-conic-gradient(var(--fill) 0% 25%, transparent 0% 50%) 50% / 18px 18px; border-radius: 18px; padding: clamp(16px, 4vw, 44px); display: grid; place-items: center; }
  .canvas :global(svg) { max-height: 62dvh; width: auto; max-width: 100%; aspect-ratio: var(--ar); }
  .dims { text-align: center; margin: 8px 0 0; }
  .warn { margin-top: 12px; padding: 10px 14px; border-radius: 12px; background: color-mix(in srgb, var(--c-orange) 13%, var(--bg-2)); }
  .warn p { margin: 4px 0; font-size: 14px; display: flex; gap: 8px; align-items: flex-start; }
  .warn :global(svg) { color: var(--c-orange); flex: none; margin-top: 2px; }
  .insp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .insp-head h2 { margin: 0; font-size: 20px; }
  .first { margin-top: 0; }
  .fields-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .chip { border: 0; border-radius: 14px; padding: 6px 11px; background: color-mix(in srgb, var(--tint) 12%, var(--bg-2)); color: var(--tint); font-size: 13px; font-weight: 500; cursor: pointer; }
  .layer-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
  .test { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
  .zpl-toggle { margin-top: 8px; }
  .zpl { font-family: var(--mono); font-size: 12px; background: var(--bg-2); padding: 12px; border-radius: 10px; overflow-x: auto; white-space: pre; color: var(--label-2); max-height: 260px; }
  .row .title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
