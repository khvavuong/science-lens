import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface JourneyRecord {
  storyId: string;
  label: string;
  title: string;
  score: number;
  total: number;
  at: number;
  /** Ảnh lưu trên thiết bị. Bản ghi cũ có thể còn trỏ tới cache. */
  photoUri?: string;
  concept?: string;
  recapKey?: string;
  videoUri?: string;
}

export type BadgeId = 'scientist' | 'explorer' | 'sprout';

/** Huy hiệu theo điểm quiz. Dùng chung cho màn Hoàn thành và Bảng thành tích. */
export const BADGES: Record<BadgeId, { name: string; desc: string }> = {
  scientist: { name: 'Nhà khoa học nhí', desc: 'Đúng hết các câu thử thách' },
  explorer: { name: 'Nhà thám hiểm tò mò', desc: 'Đúng từ một nửa số câu trở lên' },
  sprout: { name: 'Mầm non khám phá', desc: 'Đi hết một hành trình' },
};

export function badgeFor(score: number, total: number): BadgeId {
  if (total > 0 && score === total) return 'scientist';
  if (score >= Math.ceil(total / 2)) return 'explorer';
  return 'sprout';
}

const KEY = 'lumoslab.history.v1';

export async function loadHistory(): Promise<JourneyRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as JourneyRecord[]) : [];
  } catch {
    return [];
  }
}

let writes: Promise<void> = Promise.resolve();

export function saveJourney(r: JourneyRecord) {
  writes = writes.catch(() => {}).then(async () => {
    const list = await loadHistory();
    const previous = list.find(x => x.storyId === r.storyId);
    let photoUri = r.photoUri;
    if (photoUri && new File(photoUri).exists && !photoUri.startsWith(Paths.document.uri)) {
      const saved = new File(Paths.document, `discovery-${r.storyId}.jpg`);
      await new File(photoUri).copy(saved, { overwrite: true });
      photoUri = saved.uri;
    }
    const videoUri = previous?.recapKey === r.recapKey ? previous?.videoUri : undefined;
    await AsyncStorage.setItem(KEY, JSON.stringify([{ ...r, photoUri, videoUri }, ...list.filter(x => x.storyId !== r.storyId)].slice(0, 20)));
  });
  return writes;
}

export function saveRecap(storyId: string, recapKey: string, videoUri: string) {
  writes = writes.catch(() => {}).then(async () => {
    const list = await loadHistory();
    const record = list.find(x => x.storyId === storyId && x.recapKey === recapKey);
    if (!record) return;
    record.videoUri = videoUri;
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  });
  return writes;
}
