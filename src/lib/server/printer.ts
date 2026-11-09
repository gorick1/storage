import { Socket } from 'node:net';
import { db, getSetting, now } from './db';

export interface PrinterStatus {
  online: boolean;
  ready: boolean;
  problems: string[];
  error?: string;
}

function printerAddress(): { host: string; port: number } | null {
  const host = getSetting('printer_host').trim();
  if (!host) return null;
  return { host, port: Number(getSetting('printer_port', '9100')) || 9100 };
}

/** Send bytes and optionally collect a reply until `until` matches or the timeout passes. */
function talk(payload: string, opts: { reply?: boolean; timeout?: number; until?: (s: string) => boolean } = {}): Promise<string> {
  const addr = printerAddress();
  if (!addr) return Promise.reject(new Error('No printer address set. Add it in Settings → Printer.'));
  const timeout = opts.timeout ?? 4000;
  return new Promise((resolve, reject) => {
    const sock = new Socket();
    let buf = '';
    let done = false;
    const finish = (err?: Error) => {
      if (done) return;
      done = true;
      sock.destroy();
      if (err) reject(err);
      else resolve(buf);
    };
    sock.setTimeout(timeout, () => (opts.reply && buf ? finish() : finish(new Error(`Printer at ${addr.host} did not answer.`))));
    sock.on('error', (e) => finish(new Error(`Can't reach the printer at ${addr.host}:${addr.port} (${(e as NodeJS.ErrnoException).code ?? e.message}).`)));
    sock.on('data', (d) => {
      buf += d.toString('latin1');
      if (opts.until?.(buf)) finish();
    });
    sock.connect(addr.port, addr.host, () => {
      sock.write(payload, 'utf8', () => {
        if (!opts.reply) sock.end(() => finish());
      });
    });
  });
}

export function sendZpl(zpl: string) {
  return talk(zpl, { timeout: 8000 });
}

/** ~HS host status: three STX…ETX lines. Flags per the ZPL programming guide. */
export async function status(): Promise<PrinterStatus> {
  if (!printerAddress()) return { online: false, ready: false, problems: [], error: 'No printer set up yet.' };
  try {
    const raw = await talk('~HS', { reply: true, timeout: 2500, until: (s) => (s.match(/\x03/g) ?? []).length >= 3 });
    const lines = raw.split('\x03').map((l) => l.replace(/[\x02\r\n]/g, '')).filter(Boolean);
    const a = (lines[0] ?? '').split(',');
    const b = (lines[1] ?? '').split(',');
    const problems: string[] = [];
    if (a[1] === '1') problems.push('Out of labels');
    if (a[2] === '1') problems.push('Paused');
    if (a[5] === '1') problems.push('Receive buffer full');
    if (b[2] === '1') problems.push('Print head is open');
    if (b[3] === '1') problems.push('Ribbon out');
    if (a[11] === '1' || a[12] === '1') problems.push('Head too hot');
    return { online: true, ready: problems.length === 0, problems };
  } catch (e) {
    return { online: false, ready: false, problems: [], error: (e as Error).message };
  }
}

