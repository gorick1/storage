<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import Icon from './Icon.svelte';
  import SwipeRow from './SwipeRow.svelte';
  import ContextMenu, { type MenuAction } from './ContextMenu.svelte';
  import { moveItems, deleteItems, printItems, lookupPrices, checkOutItem } from '$lib/client/actions.svelte';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';

  type Row = {
    id: number; number: number; name: string; cover?: string | null; box_name?: string | null; location_name?: string | null; location_color?: string | null;
    quantity: number; track_quantity: number; checked_out_at?: number | null; checked_out_name?: string | null; description?: string; brand?: string; missing_at?: number | null;
  };
  let { item, showPlace = true, selecting = false, selected = false, onToggle }: { item: Row; showPlace?: boolean; selecting?: boolean; selected?: boolean; onToggle?: (id: number) => void } = $props();
  const place = $derived(item.box_name ? item.box_name : item.location_name ? `${item.location_name} (loose)` : 'Not put away');

  async function returnItem() {
    await api(`/api/items/${item.id}`, { action: 'checkin' });
    await invalidateAll();
    toast(`${item.name} returned`, { icon: 'in' });
  }

  const menu: MenuAction[] = $derived([
    { label: 'Move', icon: 'move', run: () => moveItems([item.id], item.name) },
    item.checked_out_at ? { label: 'Return', icon: 'in', run: returnItem } : { label: 'Check out', icon: 'out', run: () => checkOutItem(item.id, item.name) },
    { label: 'Print label', icon: 'printer', run: () => printItems([item.id]) },
    { label: 'Look up price', icon: 'search', run: () => lookupPrices([item.id]) },
    { label: 'Duplicate', icon: 'copy', run: () => goto(`/add?from=${item.number}`) },
    { label: 'Delete', icon: 'trash', danger: true, run: () => deleteItems([item.id], item.name) }
  ]);
</script>

{#snippet body()}
  {#if selecting}
    <button class="row selrow" type="button" style="--inset: 108px" onclick={() => onToggle?.(item.id)} aria-pressed={selected}>
      <span class="check" class:on={selected}>{#if selected}<Icon name="check" size={15} stroke={3} />{/if}</span>
      {@render inner()}
    </button>
  {:else}
    <a class="row" href={`/items/${item.number}`} style="--inset: 72px">
      {@render inner()}
      <span class="chev"><Icon name="chevron-right" size={16} stroke={2.4} /></span>
    </a>
  {/if}
{/snippet}

{#snippet inner()}
  {#if item.cover}
    <img class="thumb" src={`/photos/${item.cover}_t.jpg`} alt="" loading="lazy" />
  {:else}
    <span class="thumb ph"><Icon name="photo" size={20} /></span>
  {/if}
  <span class="grow">
    <span class="title" style="display:block">{item.name}{#if item.track_quantity}{' '}<span class="qty num">×{item.quantity}</span>{/if}</span>
    <span class="sub" style="display:flex;align-items:center;gap:6px">
      {#if item.missing_at}
        <span class="flag missing"><Icon name="warning" size={13} stroke={2.2} /> Missing</span>
      {:else if item.checked_out_at}
        <span class="flag out"><Icon name="out" size={13} stroke={2.2} /> Checked out by {item.checked_out_name ?? 'someone'}</span>
      {:else if showPlace}
        <span class="dot" data-color={item.location_color ?? 'none'}></span>{place}
      {:else}
        {item.brand || item.description || ' '}
      {/if}
    </span>
  </span>
{/snippet}

{#if selecting}
  {@render body()}
{:else}
  <ContextMenu actions={menu}>
    <SwipeRow
      leading={item.checked_out_at ? { label: 'Return', icon: 'in', color: 'var(--green)', run: returnItem } : { label: 'Check out', icon: 'out', color: 'oklch(from var(--c-orange) min(l, 0.62) c h)', run: () => checkOutItem(item.id, item.name) }}
      trailing={[
        { label: 'Move', icon: 'move', color: 'var(--tint)', run: () => moveItems([item.id], item.name) },
        { label: 'Delete', icon: 'trash', color: 'var(--red)', run: () => deleteItems([item.id], item.name) }
      ]}>
      {@render body()}
    </SwipeRow>
  </ContextMenu>
{/if}

<style>
  .qty { color: var(--label-2); font-weight: 400; }
  .flag { display: inline-flex; align-items: center; gap: 4px; font-weight: 500; }
  .flag.out { color: color-mix(in srgb, var(--c-orange) 50%, var(--label)); }
  .flag.missing { color: var(--red); }
  .row .sub { min-height: 1.2em; }
  .selrow { cursor: pointer; }
  .check { width: 24px; height: 24px; border-radius: 12px; border: 2px solid var(--label-3); display: grid; place-items: center; flex: none; color: #fff; transition: transform 0.4s var(--spring), background 0.2s; }
  .check.on { background: var(--tint); border-color: var(--tint); transform: scale(1.06); }
</style>
