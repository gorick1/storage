import type { LabelData, LabelElement, LabelStock } from './types';
import { dots, fillText } from './types';
import { code128Modules } from './code128';

function esc(s: string) {
  // ^FH lets us hex-escape the two characters ZPL reserves.
  return s.replace(/_/g, '_5F').replace(/\^/g, '_5E').replace(/~/g, '_7E').replace(/[\r\n]+/g, ' ');
}

const ALIGN = { left: 'L', center: 'C', right: 'R' } as const;

/** ^A0 is CG Triumvirate Bold Condensed; width ≈ 0.85 × height reads closest to the on-screen preview. */
export function fontWidth(size: number) {
  return Math.round(size * 0.85);
}

/** Barcode module width that fills (but never exceeds) the element box. */
export function barcodeModule(value: string, w: number) {
  return Math.max(1, Math.min(10, Math.floor(w / code128Modules(value))));
}

export function elementZpl(el: LabelElement, data: LabelData): string {
  switch (el.type) {
    case 'text': {
      const text = esc(fillText(el.text, data));
      const rev = el.invert ? '^FR' : '';
      return `^FO${el.x},${el.y}^A0N,${el.size},${fontWidth(el.size)}^FB${el.w},${el.maxLines},0,${ALIGN[el.align]},0${rev}^FH^FD${text}^FS`;
    }
    case 'qr': {
      // ^BQ adds a fixed 10-dot top offset on most firmware; compensate so preview and print line up.
      const mag = Math.max(1, Math.min(10, el.size));
      return `^FO${el.x},${Math.max(0, el.y - 10)}^BQN,2,${mag}^FDMA,${data.qr}^FS`;
    }
    case 'barcode': {
      const m = barcodeModule(data.code, el.w);
      return `^FO${el.x},${el.y}^BY${m},3,${el.h}^BCN,${el.h},N,N,N^FD${esc(data.code)}^FS`;
    }
    case 'box':
      return `^FO${el.x},${el.y}^GB${el.w},${el.h},${el.fill ? Math.min(el.w, el.h) : el.thickness},B,0^FS`;
  }
}

export function renderZpl(stock: LabelStock, elements: LabelElement[], data: LabelData, copies = 1): string {
  const w = dots(stock.width_in, stock.dpi);
  const h = dots(stock.height_in, stock.dpi);
  const media = stock.media === 'continuous' ? 'N' : stock.media === 'mark' ? 'M' : 'Y';
  const head = [
    '^XA',
    '^CI28',
    `^MT${stock.method === 'TT' ? 'T' : 'D'}`,
    `^MN${media}`,
    `^PW${w}`,
    `^LL${h}`,
    '^LH0,0',
    `~SD${String(Math.max(0, Math.min(30, stock.darkness))).padStart(2, '0')}`
  ];
  return [...head, ...elements.map((e) => elementZpl(e, data)), `^PQ${Math.max(1, copies)}`, '^XZ'].join('\n');
}
