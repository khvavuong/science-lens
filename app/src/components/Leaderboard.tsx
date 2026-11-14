import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState, type ReactElement } from 'react';
import { FlatList, StyleSheet, Text, View, type ListViewToken } from 'react-native';
import { standingsWith, type Standing } from '@/lib/leaderboard';
import { colors, font, radius, space, type } from '@/theme';

const pointsFormat = new Intl.NumberFormat('vi-VN');
const AVATAR = 40;
const PODIUM_AVATAR = 56;
const WINNER_AVATAR = 72;

/** Bục 3 hạng đầu là một item của danh sách để theo dõi được người dùng có đang hiện trên màn không. */
type Item =
  | { kind: 'podium'; key: string; places: Standing[] }
  | { kind: 'row'; key: string; standing: Standing };

const hasYou = (item: Item) => item.kind === 'podium' ? item.places.some((p) => p.you) : item.standing.you;

function entryLabel(s: Standing) {
  return `${s.you ? 'Bạn. ' : `${s.name}. `}Hạng ${s.rank}. ${pointsFormat.format(s.points)} điểm.`;
}

function Avatar({ standing, size }: { standing: Standing; size: number }) {
  const frame = { width: size, height: size, borderRadius: size / 2 };
  if (!standing.avatar) {
    return (
      <View style={[frame, styles.youAvatar]}>
        <Ionicons name="person" size={size * 0.5} color={colors.brand} />
      </View>
    );
  }
  return <Image source={standing.avatar} style={[frame, styles.avatar]} contentFit="contain" accessible={false} />;
}

// Thứ tự trên bục: hạng 2 bên trái, hạng 1 ở giữa (cao nhất), hạng 3 bên phải.
const PODIUM_ORDER = [1, 0, 2] as const;
const STAND = [
  { height: 64, backgroundColor: colors.lumen },
  { height: 48, backgroundColor: colors.brandSoft },
  { height: 36, backgroundColor: colors.surface },
] as const;

