<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

<div class="wrap">
  <div class="card">
    <img src="/icon.svg" alt="" width="64" height="64" class="logo" />
    {@render children()}
  </div>
</div>

<style>
  .wrap { min-height: 100dvh; display: grid; place-items: center; padding: calc(24px + var(--safe-t)) 16px calc(24px + var(--safe-b)); }
  .card { width: min(420px, 100%); display: flex; flex-direction: column; gap: 16px; }
  .logo { border-radius: 16px; box-shadow: var(--shadow-lift); align-self: center; margin-bottom: 4px; }
</style>
