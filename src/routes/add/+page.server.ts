import { fail } from '@sveltejs/kit';
import { boxById, createItem, getBox, getItem, getLocation, locationById } from '$lib/server/records';
import { savePhoto } from '$lib/server/photos';
import { autoPrint } from '$lib/server/labels';
import { aiConfigured } from '$lib/server/ai';
import { parseDetails } from '$lib/server/forms';
import { queuePriceLookup } from '$lib/server/pricing';
import { categories } from '$lib/server/records';

export const load = ({ url }) => {
  const from = url.searchParams.get('from') ? getItem(Number(url.searchParams.get('from'))) : undefined;
  const boxN = url.searchParams.get('box');
  const box = boxN ? getBox(Number(boxN)) : from?.box_id ? boxById(from.box_id) : undefined;
  const locN = url.searchParams.get('location');
  const location = locN ? getLocation(Number(locN)) : from?.location_id ? locationById(from.location_id) : undefined;
  return {
    aiReady: aiConfigured(),
    prefill: from ? { name: from.name, description: from.description, tags: from.tags, quantity: from.quantity, track_quantity: !!from.track_quantity, keywords: from.keywords, brand: from.brand, model: from.model, category: from.category, condition: from.condition } : null,
    categories: categories(),
    box: box ?? null,
    location: location ?? null
  };
};

export const actions = {
  default: async ({ request, locals, url }) => {
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Give the item a name.' });
    const photos: string[] = [];
    for (let i = 0; i < 8; i++) {
      const full = f.get(`full_${i}`);
      if (!(full instanceof File)) break;
      const thumb = f.get(`thumb_${i}`);
      photos.push(await savePhoto(full, thumb instanceof File ? thumb : null));
    }
    const boxId = Number(f.get('box_id')) || null;
    const locationId = Number(f.get('location_id')) || null;
    const item = createItem({
      name,
      description: String(f.get('description') ?? '').trim(),
      tags: String(f.get('tags') ?? '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).join(', '),
      keywords: String(f.get('keywords') ?? ''),
      notes: String(f.get('notes') ?? ''),
      quantity: Math.max(0, Number(f.get('quantity')) || 1),
      track_quantity: f.get('track_quantity') === 'on',
      box_id: boxId,
      location_id: boxId ? null : locationId,
      ...parseDetails(f)
    }, photos, locals.user!.id);
    // Branded items get an MSRP looked up in the background; saving never waits on it.
    const pricing = f.get('lookup_price') === 'off' ? false : queuePriceLookup(item.id, { onlyIfBranded: true });
    const job = f.get('print') === 'off' ? null : autoPrint('item', item.id, url.origin, locals.user!.id);
    return { created: { number: item.number, name: item.name }, job: job && 'jobId' in job ? { id: job.jobId, held: job.held } : null, pricing };
  }
};
