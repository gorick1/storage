import { json } from '@sveltejs/kit';
import { autoPrint } from '$lib/server/labels';
import { createBox, listBoxes, listLocations, recentBoxes } from '$lib/server/records';

/** Box picker data: recent first, then every box grouped by place. */
export function GET() {
  return json({ recent: recentBoxes(6), boxes: listBoxes(), locations: listLocations() });
}

export async function POST({ request, locals, url }) {
  const { name, location_id } = await request.json();
  const box = createBox({ name: String(name ?? ''), location_id: location_id ? Number(location_id) : null }, locals.user!.id);
  const job = autoPrint('box', box.id, url.origin, locals.user!.id);
  return json({ box, job });
}
