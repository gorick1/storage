<script lang="ts">
  // A Dynamic Island–style pill that follows labels from queued to printed.
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  type Job = { id: number; status: string; error: string | null; name: string | null };
  let jobs = $state<Job[]>([]);
  let expanded = $state(false);

  onMount(() => {
    let alive = true;
    let delay = 2500;
    const tick = async () => {
      if (!alive) return;
      if (document.visibilityState === 'visible') {
        try {
          const r = await fetch('/api/print/active');
          if (r.ok) jobs = (await r.json()).jobs;
        } catch {}
      }
      delay = jobs.length ? 900 : 2500;
      setTimeout(tick, delay);
    };
    tick();
    return () => (alive = false);
  });

  const active = $derived(jobs.filter((j) => j.status === 'pending' || j.status === 'sending'));
  const held = $derived(jobs.filter((j) => j.status === 'held'));
  const done = $derived(jobs.filter((j) => j.status === 'sent'));
  const trouble = $derived(active.find((j) => j.error));
  const mode = $derived(trouble ? 'trouble' : active.length ? 'printing' : held.length ? 'held' : done.length ? 'done' : 'idle');
  const label = $derived(
    mode === 'trouble' ? trouble!.error :
    mode === 'printing' ? (active.length === 1 ? `Printing ${active[0].name ?? 'label'}` : `Printing ${active.length} labels`) :
    mode === 'held' ? `${held.length} waiting for the right roll` :
    mode === 'done' ? (done.length === 1 ? `Printed ${done[0].name ?? 'label'}` : `Printed ${done.length} labels`) : ''
  );
</script>

{#if mode !== 'idle'}
  <a class="pill glass glass-strong" class:expanded href="/labels" data-state={mode} onmouseenter={() => (expanded = true)} onmouseleave={() => (expanded = false)} aria-live="polite">
    <span class="ic">
      {#if mode === 'done'}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path class="draw" d="M5 12.5 10 17.5 19 7" /></svg>
      {:else}
        <Icon name={mode === 'printing' ? 'printer' : 'warning'} size={17} stroke={2.2} />
      {/if}
    </span>
    <span class="txt">{label}</span>
  </a>
{/if}

<style>
  .pill {
    position: fixed; top: calc(var(--safe-t) + 8px); left: 50%; transform: translateX(-50%); z-index: 90;
    display: flex; align-items: center; gap: 8px; height: 38px; max-width: min(92vw, 420px); padding: 0 16px 0 10px; border-radius: 19px;
    color: var(--label); font-size: 14px; font-weight: 600; animation: drop 0.6s var(--spring);
  }
  .ic { width: 26px; height: 26px; border-radius: 13px; display: grid; place-items: center; color: #fff; background: var(--tint); flex: none; }
  [data-state='printing'] .ic { animation: pulse 1.1s ease-in-out infinite; }
  [data-state='done'] .ic { background: var(--green); }
  [data-state='held'] .ic, [data-state='trouble'] .ic { background: oklch(from var(--c-orange) min(l, 0.6) c h); }
  .txt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .draw { stroke-dasharray: 24; stroke-dashoffset: 24; animation: draw 0.45s 0.1s var(--ease) forwards; }
  @keyframes drop { from { transform: translate(-50%, -24px) scale(0.6); opacity: 0; } }
  @keyframes pulse { 50% { transform: scale(0.86); opacity: 0.75; } }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @media (min-width: 900px) { .pill { left: calc(50% + 140px); } }
</style>
