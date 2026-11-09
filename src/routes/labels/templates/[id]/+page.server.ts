import { error, fail, redirect } from '@sveltejs/kit';
import { deleteTemplate, getStock, getTemplate, listStocks, sampleData, saveTemplate } from '$lib/server/labels';
import { enqueue } from '$lib/server/printer';
import { renderZpl } from '$lib/labels/zpl';
import type { LabelElement } from '$lib/labels/types';
import type { Kind } from '$lib/codes';

export const load = ({ params, url }) => {
  const t = getTemplate(Number(params.id));
  if (!t) error(404, 'Template not found.');
  return {
    template: t,
    stocks: listStocks(),
    samples: { item: sampleData('item', url.origin), box: sampleData('box', url.origin), location: sampleData('location', url.origin) }
  };
};

function parse(f: FormData) {
  const p = JSON.parse(String(f.get('payload') ?? '{}')) as { name: string; kind: Kind; stock_id: number; elements: LabelElement[]; is_default: boolean; auto_print: boolean };
  if (!p.name?.trim()) throw new Error('Name the template.');
  if (!['item', 'box', 'location'].includes(p.kind)) throw new Error('Bad kind.');
  if (!getStock(p.stock_id)) throw new Error('Pick a label stock.');
  if (!Array.isArray(p.elements)) throw new Error('Bad layout.');
  return p;
}

export const actions = {
  save: async ({ params, request }) => {
    try {
      const p = parse(await request.formData());
      saveTemplate({ id: Number(params.id), ...p, name: p.name.trim() });
      return { saved: true };
    } catch (e) {
      return fail(400, { error: (e as Error).message });
    }
  },
  test: async ({ request, locals, url }) => {
    try {
      const p = parse(await request.formData());
      const stock = getStock(p.stock_id)!;
      const zpl = renderZpl(stock, p.elements, sampleData(p.kind, url.origin));
      // Test prints never wait for the "loaded roll" check: you're standing at the printer.
      const jobId = enqueue({ entity: 'test', entity_id: 0, template_id: 0, stock_id: stock.id, copies: 1, zpl, delayMs: 0, userId: locals.user!.id });
      return { jobId };
    } catch (e) {
      return fail(400, { error: (e as Error).message });
    }
  },
  duplicate: async ({ params }) => {
    const t = getTemplate(Number(params.id));
    if (!t) error(404);
    const id = saveTemplate({ ...t, id: undefined, name: `${t.name} copy`, is_default: false });
    redirect(303, `/labels/templates/${id}`);
  },
  delete: async ({ params }) => {
    deleteTemplate(Number(params.id));
    redirect(303, '/labels');
  }
};
