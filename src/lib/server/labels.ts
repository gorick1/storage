import { db, getSetting, now } from './db';
import type { LabelData, LabelElement, LabelStock, LabelTemplate } from '$lib/labels/types';
import { dots } from '$lib/labels/types';
import { renderZpl } from '$lib/labels/zpl';
import { defaultElements } from '$lib/labels/defaults';
import { displayCode, qrUrl, type Kind } from '$lib/codes';
import { boxById, boxValue, itemById, itemsInBox, locationById, looseItems, listBoxes } from './records';
import { formatMoney } from '$lib/money';
import { enqueue } from './printer';

type TemplateRow = Omit<LabelTemplate, 'elements' | 'is_default' | 'auto_print'> & { elements: string; is_default: number; auto_print: number };

function parseTemplate(r: TemplateRow): LabelTemplate {
  return { ...r, elements: JSON.parse(r.elements) as LabelElement[], is_default: !!r.is_default, auto_print: !!r.auto_print };
}

export function listStocks(): LabelStock[] {
  return db.prepare('SELECT * FROM label_stocks ORDER BY width_in * height_in').all() as unknown as LabelStock[];
}

export function getStock(id: number): LabelStock | undefined {
  return db.prepare('SELECT * FROM label_stocks WHERE id = ?').get(id) as LabelStock | undefined;
}

