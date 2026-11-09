import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayCode, qrCode, qrUrl, parseCode } from '../src/lib/codes.ts';

test('display and qr forms', () => {
  assert.equal(displayCode('item', 42), 'I000042');
  assert.equal(qrCode('item', 1295), 'IZZ');
  assert.equal(qrUrl('https://gtor.cc', 'box', 12), 'HTTPS://GTOR.CC/BC');
});

test('qr url stays within 20 chars for 46,655 items on gtor.cc', () => {
  assert.ok(qrUrl('https://gtor.cc', 'item', 46655).length <= 20);
});

test('parse barcode, qr path, url, lowercase', () => {
  assert.deepEqual(parseCode('I000042'), { kind: 'item', number: 42 });
  assert.deepEqual(parseCode('IZZ'), { kind: 'item', number: 1295 });
  assert.deepEqual(parseCode('izz'), { kind: 'item', number: 1295 });
  assert.deepEqual(parseCode('HTTPS://GTOR.CC/BC'), { kind: 'box', number: 12 });
  assert.deepEqual(parseCode('https://storage.garrettorick.com/L1'), { kind: 'location', number: 1 });
  assert.equal(parseCode('hello'), null);
  assert.equal(parseCode('X123'), null);
});
