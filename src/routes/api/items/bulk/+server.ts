import { json } from '@sveltejs/kit';
import { boxById, deleteItem, itemsByIds, moveItem, restoreItem, setMissing } from '$lib/server/records';
import { printRecord } from '$lib/server/labels';
import { queuePriceLookup } from '$lib/server/pricing';

/** One action on many items: move, print, price, delete, restore, missing, found. */
export async function POST({ request, locals, url }) {
  const body = await request.json();
  const uid = locals.user!.id;
  const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter((n: number) => n > 0).slice(0, 500) as number[];
  if (!ids.length) return json({ error: 'Nothing selected.' }, { status: 400 });
  const items = itemsByIds(ids);
  switch (body.action) {
    case 'move': {
      const box = body.box_id ? boxById(Number(body.box_id)) : null;
      if (body.box_id && !box) return json({ error: 'That box no longer exists.' }, { status: 400 });
      const from = items.map((i) => ({ id: i.id, box_id: i.box_id, location_id: i.location_id }));
      for (const i of items) moveItem(i.id, { box_id: box?.id ?? null, location_id: box ? null : Number(body.location_id) || null }, uid);
      return json({ ok: true, count: items.length, from });
    }
    case 'undo-move': {
      for (const f of body.from ?? []) moveItem(Number(f.id), { box_id: f.box_id, location_id: f.location_id }, uid);
      return json({ ok: true });
    }
    case 'print': {
      let queued = 0;
      for (const i of items) if ('jobId' in printRecord('item', i.id, url.origin, { userId: uid })) queued++;
      return json({ ok: true, count: queued });
    }
    case 'price': {
      let started = 0;
      for (const i of items) if (queuePriceLookup(i.id)) started++;
      return json({ ok: true, count: started });
    }
    case 'delete':
      for (const i of items) deleteItem(i.id, uid);
      return json({ ok: true, count: items.length });
    case 'restore':
      for (const id of ids) restoreItem(id, uid);
      return json({ ok: true, count: ids.length });
    case 'missing':
    case 'found':
      setMissing(items.map((i) => i.id), body.action === 'missing', uid);
      return json({ ok: true, count: items.length });
  }
  return json({ error: 'Unknown action.' }, { status: 400 });
}
