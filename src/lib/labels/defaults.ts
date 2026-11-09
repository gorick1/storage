import type { LabelElement } from './types';
import type { Kind } from '../codes';

let n = 0;
const id = () => `e${++n}`;

/** Sensible starting layouts. Coordinates assume 203 dpi; they are rescaled for other stocks. */
export function defaultElements(kind: Kind, widthDots: number, heightDots: number): LabelElement[] {
  const W = widthDots;
  const H = heightDots;
  const pad = Math.round(Math.min(W, H) * 0.06);
  if (kind === 'item') {
    const qrMag = H < 260 ? 3 : 5;
    const qrSize = 25 * qrMag;
    const right = pad + qrSize + pad;
    const colW = W - right - pad;
    return [
      { id: id(), type: 'qr', x: pad, y: pad, size: qrMag },
      { id: id(), type: 'text', x: right, y: pad, w: colW, h: 64, text: '{name}', size: Math.round(H * 0.15), align: 'left', maxLines: 2 },
      { id: id(), type: 'text', x: right, y: pad + Math.round(H * 0.34), w: colW, h: 30, text: '{box} · {box_number}', size: Math.round(H * 0.1), align: 'left', maxLines: 1 },
      { id: id(), type: 'barcode', x: right, y: H - pad - Math.round(H * 0.26), w: colW, h: Math.round(H * 0.17) },
      { id: id(), type: 'text', x: right, y: H - pad - Math.round(H * 0.08), w: colW, h: 20, text: '{number}', size: Math.round(H * 0.08), align: 'left', maxLines: 1 },
      { id: id(), type: 'text', x: pad, y: pad + qrSize + 4, w: qrSize, h: 20, text: '{location}', size: Math.round(H * 0.07), align: 'center', maxLines: 1 }
    ];
  }
  // Boxes and locations: big readable name, QR you can scan from across the garage, contents list.
  const qrMag = Math.max(4, Math.min(10, Math.floor((H * 0.45) / 25)));
  const qrSize = 25 * qrMag;
  const textW = W - pad * 3 - qrSize;
  return [
    { id: id(), type: 'box', x: pad, y: pad, w: W - pad * 2, h: Math.round(H * 0.2), thickness: 4, fill: true },
    { id: id(), type: 'text', x: pad + 12, y: pad + Math.round(H * 0.04), w: W - pad * 2 - 24, h: Math.round(H * 0.14), text: '{name}', size: Math.round(H * 0.12), align: 'left', maxLines: 1, invert: true },
    { id: id(), type: 'qr', x: W - pad - qrSize, y: pad + Math.round(H * 0.25), size: qrMag },
    { id: id(), type: 'text', x: pad, y: pad + Math.round(H * 0.25), w: textW, h: Math.round(H * 0.13), text: '{number}', size: Math.round(H * 0.11), align: 'left', maxLines: 1 },
    { id: id(), type: 'text', x: pad, y: pad + Math.round(H * 0.39), w: textW, h: Math.round(H * 0.07), text: kind === 'box' ? '{location} · {item_count} items' : '{item_count} items', size: Math.round(H * 0.06), align: 'left', maxLines: 1 },
    { id: id(), type: 'text', x: pad, y: pad + Math.round(H * 0.49), w: textW, h: Math.round(H * 0.3), text: '{contents}', size: Math.round(H * 0.05), align: 'left', maxLines: 5 },
    { id: id(), type: 'barcode', x: pad, y: H - pad - Math.round(H * 0.11), w: W - pad * 2, h: Math.round(H * 0.11) }
  ];
}
