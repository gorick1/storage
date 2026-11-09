import { json } from '@sveltejs/kit';
import { issueRecoveryCodes } from '$lib/server/auth';

/** Fresh recovery codes for the signed-in person (replaces old ones). */
export function POST({ locals }) {
  if (!locals.user) return json({ error: 'Sign in first.' }, { status: 401 });
  return json({ codes: issueRecoveryCodes(locals.user.id) });
}
