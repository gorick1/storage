import { fail, redirect } from '@sveltejs/kit';
import { db, getSetting } from '$lib/server/db';
import { deleteStock, directThermalRecords, listStocks, listTemplates, sampleData, saveStock, saveTemplate, getStock } from '$lib/server/labels';
import { recentJobs } from '$lib/server/printer';
import { listLocations } from '$lib/server/records';
import { defaultElements } from '$lib/labels/defaults';
import { dots } from '$lib/labels/types';
import type { Kind } from '$lib/codes';

export const load = ({ url }) => {
  const dt = directThermalRecords();
  return {
    stocks: listStocks(),
    templates: listTemplates(),
    jobs: recentJobs(30),
    loadedStock: Number(getSetting('loaded_stock_id', '0')),
    paused: getSetting('auto_print_paused') === '1',
    printerSet: !!getSetting('printer_host'),
    samples: { item: sampleData('item', url.origin), box: sampleData('box', url.origin), location: sampleData('location', url.origin) },
    dtCount: dt.items.length + dt.boxes.length,
    hasTT: listStocks().some((s) => s.method === 'TT'),
    locations: listLocations(),
    heldCount: (db.prepare("SELECT COUNT(*) AS c FROM print_jobs WHERE status = 'held'").get() as { c: number }).c
  };
};

function num(v: FormDataEntryValue | null, min: number, max: number, d: number) {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : d;
}

export const actions = {
  stock: async ({ request }) => {
    const f = await request.formData();
    const width = num(f.get('width_in'), 0.5, 4.25, 0);
    const height = num(f.get('height_in'), 0.25, 39, 0);
    if (!width || !height) return fail(400, { error: 'Width must be 0.5–4.25 in and height 0.25–39 in for the ZD420.' });
    const dpi = [203, 300].includes(Number(f.get('dpi'))) ? Number(f.get('dpi')) : 203;
    saveStock({
      id: Number(f.get('id')) || undefined,
      name: String(f.get('name') || `${width} × ${height} in`).trim(),
      width_in: width, height_in: height, dpi,
      media: (['gap', 'continuous', 'mark'].includes(String(f.get('media'))) ? f.get('media') : 'gap') as 'gap',
      method: f.get('method') === 'TT' ? 'TT' : 'DT',
      darkness: num(f.get('darkness'), 0, 30, 15)
    });
    return { saved: true };
  },
  deleteStock: async ({ request }) => {
    const err = deleteStock(Number((await request.formData()).get('id')));
    return err ? fail(400, { error: err }) : { saved: true };
  },
  newTemplate: async ({ request }) => {
    const f = await request.formData();
    const kind = (['item', 'box', 'location'].includes(String(f.get('kind'))) ? f.get('kind') : 'item') as Kind;
    const stock = getStock(Number(f.get('stock_id')));
    if (!stock) return fail(400, { error: 'Pick a label stock first.' });
    const id = saveTemplate({
      name: `${kind[0].toUpperCase() + kind.slice(1)} · ${stock.name}`, kind, stock_id: stock.id,
      elements: defaultElements(kind, dots(stock.width_in, stock.dpi), dots(stock.height_in, stock.dpi)), is_default: false, auto_print: true
    });
    redirect(303, `/labels/templates/${id}`);
  }
};
