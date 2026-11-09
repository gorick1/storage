import { randomUUID } from 'node:crypto';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { PHOTO_DIR } from './db';

const MAX_BYTES = 6 * 1024 * 1024;

/** The browser already resized the photo and made a thumbnail; we store both as given. */
export async function savePhoto(full: File, thumb: File | null): Promise<string> {
  if (!full.type.startsWith('image/')) throw new Error('That file is not an image.');
  if (full.size > MAX_BYTES) throw new Error('That photo is too large.');
  const name = randomUUID();
  await writeFile(join(PHOTO_DIR, `${name}.jpg`), Buffer.from(await full.arrayBuffer()));
  await writeFile(join(PHOTO_DIR, `${name}_t.jpg`), Buffer.from(await (thumb ?? full).arrayBuffer()));
  return name;
}

export async function removePhotoFiles(names: string[]) {
  for (const n of names) {
    await unlink(join(PHOTO_DIR, `${n}.jpg`)).catch(() => {});
    await unlink(join(PHOTO_DIR, `${n}_t.jpg`)).catch(() => {});
  }
}
