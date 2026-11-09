import { error, fail, redirect } from '@sveltejs/kit';
import { addPhotos, deleteItem, deletePhoto, getItem, history, itemPhotos, makeCover, updateItem } from '$lib/server/records';
import { removePhotoFiles, savePhoto } from '$lib/server/photos';
import { printRecord, listTemplates } from '$lib/server/labels';
import { parseDetails } from '$lib/server/forms';
import { queuePriceLookup } from '$lib/server/pricing';
import { aiConfigured } from '$lib/server/ai';
import { categories } from '$lib/server/records';

export const load = ({ params }) => {
  const item = getItem(Number(params.n));
  if (!item) error(404, 'That item doesn’t exist.');
  return { item, photos: itemPhotos(item.id), history: history('item', item.id), templates: listTemplates().filter((t) => t.kind === 'item'), aiReady: aiConfigured(), categories: categories() };
};

function tagsOf(v: FormDataEntryValue | null) {
  return String(v ?? '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).join(', ');
}

export const actions = {
  edit: async ({ params, request, locals }) => {
    const item = getItem(Number(params.n));
    if (!item) error(404);
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Give the item a name.' });
    updateItem(item.id, {
      name, description: String(f.get('description') ?? ''), tags: tagsOf(f.get('tags')), keywords: item.keywords, notes: String(f.get('notes') ?? ''),
      quantity: Math.max(0, Number(f.get('quantity')) || 1), track_quantity: f.get('track_quantity') === 'on',
      ...parseDetails(f)
    }, locals.user!.id);
    return { saved: true };
  },
  photo: async ({ params, request }) => {
    const item = getItem(Number(params.n));
    if (!item) error(404);
    const f = await request.formData();
    const full = f.get('full');
    if (!(full instanceof File)) return fail(400, { error: 'No photo.' });
    const thumb = f.get('thumb');
    addPhotos(item.id, [await savePhoto(full, thumb instanceof File ? thumb : null)]);
    return { saved: true };
  },
  deletePhoto: async ({ params, request }) => {
    const item = getItem(Number(params.n));
    if (!item) error(404);
    const file = deletePhoto(item.id, Number((await request.formData()).get('photo')));
    if (file) await removePhotoFiles([file]);
    return { saved: true };
  },
  cover: async ({ params, request }) => {
    const item = getItem(Number(params.n));
    if (!item) error(404);
    makeCover(item.id, Number((await request.formData()).get('photo')));
    return { saved: true };
  },
  print: async ({ params, request, locals, url }) => {
    const item = getItem(Number(params.n));
    if (!item) error(404);
    const f = await request.formData();
    const r = printRecord('item', item.id, url.origin, { userId: locals.user!.id, templateId: Number(f.get('template')) || undefined, copies: Number(f.get('copies')) || 1 });
    if ('error' in r) return fail(400, { error: r.error });
    return { jobId: r.jobId, held: r.held };
  },
  price: async ({ params }) => {
    const item = getItem(Number(params.n));
    if (!item) error(404);
    if (!queuePriceLookup(item.id)) return fail(400, { error: aiConfigured() ? 'A lookup is already running.' : 'Add your Anthropic API key in Settings first.' });
    return { pricing: true };
  },
  delete: async ({ params, locals }) => {
    const item = getItem(Number(params.n));
    if (!item) error(404);
    deleteItem(item.id, locals.user!.id);
    redirect(303, `${item.box_number ? `/boxes/${item.box_number}` : '/'}?deleted=${item.id}`);
  }
};
