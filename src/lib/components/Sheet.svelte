<script lang="ts">
  import type { Snippet } from 'svelte';
  let { open = $bindable(false), title, children, done, onclose }: { open?: boolean; title: string; children: Snippet; done?: Snippet; onclose?: () => void } = $props();
  let dialog: HTMLDialogElement;
  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog bind:this={dialog} onclose={() => { open = false; onclose?.(); }} onclick={(e) => { if (e.target === dialog) dialog.close(); }}>
  <div class="sheet">
    <div class="grab"></div>
    <header>
      <button class="btn plain" type="button" onclick={() => dialog.close()}>Cancel</button>
      <h2>{title}</h2>
      <span class="done">{@render done?.()}</span>
    </header>
    <div class="body">{@render children()}</div>
  </div>
</dialog>

<style>
  dialog { border: 0; padding: 0 8px calc(var(--safe-b) + 8px); margin: auto auto 0; width: 100%; max-width: 640px; max-height: 94dvh; background: transparent; color: var(--label); overflow: visible; }
  dialog::backdrop { background: rgba(20, 20, 30, 0.22); animation: fade 0.3s; }
  dialog[open] .sheet { animation: up 0.55s var(--spring); }
  /* Floating Liquid Glass sheet, inset from the screen edges. */
  .sheet {
    background: color-mix(in srgb, var(--bg) 82%, transparent); -webkit-backdrop-filter: blur(30px) saturate(190%); backdrop-filter: blur(30px) saturate(190%);
    box-shadow: inset 0 1px 0 var(--glass-rim), inset 0 0 0 0.5px var(--glass-edge), 0 24px 60px rgba(0, 0, 0, 0.22);
    border-radius: 34px; max-height: calc(94dvh - var(--safe-b)); display: flex; flex-direction: column; overflow: hidden;
  }
  .grab { width: 36px; height: 5px; border-radius: 3px; background: var(--fill-2); margin: 6px auto 0; }
  header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 4px 10px; }
  header :global(.btn.plain) { height: 38px; padding: 0 14px; border-radius: 19px; background: var(--glass-lens); }
  header h2 { font-size: 17px; font-weight: 600; margin: 0; }
  .done { display: flex; justify-content: flex-end; }
  .body { overflow-y: auto; padding: 4px 16px 24px; }
  @media (min-width: 700px) {
    dialog { margin: auto; padding: 0; }
    .grab { display: none; }
  }
  @keyframes up { from { transform: translateY(30%) scale(0.96); opacity: 0; } }
  @keyframes fade { from { opacity: 0; } }
</style>
