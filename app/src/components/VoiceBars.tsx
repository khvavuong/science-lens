import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '@/theme';

type BarTone = 'lumo' | 'me' | 'idle';

const BAR_WIDTH = 3.5;
const BAR_HEIGHT = 32;
/** Độ cao vạch khi im lặng/tĩnh (tỉ lệ so với BAR_HEIGHT). */
const IDLE_SCALE = 0.12;

const barColor: Record<BarTone, string> = {
  lumo: colors.lumen,
  me: colors.white,
  idle: colors.whiteHalf,
};

/**
 * Sóng âm dạng vạch: giữ `count` mức âm lượng gần nhất, vạch mới vào bên phải.
 * Lịch sử nằm trong ref, chỉ cập nhật Animated.Value trong effect để không render lại.
 */
export function VoiceBars({ level, tone, count = 28 }: { level: number; tone: BarTone; count?: number }) {
  const history = useRef<number[]>([]);
  const [bars] = useState(() => Array.from({ length: count }, () => new Animated.Value(IDLE_SCALE)));

  useEffect(() => {
    if (tone === 'idle') {
      history.current = [];
      bars.forEach((bar) => bar.setValue(IDLE_SCALE));
      return;
    }
    const scale = IDLE_SCALE + (1 - IDLE_SCALE) * Math.max(0, Math.min(1, level));
    const next = [...history.current, scale].slice(-bars.length);
    history.current = next;
    // Dồn lịch sử về bên phải: vạch cuối là mức mới nhất.
    const offset = bars.length - next.length;
    const anim = Animated.parallel(bars.map((bar, i) => Animated.timing(bar, {
      toValue: i < offset ? IDLE_SCALE : next[i - offset],
      duration: 90,
      useNativeDriver: true,
    })));
    anim.start();
    return () => anim.stop();
  }, [level, tone, bars]);

  const color = barColor[tone];
  return (
    <View style={styles.wave} pointerEvents="none">
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[styles.bar, { backgroundColor: color, transform: [{ scaleY: bar }] }]}
        />
      ))}
    </View>
  );
}

type LiveTone = 'lumo' | 'me' | 'idle' | 'paused';

const liveIcon: Record<Exclude<LiveTone, 'lumo'>, keyof typeof Ionicons.glyphMap> = {
  me: 'mic',
  paused: 'mic-off',
  idle: 'scan-outline',
};

/** Thanh trạng thái hội thoại: ai đang nói (Lumo/em/đang tìm/tạm dừng) và sóng âm. */
export function LiveBar({ tone, level, label }: { tone: LiveTone; level: number; label: string }) {
  return (
    <View
      style={styles.live}
      accessible
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={label}
    >
      <View style={styles.who}>
        {tone === 'lumo'
          ? <View style={styles.dot} />
          : <Ionicons name={liveIcon[tone]} size={18} color={colors.white} />}
        <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.3}>{label}</Text>
      </View>
      <VoiceBars level={level} tone={tone === 'paused' ? 'idle' : tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  wave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: BAR_HEIGHT,
  },
  bar: { width: BAR_WIDTH, height: BAR_HEIGHT, borderRadius: BAR_WIDTH / 2 },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + space.xs,
    minHeight: 52,
    paddingHorizontal: space.md,
    borderRadius: 26,
    backgroundColor: colors.navy,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 64, flexShrink: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.lumen },
  label: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: colors.white, flexShrink: 1 },
});
