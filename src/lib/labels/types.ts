import type { Kind } from '../codes';

export type Align = 'left' | 'center' | 'right';

/** All geometry is in printer dots at the stock's dpi. */
export type LabelElement =
  | { id: string; type: 'text'; x: number; y: number; w: number; h: number; text: string; size: number; align: Align; maxLines: number; invert?: boolean }
  | { id: string; type: 'qr'; x: number; y: number; size: number }
  | { id: string; type: 'barcode'; x: number; y: number; w: number; h: number }
  | { id: string; type: 'box'; x: number; y: number; w: number; h: number; thickness: number; fill?: boolean };

export interface LabelStock {
  id: number;
  name: string;
  width_in: number;
  height_in: number;
  dpi: number;
  media: 'gap' | 'continuous' | 'mark';
  method: 'DT' | 'TT';
  darkness: number;
}

export interface LabelTemplate {
  id: number;
  name: string;
  kind: Kind;
  stock_id: number;
  elements: LabelElement[];
  is_default: boolean;
  auto_print: boolean;
}

/** Values a template can reference with {placeholders}. */
export interface LabelData {
  number: string; // I000042
  name: string;
  description: string;
  quantity: string;
  box: string; // box name
  box_number: string; // B000012
  location: string;
  contents: string; // boxes: first items
  item_count: string;
  brand: string;
  model: string;
  value: string; // MSRP or price paid
  qr: string; // full QR URL
  code: string; // barcode value (display code)
  date: string;
}

export const FIELDS: { key: keyof LabelData; label: string; kinds: Kind[] }[] = [
  { key: 'name', label: 'Name', kinds: ['item', 'box', 'location'] },
  { key: 'number', label: 'Number', kinds: ['item', 'box', 'location'] },
  { key: 'description', label: 'Description', kinds: ['item'] },
  { key: 'brand', label: 'Brand', kinds: ['item'] },
  { key: 'model', label: 'Model', kinds: ['item'] },
  { key: 'value', label: 'Value', kinds: ['item', 'box'] },
  { key: 'quantity', label: 'Quantity', kinds: ['item'] },
  { key: 'box', label: 'Box name', kinds: ['item'] },
  { key: 'box_number', label: 'Box number', kinds: ['item'] },
  { key: 'location', label: 'Location', kinds: ['item', 'box'] },
  { key: 'contents', label: 'Contents', kinds: ['box', 'location'] },
  { key: 'item_count', label: 'Item count', kinds: ['box', 'location'] },
  { key: 'date', label: 'Date printed', kinds: ['item', 'box', 'location'] }
];

export function dots(inches: number, dpi: number) {
  return Math.round(inches * dpi);
}

export function fillText(text: string, data: LabelData): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (k in data ? String(data[k as keyof LabelData] ?? '') : `{${k}}`));
}
