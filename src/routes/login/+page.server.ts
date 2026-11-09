import { redirect } from '@sveltejs/kit';
import { setupOpen } from '$lib/server/auth';

export const load = ({ locals, url }) => {
  const next = url.searchParams.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  if (locals.user) redirect(303, safeNext);
  return { next: safeNext, setupOpen: setupOpen() };
};
