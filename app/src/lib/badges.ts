import { badgeFor, type BadgeId, type JourneyRecord } from '@/lib/history';

/** Từ dễ đến khó, cũng là thứ tự các mốc trên bản đồ (từ trên xuống). */
export const BADGE_ORDER: BadgeId[] = ['sprout', 'explorer', 'scientist'];

/**
 * Số huy hiệu đã đạt, tính lũy tiến: đạt mức cao thì các mức thấp hơn cũng tính là đã đạt
 * (đúng hết câu thì cũng đã đi hết hành trình). 0 = chưa có hành trình nào.
 */
export function earnedBadgeCount(history: JourneyRecord[]): number {
  return 1 + Math.max(-1, ...history.map((r) => BADGE_ORDER.indexOf(badgeFor(r.score, r.total))));
}
