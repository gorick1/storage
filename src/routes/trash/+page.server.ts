import { deletedItems, purgeDeleted } from '$lib/server/records';
import { removePhotoFiles } from '$lib/server/photos';

export const load = () => ({ items: deletedItems() });

export const actions = {
  empty: async ({ request }) => {
    const ids = String((await request.formData()).get('ids') ?? '').split(',').map(Number).filter(Boolean);
    await removePhotoFiles(purgeDeleted(undefined, ids.length ? ids : undefined));
    return { emptied: true };
  }
};
