import { json } from '@sveltejs/kit';
import { createSession, rateLimited, useRecoveryCode } from '$lib/server/auth';
import { isSecure } from '$lib/server/rp';

export async function POST({ request, url, cookies, getClientAddress }) {
  if (rateLimited(`recovery:${getClientAddress()}`, 8)) return json({ error: 'Too many attempts. Wait ten minutes and try again.' }, { status: 429 });
  const { code } = await request.json();
  const userId = useRecoveryCode(String(code ?? ''));
  if (!userId) return json({ error: 'That code isn’t valid or was already used.' }, { status: 400 });
  createSession(cookies, userId, isSecure(url, request));
  return json({ ok: true });
}
