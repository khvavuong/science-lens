import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/Button';
import { haptic } from '@/lib/haptics';
import { colors, radius, space, touch, type } from '@/theme';

/**
 * Khung chung của Săn đồ vật: thanh tiêu đề cố định (giống Kho khám phá, Bảng xếp hạng),
 * nội dung cuộn, và vùng hành động ghim ở đáy (vùng ngón cái, ngay trên thanh điều hướng).
 */
export function HuntFrame({ children, back, title, footer }: {
  children: ReactNode;
  back: '/' | '/hunt';
  title?: string;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const sides = { paddingLeft: insets.left + space.md, paddingRight: insets.right + space.md };
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, sides, { paddingTop: insets.top + space.sm }]}>
        <IconButton icon="chevron-back" label="Quay lại" size={touch} onPress={() => router.canGoBack() ? router.back() : router.replace(back)} />
        {title ? <Text style={styles.title} accessibilityRole="header" numberOfLines={2} maxFontSizeMultiplier={1.3}>{title}</Text> : <View style={styles.scroll} />}
        <View style={styles.balance} />
      </View>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[sides, {
        paddingTop: space.sm, paddingBottom: footer ? space.lg : insets.bottom + space.xl,
      }]}>
        <View style={styles.container}>{children}</View>
      </ScrollView>
      {footer && (
        <View style={[styles.footer, sides, { paddingBottom: insets.bottom + space.md }]}>
          <View style={[styles.container, styles.footerStack]}>{footer}</View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

type Tone = 'primary' | 'soft' | 'plain' | 'danger' | 'overlay';

/** Nút chỉ có icon của Săn đồ vật, có trạng thái tắt và đang tải (IconButton chung không có). */
export function HuntIconButton({ icon, label, onPress, disabled, loading, tone = 'plain', size = touch, square }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: Tone;
  size?: number;
  /** Góc bo vuông, để đứng cạnh nút chữ cao 56. */
  square?: boolean;
}) {
  const off = disabled || loading;
  const look = tones[tone];
  const fg = off && tone === 'primary' ? colors.muted : look.fg;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      hitSlop={size < touch ? (touch - size) / 2 : undefined}
      onPress={() => { haptic.tap(); onPress(); }}
      style={({ pressed }) => [{
        width: size, height: size, borderRadius: square ? radius.md : size / 2,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: off && tone === 'primary' ? colors.surface : pressed ? look.pressed : look.bg,
        opacity: off && tone !== 'primary' ? 0.45 : 1,
      }]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Ionicons name={icon} size={Math.round(Math.min(size, 56) * 0.46)} color={fg} />}
    </Pressable>
  );
}

const tones: Record<Tone, { bg: string; pressed: string; fg: string }> = {
  primary: { bg: colors.brand, pressed: colors.brandPressed, fg: colors.white },
  soft: { bg: colors.bgAlt, pressed: colors.surface, fg: colors.brand },
  plain: { bg: 'transparent', pressed: colors.bgAlt, fg: colors.brand },
  danger: { bg: colors.dangerSoft, pressed: colors.divider, fg: colors.danger },
  overlay: { bg: colors.navyVeil, pressed: colors.navyLabel, fg: colors.white },
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: space.xs },
  title: { ...type.h2, flex: 1, textAlign: 'center', marginHorizontal: space.sm },
  balance: { width: touch },
  scroll: { flex: 1 },
  footer: { paddingTop: space.sm, backgroundColor: colors.bg },
  container: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: space.md },
  footerStack: { gap: space.sm },
});
