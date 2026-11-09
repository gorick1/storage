import { json } from '@sveltejs/kit';
import { createItem, EMPTY_DETAILS } from '$lib/server/records';
import { savePhoto } from '$lib/server/photos';
import { autoPrint } from '$lib/server/labels';
import { queuePriceLookup } from '$lib/server/pricing';

/** Whole-box capture: several items at once, all sharing the box photo. */
export async function POST({ request, locals, url }) {
  const f = await request.formData();
  const items = JSON.parse(String(f.get('items') ?? '[]')) as { name: string; brand: string; model: string; category: string; quantity: number; description: string }[];
  if (!items.length) return json({ error: 'Nothing to add.' }, { status: 400 });
  const boxId = Number(f.get('box_id')) || null;
  const locationId = Number(f.get('location_id')) || null;
  const full = f.get('full');
  const thumb = f.get('thumb');
  const print = f.get('print') === 'on';
  const lookup = f.get('lookup_price') === 'on';
  const created: { id: number; number: number; name: string }[] = [];
  for (const it of items.slice(0, 30)) {
    const name = String(it.name ?? '').trim().slice(0, 120);
    if (!name) continue;
    // Each item gets its own copy of the photo so deleting one never removes another's.
    const photos = full instanceof File ? [await savePhoto(full, thumb instanceof File ? thumb : null)] : [];
    const q = Math.max(1, Math.trunc(Number(it.quantity) || 1));
    const item = createItem({
      ...EMPTY_DETAILS,
      name, description: String(it.description ?? '').slice(0, 300), tags: '', keywords: '', notes: '',
      brand: String(it.brand ?? '').slice(0, 120), model: String(it.model ?? '').slice(0, 120), category: String(it.category ?? '').slice(0, 60),
      quantity: q, track_quantity: q > 1, box_id: boxId, location_id: boxId ? null : locationId
    }, photos, locals.user!.id);
    created.push({ id: item.id, number: item.number, name: item.name });
    if (print) autoPrint('item', item.id, url.origin, locals.user!.id);
    if (lookup) queuePriceLookup(item.id, { onlyIfBranded: true });
  }
  return json({ created });
}
