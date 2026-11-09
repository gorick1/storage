import type { ItemDetails } from './records';

export const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;

/** "$1,299.99" → 129999 cents; blank or nonsense → null. */
export function parseMoney(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').replace(/[$,\s]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 10_000_000 ? Math.round(n * 100) : null;
}

export function parseDetails(f: FormData): ItemDetails {
  const str = (k: string, max = 120) => String(f.get(k) ?? '').trim().slice(0, max);
  const cond = str('condition');
  const date = str('purchase_date');
  return {
    brand: str('brand'),
    model: str('model'),
    category: str('category', 60),
    condition: (CONDITIONS as readonly string[]).includes(cond) ? cond : '',
    serial_number: str('serial_number'),
    purchase_price_cents: parseMoney(f.get('purchase_price')),
    purchase_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
  };
}
