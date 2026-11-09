import { error, fail, redirect } from '@sveltejs/kit';
import { deleteBox, getBox, history, itemsInBox, listLocations, updateBox } from '$lib/server/records';
import { printRecord } from '$lib/server/labels';

export const load = ({ params }) => {
  const box = getBox(Number(params.n));
  if (!box) error(404, 'That box doesn’t exist.');
  return { box, items: itemsInBox(box.id), locations: listLocations(), history: history('box', box.id) };
};

export const actions = {
  edit: async ({ params, request, locals }) => {
    const box = getBox(Number(params.n));
    if (!box) error(404);
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Give the box a name.' });
    const loc = Number(f.get('location_id')) || null;
    updateBox(box.id, { name, location_id: loc, notes: String(f.get('notes') ?? '') }, locals.user!.id);
    return { saved: true };
  },
  print: async ({ params, locals, url }) => {
    const box = getBox(Number(params.n));
    if (!box) error(404);
    const r = printRecord('box', box.id, url.origin, { userId: locals.user!.id });
    if ('error' in r) return fail(400, { error: r.error });
    return { jobId: r.jobId, held: r.held };
  },
  delete: async ({ params, request, locals }) => {
    const box = getBox(Number(params.n));
    if (!box) error(404);
    const f = await request.formData();
    const dest = String(f.get('dest') ?? 'location');
    deleteBox(box.id, { box_id: null, location_id: dest === 'location' ? box.location_id : null }, locals.user!.id);
    redirect(303, box.location_id ? `/locations/${listLocations().find((l) => l.id === box.location_id)?.number}` : '/');
  }
};
