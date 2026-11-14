import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { DiscoveryShare } from '@/components/DiscoveryShare';
import { haptic } from '@/lib/haptics';
import { loadHistory, type JourneyRecord } from '@/lib/history';
import { useJourney } from '@/lib/store';
import { colors, font, radius, space, type } from '@/theme';

const GAP = 12;
const DAY = 24 * 60 * 60 * 1000;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const initial = (s: string) => ([...s.trim()][0] ?? '?').toUpperCase();

/** Ngày tương đối theo lịch: "Hôm nay", "Hôm qua", "3 ngày trước", "2 tuần trước", rồi tới ngày cụ thể. */
function relativeDay(at: number, now: number) {
  const startOf = (t: number) => new Date(t).setHours(0, 0, 0, 0);
  const days = Math.round((startOf(now) - startOf(at)) / DAY);
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  if (days < 28) return `${Math.floor(days / 7)} tuần trước`;
  const d = new Date(at);
  const dm = `${d.getDate()}/${d.getMonth() + 1}`;
  return d.getFullYear() === new Date(now).getFullYear() ? dm : `${dm}/${d.getFullYear()}`;
}

/** Kho khám phá: lưới ảnh các đồ vật đã khám phá. Chạm để xem lại, chạm giữ hoặc nút góc ảnh để chia sẻ. */
export default function Library() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // null = đang đọc lịch sử: không hiện empty state để tránh nháy.
  const [data, setData] = useState<{ items: JourneyRecord[]; now: number } | null>(null);
  const [sharing, setSharing] = useState<JourneyRecord>();
  const [broken, setBroken] = useState<ReadonlySet<string>>(() => new Set());
  const openStory = useJourney((s) => s.openStory);

  useFocusEffect(useCallback(() => {
    let active = true;
    loadHistory().then(items => { if (active) setData({ items, now: Date.now() }); });
    return () => { active = false; };
  }, []));

  const tileWidth = Math.floor((width - insets.left - insets.right - space.md * 2 - GAP) / 2);
  const items = data?.items;

  const reopen = async (r: JourneyRecord) => {
    haptic.tap();
    try {
      await openStory(r.storyId);
      router.push({ pathname: '/story', params: { from: 'library', autoplay: '1' } });
    } catch {
      Alert.alert('Chưa mở được', 'Cần kết nối mạng để mở lại câu chuyện này.');
    }
  };

  const share = (r: JourneyRecord) => {
    haptic.select();
    setSharing(r);
  };

  const renderTile = ({ item: r }: { item: JourneyRecord }) => {
    const name = cap(r.label);
    const when = relativeDay(r.at, data?.now ?? r.at);
    const hasPhoto = !!r.photoUri && !broken.has(r.storyId);
    // Nút chia sẻ là anh em (không lồng) với ô: trên web, <button> không được chứa <button>.
    return (
      <View style={{ width: tileWidth }}>
        <Pressable
          onPress={() => reopen(r)}
          onLongPress={() => share(r)}
          accessibilityRole="button"
          accessibilityLabel={`${name}. ${r.title}. Đúng ${r.score} trên ${r.total} câu. ${when}`}
          accessibilityHint="Chạm để xem lại câu chuyện"
          accessibilityActions={[{ name: 'activate' }, { name: 'share', label: 'Chia sẻ' }]}
          onAccessibilityAction={({ nativeEvent: { actionName } }) => {
            if (actionName === 'activate') reopen(r);
            else if (actionName === 'share') share(r);
          }}
        >
          {({ pressed }) => (
            <>
              <View style={[styles.photo, !hasPhoto && styles.placeholder, pressed && styles.pressed]}>
                {hasPhoto ? (
                  <Image
                    source={{ uri: r.photoUri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={120}
                    accessible={false}
                    onError={() => setBroken(prev => new Set(prev).add(r.storyId))}
                  />
                ) : (
                  <Text style={styles.initial} maxFontSizeMultiplier={1} accessible={false}>{initial(r.label)}</Text>
                )}
                <View style={styles.score} accessible={false}>
                  <Ionicons name="star" size={13} color={colors.navy} />
                  <Text style={styles.scoreText} maxFontSizeMultiplier={1.3}>{r.score}/{r.total}</Text>
                </View>
              </View>
              <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.3}>{name}</Text>
              <Text style={type.caption} numberOfLines={1} maxFontSizeMultiplier={1.3}>{when}</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => share(r)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Chia sẻ ${name}`}
          style={({ pressed: p }) => [styles.shareBtn, p && styles.shareBtnPressed]}
        >
          <Ionicons name="share-outline" size={17} color={colors.white} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" label="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
        <View style={styles.headerText}>
          <Text style={type.h2} accessibilityRole="header" numberOfLines={1}>Kho khám phá</Text>
          {!!items?.length && <Text style={type.caption}>{items.length} đồ vật</Text>}
        </View>
      </View>

      {sharing && <DiscoveryShare record={sharing} onClose={() => setSharing(undefined)} />}

      {items && items.length === 0 && (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="albums" size={36} color={colors.brand} /></View>
          <Text style={[type.h2, styles.center]}>Kho còn trống</Text>
          <Text style={[type.body, styles.center, { color: colors.muted }]}>Mỗi đồ vật bạn khám phá sẽ được cất vào đây để xem lại bất cứ lúc nào.</Text>
          <Button label="Quét đồ vật đầu tiên" icon="camera" onPress={() => router.push('/scan')} style={styles.emptyCta} />
        </View>
      )}

      {!!items?.length && (
        <FlatList
          data={items}
          keyExtractor={(r) => r.storyId}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={[styles.grid, { paddingLeft: insets.left + space.md, paddingRight: insets.right + space.md }]}
          extraData={broken}
          renderItem={renderTile}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingBottom: space.sm },
  headerText: { flex: 1 },
  grid: { paddingTop: space.sm, paddingBottom: space.lg, gap: space.md + space.xs },
  photo: {
    aspectRatio: 4 / 5, borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center',
  },
  placeholder: { backgroundColor: colors.lumenSoft },
  pressed: { opacity: 0.85 },
  initial: { fontFamily: font.black, fontSize: 56, lineHeight: 68, color: colors.navy },
  score: {
    position: 'absolute', left: space.sm, bottom: space.sm,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.lumen,
  },
  scoreText: { fontFamily: font.bold, fontSize: 13, lineHeight: 17, color: colors.navy },
  shareBtn: {
    // 32dp nhìn thấy + hitSlop 8 mỗi cạnh = vùng chạm 48dp.
    position: 'absolute', top: space.sm, right: space.sm, width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navyVeil,
  },
  shareBtnPressed: { backgroundColor: colors.navyLabel },
  name: { fontFamily: font.bold, fontSize: 16, lineHeight: 21, color: colors.navy, marginTop: space.sm },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm,
    paddingHorizontal: space.lg, paddingBottom: space.xl + space.md, // bù chiều cao header để khối nằm giữa mắt nhìn
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 26, backgroundColor: colors.lumenSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: space.sm,
  },
  center: { textAlign: 'center' },
  emptyCta: { alignSelf: 'stretch', marginTop: space.md },
});
