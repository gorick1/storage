import { db, now, tx } from './db';
import type { Kind } from '$lib/codes';

export interface Location { id: number; number: number; name: string; color: string; icon: string; notes: string; sort: number; box_count?: number; item_count?: number; last_label_stock_id: number | null }
export interface Box { id: number; number: number; name: string; location_id: number | null; notes: string; photo: string | null; pinned: number; item_count?: number; location_name?: string | null; location_color?: string | null; cover?: string | null; last_label_stock_id: number | null; updated_at: number }
export interface Item {
  id: number; number: number; name: string; description: string; tags: string; keywords: string; notes: string;
  quantity: number; track_quantity: number; box_id: number | null; location_id: number | null;
  checked_out_by: number | null; checked_out_at: number | null; checked_out_note: string | null;
  last_label_stock_id: number | null; label_box_id: number | null;
  brand: string; model: string; category: string; condition: string; serial_number: string;
  purchase_price_cents: number | null; purchase_date: string | null;
  msrp_cents: number | null; msrp_source_url: string | null; msrp_source_name: string | null; msrp_note: string | null; msrp_checked_at: number | null;
  price_status: 'none' | 'pending' | 'found' | 'not_found' | 'error';
  deleted_at: number | null; missing_at: number | null;
  created_at: number; updated_at: number;
  cover?: string | null; box_name?: string | null; box_number?: number | null; location_name?: string | null; location_color?: string | null; checked_out_name?: string | null;
}

export const COLORS = ['teal', 'orange', 'purple', 'green', 'indigo', 'pink', 'yellow', 'blue', 'red', 'brown'] as const;

function nextNumber(kind: Kind): number {
  const table = kind === 'item' ? 'items' : kind === 'box' ? 'boxes' : 'locations';
  const row = db.prepare('SELECT next FROM counters WHERE kind = ?').get(kind) as { next: number } | undefined;
  const max = (db.prepare(`SELECT COALESCE(MAX(number), 0) AS m FROM ${table}`).get() as { m: number }).m;
  const n = Math.max(row?.next ?? 1, max + 1);
  db.prepare('INSERT INTO counters (kind, next) VALUES (?, ?) ON CONFLICT(kind) DO UPDATE SET next = excluded.next').run(kind, n + 1);
  return n; // numbers are never reused, even after deletes
}

export function logEvent(entity: Kind, entityId: number, action: string, detail: object, userId: number | null) {
  db.prepare('INSERT INTO events (entity, entity_id, action, detail, user_id, at) VALUES (?, ?, ?, ?, ?, ?)').run(entity, entityId, action, JSON.stringify(detail), userId, now());
}

/* ---------- Locations ---------- */

export function listLocations(): Location[] {
  return db.prepare(`
    SELECT l.*,
      (SELECT COUNT(*) FROM boxes b WHERE b.location_id = l.id) AS box_count,
      (SELECT COUNT(*) FROM live_items i LEFT JOIN boxes b ON b.id = i.box_id WHERE COALESCE(b.location_id, i.location_id) = l.id) AS item_count
    FROM locations l ORDER BY l.sort, l.name COLLATE NOCASE`).all() as unknown as Location[];
}

export function getLocation(number: number): Location | undefined {
  return db.prepare('SELECT * FROM locations WHERE number = ?').get(number) as Location | undefined;
}

export function locationById(id: number): Location | undefined {
  return db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as Location | undefined;
}

