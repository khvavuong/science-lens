import AsyncStorage from '@react-native-async-storage/async-storage';

export interface JourneyRecord {
  storyId: string;
  label: string;
  title: string;
  score: number;
  total: number;
  at: number;
  /** Ảnh người dùng chụp (file cache trên máy, có thể đã bị hệ điều hành dọn). */
  photoUri?: string;
  concept?: string;
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

export async function saveJourney(r: JourneyRecord) {
  try {
    const list = (await loadHistory()).filter((x) => x.storyId !== r.storyId);
    await AsyncStorage.setItem(KEY, JSON.stringify([r, ...list].slice(0, 20)));
  } catch { /* không chặn người dùng nếu lưu lỗi */ }
}
