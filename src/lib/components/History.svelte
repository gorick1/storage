<script lang="ts">
  let { events }: { events: { action: string; detail: string; at: number; user_name: string | null }[] } = $props();
  const VERB: Record<string, string> = { created: 'Added', edited: 'Edited', moved: 'Moved', checked_out: 'Checked out', returned: 'Returned', took: 'Took some', added: 'Added more', deleted: 'Deleted' };
  const fmt = (t: number) => new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

{#if events.length}
  <h3 class="group-label">History</h3>
  <div class="group">
    {#each events.slice(0, 12) as e}
      <div class="row">
        <span class="grow footnote">{VERB[e.action] ?? e.action}{#if e.action === 'took' || e.action === 'added'} ({JSON.parse(e.detail).delta > 0 ? '+' : ''}{JSON.parse(e.detail).delta}){/if}{#if e.user_name}{" · "}{e.user_name}{/if}</span>
        <span class="detail footnote num">{fmt(e.at)}</span>
      </div>
    {/each}
  </div>
{/if}