function Podium({ places }: { places: Standing[] }) {
  return (
    <View style={styles.podium}>
      {PODIUM_ORDER.map((position) => {
        const s = places[position];
        if (!s) return <View key={position} style={styles.place} />;
        return (
          <View key={s.key} style={styles.place} accessible accessibilityLabel={entryLabel(s)}>
            <Avatar standing={s} size={position === 0 ? WINNER_AVATAR : PODIUM_AVATAR} />
            <View style={styles.podiumNameSlot}>
              <Text style={[styles.podiumName, s.you && styles.youText]} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                {s.name}
              </Text>
            </View>
            <Text style={styles.points} maxFontSizeMultiplier={1.3}>{pointsFormat.format(s.points)}</Text>
            <View style={[styles.stand, STAND[position]]}>
              <Text style={styles.standRank} maxFontSizeMultiplier={1.3}>{s.rank}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Row({ standing: s }: { standing: Standing }) {
  return (
    <View style={[styles.row, s.you && styles.youRow]} accessible accessibilityLabel={entryLabel(s)}>
      <Text style={styles.rank} maxFontSizeMultiplier={1.3}>{s.rank}</Text>
      <Avatar standing={s} size={AVATAR} />
      <Text style={[styles.name, s.you && styles.youText]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{s.name}</Text>
      <Text style={styles.points} maxFontSizeMultiplier={1.3}>{pointsFormat.format(s.points)}</Text>
    </View>
  );
}

/** Hàng "Bạn" ghim phía trên thanh điều hướng, kiểu Duolingo. Chưa có hành trình thì mời khám phá thay cho điểm 0. */
function PinnedYou({ you, bottomInset }: { you: Standing | undefined; bottomInset: number }) {
  return (
    <View style={[styles.pinned, { paddingBottom: bottomInset + space.sm }]}>
      {you ? <Row standing={you} /> : (
        <View
          style={[styles.row, styles.youRow]}
          accessible
          accessibilityLabel="Bạn chưa có trên bảng. Hoàn thành một khám phá để lên bảng."
        >
          <View style={styles.rankSlot} />
          <Avatar standing={{ key: 'you', rank: 0, name: 'Bạn', points: 0, you: true }} size={AVATAR} />
          <View style={styles.identity}>
            <Text style={styles.youName} maxFontSizeMultiplier={1.3}>Bạn</Text>
            <Text style={type.caption} maxFontSizeMultiplier={1.3}>Hoàn thành một khám phá để lên bảng</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * `youPoints`: undefined = đang đọc lịch sử, null = chưa có hành trình, số = điểm của người dùng.
 * `header`: phần đặt trên bục (vd. dải huy hiệu), cuộn cùng danh sách.
 */
export function Leaderboard({ bottomInset, youPoints, header }: {
  bottomInset: number;
  youPoints: number | null | undefined;
  header?: ReactElement;
}) {
  const standings = standingsWith(youPoints ?? null);
  const you = standings.find((s) => s.you);
  const items: Item[] = [
    { kind: 'podium', key: 'podium', places: standings.slice(0, 3) },
    ...standings.slice(3).map((standing): Item => ({ kind: 'row', key: standing.key, standing })),
  ];

  // Ẩn hàng ghim khi hàng của người dùng đang hiện trong danh sách, tránh lặp thông tin.
  const [youVisible, setYouVisible] = useState(false);
  const [viewability] = useState(() => ({
    config: { itemVisiblePercentThreshold: 60 },
    onChange: ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      setYouVisible(viewableItems.some((v) => hasYou(v.item as Item)));
    },
  }));

  const showPinned = youPoints !== undefined && !(you && youVisible);

  return (
    <View style={styles.root}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: (showPinned ? 0 : bottomInset) + space.lg }]}
        showsVerticalScrollIndicator={false}
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => item.kind === 'podium' ? <Podium places={item.places} /> : <Row standing={item.standing} />}
        ListHeaderComponent={header}
        viewabilityConfig={viewability.config}
        onViewableItemsChanged={viewability.onChange}
      />
      {showPinned && <PinnedYou you={you} bottomInset={bottomInset} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: space.md },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, paddingTop: space.md, marginBottom: space.sm },
  place: { flex: 1, minWidth: 0, alignItems: 'center', gap: space.xs },
  podiumNameSlot: { minHeight: 42, justifyContent: 'flex-end', alignSelf: 'stretch' },
  podiumName: { fontFamily: font.bold, fontSize: 16, lineHeight: 21, color: colors.navy, textAlign: 'center' },
  stand: {
    alignSelf: 'stretch', marginTop: space.xs, alignItems: 'center', justifyContent: 'center',
    borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm,
  },
  standRank: { fontFamily: font.black, fontSize: 20, color: colors.navy, fontVariant: ['tabular-nums'] },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 56,
    paddingHorizontal: space.sm, paddingVertical: space.xs,
    borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  youRow: { backgroundColor: colors.brandSoft, borderRadius: radius.md, borderBottomWidth: 0 },
  rank: { width: 28, textAlign: 'center', fontFamily: font.black, fontSize: 16, color: colors.muted, fontVariant: ['tabular-nums'] },
  rankSlot: { width: 28 },
  avatar: { backgroundColor: colors.brandSoft },
  youAvatar: { backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.brand },
  identity: { flex: 1, minWidth: 0 },
  name: { flex: 1, minWidth: 0, fontFamily: font.semibold, fontSize: 16, lineHeight: 22, color: colors.navy },
  youText: { fontFamily: font.black, color: colors.brand },
  youName: { fontFamily: font.black, fontSize: 16, lineHeight: 22, color: colors.brand },
  points: { fontFamily: font.black, fontSize: 16, color: colors.navy, fontVariant: ['tabular-nums'] },
  pinned: {
    paddingHorizontal: space.md, paddingTop: space.sm, backgroundColor: colors.bg,
    borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth,
  },
});
