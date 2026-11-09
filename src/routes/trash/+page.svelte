<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';
  let { data } = $props();
  let confirming = $state(false);
  const daysLeft = (t: number) => Math.max(0, 30 - Math.floor((Date.now() - t) / 864e5));

  async function restore(id: number, name: string) {
    await api('/api/items/bulk', { action: 'restore', ids: [id] });
    await invalidateAll();
    toast(`${name} restored`, { icon: 'check' });
  }
</script>

<svelte:head><title>Recently Deleted · Storage</title></svelte:head>
<div class="page narrow">
  <PageHeader title="Recently Deleted" back={{ href: '/settings', label: 'Settings' }} />
  <p class="muted lead">Items stay here for 30 days, then they and their photos are removed for good.</p>
  {#if data.items.length}
    <div class="group">
      {#each data.items as i (i.id)}
        <div class="row" style="--inset:72px">
          {#if i.cover}<img class="thumb" src={`/photos/${i.cover}_t.jpg`} alt="" />{:else}<span class="thumb ph"><Icon name="photo" size={18} /></span>{/if}
          <span class="grow"><span class="title" style="display:block">{i.name}</span><span class="sub">{daysLeft(i.deleted_at)} days left{i.box_name ? ` · was in ${i.box_name}` : ''}</span></span>
          <button class="btn small gray" onclick={() => restore(i.id, i.name)}>Restore</button>
        </div>
      {/each}
    </div>
    <div class="group" style="margin-top:24px">
      {#if confirming}
        <form method="POST" action="?/empty" use:enhance={() => async ({ update }) => { await update(); confirming = false; toast('Recently Deleted emptied', { icon: 'trash' }); }}>
          <input type="hidden" name="ids" value="" />
          <button class="row danger">Delete {data.items.length} items and their photos forever</button>
        </form>
      {:else}
        <button class="row danger" onclick={() => (confirming = true)}>Empty Recently Deleted</button>
      {/if}
    </div>
  {:else}
    <div class="empty"><Icon name="trash" size={40} stroke={1.5} /><h3>Nothing here</h3><p>Deleted items wait here for 30 days in case you change your mind.</p></div>
  {/if}
</div>

<style>
  .narrow { max-width: 680px; }
  .lead { margin: 0 4px 16px; }
  .empty :global(svg) { color: var(--label-3); }
</style>
