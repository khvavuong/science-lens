import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { haptic } from '@/lib/haptics';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, motion, radius, space, type } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export type HuntCardData = {
  title: string;
  task: string;
  icon: string;
  tint: string;
  required: number;
  count: number;
  done: boolean;
  /** Đã có ảnh nháp cho đồ vật kế tiếp nhưng chưa gửi lời giải thích. */
  pending: boolean;
};

/** Vùng chạm cả thẻ: thu nhỏ nhẹ khi nhấn, chỉ đổi độ mờ khi bật Giảm chuyển động. */
function CardPress({ label, hint, onPress, style, cardStyle, children }: {
  label: string;
  hint: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  cardStyle: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const to = (value: number) => {
    if (!reduced) Animated.timing(scale, { toValue: value, duration: motion.tap, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        onPress={() => { haptic.tap(); onPress(); }}
        style={({ pressed }) => [styles.fill, cardStyle, pressed && reduced && styles.pressedReduced]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/** Thanh tiến độ phân đoạn: mỗi đoạn là một đồ vật cần tìm. */
function Segments({ required, count, pending, dark }: { required: number; count: number; pending: boolean; dark?: boolean }) {
  return (
    <View style={styles.segments}>
      {Array.from({ length: required }, (_, slot) => (
        <View
          key={slot}
          style={[
            styles.segment,
            dark ? styles.segmentDark : undefined,
            slot < count ? (dark ? styles.segmentDarkDone : styles.segmentDone)
              : slot === count && pending ? (dark ? styles.segmentDarkPending : styles.segmentPending) : undefined,
          ]}
        />
      ))}
    </View>
  );
}

function describe(data: HuntCardData) {
  // Tên chủ đề có thể đã kết thúc bằng "?": không thêm dấu chấm thừa cho trình đọc màn hình.
  const title = /[?!.]$/.test(data.title) ? data.title : `${data.title}.`;
  if (data.done) return `${title} Đã hoàn thành.`;
  const extra = data.pending ? ' Có một ảnh đang chờ em giải thích.' : '';
  return `${title} Đã tìm ${data.count} trên ${data.required} đồ vật.${extra}`;
}

/** Thẻ nổi bật ở đầu danh sách: chủ đề đang làm dở, hoặc chủ đề gợi ý tiếp theo. */
export function HuntFeaturedCard({ data, onPress }: { data: HuntCardData; onPress: () => void }) {
  const resume = data.count > 0 || data.pending;
  const action = resume ? 'Tiếp tục' : 'Bắt đầu';
  return (
    <CardPress label={`${action}: ${describe(data)} ${data.task}`} hint="Mở thử thách" onPress={onPress} cardStyle={styles.featured}>
      <View style={styles.featuredHead}>
        <View style={styles.featuredIcon}>
          <Ionicons name={data.icon as IconName} size={28} color={colors.lumen} />
        </View>
        <Text style={styles.featuredTitle} numberOfLines={2} maxFontSizeMultiplier={1.3}>{data.title}</Text>
      </View>
      <Text style={styles.featuredTask} numberOfLines={3} maxFontSizeMultiplier={1.3}>{data.task}</Text>
      <View style={styles.featuredFoot}>
        <View style={styles.featuredProgress}>
          <Segments required={data.required} count={data.count} pending={data.pending} dark />
          <Text style={styles.featuredCount} maxFontSizeMultiplier={1.3}>{data.count}/{data.required}</Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText} maxFontSizeMultiplier={1.3}>{action}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.navy} />
        </View>
      </View>
    </CardPress>
  );
}

/** Ô chủ đề trong lưới: nền màu riêng, icon to, tiến độ dạng thanh. */
export function HuntTopicCard({ data, onPress, style }: { data: HuntCardData; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <CardPress
      label={describe(data)}
      hint="Mở thử thách"
      onPress={onPress}
      style={style}
      cardStyle={[styles.tile, { backgroundColor: data.done ? colors.mintSoft : data.tint }]}
    >
      <View style={styles.tileIcon}>
        <Ionicons name={data.icon as IconName} size={26} color={data.done ? colors.mintInk : colors.brand} />
      </View>
      <Text style={styles.tileTitle} numberOfLines={2} maxFontSizeMultiplier={1.4}>{data.title}</Text>
      {data.done ? (
        <View style={styles.tileFoot}>
          <Ionicons name="checkmark-circle" size={18} color={colors.mintInk} />
          <Text style={[styles.tileCount, styles.doneText]} maxFontSizeMultiplier={1.4}>Hoàn thành</Text>
        </View>
      ) : (
        <View style={styles.tileFoot}>
          <Segments required={data.required} count={data.count} pending={data.pending} />
          <Text style={styles.tileCount} maxFontSizeMultiplier={1.4}>{data.count}/{data.required}</Text>
        </View>
      )}
    </CardPress>
  );
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1 },
  pressedReduced: { opacity: 0.85 },

  featured: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: space.md + space.xs, gap: space.md },
  featuredHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  featuredIcon: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navySoft,
  },
  featuredTitle: { ...type.h2, flex: 1, color: colors.white },
  featuredTask: { ...type.body, color: colors.onDarkMuted, marginTop: -space.xs },
  featuredFoot: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  featuredProgress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  featuredCount: { fontFamily: font.bold, fontSize: 16, lineHeight: 23, color: colors.white },
  cta: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: space.md + 2,
    borderRadius: radius.pill, backgroundColor: colors.lumen,
  },
  ctaText: { fontFamily: font.bold, fontSize: 16, lineHeight: 23, color: colors.navy },

  tile: { borderRadius: radius.lg, padding: space.md, gap: space.md - space.xs, minHeight: 156 },
  tileIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  tileTitle: { ...type.bodyStrong, fontFamily: font.bold, color: colors.navy },
  tileFoot: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 'auto', minHeight: 18 },
  tileCount: { ...type.caption, fontFamily: font.bold, color: colors.navy },
  doneText: { color: colors.mintInk },

  segments: { flex: 1, flexDirection: 'row', gap: space.xs },
  segment: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.track },
  segmentDone: { backgroundColor: colors.brand },
  segmentPending: { backgroundColor: colors.lumen },
  segmentDark: { backgroundColor: colors.whiteSubtle },
  segmentDarkDone: { backgroundColor: colors.lumen },
  segmentDarkPending: { backgroundColor: colors.whiteHalf },
});
