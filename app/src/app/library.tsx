import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { DiscoveryShare } from '@/components/DiscoveryShare';
import { haptic } from '@/lib/haptics';
import { loadHistory, type JourneyRecord } from '@/lib/history';
import { useJourney } from '@/lib/store';
import { colors, font, radius, space, type } from '@/theme';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Kho khám phá: các đồ vật đã khám phá, chạm để xem lại câu chuyện. */
export default function Library() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<JourneyRecord[] | null>(null);
  const [sharing, setSharing] = useState<JourneyRecord>();
  const openStory = useJourney((s) => s.openStory);

  useFocusEffect(useCallback(() => { loadHistory().then(setItems); }, []));

  const reopen = async (r: JourneyRecord) => {
    haptic.tap();
    try {
      await openStory(r.storyId);
      router.push('/story');
    } catch {
      Alert.alert('Chưa mở được', 'Cần kết nối mạng để mở lại câu chuyện này.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" label="Quay lại" onPress={() => router.back()} />
        <Text style={type.h2} accessibilityRole="header">Kho khám phá</Text>
        <View style={{ width: 44 }} />
      </View>

      {sharing && <DiscoveryShare record={sharing} onClose={() => setSharing(undefined)} />}
      {items && items.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.emptyIcon}><Ionicons name="leaf" size={36} color="#E39B12" /></View>
          <Text style={[type.h2, { textAlign: 'center' }]}>Kho còn trống</Text>
          <Text style={[type.body, { textAlign: 'center', color: colors.muted }]}>Mỗi đồ vật bạn khám phá sẽ được cất vào đây để xem lại bất cứ lúc nào.</Text>
          <Button label="Quét vật thể ngay" icon="camera" onPress={() => router.replace('/scan')} style={{ alignSelf: 'stretch', marginTop: space.md }} />
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(r) => r.storyId}
          contentContainerStyle={{ padding: space.lg, gap: 12, paddingBottom: insets.bottom + space.lg }}
          renderItem={({ item: r }) => (
            <View style={styles.card}>
            <Pressable
              onPress={() => reopen(r)}
              accessibilityRole="button"
              accessibilityLabel={`${r.title}. ${cap(r.label)}. Đúng ${r.score} trên ${r.total} câu. Chạm để xem lại`}
              style={({ pressed }) => [{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }, pressed && { backgroundColor: colors.bgAlt }]}
            >
              <View style={styles.thumb}>
                {r.photoUri ? <Image source={{ uri: r.photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="book" size={22} color={colors.brand} />}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.label}>{cap(r.label)}{r.concept ? ` – ${r.concept}` : ''}</Text>
                <Text style={styles.title} numberOfLines={2}>{r.title}</Text>
                <View style={styles.stars}>
                  {Array.from({ length: r.total }, (_, i) => (
                    <Ionicons key={i} name="star" size={13} color={i < r.score ? '#F2B11E' : colors.divider} />
                  ))}
                  <Text style={styles.score}>{r.score}/{r.total}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
            <IconButton icon="share-outline" label={`Chia sẻ ${r.label}`} onPress={() => setSharing(r)} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, gap: space.sm },
  emptyIcon: { width: 80, height: 80, borderRadius: 26, backgroundColor: colors.lumenSoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.divider },
  thumb: { width: 60, height: 60, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: font.semibold, fontSize: 13, color: colors.brand },
  title: { fontFamily: font.bold, fontSize: 16, lineHeight: 21, color: colors.navy },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  score: { fontFamily: font.medium, fontSize: 12, color: colors.muted, marginLeft: 4 },
});
