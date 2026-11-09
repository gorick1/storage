<script lang="ts">
  // Press and hold (or right-click) for actions, iOS style: the item lifts, the page blurs, a glass menu appears.
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  export type MenuAction = { label: string; icon: string; run: () => void | Promise<void>; danger?: boolean };
  let { actions, children }: { actions: MenuAction[]; children: Snippet } = $props();

  let open = $state(false);
  let lifted = $state(false);
  let pos = $state({ x: 0, y: 0, below: true, w: 0 });
  let host: HTMLElement;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let suppressClick = false;
  let start = { x: 0, y: 0 };

  function show() {
    const r = host.getBoundingClientRect();
    const below = r.bottom + 60 * actions.length < window.innerHeight - 40;
    pos = { x: Math.min(Math.max(12, r.left), window.innerWidth - 232), y: below ? r.bottom + 10 : r.top - 10, below, w: r.width };
    open = true;
    suppressClick = true;
    navigator.vibrate?.(12);
  }

  function down(e: PointerEvent) {
    if (e.pointerType === 'mouse') return;
    start = { x: e.clientX, y: e.clientY };
    lifted = true;
    timer = setTimeout(show, 420);
  }
  function move(e: PointerEvent) {
    if (timer && (Math.abs(e.clientX - start.x) > 8 || Math.abs(e.clientY - start.y) > 8)) cancel();
  }
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    if (!open) lifted = false;
  }
  function close() {
    open = false;
    lifted = false;
    setTimeout(() => (suppressClick = false), 50);
  }
  async function pick(a: MenuAction) {
    close();
    await a.run();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={host} class="cm-host" class:lifted class:open
  onpointerdown={down} onpointermove={move} onpointerup={cancel} onpointercancel={cancel}
  oncontextmenu={(e) => { e.preventDefault(); show(); }}
  onclickcapture={(e) => { if (suppressClick) { e.preventDefault(); e.stopPropagation(); } }}>
  {@render children()}
</div>

{#if open}
  <div class="scrim" onclick={close} oncontextmenu={(e) => { e.preventDefault(); close(); }} role="presentation"></div>
  <div class="menu glass glass-strong" role="menu" style:left={`${pos.x}px`} style:top={pos.below ? `${pos.y}px` : undefined} style:bottom={pos.below ? undefined : `${window.innerHeight - pos.y}px`} class:up={!pos.below}>
    {#each actions as a}
      <button role="menuitem" class:danger={a.danger} onclick={() => pick(a)}><span>{a.label}</span><Icon name={a.icon} size={19} /></button>
    {/each}
  </div>
{/if}
<svelte:window onkeydown={(e) => open && e.key === 'Escape' && close()} onscroll={() => open && close()} />

<style>
  .cm-host { transition: transform 0.5s var(--spring), filter 0.3s; -webkit-touch-callout: none; user-select: none; -webkit-user-select: none; }
  .cm-host.lifted { transform: scale(0.97); }
  .cm-host.open { position: relative; z-index: 81; transform: scale(1.03); filter: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.18)); }
  .scrim { position: fixed; inset: 0; z-index: 80; background: rgba(240, 240, 245, 0.35); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); animation: fade 0.25s; }
  .menu { position: fixed; z-index: 82; width: 220px; border-radius: 22px; padding: 6px; display: flex; flex-direction: column; transform-origin: top left; animation: pop 0.45s var(--spring); }
  .menu.up { transform-origin: bottom left; }
  .menu button { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 44px; padding: 0 14px; border: 0; border-radius: 15px; background: transparent; color: var(--label); font-size: 16px; text-align: left; cursor: pointer; }
  .menu button:hover, .menu button:active { background: var(--glass-lens); }
  .menu button.danger { color: var(--red); }
  @keyframes pop { from { transform: scale(0.6); opacity: 0; } }
  @keyframes fade { from { opacity: 0; } }
</style>
