import { json } from '@sveltejs/kit';
import { detect, sendZpl, status, releaseHeld } from '$lib/server/printer';
import { setSetting } from '$lib/server/db';

export async function GET() {
  return json(await status());
}

export async function POST({ request }) {
  const body = await request.json();
  try {
    if (body.action === 'detect') return json(await detect());
    if (body.action === 'test') {
      await sendZpl('^XA^CI28^FO30,30^A0N,40,34^FDStorage test print^FS^FO30,80^A0N,26,22^FDIf you can read this, printing works.^FS^FO30,120^BQN,2,4^FDMA,HTTPS://STORAGE.GARRETTORICK.COM^FS^XZ');
      return json({ ok: true });
    }
    if (body.action === 'calibrate') {
      await sendZpl('~JC');
      return json({ ok: true });
    }
    if (body.action === 'loaded') {
      setSetting('loaded_stock_id', String(Number(body.stockId) || 0));
      if (body.stockId) releaseHeld(Number(body.stockId));
      return json({ ok: true });
    }
    if (body.action === 'pause') {
      setSetting('auto_print_paused', body.paused ? '1' : '0');
      return json({ ok: true });
    }
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 502 });
  }
  return json({ error: 'Unknown action.' }, { status: 400 });
}
