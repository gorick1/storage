import { reportRows, rowValue } from '$lib/server/report';
import { listLocations } from '$lib/server/records';

export const load = ({ url }) => {
  const n = Number(url.searchParams.get('location')) || undefined;
  const { rows, location } = reportRows(n);
  return { rows, location, locationNumber: n ?? null, total: rows.reduce((s, r) => s + rowValue(r), 0), locations: listLocations(), generated: Date.now() };
};
