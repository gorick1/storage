import { db, getSetting } from '$lib/server/db';
import { aiConfigured } from '$lib/server/ai';

export const load = ({ locals }) => {
  const user = locals.user;
  if (!user) return { user: null };
  const held = (db.prepare("SELECT COUNT(*) AS c FROM print_jobs WHERE status IN ('held', 'failed')").get() as { c: number }).c;
  return {
    user: { id: user.id, name: user.name, role: user.role },
    held,
    aiReady: aiConfigured(),
    printPaused: getSetting('auto_print_paused') === '1'
  };
};
