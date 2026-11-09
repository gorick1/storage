import { error, fail, redirect } from '@sveltejs/kit';
import { createBox, deleteLocation, getLocation, listBoxes, locationValue, looseItems, updateLocation } from '$lib/server/records';
import { printRecord } from '$lib/server/labels';
import { COLORS, LOCATION_ICONS } from '$lib/icons';

export const load = ({ params }) => {
  const loc = getLocation(Number(params.n));
  if (!loc) error(404, 'That place doesn’t exist.');
  return { loc, boxes: listBoxes(loc.id), loose: looseItems(loc.id), value: locationValue(loc.id) };
};

export const actions = {
  edit: async ({ params, request }) => {
    const loc = getLocation(Number(params.n));
    if (!loc) error(404);
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Give the place a name.' });
    const color = (COLORS as readonly string[]).includes(String(f.get('color'))) ? String(f.get('color')) : loc.color;
    const icon = (LOCATION_ICONS as readonly string[]).includes(String(f.get('icon'))) ? String(f.get('icon')) : loc.icon;
    updateLocation(loc.id, { name, color, icon, notes: String(f.get('notes') ?? '') });
    return { saved: true };
  },
  addBox: async ({ params, request, locals, url }) => {
    const loc = getLocation(Number(params.n));
    if (!loc) error(404);
    const name = String((await request.formData()).get('name') ?? '').trim();
    const box = createBox({ name, location_id: loc.id }, locals.user!.id);
    const { autoPrint } = await import('$lib/server/labels');
    const job = autoPrint('box', box.id, url.origin, locals.user!.id);
    redirect(303, `/boxes/${box.number}${job && 'jobId' in job ? `?printed=${job.jobId}` : ''}`);
  },
  print: async ({ params, locals, url }) => {
    const loc = getLocation(Number(params.n));
    if (!loc) error(404);
    const r = printRecord('location', loc.id, url.origin, { userId: locals.user!.id });
    if ('error' in r) return fail(400, { error: r.error });
    return { jobId: r.jobId, held: r.held };
  },
  delete: async ({ params, locals }) => {
    const loc = getLocation(Number(params.n));
    if (!loc) error(404);
    deleteLocation(loc.id, locals.user!.id);
    redirect(303, '/');
  }
};
