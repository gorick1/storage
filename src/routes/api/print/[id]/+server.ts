import { json } from '@sveltejs/kit';
import { cancelJob, jobState, retryJob } from '$lib/server/printer';

export function GET({ params }) {
  const j = jobState(Number(params.id));
  return j ? json(j) : json({ error: 'No such job' }, { status: 404 });
}

export async function POST({ params, request }) {
  const { action } = await request.json();
  if (action === 'cancel') cancelJob(Number(params.id));
  else if (action === 'retry') retryJob(Number(params.id));
  return json(jobState(Number(params.id)) ?? {});
}
