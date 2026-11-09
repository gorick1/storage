import { reportRows, rowValue } from '$lib/server/report';
import { displayCode } from '$lib/codes';

const cell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const dollars = (c: number | null) => (c == null ? '' : (c / 100).toFixed(2));

export function GET({ url }) {
  const { rows, location } = reportRows(Number(url.searchParams.get('location')) || undefined);
  const head = ['Number', 'Name', 'Brand', 'Model', 'Category', 'Condition', 'Serial number', 'Quantity', 'Price paid', 'Purchase date', 'MSRP', 'Estimated value', 'Box', 'Place', 'Description', 'Price source', 'Link'];
  const lines = rows.map((r) => [
    displayCode('item', r.number), r.name, r.brand, r.model, r.category, r.condition, r.serial_number, r.track_quantity ? r.quantity : 1,
    dollars(r.purchase_price_cents), r.purchase_date ?? '', dollars(r.msrp_cents), dollars(rowValue(r)), r.box_name ?? '', r.location_name ?? '', r.description, r.msrp_source_url ?? '', `${url.origin}/items/${r.number}`
  ].map(cell).join(','));
  const name = `storage-inventory${location ? '-' + location.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response([head.join(','), ...lines].join('\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"` } });
}
