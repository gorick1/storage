import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

/** What the print pill shows: jobs waiting or printing, plus anything that finished in the last few seconds. */
export function GET() {
  const rows = db.prepare(`SELECT j.id, j.status, j.error, j.entity, j.sent_at,
      CASE j.entity WHEN 'item' THEN (SELECT name FROM items WHERE id = j.entity_id) WHEN 'box' THEN (SELECT name FROM boxes WHERE id = j.entity_id) WHEN 'location' THEN (SELECT name FROM locations WHERE id = j.entity_id) ELSE 'Test label' END AS name
    FROM print_jobs j
    WHERE j.status IN ('pending', 'sending') OR (j.status = 'sent' AND j.sent_at > ?) OR (j.status = 'held' AND j.created_at > ?)
    ORDER BY j.id`).all(Date.now() - 5000, Date.now() - 60_000) as { id: number; status: string; error: string | null; name: string | null; sent_at: number | null }[];
  return json({ jobs: rows });
}
