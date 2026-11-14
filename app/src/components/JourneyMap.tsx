import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { BADGE_ORDER, earnedBadgeCount } from '@/lib/badges';
import { haptic } from '@/lib/haptics';
import { BADGES, loadHistory, type BadgeId, type JourneyRecord } from '@/lib/history';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, motion, radius, space, touch, type } from '@/theme';

const MAP = require('../../assets/map/journey.webp');
const MAP_RATIO = 2079 / 756; // cao / rộng của ảnh gốc

const BADGE_ART: Record<BadgeId, { on: number; off: number }> = {
  sprout: { on: require('../../assets/badges/sprout.webp'), off: require('../../assets/badges/sprout-locked.webp') },
  explorer: { on: require('../../assets/badges/explorer.webp'), off: require('../../assets/badges/explorer-locked.webp') },
  scientist: { on: require('../../assets/badges/scientist.webp'), off: require('../../assets/badges/scientist-locked.webp') },
};

/** Tâm mốc theo tỉ lệ ảnh (0–1), đặt trên con đường cát. Hành trình đi từ trường học (đỉnh) xuống đài thiên văn (đáy). */
const SPOTS: Record<BadgeId, { x: number; y: number }> = {
  sprout: { x: 0.7, y: 0.235 },
  explorer: { x: 0.425, y: 0.505 },
  scientist: { x: 0.775, y: 0.805 },
};

const NODE = 76;
const LABEL_WIDTH = 168;
const native = Platform.OS !== 'web';

type Status = 'earned' | 'next' | 'locked';

const STATUS: Record<Status, { text: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  earned: { text: 'Đã nhận', icon: 'checkmark-circle', color: colors.mintInk },
  next: { text: 'Mốc tiếp theo', icon: 'flag', color: colors.brand },
  locked: { text: 'Chưa mở khóa', icon: 'lock-closed', color: colors.muted },
};

function statusOf(index: number, earned: number): Status {
  return index < earned ? 'earned' : index === earned ? 'next' : 'locked';
}

