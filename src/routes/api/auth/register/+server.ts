import { json } from '@sveltejs/kit';
import { registrationOptions, verifyRegistration } from '$lib/server/auth';
import { rpFor } from '$lib/server/rp';

/** Add a passkey for the signed-in person (right after setup or invite, or from Settings). */
export async function POST({ request, locals, url }) {
  if (!locals.user) return json({ error: 'Sign in first.' }, { status: 401 });
  const body = await request.json();
  const rp = rpFor(url, request);
  try {
    if (body.step === 'options') return json(await registrationOptions(locals.user, rp));
    await verifyRegistration(body.challengeId, body.response, rp, String(body.deviceName ?? 'Device').slice(0, 60));
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 400 });
  }
}
