<script lang="ts">
  import { toasts, dismiss, update } from '$lib/client/toast.svelte';
  import Icon from './Icon.svelte';
  import { onDestroy } from 'svelte';

  // Follow print jobs live: "Printing in 3s… Cancel" → "Printed" / the printer's problem.
  const watching = new Set<number>();
  const timer = setInterval(async () => {
    for (const t of toasts.list) {
      if (!t.printJob || watching.has(t.id)) continue;
      watching.add(t.id);
      try {
        const r = await fetch(`/api/print/${t.printJob}`);
        if (r.ok) {
          const j = (await r.json()) as { status: string; error: string | null };
          if (j.status === 'sent') update(t.id, { text: 'Label printed', icon: 'check', action: undefined, printJob: undefined });
          else if (j.status === 'held') update(t.id, { text: 'Label held: load the right roll', icon: 'warning', tone: 'error', printJob: undefined, action: undefined });
          else if (j.status === 'failed' || (j.status === 'pending' && j.error)) update(t.id, { text: j.error ?? 'Print failed', icon: 'warning', tone: 'error', action: undefined, printJob: j.status === 'failed' ? undefined : t.printJob });
          else if (j.status === 'cancelled') update(t.id, { text: 'Print cancelled', icon: 'x', action: undefined, printJob: undefined });
        }
      } finally {
        watching.delete(t.id);
      }
    }
  }, 900);
  onDestroy(() => clearInterval(timer));
</script>

<div class="toasts" aria-live="polite">
  {#each toasts.list as t (t.id)}
    <div class="toast" class:error={t.tone === 'error'}>
      {#if t.icon}<span class="ic"><Icon name={t.icon} size={18} stroke={2.2} /></span>{/if}
      <span class="txt">{t.text}</span>
      {#if t.action}
        <button class="act" onclick={async () => { const a = t.action!; dismiss(t.id); await a.run(); }}>{t.action.label}</button>
      {:else}
        <button class="close" aria-label="Dismiss" onclick={() => dismiss(t.id)}><Icon name="x" size={14} stroke={2.4} /></button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .toasts { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(var(--tabbar-h) + 4px); z-index: 100; display: flex; flex-direction: column; gap: 8px; width: min(440px, calc(100vw - 24px)); pointer-events: none; }
  .toast {
    pointer-events: auto; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 7px 7px 7px 16px; border-radius: 26px;
    background: var(--glass-bg-strong); backdrop-filter: saturate(190%) blur(24px); -webkit-backdrop-filter: saturate(190%) blur(24px);
    box-shadow: inset 0 1px 0 var(--glass-rim), inset 0 0 0 0.5px var(--glass-edge), var(--glass-shadow); font-size: 15px; font-weight: 500; animation: rise 0.55s var(--spring);
  }
  .toast.error .ic { color: var(--red); }
  .ic { color: var(--green); display: grid; }
  .txt { flex: 1; }
  .act { border: 0; background: var(--tint); color: #fff; font-weight: 600; height: 38px; padding: 0 16px; border-radius: 19px; cursor: pointer; }
  .close { border: 0; background: transparent; color: var(--label-3); width: 34px; height: 34px; cursor: pointer; display: grid; place-items: center; }
  @keyframes rise { from { opacity: 0; transform: translateY(14px) scale(0.98); filter: blur(4px); } }
</style>
