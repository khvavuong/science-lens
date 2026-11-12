import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/Button';
import { BADGES, badgeFor, loadHistory, type BadgeId, type JourneyRecord } from '@/lib/history';
import { colors, font, radius, space, type } from '@/theme';

const ICONS: Record<BadgeId, keyof typeof Ionicons.glyphMap> = { scientist: 'trophy', explorer: 'ribbon', sprout: 'leaf' };
const ORDER: BadgeId[] = ['scientist', 'explorer', 'sprout'];

/** Bảng thành tích: tổng số đồ vật, câu đúng, và các huy hiệu đã nhận. */
export default function Badges() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<JourneyRecord[]>([]);
  useFocusEffect(useCallback(() => { loadHistory().then(setItems); }, []));

  const counts = ORDER.reduce((acc, id) => ({ ...acc, [id]: 0 }), {} as Record<BadgeId, number>);
  items.forEach((r) => { counts[badgeFor(r.score, r.total)]++; });
  const correct = items.reduce((a, r) => a + r.score, 0);
  const asked = items.reduce((a, r) => a + r.total, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" label="Quay lại" onPress={() => router.back()} />
        <Text style={type.h2} accessibilityRole="header">Bảng thành tích</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.summary}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{items.length}</Text>
            <Text style={styles.statLabel}>đồ vật đã khám phá</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{correct}<Text style={styles.statOf}>/{asked}</Text></Text>
            <Text style={styles.statLabel}>câu trả lời đúng</Text>
          </View>
        </View>

        <Text style={type.h2}>Huy hiệu</Text>
        {ORDER.map((id) => {
          const n = counts[id];
          const got = n > 0;
          return (
            <View key={id} style={styles.badge} accessible accessibilityLabel={`${BADGES[id].name}. ${BADGES[id].desc}. ${got ? `Đã nhận ${n} lần` : 'Chưa nhận'}`}>
              <View style={[styles.badgeIcon, got ? { backgroundColor: colors.lumen } : { backgroundColor: colors.bgAlt }]}>
                <Ionicons name={got ? ICONS[id] : 'lock-closed'} size={24} color={got ? colors.navy : colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.badgeName, !got && { color: colors.muted }]}>{BADGES[id].name}</Text>
                <Text style={type.caption}>{BADGES[id].desc}</Text>
              </View>
              {got && <Text style={styles.times}>x{n}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md },
  scroll: { padding: space.lg, gap: 14 },
  summary: { flexDirection: 'row', alignItems: 'center', padding: space.md, borderRadius: radius.xl, backgroundColor: colors.navy, marginBottom: space.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: font.black, fontSize: 30, color: colors.lumen },
  statOf: { fontFamily: font.bold, fontSize: 18, color: colors.trail },
  statLabel: { fontFamily: font.medium, fontSize: 13, color: colors.trail },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.navySoft },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.divider },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontFamily: font.bold, fontSize: 16, color: colors.navy },
  times: { fontFamily: font.black, fontSize: 16, color: colors.navy },
});
