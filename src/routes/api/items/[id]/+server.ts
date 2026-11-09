import { json } from '@sveltejs/kit';
import { adjustQuantity, boxById, checkIn, checkOut, itemById, moveItem } from '$lib/server/records';
import { autoPrint } from '$lib/server/labels';

/** Small, undoable actions from the item page and the scanner. */
export async function POST({ params, request, locals, url }) {
  const id = Number(params.id);
  const item = itemById(id);
  if (!item) return json({ error: 'Item not found.' }, { status: 404 });
  const body = await request.json();
  const uid = locals.user!.id;
  switch (body.action) {
    case 'move': {
      const to = { box_id: body.box_id ? Number(body.box_id) : null, location_id: body.location_id ? Number(body.location_id) : null };
      if (to.box_id && !boxById(to.box_id)) return json({ error: 'That box no longer exists.' }, { status: 400 });
      moveItem(id, to, uid);
      const after = itemById(id)!;
      // The printed label shows the box, so it's out of date the moment the item moves.
      const stale = !!item.last_label_stock_id && after.box_id !== item.label_box_id;
      return json({ ok: true, from: { box_id: item.box_id, location_id: item.location_id }, item: after, labelStale: stale });
    }
    case 'checkout':
      checkOut(id, uid, String(body.note ?? '').slice(0, 200));
      return json({ ok: true, item: itemById(id) });
    case 'checkin':
      checkIn(id, uid);
      return json({ ok: true, item: itemById(id) });
    case 'qty':
      adjustQuantity(id, Math.trunc(Number(body.delta) || 0), uid);
      return json({ ok: true, item: itemById(id) });
    case 'reprint': {
      const r = autoPrint('item', id, url.origin, uid);
      return json(r ?? { error: 'Auto-print is off for item labels.' });
    }
  }
  return json({ error: 'Unknown action.' }, { status: 400 });
}
