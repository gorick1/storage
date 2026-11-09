import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PHOTO_DIR } from '$lib/server/db';

export async function GET({ params }) {
  if (!/^[0-9a-f-]{36}(_t)?\.jpg$/.test(params.file)) error(404);
  try {
    const buf = await readFile(join(PHOTO_DIR, params.file));
    return new Response(buf, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=31536000, immutable' } });
  } catch {
    error(404);
  }
}
