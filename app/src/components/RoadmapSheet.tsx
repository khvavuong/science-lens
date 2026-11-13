import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Scene } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, motion, radius, space, type } from '@/theme';
import { TrailNode, type NodeState } from './Trail';

const H = Dimensions.get('window').height;

/**
 * Bottom sheet "Hành trình khám phá": đường ánh sáng dọc.
 * Đã xem → chạm để nghe lại. Bước kế tiếp → mở được. Xa hơn → khóa (chỉ xem tiêu đề).
 */
export function RoadmapSheet({ visible, onClose, scenes, current, maxViewed, mode, onSelect }: {
  visible: boolean;
  onClose: () => void;
  scenes: Scene[];
  current: number;
  maxViewed: number;
  mode: 'historical' | 'process';
  onSelect: (i: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [y] = useState(() => new Animated.Value(H));
  const [mounted, setMounted] = useState(visible);
  // Mở: mount ngay trong render (không setState trong effect). Đóng: chờ animation xong mới unmount.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      y.setValue(H * 0.6);
      if (reduced) y.setValue(0);
      else Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.9 }).start();
    } else if (mounted) {
      Animated.timing(y, { toValue: H * 0.7, duration: reduced ? 0 : motion.sheet - 60, useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vuốt xuống trên vùng tay nắm để đóng.
  const pan = useMemo(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => y.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.8) onClose();
        else Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 240 }).start();
      },
    }),
  [onClose, y]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng hành trình" accessibilityRole="button" />
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + space.md, transform: [{ translateY: y }] }]}>
        <View {...pan.panHandlers} style={styles.header}>
          <View style={styles.grabber} />
          <Text style={type.h1}>Hành trình khám phá</Text>
          <Text style={[type.caption, { fontSize: 14 }]}>Chạm bước đã xem để nghe lại.</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
          {scenes.map((s, i) => {
            const isCur = i === current;
            const viewed = i <= maxViewed;
            const open = i <= maxViewed + 1;
            const last = i === scenes.length - 1;
            const state: NodeState = isCur ? 'current' : viewed ? 'done' : open ? 'todo' : 'locked';
            const tag = isCur ? 'Đang xem' : viewed ? (mode === 'historical' ? s.timeline_label : `Bước ${i + 1}`) : open ? 'Tiếp theo' : 'Chưa mở';
            return (
              <Pressable
                key={s.id}
                disabled={!open}
                onPress={() => { haptic.select(); onSelect(i); }}
                accessibilityRole="button"
                accessibilityState={{ disabled: !open, selected: isCur }}
                accessibilityLabel={`${tag}. ${s.title}${viewed && !isCur ? '. Chạm để nghe lại' : ''}`}
                style={({ pressed }) => [styles.item, pressed && open && { opacity: 0.7 }]}
              >
                <View style={styles.rail}>
                  <TrailNode state={state} size={30} />
                  {!last && <View style={[styles.line, i < maxViewed && styles.lineDone]} />}
                </View>
                <View style={[styles.body, isCur && styles.bodyCur]}>
                  <Text style={[styles.tag, !open && { color: colors.muted }, isCur && { color: colors.navy }]}>{tag}</Text>
                  <Text style={[styles.title, !open && { color: colors.muted }]}>{s.title}</Text>
                  {(viewed || isCur) && <Text style={styles.fact} numberOfLines={3}>{s.key_fact}</Text>}
                  {s.is_legend && viewed && (
                    <View style={styles.legend}>
                      <Ionicons name="chatbubble-ellipses-outline" size={12} color={colors.muted} />
                      <Text style={styles.legendText}>Có chi tiết là giai thoại</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,36,82,0.45)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: H * 0.8,
    backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  header: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md, gap: 4 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.divider, marginBottom: space.md },
  item: { flexDirection: 'row', gap: 14 },
  rail: { width: 30, alignItems: 'center', paddingTop: 2 },
  line: { flex: 1, minHeight: 16, marginVertical: 3, borderLeftWidth: 2, borderColor: colors.trail, borderStyle: 'dashed' },
  lineDone: { borderColor: colors.brand, borderStyle: 'solid' },
  body: { flex: 1, paddingBottom: 18, paddingTop: 2 },
  // Ghi rõ từng cạnh: paddingTop/Bottom của `body` thắng `padding` viết tắt.
  bodyCur: { backgroundColor: colors.lumenSoft, borderRadius: radius.md, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 12, marginBottom: 14 },
  tag: { fontFamily: font.bold, fontSize: 13, color: colors.brand },
  title: { fontFamily: font.bold, fontSize: 17, lineHeight: 23, color: colors.navy },
  fact: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  legendText: { fontFamily: font.medium, fontSize: 12, color: colors.muted },
});
