<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from './Icon.svelte';
  import ContextMenu from './ContextMenu.svelte';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';
  let { loc }: { loc: { id: number; number: number; name: string; color: string; icon: string; box_count?: number; item_count?: number } } = $props();
  const actions = $derived([
    { label: 'Add item here', icon: 'camera', run: () => goto(`/add?location=${loc.number}`) },
    { label: 'Open', icon: 'chevron-right', run: () => goto(`/locations/${loc.number}`) },
    { label: 'Print label', icon: 'printer', run: async () => { const r = await api<{ held?: boolean }>('/api/print', { kind: 'location', id: loc.id }).catch((e) => (toast(e.message, { tone: 'error', icon: 'warning' }), null)); if (r) toast(r.held ? 'Label held for the right roll' : 'Place label queued', { icon: 'printer' }); } },
    { label: 'Insurance report', icon: 'copy', run: () => goto(`/report?location=${loc.number}`) }
  ]);
</script>

<ContextMenu {actions}>
<a class="tile" href={`/locations/${loc.number}`} data-color={loc.color} style:view-transition-name={`loc-${loc.number}`}>
  <span class="glyph"><Icon name={loc.icon} size={24} stroke={2} /></span>
  <span class="name">{loc.name}</span>
  <span class="meta num">{loc.box_count ?? 0} {loc.box_count === 1 ? 'box' : 'boxes'} · {loc.item_count ?? 0} {loc.item_count === 1 ? 'item' : 'items'}</span>
</a>
</ContextMenu>

<style>
  .tile {
    position: relative; display: flex; flex-direction: column; justify-content: flex-end; gap: 2px;
    aspect-ratio: 1.12; min-height: 132px; padding: 14px 15px; border-radius: var(--r-tile); color: #fff; overflow: hidden;
    /* Deepened fill keeps white labels at 4.5:1 or better while the hue stays recognizable. */
    background: var(--loc-solid);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), var(--shadow);
    transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease);
  }
  .tile::after { content: ''; position: absolute; inset: 0; background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.12)); pointer-events: none; }
  .tile { transition: transform 0.5s var(--spring), box-shadow 0.3s; }
  .tile:active { transform: scale(0.96); transition-duration: 0.1s; }
  @media (min-width: 640px) { .tile { aspect-ratio: 1.5; } }
  @media (hover: hover) { .tile:hover { transform: translateY(-2px); box-shadow: inset 0 1px 0 rgba(255,255,255,.22), var(--shadow-lift); } }
  .glyph { position: absolute; top: 13px; left: 13px; width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: rgba(255, 255, 255, 0.22); }
  .name { font: 600 19px/1.15 var(--font-display); letter-spacing: 0.01em; position: relative; z-index: 1; overflow-wrap: anywhere; }
  .meta { font-size: 13px; font-weight: 500; position: relative; z-index: 1; }
  [data-color='yellow'].tile { color: #2e2300; background: var(--loc); }
  [data-color='yellow'] .glyph { background: rgba(0, 0, 0, 0.1); }
</style>
