<script lang="ts">
  import Icon from './Icon.svelte';
  let { item, showPlace = true }: { item: { number: number; name: string; cover?: string | null; box_name?: string | null; location_name?: string | null; location_color?: string | null; quantity: number; track_quantity: number; checked_out_at?: number | null; checked_out_name?: string | null; description?: string }; showPlace?: boolean } = $props();
  const place = $derived(item.box_name ? item.box_name : item.location_name ? `${item.location_name} (loose)` : 'Not put away');
</script>

<a class="row" href={`/items/${item.number}`} style="--inset: 72px">
  {#if item.cover}
    <img class="thumb" src={`/photos/${item.cover}_t.jpg`} alt="" loading="lazy" />
  {:else}
    <span class="thumb ph"><Icon name="photo" size={20} /></span>
  {/if}
  <span class="grow">
    <span class="title" style="display:block">{item.name}{#if item.track_quantity}{' '}<span class="qty num">×{item.quantity}</span>{/if}</span>
    <span class="sub" style="display:flex;align-items:center;gap:6px">
      {#if item.checked_out_at}
        <span class="out"><Icon name="out" size={13} stroke={2.2} /> Checked out by {item.checked_out_name ?? 'someone'}</span>
      {:else if showPlace}
        <span class="dot" data-color={item.location_color ?? 'none'}></span>{place}
      {:else}
        {item.description || ' '}
      {/if}
    </span>
  </span>
  <span class="chev"><Icon name="chevron-right" size={16} stroke={2.4} /></span>
</a>

<style>
  .qty { color: var(--label-2); font-weight: 400; }
  .out { display: inline-flex; align-items: center; gap: 4px; color: color-mix(in srgb, var(--c-orange) 50%, var(--label)); font-weight: 500; }
  .row .sub { min-height: 1.2em; }
</style>
