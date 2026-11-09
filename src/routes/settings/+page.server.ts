import { fail } from '@sveltejs/kit';
import { getSetting, setSetting } from '$lib/server/db';
import { createInvite, deleteUser, issueRecoveryCodes, listPasskeys, listUsers, removePasskey } from '$lib/server/auth';
import { aiConfigured } from '$lib/server/ai';

export const load = ({ locals, url }) => {
  const key = getSetting('anthropic_api_key');
  return {
    printerHost: getSetting('printer_host'),
    printerPort: getSetting('printer_port', '9100'),
    qrBase: getSetting('qr_base'),
    origin: url.origin,
    aiKeyHint: key ? `•••• ${key.slice(-4)}` : process.env.ANTHROPIC_API_KEY ? 'From add-on options' : '',
    aiReady: aiConfigured(),
    users: locals.user!.role === 'admin' ? listUsers() : [],
    passkeys: listPasskeys(locals.user!.id)
  };
};

const adminOnly = (role: string) => (role !== 'admin' ? fail(403, { error: 'Only an admin can change this.' }) : null);

export const actions = {
  printer: async ({ request, locals }) => {
    const deny = adminOnly(locals.user!.role); if (deny) return deny;
    const f = await request.formData();
    const host = String(f.get('host') ?? '').trim();
    if (host && !/^[a-zA-Z0-9.-]+$/.test(host)) return fail(400, { error: 'Enter an IP address like 192.168.0.50 or a hostname.' });
    setSetting('printer_host', host);
    setSetting('printer_port', String(Number(f.get('port')) || 9100));
    return { saved: 'printer' };
  },
  qr: async ({ request, locals }) => {
    const deny = adminOnly(locals.user!.role); if (deny) return deny;
    const base = String((await request.formData()).get('qr_base') ?? '').trim().replace(/\/+$/, '');
    if (base && !/^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?$/.test(base)) return fail(400, { error: 'Use just the address, like https://gtor.cc' });
    setSetting('qr_base', base);
    return { saved: 'qr' };
  },
  ai: async ({ request, locals }) => {
    const deny = adminOnly(locals.user!.role); if (deny) return deny;
    const key = String((await request.formData()).get('key') ?? '').trim();
    if (key && !key.startsWith('sk-ant-')) return fail(400, { error: 'That doesn’t look like an Anthropic API key (it starts with sk-ant-).' });
    setSetting('anthropic_api_key', key);
    return { saved: 'ai' };
  },
  invite: async ({ request, locals, url }) => {
    const deny = adminOnly(locals.user!.role); if (deny) return deny;
    const role = (await request.formData()).get('role') === 'admin' ? 'admin' : 'member';
    return { invite: `${url.origin}/invite/${createInvite(locals.user!.id, role)}` };
  },
  removeUser: async ({ request, locals }) => {
    const deny = adminOnly(locals.user!.role); if (deny) return deny;
    const id = Number((await request.formData()).get('id'));
    if (id === locals.user!.id) return fail(400, { error: 'You can’t remove yourself.' });
    deleteUser(id);
    return { saved: 'users' };
  },
  codes: async ({ locals }) => ({ codes: issueRecoveryCodes(locals.user!.id) }),
  removePasskey: async ({ request, locals }) => {
    removePasskey(locals.user!.id, String((await request.formData()).get('id')));
    return { saved: 'passkeys' };
  }
};
