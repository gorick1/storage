import { fail, redirect } from '@sveltejs/kit';
import { checkSetupCode, createSession, createUser, issueRecoveryCodes, rateLimited, removeIncompleteUsers, setupOpen, userCount } from '$lib/server/auth';
import { isSecure } from '$lib/server/rp';

export const load = ({ locals }) => {
  if (!setupOpen()) redirect(303, locals.user ? '/' : '/login');
  // Someone already started setup in this browser: let them finish adding a passkey.
  return { resume: !!locals.user, restarting: userCount() > 0 && !locals.user };
};

export const actions = {
  default: async ({ request, cookies, url, getClientAddress }) => {
    if (!setupOpen()) return fail(403, { error: 'Storage is already set up. Ask an admin for an invite.' });
    if (rateLimited(`setup:${getClientAddress()}`, 8)) return fail(429, { error: 'Too many tries. Wait ten minutes.' });
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Enter your name.' });
    if (!checkSetupCode(String(f.get('code') ?? ''))) {
      return fail(400, { error: 'That setup code doesn’t match. Copy it from Home Assistant → Settings → Apps → Storage → Log.' });
    }
    removeIncompleteUsers();
    const user = createUser(name, 'admin');
    createSession(cookies, user.id, isSecure(url, request));
    return { codes: issueRecoveryCodes(user.id) };
  }
};
