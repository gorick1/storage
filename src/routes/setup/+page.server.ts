import { fail, redirect } from '@sveltejs/kit';
import { createSession, createUser, issueRecoveryCodes, userCount } from '$lib/server/auth';
import { isSecure } from '$lib/server/rp';

export const load = ({ locals }) => {
  if (userCount() > 0 && !locals.user) redirect(303, '/login');
  return {};
};

export const actions = {
  default: async ({ request, cookies, url }) => {
    if (userCount() > 0) return fail(403, { error: 'Storage is already set up. Ask an admin for an invite.' });
    const name = String((await request.formData()).get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Enter your name.' });
    const user = createUser(name, 'admin');
    createSession(cookies, user.id, isSecure(url, request));
    return { codes: issueRecoveryCodes(user.id) };
  }
};
