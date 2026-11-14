import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import type { preparePhoto } from '@/lib/preparePhoto';
import type { HuntPhoto, HuntProgress } from '@/lib/huntTypes';

const key = (topic: string) => `lumoslab.hunt.v1.${topic}`;

export async function loadHuntProgress(topic: string): Promise<HuntProgress | undefined> {
  const value = await AsyncStorage.getItem(key(topic));
  return value ? JSON.parse(value) : undefined;
}

export async function saveHuntProgress(progress: HuntProgress) {
  await AsyncStorage.setItem(key(progress.topicId), JSON.stringify(progress));
}

export async function saveHuntPhoto(topic: string, id: string, rev: number, photo: Awaited<ReturnType<typeof preparePhoto>>): Promise<HuntPhoto> {
  const dir = new Directory(Paths.document, 'lumos-hunt');
  dir.create({ idempotent: true, intermediates: true });
  const target = new File(dir, `${topic}-${id}-${rev}.jpg`);
  const source = new File(photo.uri);
  const digest = source.md5;
  if (!digest) throw new Error('Chưa đọc được ảnh.');
  await source.copy(target, { overwrite: true });
  return { uri: target.uri, digest, revision: rev };
}

export function deleteHuntPhoto(photo: HuntPhoto) {
  const file = new File(photo.uri);
  if (file.exists) file.delete();
}
