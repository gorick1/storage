import { redirect, type Handle } from '@sveltejs/kit';
import { sessionUser, userCount } from '$lib/server/auth';
import { startQueue } from '$lib/server/printer';
import { seedLabels } from '$lib/server/labels';

seedLabels();
startQueue();

const PUBLIC = ['/login', '/setup', '/invite', '/api/auth', '/manifest.webmanifest', '/icon', '/icon-180.png'];

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = sessionUser(event.cookies.get('sid'));
  const path = event.url.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(p + '/') || path.startsWith(p + '.'));
  if (!event.locals.user && !isPublic) {
    if (path.startsWith('/api/')) return new Response(JSON.stringify({ error: 'Sign in first.' }), { status: 401, headers: { 'content-type': 'application/json' } });
    if (userCount() === 0) redirect(303, '/setup');
    // Keep where they were going (a scanned QR) so login lands them on it.
    redirect(303, `/login?next=${encodeURIComponent(path + event.url.search)}`);
  }
  const response = await resolve(event);
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('referrer-policy', 'same-origin');
  response.headers.set('x-content-type-options', 'nosniff');
  return response;
};
