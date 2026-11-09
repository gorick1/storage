import { json } from '@sveltejs/kit';
import { printRecord } from '$lib/server/labels';
import type { Kind } from '$lib/codes';

export async function POST({ request, locals, url }) {
  const { kind, id, templateId, copies, delayMs } = await request.json();
  if (!['item', 'box', 'location'].includes(kind)) return json({ error: 'Unknown record type.' }, { status: 400 });
  const r = printRecord(kind as Kind, Number(id), url.origin, { templateId: templateId ? Number(templateId) : undefined, copies: Math.min(50, Math.max(1, Number(copies) || 1)), delayMs: Math.min(10000, Number(delayMs) || 0), userId: locals.user!.id });
  if ('error' in r) return json({ error: r.error }, { status: 400 });
  return json(r);
}