export function createLocation(input: { name: string; color: string; icon: string; notes?: string }, userId: number | null): Location {
  return tx(() => {
    const n = nextNumber('location');
    const t = now();
    const sort = (db.prepare('SELECT COALESCE(MAX(sort), 0) + 1 AS s FROM locations').get() as { s: number }).s;
    const r = db.prepare('INSERT INTO locations (number, name, color, icon, notes, sort, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(n, input.name, input.color, input.icon, input.notes ?? '', sort, t, t);
    logEvent('location', Number(r.lastInsertRowid), 'created', {}, userId);
    return locationById(Number(r.lastInsertRowid))!;
  });
}

export function updateLocation(id: number, input: { name: string; color: string; icon: string; notes: string }) {
  db.prepare('UPDATE locations SET name = ?, color = ?, icon = ?, notes = ?, updated_at = ? WHERE id = ?').run(input.name, input.color, input.icon, input.notes, now(), id);
}

export function deleteLocation(id: number, userId: number | null) {
  tx(() => {
    db.prepare('UPDATE boxes SET location_id = NULL WHERE location_id = ?').run(id);
    db.prepare('UPDATE items SET location_id = NULL WHERE location_id = ?').run(id);
    db.prepare('DELETE FROM locations WHERE id = ?').run(id);
    logEvent('location', id, 'deleted', {}, userId);
  });
}

/* ---------- Boxes ---------- */

const BOX_SELECT = `
  SELECT b.*, l.name AS location_name, l.color AS location_color,
    (SELECT COUNT(*) FROM live_items i WHERE i.box_id = b.id) AS item_count,
    COALESCE(b.photo, (SELECT p.file FROM photos p JOIN live_items i ON i.id = p.item_id WHERE i.box_id = b.id ORDER BY i.updated_at DESC, p.sort LIMIT 1)) AS cover
  FROM boxes b LEFT JOIN locations l ON l.id = b.location_id`;

export function listBoxes(locationId?: number | null): Box[] {
  if (locationId === undefined) return db.prepare(`${BOX_SELECT} ORDER BY b.number`).all() as unknown as Box[];
  if (locationId === null) return db.prepare(`${BOX_SELECT} WHERE b.location_id IS NULL ORDER BY b.number`).all() as unknown as Box[];
  return db.prepare(`${BOX_SELECT} WHERE b.location_id = ? ORDER BY b.name COLLATE NOCASE`).all(locationId) as unknown as Box[];
}

export function recentBoxes(limit = 10, excludePinned = false): Box[] {
  return db.prepare(`${BOX_SELECT} ${excludePinned ? 'WHERE b.pinned = 0' : ''} ORDER BY b.updated_at DESC LIMIT ?`).all(limit) as unknown as Box[];
}

export function pinnedBoxes(): Box[] {
  return db.prepare(`${BOX_SELECT} WHERE b.pinned = 1 ORDER BY b.name COLLATE NOCASE`).all() as unknown as Box[];
}

export function setPinned(id: number, pinned: boolean) {
  db.prepare('UPDATE boxes SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, id);
}

export function getBox(number: number): Box | undefined {
  return db.prepare(`${BOX_SELECT} WHERE b.number = ?`).get(number) as Box | undefined;
}

export function boxById(id: number): Box | undefined {
  return db.prepare(`${BOX_SELECT} WHERE b.id = ?`).get(id) as Box | undefined;
}

export function createBox(input: { name?: string; location_id: number | null; notes?: string }, userId: number | null): Box {
  return tx(() => {
    const n = nextNumber('box');
    const t = now();
    const name = input.name?.trim() || `Box ${n}`;
    const r = db.prepare('INSERT INTO boxes (number, name, location_id, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(n, name, input.location_id, input.notes ?? '', t, t);
    logEvent('box', Number(r.lastInsertRowid), 'created', {}, userId);
    return boxById(Number(r.lastInsertRowid))!;
  });
}

export function updateBox(id: number, input: { name: string; location_id: number | null; notes: string }, userId: number | null) {
  const before = boxById(id);
  db.prepare('UPDATE boxes SET name = ?, location_id = ?, notes = ?, updated_at = ? WHERE id = ?').run(input.name, input.location_id, input.notes, now(), id);
  if (before && before.location_id !== input.location_id) logEvent('box', id, 'moved', { from: before.location_id, to: input.location_id }, userId);
}

export function deleteBox(id: number, itemsTo: { box_id: number | null; location_id: number | null }, userId: number | null) {
  tx(() => {
    db.prepare('UPDATE items SET box_id = ?, location_id = ?, updated_at = ? WHERE box_id = ?').run(itemsTo.box_id, itemsTo.box_id ? null : itemsTo.location_id, now(), id);
    db.prepare('DELETE FROM boxes WHERE id = ?').run(id);
    logEvent('box', id, 'deleted', itemsTo, userId);
  });
}

export function touchBox(id: number | null) {
  if (id) db.prepare('UPDATE boxes SET updated_at = ? WHERE id = ?').run(now(), id);
}

/* ---------- Items ---------- */

const ITEM_SELECT = `
  SELECT i.*, b.name AS box_name, b.number AS box_number,
    COALESCE(lb.name, li.name) AS location_name, COALESCE(lb.color, li.color) AS location_color,
    (SELECT p.file FROM photos p WHERE p.item_id = i.id ORDER BY p.sort, p.id LIMIT 1) AS cover,
    u.name AS checked_out_name
  FROM live_items i
  LEFT JOIN boxes b ON b.id = i.box_id
  LEFT JOIN locations lb ON lb.id = b.location_id
  LEFT JOIN locations li ON li.id = i.location_id
  LEFT JOIN users u ON u.id = i.checked_out_by`;

export function getItem(number: number): Item | undefined {
  return db.prepare(`${ITEM_SELECT} WHERE i.number = ?`).get(number) as Item | undefined;
}

export function itemById(id: number): Item | undefined {
  return db.prepare(`${ITEM_SELECT} WHERE i.id = ?`).get(id) as Item | undefined;
}

export function itemsInBox(boxId: number): Item[] {
  return db.prepare(`${ITEM_SELECT} WHERE i.box_id = ? ORDER BY i.name COLLATE NOCASE`).all(boxId) as unknown as Item[];
}

export function looseItems(locationId: number): Item[] {
  return db.prepare(`${ITEM_SELECT} WHERE i.box_id IS NULL AND i.location_id = ? ORDER BY i.name COLLATE NOCASE`).all(locationId) as unknown as Item[];
}

export function unplacedItems(): Item[] {
  return db.prepare(`${ITEM_SELECT} WHERE i.box_id IS NULL AND i.location_id IS NULL ORDER BY i.updated_at DESC`).all() as unknown as Item[];
}

export function recentItems(limit = 12): Item[] {
  return db.prepare(`${ITEM_SELECT} ORDER BY i.created_at DESC LIMIT ?`).all(limit) as unknown as Item[];
}

export function checkedOutItems(): Item[] {
  return db.prepare(`${ITEM_SELECT} WHERE i.checked_out_at IS NOT NULL ORDER BY i.checked_out_at`).all() as unknown as Item[];
}

export function itemPhotos(itemId: number): { id: number; file: string }[] {
  return db.prepare('SELECT id, file FROM photos WHERE item_id = ? ORDER BY sort, id').all(itemId) as unknown as { id: number; file: string }[];
}

function syncFts(id: number) {
  // Brand, model and category ride in the keywords column so search finds them.
  const i = db.prepare("SELECT name, description, tags, trim(keywords || ' ' || brand || ' ' || model || ' ' || category) AS keywords, notes FROM items WHERE id = ?").get(id) as Record<string, string> | undefined;
  db.prepare('DELETE FROM items_fts WHERE rowid = ?').run(id);
  if (i) db.prepare('INSERT INTO items_fts (rowid, name, description, tags, keywords, notes) VALUES (?, ?, ?, ?, ?, ?)').run(id, i.name, i.description, i.tags, i.keywords, i.notes);
}

export interface ItemDetails {
  brand: string; model: string; category: string; condition: string; serial_number: string;
  purchase_price_cents: number | null; purchase_date: string | null;
}

export const EMPTY_DETAILS: ItemDetails = { brand: '', model: '', category: '', condition: '', serial_number: '', purchase_price_cents: null, purchase_date: null };

export interface ItemInput extends ItemDetails {
  name: string; description: string; tags: string; keywords: string; notes: string;
  quantity: number; track_quantity: boolean; box_id: number | null; location_id: number | null;
}

export function createItem(input: ItemInput, photos: string[], userId: number | null): Item {
  return tx(() => {
    const n = nextNumber('item');
    const t = now();
    const r = db.prepare(`INSERT INTO items (number, name, description, tags, keywords, notes, quantity, track_quantity, box_id, location_id,
        brand, model, category, condition, serial_number, purchase_price_cents, purchase_date, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      n, input.name, input.description, input.tags, input.keywords, input.notes, input.quantity, input.track_quantity ? 1 : 0,
      input.box_id, input.box_id ? null : input.location_id,
      input.brand, input.model, input.category, input.condition, input.serial_number, input.purchase_price_cents, input.purchase_date, userId, t, t);
    const id = Number(r.lastInsertRowid);
    photos.forEach((file, idx) => db.prepare('INSERT INTO photos (item_id, file, sort, created_at) VALUES (?, ?, ?, ?)').run(id, file, idx, t));
    syncFts(id);
    touchBox(input.box_id);
    logEvent('item', id, 'created', { box_id: input.box_id, location_id: input.location_id }, userId);
    return itemById(id)!;
  });
}

export function updateItem(id: number, input: Omit<ItemInput, 'box_id' | 'location_id'>, userId: number | null) {
  db.prepare(`UPDATE items SET name = ?, description = ?, tags = ?, keywords = ?, notes = ?, quantity = ?, track_quantity = ?,
      brand = ?, model = ?, category = ?, condition = ?, serial_number = ?, purchase_price_cents = ?, purchase_date = ?, updated_at = ? WHERE id = ?`)
    .run(input.name, input.description, input.tags, input.keywords, input.notes, input.quantity, input.track_quantity ? 1 : 0,
      input.brand, input.model, input.category, input.condition, input.serial_number, input.purchase_price_cents, input.purchase_date, now(), id);
  syncFts(id);
  logEvent('item', id, 'edited', {}, userId);
}

export function moveItem(id: number, to: { box_id: number | null; location_id: number | null }, userId: number | null) {
  const before = itemById(id);
  if (!before) return;
  db.prepare('UPDATE items SET box_id = ?, location_id = ?, updated_at = ? WHERE id = ?').run(to.box_id, to.box_id ? null : to.location_id, now(), id);
  touchBox(to.box_id);
  logEvent('item', id, 'moved', { from: { box_id: before.box_id, location_id: before.location_id }, to }, userId);
}

export function addPhotos(itemId: number, files: string[]) {
  const t = now();
  const start = (db.prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS s FROM photos WHERE item_id = ?').get(itemId) as { s: number }).s;
  files.forEach((f, i) => db.prepare('INSERT INTO photos (item_id, file, sort, created_at) VALUES (?, ?, ?, ?)').run(itemId, f, start + i, t));
}

export function deletePhoto(itemId: number, photoId: number): string | null {
  const p = db.prepare('SELECT file FROM photos WHERE id = ? AND item_id = ?').get(photoId, itemId) as { file: string } | undefined;
  if (!p) return null;
  db.prepare('DELETE FROM photos WHERE id = ?').run(photoId);
  return p.file;
}

export function makeCover(itemId: number, photoId: number) {
  db.prepare('UPDATE photos SET sort = sort + 1 WHERE item_id = ?').run(itemId);
  db.prepare('UPDATE photos SET sort = 0 WHERE id = ? AND item_id = ?').run(photoId, itemId);
}

export function checkOut(id: number, userId: number, note: string) {
  db.prepare('UPDATE items SET checked_out_by = ?, checked_out_at = ?, checked_out_note = ?, updated_at = ? WHERE id = ?').run(userId, now(), note, now(), id);
  logEvent('item', id, 'checked_out', { note }, userId);
}

export function checkIn(id: number, userId: number | null) {
  db.prepare('UPDATE items SET checked_out_by = NULL, checked_out_at = NULL, checked_out_note = NULL, updated_at = ? WHERE id = ?').run(now(), id);
  logEvent('item', id, 'returned', {}, userId);
}

export function adjustQuantity(id: number, delta: number, userId: number | null) {
  const i = itemById(id);
  if (!i) return;
  const q = Math.max(0, i.quantity + delta);
  db.prepare('UPDATE items SET quantity = ?, updated_at = ? WHERE id = ?').run(q, now(), id);
  logEvent('item', id, delta < 0 ? 'took' : 'added', { delta, quantity: q }, userId);
}

/** Moves to Recently Deleted; photos stay until the item is purged. */
export function deleteItem(id: number, userId: number | null) {
  db.prepare('UPDATE items SET deleted_at = ? WHERE id = ?').run(now(), id);
  db.prepare('DELETE FROM items_fts WHERE rowid = ?').run(id);
  logEvent('item', id, 'deleted', {}, userId);
}

export function restoreItem(id: number, userId: number | null) {
  db.prepare('UPDATE items SET deleted_at = NULL, updated_at = ? WHERE id = ?').run(now(), id);
  syncFts(id);
  logEvent('item', id, 'restored', {}, userId);
}

export function deletedItems() {
  return db.prepare(`SELECT i.id, i.number, i.name, i.deleted_at, b.name AS box_name,
      (SELECT p.file FROM photos p WHERE p.item_id = i.id ORDER BY p.sort, p.id LIMIT 1) AS cover
    FROM items i LEFT JOIN boxes b ON b.id = i.box_id WHERE i.deleted_at IS NOT NULL ORDER BY i.deleted_at DESC`).all() as unknown as { id: number; number: number; name: string; deleted_at: number; box_name: string | null; cover: string | null }[];
}

/** Permanently removes deleted items (all of them, or those older than the cutoff). Returns photo files to remove. */
export function purgeDeleted(olderThan?: number, ids?: number[]): string[] {
  return tx(() => {
    const rows = ids?.length
      ? (db.prepare(`SELECT id FROM items WHERE deleted_at IS NOT NULL AND id IN (${ids.map(() => '?').join(',')})`).all(...ids) as { id: number }[])
      : (db.prepare('SELECT id FROM items WHERE deleted_at IS NOT NULL AND deleted_at < ?').all(olderThan ?? now()) as { id: number }[]);
    const files: string[] = [];
    for (const { id } of rows) {
      files.push(...(db.prepare('SELECT file FROM photos WHERE item_id = ?').all(id) as { file: string }[]).map((p) => p.file));
      db.prepare('DELETE FROM items WHERE id = ?').run(id);
    }
    return files;
  });
}

/* ---------- Missing (from Verify Box) ---------- */

export function setMissing(ids: number[], missing: boolean, userId: number | null) {
  for (const id of ids) {
    db.prepare('UPDATE items SET missing_at = ? WHERE id = ?').run(missing ? now() : null, id);
    logEvent('item', id, missing ? 'marked_missing' : 'found', {}, userId);
  }
}

export function missingItems(): Item[] {
  return db.prepare(`${ITEM_SELECT} WHERE i.missing_at IS NOT NULL ORDER BY i.missing_at DESC`).all() as unknown as Item[];
}

/* ---------- Bulk ---------- */

export function itemsByIds(ids: number[]): Item[] {
  if (!ids.length) return [];
  return db.prepare(`${ITEM_SELECT} WHERE i.id IN (${ids.map(() => '?').join(',')})`).all(...ids) as unknown as Item[];
}

/** Similar items already in the catalog, for the duplicate check while adding. */
export function similarItems(name: string, brand: string, limit = 3): Item[] {
  const q = [brand, name].filter(Boolean).join(' ').trim();
  if (q.length < 3) return [];
  const words = q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  if (!words.length) return [];
  const candidates = search(q, 20).items;
  // Keep only strong matches: most of the typed words appear in the existing item.
  return candidates.filter((i) => {
    const text = `${i.name} ${i.brand} ${i.model}`.toLowerCase();
    const hits = words.filter((w) => text.includes(w)).length;
    return hits / words.length >= 0.6;
  }).slice(0, limit);
}

export function history(entity: Kind, id: number) {
  return db.prepare(`SELECT e.action, e.detail, e.at, u.name AS user_name FROM events e LEFT JOIN users u ON u.id = e.user_id
    WHERE e.entity = ? AND e.entity_id = ? ORDER BY e.at DESC LIMIT 50`).all(entity, id) as unknown as { action: string; detail: string; at: number; user_name: string | null }[];
}

/* ---------- Search ---------- */

export function search(q: string, limit = 60): { items: Item[]; boxes: Box[]; locations: Location[] } {
  const term = q.trim();
  if (!term) return { items: [], boxes: [], locations: [] };
  const like = `%${term.replace(/[%_]/g, '')}%`;
  let ids: number[] = [];
  const words = term.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length) {
    const match = words.map((w) => `"${w.replace(/"/g, '""')}"`).join(' AND ');
    try {
      ids = (db.prepare('SELECT rowid FROM items_fts WHERE items_fts MATCH ? ORDER BY rank LIMIT ?').all(match, limit) as { rowid: number }[]).map((r) => r.rowid);
    } catch {
      ids = [];
    }
  }
  const likeIds = (db.prepare('SELECT id FROM live_items WHERE name LIKE ? OR tags LIKE ? OR brand LIKE ? OR model LIKE ? LIMIT ?').all(like, like, like, like, limit) as { id: number }[]).map((r) => r.id);
  let all = [...new Set([...ids, ...likeIds])];
  if (all.length < 5) all = [...all, ...fuzzyIds(term, limit).filter((id) => !all.includes(id))];
  all = all.slice(0, limit);
  const items = all.map((id) => itemById(id)).filter(Boolean) as Item[];
  const boxes = db.prepare(`${BOX_SELECT} WHERE b.name LIKE ? OR b.notes LIKE ? ORDER BY b.updated_at DESC LIMIT 20`).all(like, like) as unknown as Box[];
  const locations = db.prepare('SELECT * FROM locations WHERE name LIKE ? LIMIT 10').all(like) as unknown as Location[];
  return { items, boxes, locations };
}

/* Typo tolerance: compare each query word to the start of each record word, allowing 1-2 edits. */
function edits(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  return dp[a.length][b.length];
}

function fuzzyIds(q: string, limit: number): number[] {
  const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
  if (!tokens.length) return [];
  const rows = db.prepare("SELECT id, name || ' ' || tags || ' ' || keywords || ' ' || brand || ' ' || model AS text FROM live_items").all() as { id: number; text: string }[];
  const scored: { id: number; score: number }[] = [];
  for (const r of rows) {
    const words = r.text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    let score = 0;
    for (const t of tokens) {
      const allowed = t.length <= 4 ? 1 : 2;
      let best = Infinity;
      for (const w of words) for (const len of [t.length - 1, t.length, t.length + 1]) if (len > 0) best = Math.min(best, edits(t, w.slice(0, len)));
      if (best > allowed) { score = -1; break; }
      score += allowed + 1 - best;
    }
    if (score > 0) scored.push({ id: r.id, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.id);
}

/* ---------- Value ---------- */

export function setPriceStatus(id: number, status: Item['price_status']) {
  db.prepare('UPDATE items SET price_status = ? WHERE id = ?').run(status, id);
}

export function saveMsrp(id: number, r: { cents: number | null; url: string | null; source: string | null; note: string | null }, status: Item['price_status']) {
  db.prepare('UPDATE items SET msrp_cents = ?, msrp_source_url = ?, msrp_source_name = ?, msrp_note = ?, msrp_checked_at = ?, price_status = ? WHERE id = ?')
    .run(r.cents, r.url, r.source, r.note, now(), status, id);
}

/** Estimated value: what you paid if known, otherwise MSRP; times quantity when tracked. */
const VALUE_SQL = `COALESCE(i.purchase_price_cents, i.msrp_cents, 0) * CASE WHEN i.track_quantity = 1 THEN i.quantity ELSE 1 END`;

export function boxValue(boxId: number): number {
  return (db.prepare(`SELECT COALESCE(SUM(${VALUE_SQL}), 0) AS v FROM live_items i WHERE i.box_id = ?`).get(boxId) as { v: number }).v;
}

export function locationValue(locationId: number): number {
  return (db.prepare(`SELECT COALESCE(SUM(${VALUE_SQL}), 0) AS v FROM live_items i LEFT JOIN boxes b ON b.id = i.box_id WHERE COALESCE(b.location_id, i.location_id) = ?`).get(locationId) as { v: number }).v;
}

export function categories(): string[] {
  return (db.prepare("SELECT category FROM live_items WHERE category != '' GROUP BY category ORDER BY COUNT(*) DESC LIMIT 40").all() as { category: string }[]).map((r) => r.category);
}
