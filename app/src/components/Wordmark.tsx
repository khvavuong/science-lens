import { Image } from 'expo-image';

export const wordmarkImage = require('../../assets/lumoslab-wordmark.png');
export const wordmarkAspectRatio = 1024 / 207;

export function Wordmark({ width }: { width: number }) {
  return (
    <Image
      source={wordmarkImage}
      contentFit="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel="lumoslab"
      style={{ width: '100%', maxWidth: width, aspectRatio: wordmarkAspectRatio }}
    />
  );
}
