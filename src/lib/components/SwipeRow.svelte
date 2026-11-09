<script lang="ts">
  // Swipe a row left for trailing actions, right for the leading one (iOS list behavior).
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  export type SwipeAction = { label: string; icon: string; color: string; run: () => void | Promise<void> };
  let { leading, trailing = [], children }: { leading?: SwipeAction; trailing?: SwipeAction[]; children: Snippet } = $props();

  const SLOT = 76;
  let x = $state(0);
  let dragging = $state(false);
  let start: { x: number; y: number; base: number } | null = null;
  let axis: 'x' | 'y' | null = null;
  const maxLeft = $derived(-SLOT * trailing.length);

  function down(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start = { x: e.clientX, y: e.clientY, base: x };
    axis = null;
  }
  function move(e: PointerEvent) {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (axis !== 'x') return;
    dragging = true;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    let n = start.base + dx;
    const min = maxLeft - 40, max = leading ? SLOT + 60 : 0;
    n = Math.max(min, Math.min(max, n));
    x = n;
  }
  async function up() {
    if (!start) return;
    const wasDrag = dragging;
    start = null;
    dragging = false;
    if (!wasDrag) return;
    if (leading && x > SLOT * 1.3) { x = 0; await leading.run(); return; }
    if (trailing.length && x < maxLeft - 30) { x = 0; await trailing[trailing.length - 1].run(); return; }
    x = x < maxLeft / 2 ? maxLeft : x > SLOT / 2 && leading ? SLOT : 0;
  }
  function onClick(e: MouseEvent) {
    if (x !== 0) { e.preventDefault(); e.stopPropagation(); x = 0; }
  }
</script>

<div class="swipe">
  {#if leading}
    <div class="lead" style:background={leading.color} style:width={`${Math.max(0, x)}px`}>
      <button onclick={async () => { x = 0; await leading.run(); }} aria-label={leading.label}><Icon name={leading.icon} size={20} /><span>{leading.label}</span></button>
    </div>
  {/if}
  <div class="trail" style:width={`${Math.max(0, -x)}px`}>
    {#each trailing as a}
      <button style:background={a.color} onclick={async () => { x = 0; await a.run(); }} aria-label={a.label}><Icon name={a.icon} size={20} /><span>{a.label}</span></button>
    {/each}
  </div>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="content" class:dragging style:transform={`translateX(${x}px)`}
    onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onclickcapture={onClick}>
    {@render children()}
  </div>
</div>

<style>
  .swipe { position: relative; overflow: hidden; }
  .content { position: relative; background: var(--bg-2); transition: transform 0.5s var(--spring); touch-action: pan-y; }
  .content.dragging { transition: none; }
  .lead, .trail { position: absolute; top: 0; bottom: 0; display: flex; overflow: hidden; }
  .lead { left: 0; }
  .trail { right: 0; flex-direction: row; }
  .lead button, .trail button { flex: 1; min-width: 0; border: 0; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 12px; font-weight: 600; cursor: pointer; background: transparent; }
  .lead button span, .trail button span { white-space: nowrap; }
</style>