export function saveStock(s: Omit<LabelStock, 'id'> & { id?: number }): number {
  if (s.id) {
    db.prepare('UPDATE label_stocks SET name = ?, width_in = ?, height_in = ?, dpi = ?, media = ?, method = ?, darkness = ?, speed = ? WHERE id = ?')
      .run(s.name, s.width_in, s.height_in, s.dpi, s.media, s.method, s.darkness, s.speed ?? 3, s.id);
    return s.id;
  }
  const r = db.prepare('INSERT INTO label_stocks (name, width_in, height_in, dpi, media, method, darkness, speed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(s.name, s.width_in, s.height_in, s.dpi, s.media, s.method, s.darkness, s.speed ?? 3, now());
  return Number(r.lastInsertRowid);
}

export function deleteStock(id: number): string | null {
  const used = (db.prepare('SELECT COUNT(*) AS c FROM label_templates WHERE stock_id = ?').get(id) as { c: number }).c;
  if (used) return 'Templates still use this label stock. Move or delete them first.';
  db.prepare('DELETE FROM label_stocks WHERE id = ?').run(id);
  return null;
}

export function listTemplates(): (LabelTemplate & { stock_name: string })[] {
  return (db.prepare('SELECT t.*, s.name AS stock_name FROM label_templates t JOIN label_stocks s ON s.id = t.stock_id ORDER BY t.kind, t.is_default DESC, t.name').all() as unknown as (TemplateRow & { stock_name: string })[])
    .map((r) => ({ ...parseTemplate(r), stock_name: r.stock_name }));
}

export function getTemplate(id: number): LabelTemplate | undefined {
  const r = db.prepare('SELECT * FROM label_templates WHERE id = ?').get(id) as TemplateRow | undefined;
  return r ? parseTemplate(r) : undefined;
}

export function defaultTemplate(kind: Kind): LabelTemplate | undefined {
  const r = db.prepare('SELECT * FROM label_templates WHERE kind = ? ORDER BY is_default DESC, id LIMIT 1').get(kind) as TemplateRow | undefined;
  return r ? parseTemplate(r) : undefined;
}

export function saveTemplate(t: { id?: number; name: string; kind: Kind; stock_id: number; elements: LabelElement[]; is_default: boolean; auto_print: boolean }): number {
  const t0 = now();
  let id = t.id;
  if (id) {
    db.prepare('UPDATE label_templates SET name = ?, kind = ?, stock_id = ?, elements = ?, is_default = ?, auto_print = ?, updated_at = ? WHERE id = ?')
      .run(t.name, t.kind, t.stock_id, JSON.stringify(t.elements), t.is_default ? 1 : 0, t.auto_print ? 1 : 0, t0, id);
  } else {
    id = Number(db.prepare('INSERT INTO label_templates (name, kind, stock_id, elements, is_default, auto_print, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(t.name, t.kind, t.stock_id, JSON.stringify(t.elements), t.is_default ? 1 : 0, t.auto_print ? 1 : 0, t0, t0).lastInsertRowid);
  }
  if (t.is_default) db.prepare('UPDATE label_templates SET is_default = 0 WHERE kind = ? AND id != ?').run(t.kind, id);
  return id;
}

export function deleteTemplate(id: number) {
  db.prepare('DELETE FROM label_templates WHERE id = ?').run(id);
}

/** First run: two common Zebra stocks and one template per record type. */
export function seedLabels() {
  const count = (db.prepare('SELECT COUNT(*) AS c FROM label_stocks').get() as { c: number }).c;
  if (count) return;
  const small = saveStock({ name: '2 × 1 in', width_in: 2, height_in: 1, dpi: 203, media: 'gap', method: 'DT', darkness: 15 });
  const large = saveStock({ name: '4 × 3 in', width_in: 4, height_in: 3, dpi: 203, media: 'gap', method: 'DT', darkness: 15 });
  const sm = { w: dots(2, 203), h: dots(1, 203) };
  const lg = { w: dots(4, 203), h: dots(3, 203) };
  saveTemplate({ name: 'Item · small', kind: 'item', stock_id: small, elements: defaultElements('item', sm.w, sm.h), is_default: true, auto_print: true });
  saveTemplate({ name: 'Box · large', kind: 'box', stock_id: large, elements: defaultElements('box', lg.w, lg.h), is_default: false, auto_print: true });
  saveTemplate({ name: 'Location · large', kind: 'location', stock_id: large, elements: defaultElements('location', lg.w, lg.h), is_default: false, auto_print: false });
  // 2 × 1 is the common roll, so the small layouts are the defaults and that roll counts as loaded.
  saveTemplate({ name: 'Box · small', kind: 'box', stock_id: small, elements: defaultElements('box', sm.w, sm.h), is_default: true, auto_print: true });
  saveTemplate({ name: 'Place · small', kind: 'location', stock_id: small, elements: defaultElements('location', sm.w, sm.h), is_default: true, auto_print: false });
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('loaded_stock_id', ?)").run(String(small));
}

export function qrBase(origin: string) {
  return getSetting('qr_base') || origin;
}

export function labelData(kind: Kind, id: number, origin: string): LabelData | null {
  const base = qrBase(origin);
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (kind === 'item') {
    const i = itemById(id);
    if (!i) return null;
    return {
      number: displayCode('item', i.number), name: i.name, description: i.description, quantity: i.track_quantity ? `Qty ${i.quantity}` : '',
      box: i.box_name ?? (i.location_name ? 'Loose' : ''), box_number: i.box_number ? displayCode('box', i.box_number) : '',
      location: i.location_name ?? '', contents: '', item_count: '', brand: i.brand, model: i.model, value: formatMoney(i.purchase_price_cents ?? i.msrp_cents),
      qr: qrUrl(base, 'item', i.number), code: displayCode('item', i.number), date
    };
  }
  if (kind === 'box') {
    const b = boxById(id);
    if (!b) return null;
    const items = itemsInBox(b.id);
    return {
      number: displayCode('box', b.number), name: b.name, description: b.notes, quantity: '', box: b.name, box_number: displayCode('box', b.number),
      location: b.location_name ?? '', contents: items.map((i) => (i.track_quantity ? `${i.name} (${i.quantity})` : i.name)).join(', '),
      item_count: String(items.length), brand: '', model: '', value: formatMoney(boxValue(b.id) || null, { whole: true }),
      qr: qrUrl(base, 'box', b.number), code: displayCode('box', b.number), date
    };
  }
  const l = locationById(id);
  if (!l) return null;
  const boxes = listBoxes(l.id);
  const loose = looseItems(l.id);
  return {
    number: displayCode('location', l.number), name: l.name, description: l.notes, quantity: '', box: '', box_number: '', location: l.name,
    contents: [...boxes.map((b) => b.name), ...loose.map((i) => i.name)].join(', '), item_count: String((l as { item_count?: number }).item_count ?? loose.length),
    brand: '', model: '', value: '',
    qr: qrUrl(base, 'location', l.number), code: displayCode('location', l.number), date
  };
}

export function sampleData(kind: Kind, origin: string): LabelData {
  const table = kind === 'item' ? 'live_items' : kind === 'box' ? 'boxes' : 'locations';
  const row = db.prepare(`SELECT id FROM ${table} ORDER BY updated_at DESC LIMIT 1`).get() as { id: number } | undefined;
  const real = row ? labelData(kind, row.id, origin) : null;
  if (real) return real;
  const base = qrBase(origin);
  return {
    number: displayCode(kind, 42), name: kind === 'item' ? 'Cordless drill' : kind === 'box' ? 'Power tools' : 'Garage',
    description: '18V with two batteries', quantity: 'Qty 1', box: 'Power tools', box_number: displayCode('box', 12), location: 'Garage',
    contents: 'Cordless drill, Impact driver, Bit set, Chargers', item_count: '4', brand: 'DeWalt', model: 'DCD771C2', value: '$159.00',
    qr: qrUrl(base, kind, 42), code: displayCode(kind, 42),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

/** Queue a label. delayMs gives the person a moment to cancel a misprint. */
export function printRecord(kind: Kind, id: number, origin: string, opts: { templateId?: number; copies?: number; delayMs?: number; userId: number | null }) {
  const template = opts.templateId ? getTemplate(opts.templateId) : defaultTemplate(kind);
  if (!template) return { error: `No ${kind} label template yet. Make one in Labels.` };
  const stock = getStock(template.stock_id);
  if (!stock) return { error: 'The template’s label stock is missing.' };
  const data = labelData(kind, id, origin);
  if (!data) return { error: 'Record not found.' };
  const zpl = renderZpl(stock, template.elements, data, opts.copies ?? 1);
  const jobId = enqueue({ entity: kind, entity_id: id, template_id: template.id, stock_id: stock.id, copies: opts.copies ?? 1, zpl, delayMs: opts.delayMs ?? 0, userId: opts.userId });
  const loaded = Number(getSetting('loaded_stock_id', '0'));
  return { jobId, held: !!loaded && loaded !== stock.id, stock: stock.name };
}

export function autoPrint(kind: Kind, id: number, origin: string, userId: number | null) {
  const t = defaultTemplate(kind);
  if (!t || !t.auto_print) return null;
  return printRecord(kind, id, origin, { templateId: t.id, delayMs: 3500, userId });
}

/** Records whose last label went out on direct-thermal stock (fades in heat). */
export function directThermalRecords(locationId?: number) {
  const dt = (listStocks().filter((s) => s.method === 'DT').map((s) => s.id));
  if (!dt.length) return { items: [] as number[], boxes: [] as number[] };
  const ph = dt.map(() => '?').join(',');
  const locFilterItems = locationId ? 'AND COALESCE(b.location_id, i.location_id) = ?' : '';
  const locFilterBoxes = locationId ? 'AND location_id = ?' : '';
  const items = (db.prepare(`SELECT i.id FROM live_items i LEFT JOIN boxes b ON b.id = i.box_id WHERE i.last_label_stock_id IN (${ph}) ${locFilterItems}`).all(...dt, ...(locationId ? [locationId] : [])) as { id: number }[]).map((r) => r.id);
  const boxes = (db.prepare(`SELECT id FROM boxes WHERE last_label_stock_id IN (${ph}) ${locFilterBoxes}`).all(...dt, ...(locationId ? [locationId] : [])) as { id: number }[]).map((r) => r.id);
  return { items, boxes };
}
