import { fail } from '@sveltejs/kit';
import { checkInvite, consumeInvite, createSession, createUser, issueRecoveryCodes } from '$lib/server/auth';
import { isSecure } from '$lib/server/rp';

export const load = ({ params }) => ({ valid: !!checkInvite(params.token) });

export const actions = {
  default: async ({ params, request, cookies, url }) => {
    const inv = checkInvite(params.token);
    if (!inv) return fail(400, { error: 'This invite has expired or was already used. Ask for a new one.' });
    const name = String((await request.formData()).get('name') ?? '').trim();
    if (!name) return fail(400, { error: 'Enter your name.' });
    const user = createUser(name, inv.role);
    consumeInvite(params.token);
    createSession(cookies, user.id, isSecure(url, request));
    return { codes: issueRecoveryCodes(user.id) };
  }
};
