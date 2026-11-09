import { error, redirect } from '@sveltejs/kit';
import { parseCode, pathFor } from '$lib/codes';
import { getBox, getItem, getLocation } from './records';

export function resolveCode(raw: string): never {
  const c = parseCode(raw);
  if (!c) error(404, `“${raw}” isn’t a Storage label.`);
  const exists = c.kind === 'item' ? getItem(c.number) : c.kind === 'box' ? getBox(c.number) : getLocation(c.number);
  if (!exists) error(404, `Nothing is labeled ${raw.toUpperCase()} yet. It may have been deleted.`);
  redirect(303, pathFor(c.kind, c.number));
}
