// Talks to Home Assistant through the Supervisor (available when this runs as an HA app).
// - Publishes sensors: item count, checked out, missing, total value.
// - Answers Assist "where is …" questions relayed as storage_find events.
// - Sends a daily reminder about items checked out too long.
import { db, getSetting, setSetting } from './db';
import { checkedOutItems, missingItems, search } from './records';
import { displayCode } from '$lib/codes';

const TOKEN = process.env.SUPERVISOR_TOKEN;
const API = 'http://supervisor/core/api';

export function haAvailable() {
  return !!TOKEN;
}

async function call(path: string, body: unknown) {
  const r = await fetch(`${API}${path}`, { method: 'POST', headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Home Assistant ${path}: ${r.status}`);
}

const days = (t: number) => Math.floor((Date.now() - t) / 864e5);

export async function pushSensors() {
  if (!TOKEN) return;
  const count = (db.prepare('SELECT COUNT(*) AS c FROM live_items').get() as { c: number }).c;
  const value = (db.prepare("SELECT COALESCE(SUM(COALESCE(purchase_price_cents, msrp_cents, 0) * CASE WHEN track_quantity = 1 THEN quantity ELSE 1 END), 0) AS v FROM live_items").get() as { v: number }).v;
  const out = checkedOutItems();
  const missing = missingItems();
  const base = process.env.ORIGIN ?? '';
  await Promise.all([
    call('/states/sensor.storage_items', { state: count, attributes: { friendly_name: 'Storage items', unit_of_measurement: 'items', icon: 'mdi:package-variant-closed', state_class: 'measurement' } }),
    call('/states/sensor.storage_value', { state: Math.round(value) / 100, attributes: { friendly_name: 'Storage value', unit_of_measurement: 'USD', device_class: 'monetary', icon: 'mdi:cash' } }),
    call('/states/sensor.storage_checked_out', {
      state: out.length,
      attributes: { friendly_name: 'Storage checked out', icon: 'mdi:export', items: out.map((i) => ({ name: i.name, by: i.checked_out_name, days: days(i.checked_out_at!), url: `${base}/items/${i.number}` })) }
    }),
    call('/states/sensor.storage_missing', { state: missing.length, attributes: { friendly_name: 'Storage missing', icon: 'mdi:help-box', items: missing.map((i) => i.name) } })
  ]);
}

/** One sentence for Assist. */
export function answerWhere(query: string): string {
  const q = query.trim().replace(/^(the|my|our)\s+/i, '');
  if (!q) return 'What should I look for?';
  const { items, boxes } = search(q, 5);
  const describe = (i: (typeof items)[number]) => {
    if (i.checked_out_at) return `${i.name} is checked out by ${i.checked_out_name ?? 'someone'}${i.box_name ? `. It lives in ${i.box_name}` : ''}.`;
    if (i.box_name) return `${i.name} is in ${i.box_name}${i.location_name ? ` in the ${i.location_name}` : ''}, box ${displayCode('box', i.box_number!)}.`;
    if (i.location_name) return `${i.name} is loose in the ${i.location_name}.`;
    return `${i.name} hasn't been put away yet.`;
  };
  if (items.length === 1) return describe(items[0]);
  if (items.length > 1) return `${describe(items[0])} I also found ${items.slice(1, 3).map((i) => i.name).join(' and ')}.`;
  if (boxes.length) return `The ${boxes[0].name} box is ${boxes[0].location_name ? `in the ${boxes[0].location_name}` : 'not in a place yet'}.`;
  return `I couldn't find ${q} in Storage.`;
}

async function remindOverdue() {
  const limit = Number(getSetting('overdue_days', '14')) || 14;
  const late = checkedOutItems().filter((i) => days(i.checked_out_at!) >= limit);
  if (!late.length) return;
  const lines = late.map((i) => `${i.name}: ${i.checked_out_name ?? 'someone'}, ${days(i.checked_out_at!)} days`);
  await call('/services/persistent_notification/create', { notification_id: 'storage_overdue', title: `${late.length} ${late.length === 1 ? 'item' : 'items'} still checked out`, message: lines.join('\n') });
  const notify = getSetting('ha_notify_service').trim(); // e.g. notify.mobile_app_garretts_iphone
  if (/^notify\.[a-z0-9_]+$/.test(notify)) {
    await call(`/services/notify/${notify.slice(7)}`, { title: 'Storage', message: lines.length === 1 ? `${lines[0]} checked out.` : `${late.length} items still checked out: ${late.map((i) => i.name).join(', ')}` });
  }
}

function connectEvents() {
  const ws = new WebSocket('ws://supervisor/core/websocket');
  let id = 1;
  ws.onmessage = async (msg) => {
    const m = JSON.parse(String(msg.data));
    if (m.type === 'auth_required') ws.send(JSON.stringify({ type: 'auth', access_token: TOKEN }));
    else if (m.type === 'auth_ok') ws.send(JSON.stringify({ id: id++, type: 'subscribe_events', event_type: 'storage_find' }));
    else if (m.type === 'event' && m.event?.event_type === 'storage_find') {
      const query = String(m.event.data?.query ?? '');
      const text = answerWhere(query);
      // A short beat so the automation is already waiting for our answer.
      setTimeout(() => call('/events/storage_answer', { query, text }).catch((e) => console.error(e.message)), 250);
    }
  };
  ws.onclose = () => setTimeout(connectEvents, 10_000);
  ws.onerror = () => ws.close();
}

let started = false;
export function startHomeAssistant() {
  if (started || !TOKEN) return;
  started = true;
  connectEvents();
  const push = () => pushSensors().catch((e) => console.error('HA sensors:', e.message));
  setTimeout(push, 3000);
  setInterval(push, 120_000).unref?.();
  // Overdue reminder once a day, after 6 pm local time.
  setInterval(() => {
    const today = new Date().toDateString();
    if (new Date().getHours() >= 18 && getSetting('overdue_reminded') !== today) {
      setSetting('overdue_reminded', today);
      remindOverdue().catch((e) => console.error('HA reminder:', e.message));
    }
  }, 600_000).unref?.();
}
