<script lang="ts">
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import ItemRow from '$lib/components/ItemRow.svelte';
  import BoxTile from '$lib/components/BoxTile.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import SelectBar from '$lib/components/SelectBar.svelte';

  let { data } = $props();
  let q = $state(data.q);
  let selecting = $state(false);
  let picked = $state<number[]>([]);
  const toggle = (id: number) => (picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const endSelect = () => { selecting = false; picked = []; };
  let t: ReturnType<typeof setTimeout>;
  $effect(() => { q = data.q; });

  function onInput() {
    clearTimeout(t);
    t = setTimeout(() => goto(`/search?q=${encodeURIComponent(q)}`, { replaceState: true, keepFocus: true, noScroll: true }), 220);
  }
  const total = $derived(data.items.length + data.boxes.length + data.locations.length);
</script>

<svelte:head><title>{data.title} · Storage</title></svelte:head>

<div class="page">
  <PageHeader title={data.title} back={data.filter ? { href: '/', label: 'Storage' } : undefined}>
    {#snippet sub()}
      {#if !data.filter}
        <div class="search-field top">
          <Icon name="search" size={17} stroke={2.2} />
          <input type="search" placeholder="Drill, tent, Christmas lights…" bind:value={q} oninput={onInput} enterkeyhint="search" aria-label="Search" autofocus />
        </div>
      {/if}
    {/snippet}
  </PageHeader>

  {#if !data.filter && !data.q}
    <div class="empty">
      <Icon name="search" size={40} stroke={1.5} />
      <h3>Find anything</h3>
      <p>Search names, descriptions, tags and the extra words the AI adds. Typos are fine.</p>
    </div>
  {:else if total === 0}
    <div class="empty">
      <h3>Nothing matches “{data.q}”</h3>
      <p>Try a shorter word, or scan the label if you have it.</p>
    </div>
  {/if}

  {#if data.locations.length}
    <h3 class="group-label">Places</h3>
    <div class="group">
      {#each data.locations as l}<a class="row" href={`/locations/${l.number}`}><span class="dot" data-color={l.color}></span><span class="grow">{l.name}</span><span class="chev"><Icon name="chevron-right" size={16} stroke={2.4} /></span></a>{/each}
    </div>
  {/if}

  {#if data.boxes.length}
    <h3 class="group-label">Boxes</h3>
    <div class="grid">{#each data.boxes as box (box.id)}<BoxTile {box} />{/each}</div>
  {/if}

  {#if data.items.length}
    <div class="items-head">
      <h3 class="group-label">Items</h3>
      <button class="btn plain" onclick={() => (selecting ? endSelect() : (selecting = true))}>{selecting ? 'Done' : 'Select'}</button>
    </div>
    <div class="group">{#each data.items as item (item.id)}<ItemRow {item} {selecting} selected={picked.includes(item.id)} onToggle={toggle} />{/each}</div>
  {/if}
</div>
{#if selecting}<SelectBar ids={picked} onDone={endSelect} />{/if}

<style>
  .top { margin-top: 10px; }
  .items-head { display: flex; align-items: flex-end; justify-content: space-between; }
  .items-head .btn { height: 34px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 1100px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .empty :global(svg) { color: var(--label-3); }
  .empty p { max-width: 36ch; margin: 0 auto; }
</style>
