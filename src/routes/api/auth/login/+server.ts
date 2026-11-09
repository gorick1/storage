import { json } from '@sveltejs/kit';
import { authenticationOptions, createSession, rateLimited, verifyAuthentication } from '$lib/server/auth';
import { isSecure, rpFor } from '$lib/server/rp';

export async function POST({ request, url, cookies, getClientAddress }) {
  if (rateLimited(`login:${getClientAddress()}`, 30)) return json({ error: 'Too many attempts. Wait a few minutes.' }, { status: 429 });
  const body = await request.json();
  const rp = rpFor(url, request);
  try {
    if (body.step === 'options') return json(await authenticationOptions(rp));
    const userId = await verifyAuthentication(body.challengeId, body.response, rp);
    createSession(cookies, userId, isSecure(url, request));
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 400 });
  }
}
