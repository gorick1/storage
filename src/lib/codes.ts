// Record codes. Every record has a permanent number and a one-letter type prefix.
//  - Display / barcode form: prefix + 6 zero-padded digits, e.g. I000042 (Code 128, app-only).
//  - QR path form: prefix + base-36 number, e.g. I16 (uppercase so QR encodes in alphanumeric mode).

export type Kind = 'item' | 'box' | 'location';

export const PREFIX: Record<Kind, string> = { item: 'I', box: 'B', location: 'L' };
const KIND_BY_PREFIX: Record<string, Kind> = { I: 'item', B: 'box', L: 'location' };

export function displayCode(kind: Kind, n: number): string {
  return PREFIX[kind] + String(n).padStart(6, '0');
}

export function qrCode(kind: Kind, n: number): string {
  return PREFIX[kind] + n.toString(36).toUpperCase();
}

export function qrUrl(base: string, kind: Kind, n: number): string {
  return base.replace(/\/+$/, '').toUpperCase() + '/' + qrCode(kind, n);
}

/** Parse anything a scanner or URL might hand us. Returns null when it isn't one of ours. */
export function parseCode(raw: string): { kind: Kind; number: number } | null {
  let s = raw.trim();
  // Full URL from a QR: keep the last path segment.
  const urlMatch = s.match(/^https?:\/\/[^/]+\/(?:go\/)?([A-Za-z0-9]+)\/?$/i);
  if (urlMatch) s = urlMatch[1];
  s = s.toUpperCase().replace(/[-\s]/g, '');
  const m = s.match(/^([IBL])([0-9A-Z]{1,7})$/);
  if (!m) return null;
  const kind = KIND_BY_PREFIX[m[1]];
  const body = m[2];
  // Barcode form is always exactly six digits; anything else is base-36 from a QR.
  const number = /^\d{6}$/.test(body) ? parseInt(body, 10) : parseInt(body, 36);
  if (!Number.isFinite(number) || number < 1) return null;
  return { kind, number };
}

export function pathFor(kind: Kind, n: number): string {
  return kind === 'item' ? `/items/${n}` : kind === 'box' ? `/boxes/${n}` : `/locations/${n}`;
}
