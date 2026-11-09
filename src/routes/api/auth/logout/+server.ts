import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth';
export function POST({ cookies }) {
  destroySession(cookies);
  redirect(303, '/login');
}
