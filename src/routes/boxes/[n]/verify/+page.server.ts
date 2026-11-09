import { error } from '@sveltejs/kit';
import { getBox, itemsInBox } from '$lib/server/records';

export const load = ({ params }) => {
  const box = getBox(Number(params.n));
  if (!box) error(404, 'That box doesn’t exist.');
  return { box, items: itemsInBox(box.id) };
};