function MapNode({ id, status, selected, mapWidth, mapHeight, reduced, onPress }: {
  id: BadgeId; status: Status; selected: boolean;
  mapWidth: number; mapHeight: number; reduced: boolean; onPress: () => void;
}) {
  const spot = SPOTS[id];
  const cx = spot.x * mapWidth;
  const cy = spot.y * mapHeight;
  const [pulse] = useState(() => new Animated.Value(1));
  const breathing = status === 'next' && !reduced;

  useEffect(() => {
    if (!breathing) return;
    const ease = Easing.inOut(Easing.sin);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.07, duration: 900, easing: ease, useNativeDriver: native }),
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: ease, useNativeDriver: native }),
    ]));
    loop.start();
    return () => { loop.stop(); pulse.setValue(1); };
  }, [breathing, pulse]);

  // Nhãn không tràn khỏi mép màn hình.
  const labelLeft = Math.min(Math.max(cx - LABEL_WIDTH / 2, space.sm), mapWidth - LABEL_WIDTH - space.sm);
  // Vòng vàng nhịp nhẹ quanh mốc kế tiếp chính là dấu "bạn đang ở đây".
  const where = status === 'next' ? ', bạn đang ở đây' : '';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${BADGES[id].name}. ${STATUS[status].text}${where}. ${BADGES[id].desc}.`}
        accessibilityState={{ selected }}
        hitSlop={space.sm}
        onPress={onPress}
        style={[styles.node, { left: cx - NODE / 2, top: cy - NODE / 2 }]}
      >
        {({ pressed }) => (
          <Animated.View style={[styles.nodeInner, { transform: [{ scale: pressed ? 0.94 : pulse }] }]}>
            {status === 'next' && <View style={styles.ring} />}
            <Image source={status === 'earned' ? BADGE_ART[id].on : BADGE_ART[id].off} style={styles.badgeArt} contentFit="contain" accessible={false} />
            {status === 'locked' && (
              <View style={styles.lock}>
                <Ionicons name="lock-closed" size={12} color={colors.white} />
              </View>
            )}
          </Animated.View>
        )}
      </Pressable>
      <View pointerEvents="none" style={[styles.labelSlot, { left: labelLeft, top: cy + NODE / 2 + space.xs }]}>
        <Text
          style={[styles.label, selected && styles.labelSelected, status === 'locked' && styles.labelLocked]}
          numberOfLines={2}
          maxFontSizeMultiplier={1.3}
        >
          {BADGES[id].name}
        </Text>
      </View>
    </>
  );
}

function BadgeSheet({ id, status, empty, reduced, onClose }: {
  id: BadgeId; status: Status; empty: boolean; reduced: boolean; onClose: () => void;
}) {
  const [shown] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(shown, {
      toValue: 1, duration: reduced ? motion.tap : motion.sheet, easing: Easing.out(Easing.cubic), useNativeDriver: native,
    }).start();
  }, [reduced, shown]);
  const lift = reduced ? 0 : shown.interpolate({ inputRange: [0, 1], outputRange: [space.lg, 0] });
  const s = STATUS[status];

  return (
    <Animated.View style={[styles.sheet, { opacity: shown, transform: [{ translateY: lift }] }]}>
      <View style={styles.sheetRow}>
        <Image source={status === 'earned' ? BADGE_ART[id].on : BADGE_ART[id].off} style={styles.sheetArt} contentFit="contain" accessible={false} />
        <View style={styles.sheetText}>
          <Text style={styles.sheetTitle} accessibilityRole="header" maxFontSizeMultiplier={1.3}>{BADGES[id].name}</Text>
          <View style={styles.status}>
            <Ionicons name={s.icon} size={16} color={s.color} />
            <Text style={[styles.statusText, { color: s.color }]} maxFontSizeMultiplier={1.3}>{s.text}</Text>
          </View>
        </View>
        <IconButton icon="close" label="Đóng" onPress={onClose} size={touch} />
      </View>
      <Text style={type.body} maxFontSizeMultiplier={1.4}>{BADGES[id].desc}.</Text>
      {empty && <Button label="Chụp đồ vật" icon="camera" onPress={() => router.push('/scan')} />}
    </Animated.View>
  );
}

/** Bản đồ "Hành trình của Lumo Pet": huy hiệu là các mốc trên con đường, đi từ trên xuống. Mở màn ở đỉnh (điểm xuất phát). */
export function JourneyMap() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [history, setHistory] = useState<JourneyRecord[]>();
  const [selected, setSelected] = useState<BadgeId>();
  useFocusEffect(useCallback(() => { loadHistory().then(setHistory); }, []));

  const mapHeight = Math.round(width * MAP_RATIO);
  const earned = history ? earnedBadgeCount(history) : 0;
  const select = (id: BadgeId) => { haptic.tap(); setSelected(selected === id ? undefined : id); };

  return (
    <View style={styles.root} onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Pressable style={{ width, height: mapHeight }} onPress={() => setSelected(undefined)} accessible={false}>
            <Image source={MAP} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
          </Pressable>
          {history && BADGE_ORDER.map((id, i) => (
            <MapNode
              key={id}
              id={id}
              status={statusOf(i, earned)}
              selected={selected === id}
              mapWidth={width}
              mapHeight={mapHeight}
              reduced={reduced}
              onPress={() => select(id)}
            />
          ))}
        </ScrollView>
      )}

      {/* Nền mờ sau thanh trạng thái để chữ/icon hệ thống đọc được trên ảnh. */}
      <View pointerEvents="none" style={[styles.statusVeil, { height: insets.top }]} />
      <View pointerEvents="box-none" style={[styles.header, { top: insets.top + space.sm }]}>
        <IconButton
          icon="chevron-back"
          label="Quay lại"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          size={touch}
          dark
        />
        {history && (
          <View
            style={styles.progress}
            accessible
            accessibilityRole="header"
            accessibilityLabel={`Hành trình của Lumo. Đã nhận ${earned} trên ${BADGE_ORDER.length} huy hiệu`}
          >
            <Ionicons name="ribbon" size={18} color={colors.lumen} />
            <Text style={styles.progressText} maxFontSizeMultiplier={1.3}>{earned}/{BADGE_ORDER.length}</Text>
          </View>
        )}
      </View>

      {selected && history && (
        <BadgeSheet
          key={selected}
          id={selected}
          status={statusOf(BADGE_ORDER.indexOf(selected), earned)}
          empty={history.length === 0}
          reduced={reduced}
          onClose={() => setSelected(undefined)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  statusVeil: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.whiteHalf },
  header: {
    position: 'absolute', left: space.md, right: space.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  progress: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 36,
    paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: colors.navyVeil,
  },
  progressText: { fontFamily: font.bold, fontSize: 16, color: colors.white, fontVariant: ['tabular-nums'] },
  node: { position: 'absolute', width: NODE, height: NODE },
  nodeInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', top: -5, left: -5, right: -5, bottom: -5,
    borderRadius: (NODE + 10) / 2, borderWidth: 4, borderColor: colors.lumen,
  },
  badgeArt: { width: NODE, height: NODE },
  lock: {
    position: 'absolute', right: 0, bottom: 0, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy,
    borderWidth: 2, borderColor: colors.bg,
  },
  labelSlot: { position: 'absolute', width: LABEL_WIDTH, alignItems: 'center' },
  label: {
    fontFamily: font.bold, fontSize: 13, lineHeight: 17, color: colors.navy, textAlign: 'center',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: colors.bg, overflow: 'hidden',
  },
  labelSelected: { backgroundColor: colors.lumen },
  labelLocked: { color: colors.muted },
  sheet: {
    position: 'absolute', left: space.md, right: space.md, bottom: space.md,
    gap: space.md, padding: space.md, borderRadius: radius.xl, backgroundColor: colors.bg,
    boxShadow: [{ offsetX: 0, offsetY: 6, blurRadius: 18, color: colors.pillShadow }],
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  sheetArt: { width: 56, height: 56 },
  sheetText: { flex: 1, minWidth: 0, gap: 2 },
  sheetTitle: { ...type.h2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  statusText: { fontFamily: font.semibold, fontSize: 14, lineHeight: 19 },
});
