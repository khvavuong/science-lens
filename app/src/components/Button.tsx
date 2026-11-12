import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { haptic } from '@/lib/haptics';
import { colors, font, motion, radius, touch } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Mũi tên ">" ở cuối: dùng cho nút đi tiếp sang bước sau. */
  chevron?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({ label, onPress, variant = 'primary', icon, chevron, disabled, loading, style, accessibilityHint }: Props) {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v: number) => Animated.timing(scale, { toValue: v, duration: motion.tap, useNativeDriver: true }).start();
  const v = variants[variant];
  const off = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!off, busy: !!loading }}
        disabled={off}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        onPress={() => { haptic.tap(); onPress(); }}
        style={({ pressed }) => [
          styles.base,
          variant === 'ghost' && styles.ghost,
          { backgroundColor: pressed && variant === 'primary' ? colors.brandPressed : off && variant === 'primary' ? colors.divider : v.bg, borderColor: v.border },
        ]}
      >
        {loading ? <ActivityIndicator color={off && variant === 'primary' ? colors.muted : v.fg} /> : icon ? <Ionicons name={icon} size={20} color={off && variant === 'primary' ? colors.muted : v.fg} /> : null}
        <Text style={[styles.label, { color: off && variant === 'primary' ? colors.muted : v.fg }]} maxFontSizeMultiplier={1.4}>{label}</Text>
        {chevron && !loading && <Ionicons name="chevron-forward" size={18} color={off && variant === 'primary' ? colors.muted : v.fg} style={styles.chevron} />}
      </Pressable>
    </Animated.View>
  );
}

const variants: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.brand, fg: colors.white, border: 'transparent' },
  secondary: { bg: colors.white, fg: colors.brand, border: colors.divider },
  ghost: { bg: 'transparent', fg: colors.brand, border: 'transparent' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    paddingHorizontal: 22,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ghost: { minHeight: touch },
  label: { fontFamily: font.bold, fontSize: 17 },
  chevron: { position: 'absolute', right: 20 },
});

/** Nút tròn chỉ có icon (đóng, quay lại, âm thanh...). Luôn có accessibilityLabel. */
export function IconButton({ icon, label, onPress, dark, size = 44, color }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; dark?: boolean; size?: number; color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => { haptic.tap(); onPress(); }}
      style={({ pressed }) => ({
        width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: dark ? (pressed ? 'rgba(255,255,255,0.3)' : 'rgba(15,36,82,0.45)') : pressed ? colors.surface : colors.bgAlt,
      })}
    >
      <Ionicons name={icon} size={size * 0.46} color={color ?? (dark ? colors.white : colors.navy)} />
    </Pressable>
  );
}
