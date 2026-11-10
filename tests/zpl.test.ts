import { test } from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';

// Same bit-packing as src/lib/labels/zpl.ts qrGraphic, checked against the qrcode matrix.
function pack(text: string, mag: number) {
  const q = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = q.modules.size * mag;
  const bpr = Math.ceil(size / 8);
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = '';
    for (let b = 0; b < bpr; b++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = b * 8 + bit;
        if (x < size && q.modules.get(Math.floor(y / mag), Math.floor(x / mag))) byte |= 0x80 >> bit;
      }
      row += byte.toString(2).padStart(8, '0');
    }
    rows.push(row.slice(0, size));
  }
  return { q, rows, size };
}

test('QR bitmap matches the module matrix at the right scale', () => {
  const { q, rows, size } = pack('HTTPS://GTOR.CC/IZZZ', 3);
  assert.equal(size, q.modules.size * 3);
  for (let r = 0; r < q.modules.size; r++)
    for (let c = 0; c < q.modules.size; c++)
      assert.equal(rows[r * 3 + 1][c * 3 + 2] === '1', !!q.modules.get(r, c));
});

test('gtor.cc item URL fits the smallest QR (21x21)', () => {
  assert.equal(QRCode.create('HTTPS://GTOR.CC/IZZZ', { errorCorrectionLevel: 'M' }).modules.size, 21);
});
