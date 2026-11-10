import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), 'data');
export const PHOTO_DIR = join(DATA_DIR, 'photos');
mkdirSync(PHOTO_DIR, { recursive: true });

export const db = new DatabaseSync(join(DATA_DIR, 'storage.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

const MIGRATIONS: string[] = [
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    webauthn_user_id TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE credentials (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key BLOB NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    transports TEXT,
    device_name TEXT,
    created_at INTEGER NOT NULL,
    last_used_at INTEGER
  );
  CREATE TABLE recovery_codes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at INTEGER
  );
  CREATE TABLE sessions (
    id_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE challenges (
    id TEXT PRIMARY KEY,
    challenge TEXT NOT NULL,
    user_id INTEGER,
    purpose TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE invites (
    token_hash TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'member',
    created_by INTEGER REFERENCES users(id),
    expires_at INTEGER NOT NULL,
    used_at INTEGER
  );
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE counters (kind TEXT PRIMARY KEY, next INTEGER NOT NULL);

  CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'teal',
    icon TEXT NOT NULL DEFAULT 'house',
    notes TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0,
    last_label_stock_id INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE boxes (
    id INTEGER PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    notes TEXT NOT NULL DEFAULT '',
    photo TEXT,
    last_label_stock_id INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '',
    keywords TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 1,
    track_quantity INTEGER NOT NULL DEFAULT 0,
    box_id INTEGER REFERENCES boxes(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    checked_out_by INTEGER REFERENCES users(id),
    checked_out_at INTEGER,
    checked_out_note TEXT,
    last_label_stock_id INTEGER,
    label_box_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX items_box ON items(box_id);
  CREATE INDEX items_loc ON items(location_id);
  CREATE INDEX boxes_loc ON boxes(location_id);
  CREATE TABLE photos (
    id INTEGER PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    file TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX photos_item ON photos(item_id);
  CREATE VIRTUAL TABLE items_fts USING fts5(name, description, tags, keywords, notes, tokenize='trigram');

  CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    entity TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '{}',
    user_id INTEGER REFERENCES users(id),
    at INTEGER NOT NULL
  );
  CREATE INDEX events_entity ON events(entity, entity_id);

  CREATE TABLE label_stocks (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    width_in REAL NOT NULL,
    height_in REAL NOT NULL,
    dpi INTEGER NOT NULL DEFAULT 203,
    media TEXT NOT NULL DEFAULT 'gap',
    method TEXT NOT NULL DEFAULT 'DT',
    darkness INTEGER NOT NULL DEFAULT 15,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE label_templates (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    stock_id INTEGER NOT NULL REFERENCES label_stocks(id),
    elements TEXT NOT NULL DEFAULT '[]',
    is_default INTEGER NOT NULL DEFAULT 0,
    auto_print INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE print_jobs (
    id INTEGER PRIMARY KEY,
    entity TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    stock_id INTEGER NOT NULL,
    copies INTEGER NOT NULL DEFAULT 1,
    zpl TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error TEXT,
    run_after INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER,
    created_at INTEGER NOT NULL,
    sent_at INTEGER
  );
  CREATE INDEX print_jobs_status ON print_jobs(status, run_after);
  `,
  `
  ALTER TABLE items ADD COLUMN brand TEXT NOT NULL DEFAULT '';
  ALTER TABLE items ADD COLUMN model TEXT NOT NULL DEFAULT '';
  ALTER TABLE items ADD COLUMN category TEXT NOT NULL DEFAULT '';
  ALTER TABLE items ADD COLUMN condition TEXT NOT NULL DEFAULT '';
  ALTER TABLE items ADD COLUMN serial_number TEXT NOT NULL DEFAULT '';
  ALTER TABLE items ADD COLUMN purchase_price_cents INTEGER;
  ALTER TABLE items ADD COLUMN purchase_date TEXT;
  ALTER TABLE items ADD COLUMN msrp_cents INTEGER;
  ALTER TABLE items ADD COLUMN msrp_source_url TEXT;
  ALTER TABLE items ADD COLUMN msrp_source_name TEXT;
  ALTER TABLE items ADD COLUMN msrp_note TEXT;
  ALTER TABLE items ADD COLUMN msrp_checked_at INTEGER;
  ALTER TABLE items ADD COLUMN price_status TEXT NOT NULL DEFAULT 'none';
  CREATE INDEX items_brand ON items(brand);
  CREATE INDEX items_category ON items(category);
  `,
  `
  ALTER TABLE items ADD COLUMN deleted_at INTEGER;
  ALTER TABLE items ADD COLUMN missing_at INTEGER;
  ALTER TABLE boxes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
  CREATE VIEW live_items AS SELECT * FROM items WHERE deleted_at IS NULL;
  CREATE INDEX items_deleted ON items(deleted_at);
  `,
  `
  ALTER TABLE label_stocks ADD COLUMN speed INTEGER NOT NULL DEFAULT 3;
  `
];

function migrate() {
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (v INTEGER NOT NULL)');
  const row = db.prepare('SELECT v FROM schema_version').get() as { v: number } | undefined;
  let v = row?.v ?? 0;
  if (!row) db.prepare('INSERT INTO schema_version (v) VALUES (0)').run();
  while (v < MIGRATIONS.length) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[v]);
      v++;
      db.prepare('UPDATE schema_version SET v = ?').run(v);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }
}
migrate();

/* One-time data fixups that need code, not just SQL. */
function fixups() {
  // v0.3.1: big solid-black header bars made the printer brown out and reset. Turn them into outlines.
  if (getSetting('fixup_fills_v1') !== '1') {
    const rows = db.prepare('SELECT t.id, t.elements, s.width_in, s.height_in, s.dpi FROM label_templates t JOIN label_stocks s ON s.id = t.stock_id').all() as { id: number; elements: string; width_in: number; height_in: number; dpi: number }[];
    for (const r of rows) {
      const area = r.width_in * r.dpi * r.height_in * r.dpi;
      const els = JSON.parse(r.elements) as Record<string, unknown>[];
      let changed = false;
      for (const e of els) {
        if (e.type === 'box' && e.fill && (e.w as number) * (e.h as number) > area * 0.06) { e.fill = false; e.thickness = Math.max(4, Number(e.thickness) || 4); changed = true; }
        if (e.type === 'text' && e.invert) { e.invert = false; changed = true; }
      }
      if (changed) db.prepare('UPDATE label_templates SET elements = ? WHERE id = ?').run(JSON.stringify(els), r.id);
    }
    setSetting('fixup_fills_v1', '1');
  }
  // v0.3.2: most households run 2 × 1 in rolls. Add small box/place templates and make them the defaults,
  // and treat the 2 × 1 roll as loaded so a 4 × 3 label waits instead of printing off the edge.
  // On a brand-new install there are no stocks yet; seeding creates the small defaults itself.
  const hasStocks = (db.prepare('SELECT COUNT(*) AS c FROM label_stocks').get() as { c: number }).c > 0;
  if (!hasStocks) setSetting('fixup_small_v1', '1');
  if (getSetting('fixup_small_v1') !== '1') {
    const small = db.prepare('SELECT id, width_in, height_in, dpi FROM label_stocks WHERE width_in = 2 AND height_in = 1 ORDER BY id LIMIT 1').get() as { id: number; width_in: number; height_in: number; dpi: number } | undefined;
    if (small) {
      const W = Math.round(small.width_in * small.dpi), H = Math.round(small.height_in * small.dpi);
      const t = Date.now();
      for (const [kind, name] of [['box', 'Box · small'], ['location', 'Place · small']] as const) {
        const exists = db.prepare('SELECT id FROM label_templates WHERE kind = ? AND stock_id = ?').get(kind, small.id);
        if (exists) continue;
        db.prepare('UPDATE label_templates SET is_default = 0 WHERE kind = ?').run(kind);
        db.prepare('INSERT INTO label_templates (name, kind, stock_id, elements, is_default, auto_print, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)')
          .run(name, kind, small.id, JSON.stringify(smallLayout(kind, W, H)), kind === 'box' ? 1 : 0, t, t);
      }
      if (getSetting('loaded_stock_id', '0') === '0') setSetting('loaded_stock_id', String(small.id));
    }
    setSetting('fixup_small_v1', '1');
  }
}

// Mirrors the small-stock branch of $lib/labels/defaults (kept here so the server can run fixups before routes load).
function smallLayout(kind: 'box' | 'location', W: number, H: number) {
  const pad = Math.round(Math.min(W, H) * 0.06);
  const qrMag = H < 220 ? 4 : 5;
  const qrSize = 25 * qrMag; // room for a 25×25 QR (longer addresses); short gtor.cc links use 21×21
  const right = pad + qrSize + pad;
  const colW = W - right - pad;
  let n = 0;
  const id = () => `s${++n}`;
  return [
    { id: id(), type: 'qr', x: pad, y: pad, size: qrMag },
    { id: id(), type: 'text', x: pad, y: pad + qrSize + 8, w: qrSize, h: 24, text: '{number}', size: Math.round(H * 0.1), align: 'center', maxLines: 1 },
    { id: id(), type: 'text', x: right, y: pad, w: colW, h: Math.round(H * 0.42), text: '{name}', size: Math.round(H * 0.2), align: 'left', maxLines: 2 },
    { id: id(), type: 'text', x: right, y: pad + Math.round(H * 0.46), w: colW, h: 26, text: kind === 'box' ? '{location}' : '{item_count} items', size: Math.round(H * 0.11), align: 'left', maxLines: 1 },
    { id: id(), type: 'barcode', x: right, y: H - pad - Math.round(H * 0.24), w: colW, h: Math.round(H * 0.22) }
  ];
}

export function now() {
  return Date.now();
}

export function tx<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function getSetting(key: string, fallback = ''): string {
  const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return r?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

fixups();
