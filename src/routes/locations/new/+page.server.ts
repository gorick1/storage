import { fail, redirect } from '@sveltejs/kit';
import { createLocation } from '$lib/server/records';
import { COLORS, LOCATION_ICONS } from '$lib/icons';

export const actions = {
  default: async ({ request, locals }) => {
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Give the place a name.' });
    const color = (COLORS as readonly string[]).includes(String(f.get('color'))) ? String(f.get('color')) : 'teal';
    const icon = (LOCATION_ICONS as readonly string[]).includes(String(f.get('icon'))) ? String(f.get('icon')) : 'house';
    const loc = createLocation({ name, color, icon, notes: String(f.get('notes') ?? '') }, locals.user!.id);
    redirect(303, `/locations/${loc.number}`);
  }
};
