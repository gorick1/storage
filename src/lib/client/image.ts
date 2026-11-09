/** Shrink a phone photo before upload: weak garage Wi-Fi shouldn't have to carry 5 MB. */
export async function resizeImage(file: Blob, max: number, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions).catch(() => null);
  const src: ImageBitmap | HTMLImageElement = bmp ?? (await loadImg(file));
  const w = 'naturalWidth' in src ? src.naturalWidth : src.width;
  const h = 'naturalHeight' in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d')!.drawImage(src, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process photo'))), 'image/jpeg', quality));
}

function loadImg(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read photo'));
    img.src = URL.createObjectURL(file);
  });
}

export async function blobToBase64(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

export interface PreparedPhoto { full: Blob; thumb: Blob; url: string }

export async function preparePhoto(file: Blob): Promise<PreparedPhoto> {
  const full = await resizeImage(file, 1600);
  const thumb = await resizeImage(full, 480, 0.78);
  return { full, thumb, url: URL.createObjectURL(thumb) };
}
