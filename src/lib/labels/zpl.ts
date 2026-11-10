import type { LabelData, LabelElement, LabelStock } from './types';
import { dots, fillText } from './types';
import { code128Modules } from './code128';
import QRCode from 'qrcode';

/**
 * QR codes are sent as an exact bitmap (^GFA) rather than the printer's ^BQ command.
 * ^BQ positions the symbol with firmware-dependent offsets, so it landed lower than the
 * design and overlapped other text. A bitmap prints exactly where the preview shows it.
 */
export function qrGraphic(text: string, mag: number): { zpl: string; size: number } {
  const q = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = q.modules.size;
  const size = n * mag;
  const bytesPerRow = Math.ceil(size / 8);
  let hex = '';
  for (let y = 0; y < size; y++) {
    const r = Math.floor(y / mag);
    for (let b = 0; b < bytesPerRow; b++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = b * 8 + bit;
        if (x < size && q.modules.get(r, Math.floor(x / mag))) byte |= 0x80 >> bit;
      }
      hex += byte.toString(16).padStart(2, '0').toUpperCase();
    }
  }
  const total = bytesPerRow * size;
  return { zpl: `^GFA,${total},${total},${bytesPerRow},${hex}`, size };
}

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
      const mag = Math.max(1, Math.min(10, el.size));
      return `^FO${el.x},${el.y}${qrGraphic(data.qr, mag).zpl}^FS`;
    }
    case 'barcode': {
      const m = barcodeModule(data.code, el.w);
      return `^FO${el.x},${el.y}^BY${m},3,${el.h}^BCN,${el.h},N,N,N^FD${esc(data.code)}^FS`;
    }
    case 'box':
      return `^FO${el.x},${el.y}^GB${el.w},${el.h},${el.fill ? Math.min(el.w, el.h) : el.thickness},B,0^FS`;
  }
}

/** Share of the label covered by solid black. Big fills draw a lot of current from the printer's power supply. */
export function fillCoverage(stock: LabelStock, elements: LabelElement[]): number {
  const area = dots(stock.width_in, stock.dpi) * dots(stock.height_in, stock.dpi);
  const black = elements.reduce((sum, e) => sum + (e.type === 'box' && e.fill ? e.w * e.h : 0), 0);
  return area ? black / area : 0;
}

export function renderZpl(stock: LabelStock, elements: LabelElement[], data: LabelData, copies = 1): string {
  const w = dots(stock.width_in, stock.dpi);
  const h = dots(stock.height_in, stock.dpi);
  // Slow down for heavy black areas so the printhead's current draw stays within the power supply.
  const base = Math.max(2, Math.min(6, stock.speed ?? 3));
  const speed = fillCoverage(stock, elements) > 0.08 ? 2 : base;
  const media = stock.media === 'continuous' ? 'N' : stock.media === 'mark' ? 'M' : 'Y';
  const head = [
    '^XA',
    '^CI28',
    `^MT${stock.method === 'TT' ? 'T' : 'D'}`,
    `^MN${media}`,
    `^PW${w}`,
    `^LL${h}`,
    '^LH0,0',
    `^PR${speed},${speed},${speed}`,
    // Darkness as a per-label offset from the printer's own setting (15 = no change). ~SD would rewrite the saved setting on every label.
    `^MD${Math.max(-15, Math.min(15, Math.round(stock.darkness) - 15))}`
  ];
  return [...head, ...elements.map((e) => elementZpl(e, data)), `^PQ${Math.max(1, copies)}`, '^XZ'].join('\n');
}
