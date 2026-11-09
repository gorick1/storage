// Shared item actions so tiles, rows, swipe actions, context menus and bulk select all behave the same.
import { invalidateAll } from '$app/navigation';
import { api } from './api';
import { toast } from './toast.svelte';

export const moveSheet = $state<{ open: boolean; ids: number[]; label: string; done?: () => void }>({ open: false, ids: [], label: '' });

export function moveItems(ids: number[], label: string, done?: () => void) {
  moveSheet.ids = ids;
  moveSheet.label = label;
  moveSheet.done = done;
  moveSheet.open = true;
}

export async function completeMove(dest: { box?: { id: number; name: string }; location?: { id: number; name: string } }) {
  const ids = moveSheet.ids;
  moveSheet.open = false;
  const r = await api<{ count: number; from: unknown[] }>('/api/items/bulk', { action: 'move', ids, box_id: dest.box?.id ?? null, location_id: dest.location?.id ?? null });
  await invalidateAll();
  moveSheet.done?.();
  const where = dest.box?.name ?? `${dest.location?.name} (loose)`;
  toast(`${r.count === 1 ? moveSheet.label : `${r.count} items`} moved to ${where}`, {
    icon: 'move',
    action: { label: 'Undo', run: async () => { await api('/api/items/bulk', { action: 'undo-move', ids, from: r.from }); await invalidateAll(); } }
  });
}

export async function deleteItems(ids: number[], label: string, done?: () => void) {
  await api('/api/items/bulk', { action: 'delete', ids });
  await invalidateAll();
  done?.();
  toast(`${ids.length === 1 ? label : `${ids.length} items`} moved to Recently Deleted`, {
    icon: 'trash',
    action: { label: 'Undo', run: async () => { await api('/api/items/bulk', { action: 'restore', ids }); await invalidateAll(); } }
  });
}

export async function printItems(ids: number[]) {
  const r = await api<{ count: number }>('/api/items/bulk', { action: 'print', ids });
  toast(r.count ? `${r.count} ${r.count === 1 ? 'label' : 'labels'} queued` : 'Nothing printed. Check Labels for an item template.', { icon: 'printer', tone: r.count ? 'normal' : 'error' });
}

export async function lookupPrices(ids: number[]) {
  const r = await api<{ count: number }>('/api/items/bulk', { action: 'price', ids });
  toast(r.count ? `Looking up ${r.count} ${r.count === 1 ? 'price' : 'prices'}` : 'No lookups started. Is the API key set in Settings?', { icon: 'search', tone: r.count ? 'normal' : 'error' });
  await invalidateAll();
}

export async function checkOutItem(id: number, name: string) {
  await api(`/api/items/${id}`, { action: 'checkout', note: '' });
  await invalidateAll();
  toast(`${name} checked out to you`, { icon: 'out', action: { label: 'Undo', run: async () => { await api(`/api/items/${id}`, { action: 'checkin' }); await invalidateAll(); } } });
}

/* Recently viewed, kept on this device. */
export type Recent = { kind: 'item' | 'box' | 'location'; number: number; name: string; at: number };
export function rememberView(r: Omit<Recent, 'at'>) {
  try {
    const list: Recent[] = JSON.parse(localStorage.getItem('recent') ?? '[]');
    const next = [{ ...r, at: Date.now() }, ...list.filter((x) => !(x.kind === r.kind && x.number === r.number))].slice(0, 12);
    localStorage.setItem('recent', JSON.stringify(next));
  } catch {}
}
export function recentViews(): Recent[] {
  try { return JSON.parse(localStorage.getItem('recent') ?? '[]'); } catch { return []; }
}
