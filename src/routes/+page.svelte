<script lang="ts">
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import LocationTile from '$lib/components/LocationTile.svelte';
  import BoxTile from '$lib/components/BoxTile.svelte';
  import ItemRow from '$lib/components/ItemRow.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let { data } = $props();
  let q = $state('');
</script>

<svelte:head><title>Storage</title></svelte:head>

<div class="page">
  <PageHeader title="Storage">
    {#snippet actions()}
      <a class="icon-btn tinted add-fab" href="/add" aria-label="Add item"><Icon name="plus" size={20} stroke={2.6} /></a>
    {/snippet}
    {#snippet sub()}
      <form class="search-field home-search" onsubmit={(e) => { e.preventDefault(); goto(`/search?q=${encodeURIComponent(q)}`); }}>
        <Icon name="search" size={17} stroke={2.2} />
        <input type="search" placeholder="Search items, boxes, places" bind:value={q} enterkeyhint="search" aria-label="Search" />
      </form>
    {/snippet}
  </PageHeader>

  {#if data.checkedOut || data.unplaced || data.homeless}
    <div class="chips">
      {#if data.checkedOut}<a class="chip" href="/checked-out" data-color="orange"><Icon name="out" size={16} stroke={2.2} /> <span class="num">{data.checkedOut}</span> checked out</a>{/if}
      {#if data.unplaced}<a class="chip" href="/search?filter=unplaced" data-color="red"><Icon name="tray" size={16} stroke={2.2} /> <span class="num">{data.unplaced}</span> not put away</a>{/if}
      {#if data.homeless}<a class="chip" href="/search?filter=homeless" data-color="indigo"><Icon name="box" size={16} stroke={2.2} /> <span class="num">{data.homeless}</span> boxes without a place</a>{/if}
    </div>
  {/if}

  <div class="section-head">
    <h2>Places</h2>
    <a href="/locations/new">Add</a>
  </div>
  {#if data.locations.length}
    <div class="tiles">
      {#each data.locations as loc (loc.id)}
        <LocationTile {loc} />
      {/each}
    </div>
  {:else}
    <div class="first-run">
      <span class="fr-icon"><Icon name="garage" size={34} stroke={1.8} /></span>
      <h3 class="title-3">Start with a place</h3>
      <p class="muted">Garage, attic, hall closet: wherever boxes live. Each place gets its own color, so you can tell them apart at a glance.</p>
      <a class="btn" href="/locations/new">Add your first place</a>
    </div>
  {/if}

  {#if data.recentBoxes.length}
    <div class="section-head">
      <h2>Recent Boxes</h2>
      <a href="/search?filter=boxes">See all</a>
    </div>
    <div class="rail">
      {#each data.recentBoxes as box (box.id)}
        <BoxTile {box} compact />
      {/each}
    </div>
  {/if}

  {#if data.recentItems.length}
    <div class="section-head"><h2>Recently Added</h2></div>
    <div class="group">
      {#each data.recentItems as item (item.id)}
        <ItemRow {item} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .home-search { margin-top: 10px; }
  @media (min-width: 900px) { .add-fab { display: none; } }
  .chips { display: flex; gap: 8px; overflow-x: auto; margin: 14px -16px 0; padding: 0 16px 2px; scrollbar-width: none; }
  .chip { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 13px; border-radius: 17px; white-space: nowrap; font-size: 15px; font-weight: 500;
    background: color-mix(in srgb, var(--loc) 15%, var(--bg-2)); color: color-mix(in srgb, var(--loc) 50%, var(--label)); }
  .tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  @media (min-width: 640px) { .tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 1100px) { .tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .tile-add { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; aspect-ratio: 1.12; min-height: 132px; border-radius: var(--r-tile);
    border: 1.5px dashed var(--fill-2); color: var(--label-2); font-size: 15px; font-weight: 500; }
  .tile-add:active { background: var(--fill); }
  @media (min-width: 640px) { .tile-add { aspect-ratio: 1.5; } }
  .rail { display: flex; gap: 12px; overflow-x: auto; margin: 0 -16px; padding: 2px 16px 10px; scroll-padding-inline: 16px; scroll-snap-type: x mandatory; scrollbar-width: none; }
  @media (min-width: 900px) { .rail { margin: 0; padding: 2px 0 10px; scroll-padding-inline: 0; } }
  .rail > :global(*) { scroll-snap-align: start; }
  .first-run { background: var(--bg-2); border-radius: var(--r-tile); padding: 28px 22px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .first-run p { max-width: 36ch; margin: 0 0 10px; }
  .fr-icon { width: 64px; height: 64px; border-radius: 18px; background: oklch(from var(--c-teal) min(l, 0.54) c h); color: #fff; display: grid; place-items: center; margin-bottom: 4px; }
</style>
