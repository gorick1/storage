import { json } from '@sveltejs/kit';
import { parseCode } from '$lib/codes';
import { getBox, getItem, getLocation } from '$lib/server/records';

export function GET({ url }) {
  const c = parseCode(url.searchParams.get('code') ?? '');
  if (!c) return json({ error: 'Not a Storage label.' }, { status: 404 });
  const record = c.kind === 'item' ? getItem(c.number) : c.kind === 'box' ? getBox(c.number) : getLocation(c.number);
  if (!record) return json({ error: 'Nothing has that label yet.' }, { status: 404 });
  return json({ kind: c.kind, record });
}
