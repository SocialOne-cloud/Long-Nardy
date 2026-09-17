export const PHOTO_SIZE = 128;

export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = src;
  });
}

export interface CropSpec {
  /** 1 = the largest square that fits; larger zooms in. */
  zoom: number;
  /** Centre offset in source pixels. */
  offsetX: number;
  offsetY: number;
}

/**
 * Crops to a square around the chosen centre, resizes to 128x128 and
 * compresses to JPEG. The result is a data URL small enough to live in the
 * room's database entry (typically 6-12 KB).
 */
export function cropToSquare(img: HTMLImageElement, spec: CropSpec, quality = 0.82): string {
  const side = Math.min(img.naturalWidth, img.naturalHeight) / Math.max(spec.zoom, 1);
  const maxX = (img.naturalWidth - side) / 2;
  const maxY = (img.naturalHeight - side) / 2;
  const cx = img.naturalWidth / 2 + clamp(spec.offsetX, -maxX, maxX);
  const cy = img.naturalHeight / 2 + clamp(spec.offsetY, -maxY, maxY);

  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, cx - side / 2, cy - side / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  return canvas.toDataURL('image/jpeg', quality);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}
