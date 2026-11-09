import { listBoxes, listLocations, missingItems, search, unplacedItems } from '$lib/server/records';

export const load = ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const filter = url.searchParams.get('filter');
  if (filter === 'unplaced') return { q, filter, title: 'Not Put Away', items: unplacedItems(), boxes: [], locations: [] };
  if (filter === 'missing') return { q, filter, title: 'Missing', items: missingItems(), boxes: [], locations: [] };
  if (filter === 'homeless') return { q, filter, title: 'Boxes Without a Place', items: [], boxes: listBoxes(null), locations: [] };
  if (filter === 'boxes') return { q, filter, title: 'All Boxes', items: [], boxes: listBoxes(), locations: [] };
  return { q, filter: null, title: 'Search', ...search(q), allLocations: listLocations() };
};
