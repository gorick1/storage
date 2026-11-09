<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/client/api';
  import Icon from './Icon.svelte';
  import { displayCode } from '$lib/codes';

  type B = { id: number; number: number; name: string; location_id: number | null; location_name: string | null; location_color: string | null; item_count: number };
  type L = { id: number; number: number; name: string; color: string };
  let { onPick, allowLoose = true, current }: { onPick: (p: { box?: B; location?: L }) => void; allowLoose?: boolean; current?: number | null } = $props();

  let recent = $state<B[]>([]);
  let boxes = $state<B[]>([]);
  let locations = $state<L[]>([]);
  let q = $state('');
  let creating = $state(false);
  let newName = $state('');
  let newLoc = $state<number | ''>('');

  onMount(async () => {
    const d = await api<{ recent: B[]; boxes: B[]; locations: L[] }>('/api/boxes');
    recent = d.recent;
    boxes = d.boxes;
    locations = d.locations;
  });

  const filtered = $derived(q.trim() ? boxes.filter((b) => (b.name + ' ' + displayCode('box', b.number) + ' ' + (b.location_name ?? '')).toLowerCase().includes(q.trim().toLowerCase())) : []);

  async function create() {
    const r = await api<{ box: B }>('/api/boxes', { name: newName, location_id: newLoc || null });
    onPick({ box: r.box });
  }
</script>

<div class="search-field"><Icon name="search" size={17} stroke={2.2} /><input placeholder="Find a box by name or number" bind:value={q} /></div>

{#if q.trim()}
  <div class="group list">
    {#each filtered as b (b.id)}
      <button class="row" type="button" onclick={() => onPick({ box: b })} disabled={b.id === current}>
        <span class="dot" data-color={b.location_color ?? 'none'}></span>
        <span class="grow"><span class="title" style="display:block">{b.name}</span><span class="sub">{b.location_name ?? 'No place'} · {displayCode('box', b.number)}</span></span>
        {#if b.id === current}<span class="detail footnote">Current</span>{/if}
      </button>
    {:else}
      <p class="row muted">No box matches “{q}”.</p>
    {/each}
  </div>
{:else}
  {#if recent.length}
    <h3 class="group-label">Recent boxes</h3>
    <div class="group">
      {#each recent as b (b.id)}
        <button class="row" type="button" onclick={() => onPick({ box: b })} disabled={b.id === current}>
          <span class="dot" data-color={b.location_color ?? 'none'}></span>
          <span class="grow"><span class="title" style="display:block">{b.name}</span><span class="sub">{b.location_name ?? 'No place'} · {b.item_count} items</span></span>
          {#if b.id === current}<span class="detail footnote">Current</span>{/if}
        </button>
      {/each}
    </div>
  {/if}
  {#if allowLoose && locations.length}
    <h3 class="group-label">Loose in a place</h3>
    <div class="group">
      {#each locations as l (l.id)}
        <button class="row" type="button" onclick={() => onPick({ location: l })}>
          <span class="dot" data-color={l.color}></span><span class="grow">{l.name}</span>
        </button>
      {/each}
    </div>
  {/if}
{/if}

<h3 class="group-label">New box</h3>
{#if creating}
  <div class="group">
    <label class="row"><input class="left" placeholder="Box name (optional)" bind:value={newName} /></label>
    <label class="row"><span class="lbl">Place</span>
      <select bind:value={newLoc}>
        <option value="">None yet</option>
        {#each locations as l}<option value={l.id}>{l.name}</option>{/each}
      </select>
    </label>
  </div>
  <button class="btn block" style="margin-top:12px" type="button" onclick={create}>Create box and print its label</button>
{:else}
  <div class="group"><button class="row action" type="button" onclick={() => (creating = true)}><Icon name="plus" size={20} stroke={2.2} /> New box</button></div>
{/if}

<style>
  .list { margin-top: 12px; }
  .row:disabled { opacity: 0.5; }
</style>
