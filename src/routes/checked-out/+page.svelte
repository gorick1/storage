<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  let { data } = $props();
  const since = (t: number) => {
    const d = Math.floor((Date.now() - t) / 864e5);
    return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days`;
  };
</script>

<svelte:head><title>Checked out · Storage</title></svelte:head>
<div class="page">
  <PageHeader title="Checked Out" back={{ href: '/', label: 'Storage' }} />
  {#if data.items.length}
    <div class="group">
      {#each data.items as i (i.id)}
        <a class="row" href={`/items/${i.number}`} style="--inset:72px">
          {#if i.cover}<img class="thumb" src={`/photos/${i.cover}_t.jpg`} alt="" />{:else}<span class="thumb ph"><Icon name="photo" size={20} /></span>{/if}
          <span class="grow">
            <span class="title" style="display:block">{i.name}</span>
            <span class="sub">{i.checked_out_name} · {since(i.checked_out_at!)}{i.checked_out_note ? ` · ${i.checked_out_note}` : ''}</span>
          </span>
          <span class="detail footnote">{i.box_name ?? i.location_name ?? ''}</span>
        </a>
      {/each}
    </div>
    <p class="group-foot">The right column is where each one goes back.</p>
  {:else}
    <div class="empty"><Icon name="check" size={40} /><h3>Everything’s home</h3><p>Nothing is checked out right now.</p></div>
  {/if}
</div>
