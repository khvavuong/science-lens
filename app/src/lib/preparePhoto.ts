import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { captureCrop } from '@/lib/captureCrop';

export async function preparePhoto(uri: string, crop?: ReturnType<typeof captureCrop>) {
  const context = ImageManipulator.manipulate(uri);
  if (crop) context.crop(crop);
  context.resize({ width: 768 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.72, base64: true });
  if (!result.base64) throw new Error('Không đọc được ảnh.');
  return { uri: result.uri, base64: result.base64 };
}
