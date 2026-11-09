<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import Icon from './Icon.svelte';
  import ContextMenu from './ContextMenu.svelte';
  import { displayCode } from '$lib/codes';
  import { api } from '$lib/client/api';
  import { toast } from '$lib/client/toast.svelte';
  let { box, compact = false }: { box: { id: number; number: number; name: string; location_name?: string | null; location_color?: string | null; item_count?: number; cover?: string | null; pinned?: number }; compact?: boolean } = $props();

  async function pin() {
    await api(`/api/boxes/${box.id}`, { pinned: !box.pinned });
    await invalidateAll();
    toast(box.pinned ? `Unpinned ${box.name}` : `Pinned ${box.name} to Home`, { icon: 'check' });
  }
  const actions = $derived([
    { label: 'Add item', icon: 'camera', run: () => goto(`/add?box=${box.number}`) },
    { label: 'Pack by scanning', icon: 'scan', run: () => goto(`/scan?into=${box.number}`) },
    { label: 'Verify contents', icon: 'check', run: () => goto(`/boxes/${box.number}/verify`) },
    { label: box.pinned ? 'Unpin from Home' : 'Pin to Home', icon: 'tag', run: pin },
    { label: 'Print label', icon: 'printer', run: async () => { const r = await api<{ held?: boolean }>('/api/print', { kind: 'box', id: box.id }).catch((e) => (toast(e.message, { tone: 'error', icon: 'warning' }), null)); if (r) toast(r.held ? 'Label held for the right roll' : 'Box label queued', { icon: 'printer' }); } }
  ]);
</script>

<ContextMenu {actions}>
<a class="box" class:compact href={`/boxes/${box.number}`} data-color={box.location_color ?? 'none'} style:view-transition-name={`box-${box.number}`}>
  <div class="cover">
    {#if box.cover}
      <img src={`/photos/${box.cover}_t.jpg`} alt="" loading="lazy" />
    {:else}
      <span class="ph"><Icon name="box" size={30} stroke={1.6} /></span>
    {/if}
    <span class="count num">{box.item_count ?? 0}</span>
    {#if box.pinned}<span class="pin" aria-label="Pinned"><Icon name="tag" size={13} stroke={2.4} /></span>{/if}
  </div>
  <div class="txt">
    <span class="name">{box.name}</span>
    <span class="meta"><span class="dot"></span>{box.location_name ?? 'No place yet'}{#if !compact}{' · '}<span class="code">{displayCode('box', box.number)}</span>{/if}</span>
  </div>
</a>
</ContextMenu>

<style>
  .box { display: flex; flex-direction: column; background: var(--bg-2); border-radius: 18px; overflow: hidden; color: var(--label); box-shadow: var(--shadow); transition: transform 0.25s var(--ease); min-width: 0; }
  .box { transition: transform 0.5s var(--spring); }
  .box:active { transform: scale(0.96); transition-duration: 0.1s; }
  .cover { position: relative; aspect-ratio: 4 / 3; background: color-mix(in srgb, var(--loc, var(--label-3)) 26%, var(--bg-2)); }
  .cover img { width: 100%; height: 100%; object-fit: cover; }
  .ph { position: absolute; inset: 0; display: grid; place-items: center; color: var(--loc-solid, var(--label-3)); }
  .count { position: absolute; right: 8px; bottom: 8px; min-width: 26px; height: 26px; padding: 0 8px; border-radius: 13px; background: rgba(0, 0, 0, 0.55); color: #fff; font-size: 13px; font-weight: 600; display: grid; place-items: center; backdrop-filter: blur(8px); }
  .pin { position: absolute; left: 8px; top: 8px; width: 26px; height: 26px; border-radius: 13px; display: grid; place-items: center; background: rgba(255,255,255,.8); color: var(--loc-solid, var(--tint)); backdrop-filter: blur(8px); }
  .txt { display: flex; flex-direction: column; gap: 2px; padding: 9px 12px 11px; min-width: 0; }
  .name { font-weight: 600; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .meta { display: flex; align-items: center; gap: 5px; font-size: 13px; color: var(--label-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .meta .code { font-size: 12px; }
  .dot { width: 8px; height: 8px; }
  .compact { width: 156px; flex: none; }
</style>
