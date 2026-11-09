<script lang="ts">
  // Floating glass action bar for multi-select.
  import Icon from './Icon.svelte';
  import { moveItems, deleteItems, printItems, lookupPrices } from '$lib/client/actions.svelte';
  let { ids, onDone }: { ids: number[]; onDone: () => void } = $props();
  const n = $derived(ids.length);
</script>

<div class="selbar glass glass-strong" role="toolbar" aria-label="Selected items">
  <span class="count num">{n} selected</span>
  <button disabled={!n} onclick={() => moveItems(ids, 'item', onDone)}><Icon name="move" size={20} /><span>Move</span></button>
  <button disabled={!n} onclick={async () => { await printItems(ids); onDone(); }}><Icon name="printer" size={20} /><span>Print</span></button>
  <button disabled={!n} onclick={async () => { await lookupPrices(ids); onDone(); }}><Icon name="search" size={20} /><span>Price</span></button>
  <button class="danger" disabled={!n} onclick={() => deleteItems(ids, 'item', onDone)}><Icon name="trash" size={20} /><span>Delete</span></button>
</div>

<style>
  .selbar {
    position: fixed; z-index: 45; left: 50%; transform: translateX(-50%); bottom: calc(var(--tabbar-h) + 2px);
    display: flex; align-items: center; gap: 2px; padding: 6px; border-radius: 30px; width: min(520px, calc(100vw - 24px)); animation: up 0.5s var(--spring);
  }
  .count { flex: 1; padding: 0 12px; font-weight: 600; font-size: 15px; white-space: nowrap; }
  button { display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 60px; height: 52px; justify-content: center; border: 0; border-radius: 24px; background: transparent; color: var(--tint); font-size: 11px; font-weight: 600; cursor: pointer; transition: transform 0.4s var(--spring); }
  button:active { transform: scale(0.9); background: var(--glass-lens); }
  button:disabled { opacity: 0.35; }
  .danger { color: var(--red); }
  @keyframes up { from { transform: translate(-50%, 120%); } }
</style>
