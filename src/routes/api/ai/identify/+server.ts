import { json } from '@sveltejs/kit';
import { identify } from '$lib/server/ai';
import { rateLimited } from '$lib/server/auth';

export async function POST({ request, locals }) {
  if (rateLimited(`ai:${locals.user!.id}`, 60, 10 * 60e3)) return json({ error: 'Slow down a little. Try again in a few minutes.' }, { status: 429 });
  const { image, mediaType, hint } = await request.json();
  if (typeof image !== 'string' || image.length > 8_000_000) return json({ error: 'Photo missing or too large.' }, { status: 400 });
  try {
    return json(await identify(image, mediaType ?? 'image/jpeg', String(hint ?? '').slice(0, 300)));
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 502 });
  }
}
