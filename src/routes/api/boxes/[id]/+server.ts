import { json } from '@sveltejs/kit';
import { boxById, setPinned } from '$lib/server/records';

export async function POST({ params, request }) {
  const box = boxById(Number(params.id));
  if (!box) return json({ error: 'Box not found.' }, { status: 404 });
  const { pinned } = await request.json();
  setPinned(box.id, !!pinned);
  return json({ ok: true, pinned: !!pinned });
}
