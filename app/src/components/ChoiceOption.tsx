import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { haptic } from '@/lib/haptics';
import { colors, font, radius, space } from '@/theme';

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

/**
 * Lựa chọn trắc nghiệm. Đúng/sai thể hiện bằng icon + chữ, không chỉ bằng màu.
 * `tone="dark"`: dùng trong khối navy của Câu hỏi bí ẩn (chọn = nền vàng Lumen).
 */
export function ChoiceOption({ index, text, state, onPress, disabled, tone = 'light' }: {
  index: number; text: string; state: ChoiceState; onPress: () => void; disabled?: boolean; tone?: 'light' | 'dark';
}) {
  const letter = String.fromCharCode(65 + index);
  const s = tone === 'dark' ? dark[state] : light[state];
  const status = state === 'correct' ? 'Đáp án đúng' : state === 'wrong' ? 'Bạn chọn, chưa đúng' : state === 'selected' ? 'Đang chọn' : '';
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: state === 'selected', disabled }}
      accessibilityLabel={`${letter}. ${text}${status ? '. ' + status : ''}`}
      disabled={disabled}
      onPress={() => { haptic.select(); onPress(); }}
      style={({ pressed }) => [
        styles.row,
        tone === 'dark' && styles.rowDark,
        { backgroundColor: s.bg, borderColor: s.border },
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: s.badgeBg }]}>
        <Text style={[styles.letter, { color: s.badgeFg }]}>{letter}</Text>
      </View>
      <Text style={[styles.text, { color: s.fg }, (state === 'selected' || state === 'correct') && { fontFamily: font.bold }]}>{text}</Text>
      {state === 'correct' && (
        <View style={styles.tag}>
          <Ionicons name="checkmark" size={20} color={colors.mintInk} />
        </View>
      )}
      {state === 'wrong' && (
        <View style={styles.tag}>
          <Ionicons name="close" size={18} color={colors.danger} />
          <Text style={styles.tagText}>Chưa đúng</Text>
        </View>
      )}
    </Pressable>
  );
}

type Look = { bg: string; border: string; badgeBg: string; badgeFg: string; fg: string };

const light: Record<ChoiceState, Look> = {
  idle: { bg: colors.bg, border: colors.trail, badgeBg: colors.surface, badgeFg: colors.navy, fg: colors.text },
  selected: { bg: colors.surface, border: colors.brand, badgeBg: colors.brand, badgeFg: colors.white, fg: colors.navy },
  correct: { bg: colors.mintSoft, border: colors.mintInk, badgeBg: colors.mintInk, badgeFg: colors.white, fg: colors.navy },
  wrong: { bg: colors.dangerSoft, border: colors.danger, badgeBg: colors.danger, badgeFg: colors.white, fg: colors.navy },
  dim: { bg: colors.bg, border: colors.divider, badgeBg: colors.surface, badgeFg: colors.muted, fg: colors.muted },
};

const dark: Record<ChoiceState, Look> = {
  idle: { bg: colors.navySoft, border: 'transparent', badgeBg: colors.whiteBadge, badgeFg: colors.white, fg: colors.white },
  selected: { bg: colors.lumen, border: 'transparent', badgeBg: colors.navy, badgeFg: colors.lumen, fg: colors.navy },
  correct: { bg: colors.lumen, border: 'transparent', badgeBg: colors.navy, badgeFg: colors.lumen, fg: colors.navy },
  wrong: { bg: colors.navySoft, border: 'transparent', badgeBg: colors.whiteBadge, badgeFg: colors.white, fg: colors.white },
  dim: { bg: colors.navySoft, border: 'transparent', badgeBg: colors.whiteBadge, badgeFg: colors.white, fg: colors.white },
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56,
    paddingVertical: 10, paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1.5,
  },
  rowDark: { minHeight: 50, borderRadius: 14, borderWidth: 0 },
  badge: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: font.black, fontSize: 14 },
  text: { flex: 1, fontFamily: font.semibold, fontSize: 16, lineHeight: 22 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tagText: { fontFamily: font.bold, fontSize: 13, color: colors.navy },
});
