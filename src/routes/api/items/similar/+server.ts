import { json } from '@sveltejs/kit';
import { similarItems } from '$lib/server/records';

export function GET({ url }) {
  const items = similarItems(url.searchParams.get('name') ?? '', url.searchParams.get('brand') ?? '');
  return json({ items: items.map((i) => ({ id: i.id, number: i.number, name: i.name, box_name: i.box_name, location_name: i.location_name, cover: i.cover })) });
}
