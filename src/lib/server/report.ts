import { db } from './db';
import { getLocation } from './records';

export interface ReportRow {
  id: number; number: number; name: string; brand: string; model: string; category: string; condition: string; serial_number: string;
  quantity: number; track_quantity: number; purchase_price_cents: number | null; purchase_date: string | null; msrp_cents: number | null; msrp_source_url: string | null;
  box_name: string | null; box_number: number | null; location_name: string | null; cover: string | null; description: string;
}

export function reportRows(locationNumber?: number): { rows: ReportRow[]; location: string | null } {
  const loc = locationNumber ? getLocation(locationNumber) : undefined;
  const rows = db.prepare(`
    SELECT i.id, i.number, i.name, i.brand, i.model, i.category, i.condition, i.serial_number, i.quantity, i.track_quantity,
      i.purchase_price_cents, i.purchase_date, i.msrp_cents, i.msrp_source_url, i.description,
      b.name AS box_name, b.number AS box_number, COALESCE(lb.name, li.name) AS location_name,
      (SELECT p.file FROM photos p WHERE p.item_id = i.id ORDER BY p.sort, p.id LIMIT 1) AS cover
    FROM live_items i
    LEFT JOIN boxes b ON b.id = i.box_id
    LEFT JOIN locations lb ON lb.id = b.location_id
    LEFT JOIN locations li ON li.id = i.location_id
    ${loc ? 'WHERE COALESCE(b.location_id, i.location_id) = ?' : ''}
    ORDER BY location_name, box_name, i.name`).all(...(loc ? [loc.id] : [])) as unknown as ReportRow[];
  return { rows, location: loc?.name ?? null };
}

export function rowValue(r: ReportRow) {
  return (r.purchase_price_cents ?? r.msrp_cents ?? 0) * (r.track_quantity ? r.quantity : 1);
}
