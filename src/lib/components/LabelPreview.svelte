<script lang="ts">
  // On-screen render of a label, in printer dots, using the same geometry the ZPL uses.
  import QRCode from 'qrcode';
  import type { LabelData, LabelElement, LabelStock } from '$lib/labels/types';
  import { dots, fillText } from '$lib/labels/types';
  import { code128B } from '$lib/labels/code128';
  import { barcodeModule } from '$lib/labels/zpl';

  let { stock, elements, data, selected = null, onSelect, onDrag, interactive = false }: {
    stock: LabelStock; elements: LabelElement[]; data: LabelData; selected?: string | null;
    onSelect?: (id: string | null) => void; onDrag?: (id: string, dx: number, dy: number, mode: 'move' | 'resize') => void; interactive?: boolean;
  } = $props();

  const W = $derived(dots(stock.width_in, stock.dpi));
  const H = $derived(dots(stock.height_in, stock.dpi));
  let svg: SVGSVGElement;

  function qrModules(text: string) {
    try {
      const q = QRCode.create(text, { errorCorrectionLevel: 'M' });
      const n = q.modules.size;
      const cells: [number, number][] = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.modules.get(r, c)) cells.push([c, r]);
      return { n, cells };
    } catch {
      return { n: 21, cells: [] };
    }
  }

  // ^FB wraps on words; approximate with measured widths so the preview breaks lines where the printer will.
  let measureCtx: CanvasRenderingContext2D | null = null;
  function wrap(text: string, size: number, width: number, maxLines: number): string[] {
    if (typeof document === 'undefined') return [text];
    measureCtx ??= document.createElement('canvas').getContext('2d');
    const ctx = measureCtx!;
    ctx.font = `700 ${size}px ${FONT}`;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width * 0.85 <= width || !line) line = test;
      else { lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    // ZPL overprints extra lines on the last one; showing them truncated is the honest preview.
    return lines.slice(0, Math.max(1, maxLines));
  }

  const FONT = `'Helvetica Neue', 'Arial Narrow', Arial, sans-serif`;

  let drag: { id: string; mode: 'move' | 'resize'; x: number; y: number } | null = null;
  function toDots(e: PointerEvent) {
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }
  function down(e: PointerEvent, id: string, mode: 'move' | 'resize') {
    if (!interactive) return;
    e.stopPropagation();
    onSelect?.(id);
    const p = toDots(e);
    drag = { id, mode, x: p.x, y: p.y };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    const p = toDots(e);
    const dx = Math.round(p.x - drag.x), dy = Math.round(p.y - drag.y);
    if (dx || dy) { onDrag?.(drag.id, dx, dy, drag.mode); drag.x += dx; drag.y += dy; }
  }
  function up() { drag = null; }

  function bbox(el: LabelElement) {
    if (el.type === 'qr') { const { n } = qrModules(data.qr); return { x: el.x, y: el.y, w: n * el.size, h: n * el.size }; }
    return { x: el.x, y: el.y, w: el.w, h: el.type === 'text' ? el.size * el.maxLines : el.h };
  }
</script>

<svg bind:this={svg} viewBox={`0 0 ${W} ${H}`} class="label" class:interactive role="img" aria-label="Label preview"
  onpointermove={move} onpointerup={up} onpointerdown={() => interactive && onSelect?.(null)}>
  <rect width={W} height={H} fill="#fff" />
  {#each elements as el (el.id)}
    <g class="el" class:sel={selected === el.id} onpointerdown={(e) => down(e, el.id, 'move')}>
      {#if el.type === 'text'}
        {@const lines = wrap(fillText(el.text, data), el.size, el.w, el.maxLines)}
        {#if el.invert}<rect x={el.x} y={el.y} width={el.w} height={el.size * el.maxLines} fill="#000" opacity="0" />{/if}
        {#each lines as line, i}
          <text x={el.align === 'left' ? el.x : el.align === 'center' ? el.x + el.w / 2 : el.x + el.w} y={el.y + el.size * (i + 0.8)}
            font-size={el.size} font-family={FONT} font-weight="700" textLength={undefined}
            text-anchor={el.align === 'left' ? 'start' : el.align === 'center' ? 'middle' : 'end'}
            fill={el.invert ? '#fff' : '#000'} transform={`translate(${(el.align === 'left' ? el.x : el.align === 'center' ? el.x + el.w / 2 : el.x + el.w) * 0.15}, 0) scale(0.85, 1)`}>{line}</text>
        {/each}
      {:else if el.type === 'qr'}
        {@const q = qrModules(data.qr)}
        <rect x={el.x} y={el.y} width={q.n * el.size} height={q.n * el.size} fill="#fff" />
        <path fill="#000" d={q.cells.map(([c, r]) => `M${el.x + c * el.size} ${el.y + r * el.size}h${el.size}v${el.size}h-${el.size}z`).join('')} />
      {:else if el.type === 'barcode'}
        {@const m = barcodeModule(data.code, el.w)}
        {@const bars = code128B(data.code)}
        <path fill="#000" d={(() => { let x = el.x; let d = ''; bars.forEach((w, i) => { if (i % 2 === 0) d += `M${x} ${el.y}h${w * m}v${el.h}h-${w * m}z`; x += w * m; }); return d; })()} />
      {:else if el.type === 'box'}
        {#if el.fill}<rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#000" />
        {:else}<rect x={el.x + el.thickness / 2} y={el.y + el.thickness / 2} width={el.w - el.thickness} height={el.h - el.thickness} fill="none" stroke="#000" stroke-width={el.thickness} />{/if}
      {/if}
      {#if interactive}
        {@const b = bbox(el)}
        <rect class="hit" x={b.x} y={b.y} width={b.w} height={b.h} />
        {#if selected === el.id && el.type !== 'qr'}
          <rect class="handle" x={b.x + b.w - 9} y={b.y + b.h - 9} width="18" height="18" rx="4" onpointerdown={(e) => down(e, el.id, 'resize')} />
        {/if}
      {/if}
    </g>
  {/each}
</svg>

<style>
  .label { width: 100%; height: auto; display: block; border-radius: 10px; box-shadow: 0 0 0 0.5px rgba(0,0,0,.18), 0 10px 30px rgba(0,0,0,.14); background: #fff; touch-action: none; user-select: none; -webkit-user-select: none; }
  /* Inverted text over a filled box: ZPL ^FR reverses ink, so text on black prints white. */
  .hit { fill: transparent; stroke: transparent; }
  .interactive .el { cursor: grab; }
  .interactive .el:hover .hit { stroke: rgba(0, 122, 255, 0.45); stroke-width: 2; stroke-dasharray: 6 4; }
  .el.sel .hit { stroke: #007aff; stroke-width: 3; stroke-dasharray: none; }
  .handle { fill: #fff; stroke: #007aff; stroke-width: 3; cursor: nwse-resize; }
</style>
