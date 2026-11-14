import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/Button';
import { Leaderboard } from '@/components/Leaderboard';
import { haptic } from '@/lib/haptics';
import { BADGES, badgeFor, loadHistory, type BadgeId, type JourneyRecord } from '@/lib/history';
import { pointsFromHistory } from '@/lib/leaderboard';
import { colors, font, radius, space, touch, type } from '@/theme';

// Từ dễ đến khó. Đạt mức cao thì cũng tính là đã đạt các mức thấp hơn (đúng hết câu thì cũng đã đi hết hành trình).
const ORDER: BadgeId[] = ['sprout', 'explorer', 'scientist'];
const ICONS: Record<BadgeId, keyof typeof Ionicons.glyphMap> = { sprout: 'leaf', explorer: 'ribbon', scientist: 'trophy' };
const BADGE_SIZE = 56;

/** Dải "Huy hiệu của bạn": đã đạt sáng màu, chưa đạt mờ kèm khóa. Chạm để xem cách nhận. */
function BadgeStrip({ history }: { history: JourneyRecord[] }) {
  const [selected, setSelected] = useState<BadgeId>();
  const best = Math.max(-1, ...history.map((r) => ORDER.indexOf(badgeFor(r.score, r.total))));

  return (
    <View style={styles.badges}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Huy hiệu của bạn</Text>
      <View style={styles.badgeRow}>
        {ORDER.map((id, tier) => {
          const earned = tier <= best;
          const active = selected === id;
          return (
            <Pressable
              key={id}
              style={styles.badge}
              accessibilityRole="button"
              accessibilityLabel={`${BADGES[id].name}. ${earned ? 'Đã nhận' : 'Chưa nhận'}. ${BADGES[id].desc}.`}
              accessibilityState={{ selected: active }}
              onPress={() => { haptic.tap(); setSelected(active ? undefined : id); }}
            >
              <View style={[styles.badgeIcon, earned ? styles.badgeEarned : styles.badgeLocked, active && styles.badgeActive]}>
                <Ionicons name={earned ? ICONS[id] : 'lock-closed'} size={24} color={earned ? colors.navy : colors.muted} />
              </View>
              <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                {BADGES[id].name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected && (
        <Text style={styles.badgeHint} maxFontSizeMultiplier={1.3} accessibilityLiveRegion="polite">
          {BADGES[selected].desc}
        </Text>
      )}
    </View>
  );
}

export default function Ranking() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<JourneyRecord[]>();
  useFocusEffect(useCallback(() => { loadHistory().then(setHistory); }, []));

  // undefined = đang đọc, null = chưa có hành trình nào.
  const youPoints = history === undefined ? undefined : history.length > 0 ? pointsFromHistory(history) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.header}>
        <IconButton
          icon="chevron-back"
          label="Quay lại"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          size={touch}
        />
        <Text style={styles.title} accessibilityRole="header">Bảng xếp hạng</Text>
        <View style={styles.headerBalance} />
      </View>
      <Leaderboard
        bottomInset={insets.bottom}
        youPoints={youPoints}
        header={<BadgeStrip history={history ?? []} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingBottom: space.sm },
  title: { ...type.h2, flex: 1, textAlign: 'center', marginHorizontal: space.sm },
  headerBalance: { width: touch },
  badges: { paddingTop: space.sm, paddingBottom: space.md, gap: space.sm },
  sectionTitle: { fontFamily: font.bold, fontSize: 16, lineHeight: 22, color: colors.navy },
  badgeRow: { flexDirection: 'row', gap: space.sm },
  badge: { flex: 1, minWidth: 0, minHeight: touch, alignItems: 'center', gap: space.xs, borderRadius: radius.md, paddingVertical: space.xs },
  badgeIcon: {
    width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE / 2,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg,
  },
  badgeEarned: { backgroundColor: colors.lumen },
  badgeLocked: { backgroundColor: colors.bgAlt },
  badgeActive: { borderColor: colors.brand },
  badgeName: { ...type.caption, color: colors.navy, fontFamily: font.semibold, textAlign: 'center' },
  badgeNameLocked: { color: colors.muted },
  badgeHint: { ...type.caption, textAlign: 'center' },
});
