import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { HomeHero } from '@/components/Illustrations';
import { haptic } from '@/lib/haptics';
import { loadHistory, type JourneyRecord } from '@/lib/history';
import { colors, font, radius, space, type } from '@/theme';

type Tile = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  route?: '/library' | '/badges';
};

const TILES: Tile[] = [
  { key: 'library', title: 'Kho khám phá', icon: 'leaf', tint: '#E39B12', bg: colors.lumenSoft, route: '/library' },
  { key: 'quiz', title: 'Thử thách Quiz', icon: 'trophy', tint: '#E39B12', bg: colors.lumenSoft },
  { key: 'badges', title: 'Bảng thành tích', icon: 'bar-chart', tint: colors.brand, bg: colors.surface, route: '/badges' },
  { key: 'path', title: 'Lộ trình học', icon: 'map', tint: colors.mint, bg: colors.mintSoft },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<JourneyRecord[]>([]);

  useFocusEffect(useCallback(() => { loadHistory().then(setHistory); }, []));

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <View style={styles.logo}><View style={styles.logoDot} /></View>
        <Text style={styles.brand}>LumosLab</Text>
      </View>

      <Text style={[type.hero, { marginTop: space.lg }]} accessibilityRole="header">
        Chụp một đồ vật.{'\n'}Nghe câu chuyện khoa học của nó.
      </Text>

      <HomeHero height={196} />

      <Button label="Quét vật thể ngay" icon="camera" chevron onPress={() => router.push('/scan')} />

      <View style={styles.grid}>
        {TILES.map((t) => {
          const soon = !t.route;
          const meta =
            t.key === 'library' ? (history.length ? `${history.length} đồ vật` : undefined)
            : soon ? 'Sắp ra mắt' : undefined;
          return (
            <Pressable
              key={t.key}
              disabled={soon}
              onPress={() => { haptic.tap(); if (t.route) router.push(t.route); }}
              accessibilityRole="button"
              accessibilityState={{ disabled: soon }}
              accessibilityLabel={`${t.title}${meta ? '. ' + meta : ''}`}
              style={({ pressed }) => [styles.tile, pressed && { backgroundColor: colors.bgAlt }]}
            >
              <View style={[styles.tileIcon, { backgroundColor: t.bg }, soon && { opacity: 0.6 }]}>
                <Ionicons name={t.icon} size={22} color={t.tint} />
              </View>
              <Text style={[styles.tileTitle, soon && { color: colors.muted }]}>{t.title}</Text>
              {meta && <Text style={styles.tileMeta}>{meta}</Text>}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space.lg, gap: space.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  logoDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.lumen },
  brand: { fontFamily: font.black, fontSize: 18, color: colors.navy },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: space.sm },
  tile: {
    width: '47.5%', flexGrow: 1, minHeight: 112, padding: 14, borderRadius: radius.lg,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.divider, gap: 8,
  },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontFamily: font.bold, fontSize: 15, lineHeight: 20, color: colors.navy },
  tileMeta: { fontFamily: font.medium, fontSize: 12, color: colors.muted, marginTop: -4 },
});
