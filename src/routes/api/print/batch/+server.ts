import { json } from '@sveltejs/kit';
import { printRecord, directThermalRecords } from '$lib/server/labels';
import { createBox, getBox } from '$lib/server/records';

export async function POST({ request, locals, url }) {
  const body = await request.json();
  const uid = locals.user!.id;
  const jobs: number[] = [];
  const errors: string[] = [];
  const push = (r: ReturnType<typeof printRecord>) => ('error' in r ? errors.push(String(r.error)) : jobs.push(Number(r.jobId)));

  if (body.mode === 'blank-boxes') {
    // Pre-print box labels: creates numbered, unplaced boxes you can name when you fill them.
    const count = Math.min(50, Math.max(1, Number(body.count) || 1));
    for (let i = 0; i < count; i++) push(printRecord('box', createBox({ location_id: null }, uid).id, url.origin, { userId: uid }));
  } else if (body.mode === 'reprint-dt') {
    const { items, boxes } = directThermalRecords(body.locationId ? Number(body.locationId) : undefined);
    const tpl = body.templateIds ?? {};
    for (const id of boxes) push(printRecord('box', id, url.origin, { userId: uid, templateId: tpl.box }));
    for (const id of items) push(printRecord('item', id, url.origin, { userId: uid, templateId: tpl.item }));
  } else if (body.mode === 'records') {
    for (const r of body.records ?? []) {
      if (r.kind === 'box' && r.number) {
        const b = getBox(Number(r.number));
        if (b) push(printRecord('box', b.id, url.origin, { userId: uid }));
      } else push(printRecord(r.kind, Number(r.id), url.origin, { userId: uid }));
    }
  }
  return json({ queued: jobs.length, errors: [...new Set(errors)] });
}
