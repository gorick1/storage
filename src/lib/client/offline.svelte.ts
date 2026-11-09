// Saves that fail for lack of signal (garage Wi-Fi) wait on the device in IndexedDB and upload later.
import { invalidateAll } from '$app/navigation';
import { deserialize } from '$app/forms';
import { toast } from './toast.svelte';

type Entry = { id?: number; at: number; name: string; fields: [string, string | Blob][] };
export const queuedCount = $state({ n: 0 });

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('storage-offline', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('adds', { keyPath: 'id', autoIncrement: true });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function store<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction('adds', mode).objectStore('adds'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function refreshCount() {
  try { queuedCount.n = await store('readonly', (s) => s.count()); } catch { queuedCount.n = 0; }
}

export async function queueAdd(fd: FormData, name: string) {
  const fields: Entry['fields'] = [];
  fd.forEach((v, k) => fields.push([k, v]));
  await store('readwrite', (s) => s.add({ at: Date.now(), name, fields } satisfies Entry));
  await refreshCount();
}

let flushing = false;
export async function flushQueue() {
  if (flushing || typeof indexedDB === 'undefined') return;
  flushing = true;
  try {
    const all = await store<Entry[]>('readonly', (s) => s.getAll());
    let sent = 0;
    for (const e of all) {
      const fd = new FormData();
      for (const [k, v] of e.fields) v instanceof Blob ? fd.append(k, v, `${k}.jpg`) : fd.append(k, v);
      try {
        const res = await fetch('/add', { method: 'POST', body: fd, headers: { accept: 'application/json', 'x-sveltekit-action': 'true' } });
        const out = deserialize(await res.text());
        if (out.type !== 'success') break; // server said no; keep it and try later
        await store('readwrite', (s) => s.delete(e.id!));
        sent++;
      } catch {
        break; // still offline
      }
    }
    if (sent) {
      toast(`Uploaded ${sent} saved ${sent === 1 ? 'item' : 'items'}`, { icon: 'check' });
      await invalidateAll();
    }
  } catch {
    // IndexedDB unavailable (private mode); nothing queued.
  } finally {
    flushing = false;
    await refreshCount();
  }
}
