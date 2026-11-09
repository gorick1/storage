// Keyboard-wedge barcode scanners "type" a code in a few milliseconds and press Enter.
// People type far slower, so timing tells them apart even while a text field has focus.
export function listenForScanner(onScan: (code: string) => void): () => void {
  let buf = '';
  let last = 0;
  let fastRun = 0;
  const MAX_GAP = 35;

  function onKey(e: KeyboardEvent) {
    const t = performance.now();
    const gap = t - last;
    last = t;
    if (e.key === 'Enter') {
      if (buf.length >= 4 && fastRun >= buf.length - 1) {
        const code = buf;
        const el = document.activeElement as HTMLInputElement | null;
        // Remove what the scanner typed into a focused field.
        if (el && 'value' in el && typeof el.value === 'string' && el.value.endsWith(code)) {
          el.value = el.value.slice(0, -code.length);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        e.preventDefault();
        e.stopPropagation();
        onScan(code);
      }
      buf = '';
      fastRun = 0;
      return;
    }
    if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
    if (gap > MAX_GAP) {
      buf = e.key;
      fastRun = 0;
    } else {
      buf += e.key;
      fastRun++;
    }
  }
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}
