import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { HuntFrame } from '@/components/HuntFrame';
import { activeHuntTopics, loadHunts, useHunts } from '@/lib/huntStore';
import { colors, radius, space, type } from '@/theme';

export default function HuntList() {
  const loaded = useHunts((state) => state.loaded);
  const progress = useHunts((state) => state.progress);
  const [error, setError] = useState(false);
  useEffect(() => { void loadHunts().catch(() => setError(true)); }, []);

  return (
    <HuntFrame back="/" title="Săn đồ vật">
      <Text style={styles.lead}>Chọn chủ đề, tìm đồ vật quanh em và giải thích điều em thấy.</Text>
      {error ? <Button label="Thử mở lại bài đã lưu" onPress={() => { setError(false); void loadHunts().catch(() => setError(true)); }} /> : !loaded ? (
        <ActivityIndicator color={colors.brand} accessibilityLabel="Đang mở nhiệm vụ" />
      ) : (
        <View style={styles.group}>
          {activeHuntTopics.map((topic, index) => {
            const saved = progress[topic.id];
            const count = saved?.accepted.length ?? 0;
            const done = !!saved?.completedAt;
            const started = count > 0 || !!saved?.draft?.photo;
            const status = done ? 'Đã hoàn thành' : `Đã tìm ${count} trên ${topic.required} đồ vật`;
            return (
              <Pressable key={topic.id} accessibilityRole="button" accessibilityLabel={`${topic.title}, ${status}`}
                onPress={() => router.push({ pathname: '/hunt/[topicId]', params: { topicId: topic.id } })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={[styles.icon, done && styles.iconDone]}>
                  <Ionicons name={topic.icon as keyof typeof Ionicons.glyphMap} size={24} color={done ? colors.mintInk : colors.brand} />
                </View>
                <View style={[styles.body, index > 0 && styles.divided]}>
                  <View style={styles.text}>
                    <Text style={type.bodyStrong} numberOfLines={2}>{topic.title}</Text>
                    {done ? (
                      <View style={styles.status}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.mintInk} />
                        <Text style={styles.doneText}>Hoàn thành</Text>
                      </View>
                    ) : (
                      <View style={styles.status}>
                        {Array.from({ length: topic.required }, (_, slot) => (
                          <View key={slot} style={[styles.pip, slot < count ? styles.pipDone : slot === count && started ? styles.pipNext : undefined]} />
                        ))}
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </HuntFrame>
  );
}

const styles = StyleSheet.create({
  lead: { ...type.body, color: colors.muted, textAlign: 'center' },
  // Nhóm phẳng như danh sách cài đặt: một nền trắng, hàng ngăn bằng vạch mảnh, không viền từng thẻ.
  group: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.md, minHeight: 72 },
  pressed: { backgroundColor: colors.bgAlt },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.brandSoft },
  iconDone: { backgroundColor: colors.mintSoft },
  body: { flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md, paddingRight: space.md },
  divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  text: { flex: 1, gap: 6 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 16 },
  pip: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.trail },
  pipDone: { backgroundColor: colors.brand, borderColor: colors.brand },
  pipNext: { backgroundColor: colors.lumen, borderColor: colors.lumenShade },
  doneText: { ...type.caption, color: colors.mintInk },
});
