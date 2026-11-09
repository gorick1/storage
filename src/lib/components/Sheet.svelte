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
  dialog { border: 0; padding: 0; margin: auto auto 0; width: 100%; max-width: 640px; max-height: 92dvh; background: transparent; color: var(--label); }
  dialog::backdrop { background: rgba(0, 0, 0, 0.35); animation: fade 0.3s; }
  dialog[open] .sheet { animation: up 0.45s var(--ease); }
  .sheet { background: var(--bg); border-radius: 14px 14px 0 0; max-height: 92dvh; display: flex; flex-direction: column; padding-bottom: var(--safe-b); }
  .grab { width: 36px; height: 5px; border-radius: 3px; background: var(--fill-2); margin: 6px auto 0; }
  header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 2px 8px; }
  header h2 { font-size: 17px; font-weight: 600; margin: 0; }
  .done { display: flex; justify-content: flex-end; }
  .body { overflow-y: auto; padding: 4px 16px 24px; }
  @media (min-width: 700px) {
    dialog { margin: auto; }
    .sheet { border-radius: 14px; }
    .grab { display: none; }
  }
  @keyframes up { from { transform: translateY(40%); opacity: 0; } }
  @keyframes fade { from { opacity: 0; } }
</style>
