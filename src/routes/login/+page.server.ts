import { redirect } from '@sveltejs/kit';
import { userCount } from '$lib/server/auth';

export const load = ({ locals, url }) => {
  const next = url.searchParams.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  if (locals.user) redirect(303, safeNext);
  if (userCount() === 0) redirect(303, '/setup');
  return { next: safeNext };
};
