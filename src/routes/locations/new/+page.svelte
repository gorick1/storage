<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import LocationForm from '$lib/components/LocationForm.svelte';
  let { form } = $props();
</script>

<svelte:head><title>New place · Storage</title></svelte:head>
<div class="page narrow">
  <PageHeader title="New Place" large={false} back={{ href: '/', label: 'Storage' }} />
  <form method="POST">
    <LocationForm />
    {#if form?.error}<p class="error-text">{form.error}</p>{/if}
    <button class="btn block save">Add place</button>
  </form>
</div>

<style>
  .narrow { max-width: 560px; }
  .save { margin-top: 24px; }
</style>
