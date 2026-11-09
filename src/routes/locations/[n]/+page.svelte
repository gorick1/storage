<script lang="ts">
  import { enhance } from '$app/forms';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import BoxTile from '$lib/components/BoxTile.svelte';
  import ItemRow from '$lib/components/ItemRow.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import LocationForm from '$lib/components/LocationForm.svelte';
  import { toast } from '$lib/client/toast.svelte';
  import { displayCode } from '$lib/codes';

  let { data, form } = $props();
  let editing = $state(false);
  let adding = $state(false);
  let confirmDelete = $state(false);
  const itemCount = $derived(data.boxes.reduce((n, b) => n + (b.item_count ?? 0), 0) + data.loose.length);
</script>

<svelte:head><title>{data.loc.name} · Storage</title></svelte:head>

<div class="page" data-color={data.loc.color}>
  <PageHeader title={data.loc.name} back={{ href: '/', label: 'Storage' }} large={false} hero>
    {#snippet actions()}
      <button class="btn plain" onclick={() => (editing = true)}>Edit</button>
    {/snippet}
  </PageHeader>

  <section class="hero" style:view-transition-name={`loc-${data.loc.number}`}>
    <span class="glyph"><Icon name={data.loc.icon} size={30} stroke={2} /></span>
    <div>
      <h1 class="large-title">{data.loc.name}</h1>
      <p class="stats num">{data.boxes.length} {data.boxes.length === 1 ? 'box' : 'boxes'} · {itemCount} {itemCount === 1 ? 'item' : 'items'} · <span class="mono">{displayCode('location', data.loc.number)}</span></p>
    </div>
  </section>

  <div class="actions">
    <button class="act" onclick={() => (adding = true)}><Icon name="plus" size={22} stroke={2.2} /><span>Add box</span></button>
    <a class="act" href={`/add?location=${data.loc.number}`}><Icon name="camera" size={22} /><span>Add item</span></a>
    <form method="POST" action="?/print" use:enhance={() => async ({ result }) => {
      if (result.type === 'success') toast(result.data?.held ? 'Label held until the right roll is loaded' : 'Printing place label…', { icon: 'printer', printJob: result.data?.held ? undefined : Number(result.data?.jobId) });
      else if (result.type === 'failure') toast(String(result.data?.error), { tone: 'error', icon: 'warning' });
    }}>
      <button class="act"><Icon name="printer" size={22} /><span>Print label</span></button>
    </form>
  </div>

  {#if data.boxes.length}
    <div class="section-head"><h2>Boxes</h2></div>
    <div class="grid">
      {#each data.boxes as box (box.id)}<BoxTile {box} />{/each}
    </div>
  {:else}
    <div class="empty">
      <Icon name="box" size={40} stroke={1.5} />
      <h3>No boxes here yet</h3>
      <p>Add a box and its label prints right away. Stick it on, then fill it.</p>
      <button class="btn" onclick={() => (adding = true)}>Add a box</button>
    </div>
  {/if}

  {#if data.loose.length}
    <div class="section-head"><h2>Loose Items</h2></div>
    <div class="group">
      {#each data.loose as item (item.id)}<ItemRow {item} showPlace={false} />{/each}
    </div>
  {/if}

  {#if data.loc.notes}
    <h3 class="group-label">Notes</h3>
    <div class="group"><p class="row">{data.loc.notes}</p></div>
  {/if}
</div>

<Sheet bind:open={adding} title="New Box">
  <form method="POST" action="?/addBox">
    <div class="group"><label class="row"><input class="left" name="name" placeholder="Name, e.g. Camping gear" autofocus /></label></div>
    <p class="group-foot">Leave it blank to name it by number. The box label prints when you add it.</p>
    <button class="btn block" style="margin-top:18px">Add box to {data.loc.name}</button>
  </form>
</Sheet>

<Sheet bind:open={editing} title="Edit Place">
  <form method="POST" action="?/edit" use:enhance={() => async ({ update, result }) => { await update({ reset: false }); if (result.type === 'success') editing = false; }}>
    <LocationForm name={data.loc.name} color={data.loc.color} icon={data.loc.icon} notes={data.loc.notes} />
    {#if form?.error}<p class="error-text">{form.error}</p>{/if}
    <button class="btn block" style="margin-top:20px">Save</button>
  </form>
  <div class="group" style="margin-top:24px">
    {#if confirmDelete}
      <form method="POST" action="?/delete"><button class="row danger">Delete {data.loc.name}? Boxes stay, without a place.</button></form>
    {:else}
      <button class="row danger" onclick={() => (confirmDelete = true)}>Delete place</button>
    {/if}
  </div>
</Sheet>

<style>
  .hero { display: flex; gap: 14px; align-items: center; margin: 6px -4px 0; padding: 18px; border-radius: var(--r-tile); background: var(--loc-solid); color: #fff; box-shadow: var(--shadow); }
  [data-color='yellow'] .hero { color: #2e2300; background: var(--loc); }
  .hero .glyph { width: 58px; height: 58px; border-radius: 16px; background: rgba(255,255,255,.22); display: grid; place-items: center; flex: none; }
  .hero h1 { font-size: 30px; overflow-wrap: anywhere; }
  .stats { margin: 2px 0 0; font-size: 15px; }
  .mono { font-family: var(--mono); font-size: 13px; }
  .actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
  .actions form { display: contents; }
  .act { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 6px; border-radius: 14px; background: var(--bg-2); color: var(--loc); border: 0; font-size: 13px; font-weight: 500; cursor: pointer; }
  .act span { color: var(--label); }
  .act:active { transform: scale(0.97); }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 1100px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .empty { background: var(--bg-2); border-radius: var(--r-tile); margin-top: 20px; color: var(--label-2); }
  .empty :global(svg) { color: var(--loc); }
  .empty p { margin: 0 auto 16px; max-width: 34ch; }
</style>