/** Ask the printer what is loaded: resolution, print width, label length, print method. */
export async function detect(): Promise<{ dpi: number | null; width_in: number | null; height_in: number | null; method: 'DT' | 'TT' | null; raw: Record<string, string> }> {
  const vars = ['head.resolution.in_dpi', 'ezpl.print_width', 'zpl.label_length', 'ezpl.print_method'];
  const raw: Record<string, string> = {};
  for (const v of vars) {
    const r = await talk(`! U1 getvar "${v}"\r\n`, { reply: true, timeout: 2000, until: (s) => (s.match(/"/g) ?? []).length >= 2 });
    raw[v] = r.replace(/[\r\n]/g, '').replace(/^"|"$/g, '').trim();
  }
  const dpi = parseInt(raw['head.resolution.in_dpi'], 10) || null;
  const w = parseInt(raw['ezpl.print_width'], 10);
  const h = parseInt(raw['zpl.label_length'], 10);
  const m = raw['ezpl.print_method'].toLowerCase();
  return {
    dpi,
    width_in: dpi && w ? Math.round((w / dpi) * 100) / 100 : null,
    height_in: dpi && h ? Math.round((h / dpi) * 100) / 100 : null,
    method: m.includes('direct') ? 'DT' : m.includes('trans') ? 'TT' : null,
    raw
  };
}

/* ---------- Queue ---------- */

export interface PrintJob { id: number; entity: string; entity_id: number; template_id: number; stock_id: number; copies: number; zpl: string; status: string; error: string | null; run_after: number; attempts: number; created_at: number; sent_at: number | null }

const ENTITY_TABLE: Record<string, string> = { item: 'items', box: 'boxes', location: 'locations' };

async function runJob(job: PrintJob) {
  const loaded = Number(getSetting('loaded_stock_id', '0'));
  if (loaded && loaded !== job.stock_id && job.entity !== 'test') {
    db.prepare("UPDATE print_jobs SET status = 'held', error = ? WHERE id = ?").run('Waiting for the right label roll', job.id);
    return;
  }
  db.prepare("UPDATE print_jobs SET status = 'sending', attempts = attempts + 1 WHERE id = ?").run(job.id);
  try {
    const st = await status();
    if (!st.online) throw new Error(st.error ?? 'Printer offline');
    if (!st.ready) throw new Error(st.problems.join(', '));
    await sendZpl(job.zpl);
    db.prepare("UPDATE print_jobs SET status = 'sent', sent_at = ?, error = NULL WHERE id = ?").run(now(), job.id);
    const table = ENTITY_TABLE[job.entity];
    if (table) {
      db.prepare(`UPDATE ${table} SET last_label_stock_id = ? WHERE id = ?`).run(job.stock_id, job.entity_id);
      if (job.entity === 'item') db.prepare('UPDATE items SET label_box_id = box_id WHERE id = ?').run(job.entity_id);
    }
  } catch (e) {
    const attempts = job.attempts + 1;
    // Retry with backoff for a while (printer asleep, out of labels), then give up and leave it in the queue.
    const failed = attempts >= 20;
    db.prepare('UPDATE print_jobs SET status = ?, error = ?, run_after = ? WHERE id = ?').run(failed ? 'failed' : 'pending', (e as Error).message, now() + Math.min(60e3, 2000 * attempts), job.id);
  }
}

let started = false;
let busy = false;
export function startQueue() {
  if (started) return;
  started = true;
  // Anything mid-send when the server stopped goes back in line.
  db.prepare("UPDATE print_jobs SET status = 'pending' WHERE status = 'sending'").run();
  setInterval(async () => {
    if (busy) return;
    if (getSetting('auto_print_paused') === '1') return;
    const job = db.prepare("SELECT * FROM print_jobs WHERE status = 'pending' AND run_after <= ? ORDER BY id LIMIT 1").get(now()) as PrintJob | undefined;
    if (!job) return;
    busy = true;
    try {
      await runJob(job);
    } finally {
      busy = false;
    }
  }, 700).unref?.();
}

export function enqueue(job: { entity: string; entity_id: number; template_id: number; stock_id: number; copies: number; zpl: string; delayMs: number; userId: number | null }): number {
  const r = db.prepare('INSERT INTO print_jobs (entity, entity_id, template_id, stock_id, copies, zpl, status, run_after, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(job.entity, job.entity_id, job.template_id, job.stock_id, job.copies, job.zpl, 'pending', now() + job.delayMs, job.userId, now());
  return Number(r.lastInsertRowid);
}

export function cancelJob(id: number) {
  db.prepare("UPDATE print_jobs SET status = 'cancelled' WHERE id = ? AND status IN ('pending', 'held', 'failed')").run(id);
}

export function retryJob(id: number) {
  db.prepare("UPDATE print_jobs SET status = 'pending', attempts = 0, run_after = ? WHERE id = ? AND status IN ('failed', 'held')").run(now(), id);
}

/** After a roll swap: everything held for this stock is released. */
export function releaseHeld(stockId: number) {
  db.prepare("UPDATE print_jobs SET status = 'pending', error = NULL, run_after = ? WHERE status = 'held' AND stock_id = ?").run(now(), stockId);
}

export function jobState(id: number) {
  return db.prepare('SELECT id, status, error FROM print_jobs WHERE id = ?').get(id) as { id: number; status: string; error: string | null } | undefined;
}

export function recentJobs(limit = 40) {
  return db.prepare(`SELECT j.id, j.entity, j.entity_id, j.status, j.error, j.created_at, j.sent_at, j.copies, t.name AS template_name, s.name AS stock_name,
      CASE j.entity WHEN 'item' THEN (SELECT name FROM items WHERE id = j.entity_id) WHEN 'box' THEN (SELECT name FROM boxes WHERE id = j.entity_id) ELSE (SELECT name FROM locations WHERE id = j.entity_id) END AS record_name,
      CASE j.entity WHEN 'item' THEN (SELECT number FROM items WHERE id = j.entity_id) WHEN 'box' THEN (SELECT number FROM boxes WHERE id = j.entity_id) ELSE (SELECT number FROM locations WHERE id = j.entity_id) END AS record_number
    FROM print_jobs j LEFT JOIN label_templates t ON t.id = j.template_id LEFT JOIN label_stocks s ON s.id = j.stock_id
    WHERE j.status != 'cancelled' ORDER BY j.id DESC LIMIT ?`).all(limit) as unknown as { id: number; entity: string; entity_id: number; status: string; error: string | null; created_at: number; sent_at: number | null; copies: number; template_name: string; stock_name: string; record_name: string | null; record_number: number | null }[];
}
