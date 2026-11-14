import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { HuntFeaturedCard, HuntTopicCard, type HuntCardData } from '@/components/HuntTopicCard';
import { activeHuntTopics, loadHunts, useHunts, type HuntTopic } from '@/lib/huntStore';
import { colors, radius, space, touch, type } from '@/theme';

// Mỗi chủ đề một màu nền riêng, gợi đúng hiện tượng (nước xanh, nam châm đỏ...). Chủ đề mới lấy màu theo thứ tự.
const tints: Record<string, string> = {
  friction: colors.surface,
  magnetism: colors.dangerSoft,
  absorption: colors.brandSoft,
  sound: colors.lilacSoft,
  elasticity: colors.lumenSoft,
};
const fallbackTints = [colors.lumenSoft, colors.brandSoft, colors.lilacSoft, colors.dangerSoft, colors.surface];

const open = (topicId: string) => router.push({ pathname: '/hunt/[topicId]', params: { topicId } });

export default function HuntList() {
  const insets = useSafeAreaInsets();
  const loaded = useHunts((state) => state.loaded);
  const progress = useHunts((state) => state.progress);
  const [error, setError] = useState(false);
  useEffect(() => { void loadHunts().catch(() => setError(true)); }, []);

  const cards = activeHuntTopics.map((topic: HuntTopic, index) => {
    const saved = progress[topic.id];
    const data: HuntCardData = {
      title: topic.title,
      task: topic.task,
      icon: topic.icon,
      tint: tints[topic.id] ?? fallbackTints[index % fallbackTints.length],
      required: topic.required,
      count: saved?.accepted.length ?? 0,
      done: !!saved?.completedAt,
      pending: !saved?.completedAt && !!saved?.draft?.photo,
    };
    return { id: topic.id, data, updatedAt: saved?.updatedAt ?? 0 };
  });

  // Thẻ nổi bật: chủ đề làm dở gần nhất; chưa có thì chủ đề đầu tiên chưa xong.
  const inProgress = cards.filter(({ data }) => !data.done && (data.count > 0 || data.pending));
  const featured = inProgress.length
    ? inProgress.reduce((latest, card) => card.updatedAt > latest.updatedAt ? card : latest)
    : cards.find(({ data }) => !data.done);
  const rest = cards.filter((card) => card !== featured);
  const ordered = [...rest.filter(({ data }) => !data.done), ...rest.filter(({ data }) => data.done)];

  const found = cards.reduce((sum, { data }) => sum + data.count, 0);
  const total = cards.reduce((sum, { data }) => sum + data.required, 0);
  const summary = !featured ? `Em đã hoàn thành cả ${cards.length} chủ đề` : `Đã tìm ${found}/${total} đồ vật`;

  const retry = () => { setError(false); void loadHunts().catch(() => setError(true)); };
  const sides = { paddingLeft: insets.left + space.md, paddingRight: insets.right + space.md };

  return (
    <View style={styles.root}>
      <View style={[styles.header, sides, { paddingTop: insets.top + space.sm }]}>
        <IconButton icon="chevron-back" label="Quay lại" size={touch} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
        <View style={styles.headerText}>
          <Text style={type.h1} accessibilityRole="header" numberOfLines={1} maxFontSizeMultiplier={1.3}>Săn đồ vật</Text>
          <Text style={type.caption} numberOfLines={1} maxFontSizeMultiplier={1.3}>{loaded && !error ? summary : ' '}</Text>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={[sides, styles.content, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.container}>
          {error ? (
            <View style={styles.error}>
              <Text style={[type.body, styles.errorText]}>Chưa mở được bài em đã lưu.</Text>
              <Button label="Thử mở lại bài đã lưu" onPress={retry} />
            </View>
          ) : !loaded ? (
            <View style={styles.container} accessible accessibilityLabel="Đang mở nhiệm vụ">
              <View style={[styles.skeleton, styles.skeletonFeatured]} />
              <View style={styles.grid}>
                {[0, 1, 2, 3].map((slot) => <View key={slot} style={[styles.skeleton, styles.cell, styles.skeletonTile]} />)}
              </View>
            </View>
          ) : (
            <>
              {featured && <HuntFeaturedCard data={featured.data} onPress={() => open(featured.id)} />}
              <View style={styles.grid}>
                {ordered.map(({ id, data }) => (
                  <HuntTopicCard key={id} data={data} style={styles.cell} onPress={() => open(id)} />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingBottom: space.sm },
  headerText: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: space.sm },
  container: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: space.md },
  // Hai cột; nếu lẻ thẻ thì thẻ cuối tự giãn hết hàng.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md - space.xs },
  cell: { flexGrow: 1, flexBasis: '40%' },
  skeleton: { backgroundColor: colors.bgAlt, borderRadius: radius.lg },
  skeletonFeatured: { height: 196, borderRadius: radius.xl },
  skeletonTile: { height: 156 },
  error: { gap: space.md, paddingTop: space.lg },
  errorText: { color: colors.muted },
});
