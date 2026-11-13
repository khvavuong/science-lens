export function captureCrop(image: { width: number; height: number }, viewport: { width: number; height: number }) {
  if (Math.min(image.width, image.height, viewport.width, viewport.height) <= 0) throw new Error('Invalid camera dimensions');
  const scale = Math.max(viewport.width / image.width, viewport.height / image.height);
  const width = viewport.width * 0.68;
  const height = width / 0.9;
  const x = (viewport.width - width) / 2;
  const y = (viewport.height - 80 - height) / 2;
  return {
    originX: Math.max(0, Math.round((x + (image.width * scale - viewport.width) / 2) / scale)),
    originY: Math.max(0, Math.round((y + (image.height * scale - viewport.height) / 2) / scale)),
    width: Math.round(width / scale), height: Math.round(height / scale),
  };
}
