import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HuntIconButton } from '@/components/HuntFrame';
import { ScanReticle } from '@/components/ScanReticle';
import { colors, font, radius, space, type } from '@/theme';

const NODE = 22;

/** Thanh trên nền trong: quay lại · đường ánh sáng (xong = mint + tích, đang tìm = vàng) · gợi ý. */
export function HuntLiveTop({ count, required, hint, hintOpen, onToggleHint }: {
  count: number;
  required: number;
  hint: string;
  hintOpen: boolean;
  onToggleHint: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.top, { paddingTop: insets.top + space.xs, paddingLeft: insets.left + space.sm, paddingRight: insets.right + space.sm }]}>
      <View style={styles.bar}>
        <HuntIconButton icon="chevron-back" tone="overlay" label="Quay lại"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/hunt')} />
        <View style={styles.trail} accessible accessibilityRole="text" accessibilityLiveRegion="polite"
          accessibilityLabel={`Đã tìm ${count} trên ${required} đồ vật`}>
          {Array.from({ length: required }, (_, index) => (
            <Fragment key={index}>
              {index > 0 && <View style={[styles.link, index <= count && styles.linkDone]} />}
              <View style={[styles.node, index < count ? styles.done : index === count ? styles.current : styles.todo]}>
                {index < count && <Ionicons name="checkmark" size={15} color={colors.white} />}
              </View>
            </Fragment>
          ))}
        </View>
        <HuntIconButton icon={hintOpen ? 'bulb' : 'bulb-outline'} tone="overlay" label={hintOpen ? 'Ẩn gợi ý' : 'Xem gợi ý'}
          onPress={onToggleHint} />
      </View>
      {hintOpen && (
        <Text accessibilityLiveRegion="polite" style={styles.hint} maxFontSizeMultiplier={1.3}>{hint}</Text>
      )}
    </View>
  );
}

/** Khung ngắm ở ~13% chiều cao và chip/tag ngay dưới nó. */
export function HuntLiveTarget({ top, size, reticle, showReticle, chip, onChip, tag, onTag }: {
  top: number;
  size: number;
  reticle: 'scanning' | 'locked' | 'idle';
  showReticle: boolean;
  /** Chữ của chip trạng thái quét; null = ẩn. */
  chip: string | null;
  /** Có thì chip là nút (vd. "Chạm để quét tiếp"). */
  onChip?: () => void;
  /** Tên vật đã khóa; null = ẩn tag. */
  tag: string | null;
  onTag?: () => void;
}) {
  return (
    <View pointerEvents="box-none" style={[styles.target, { top }]}>
      {showReticle ? <ScanReticle state={reticle} size={size} /> : <View style={{ height: size }} />}
      <View pointerEvents="box-none" style={styles.float}>
        {tag ? (
          <Pressable accessibilityRole="button" accessibilityLabel={tag} accessibilityHint={onTag ? 'Quét một vật khác' : undefined}
            disabled={!onTag} onPress={onTag} style={({ pressed }) => [styles.tag, pressed && styles.pressed]}>
            <Ionicons name="checkmark-circle" size={22} color={colors.mintInk} />
            <Text style={styles.tagText} numberOfLines={1} maxFontSizeMultiplier={1.3}>{tag}</Text>
          </Pressable>
        ) : chip ? (
          onChip ? (
            <Pressable accessibilityRole="button" accessibilityLabel={chip} onPress={onChip}
              style={({ pressed }) => [styles.chip, styles.chipButton, pressed && styles.pressed]}>
              <Ionicons name="refresh" size={18} color={colors.white} />
              <Text style={styles.chipText} maxFontSizeMultiplier={1.3}>{chip}</Text>
            </Pressable>
          ) : (
            <View style={styles.chip} accessible accessibilityRole="text" accessibilityLiveRegion="polite" accessibilityLabel={chip}>
              <Text style={styles.chipText} maxFontSizeMultiplier={1.3}>{chip}</Text>
            </View>
          )
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, gap: space.sm },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trail: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 48 },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  done: { backgroundColor: colors.mint, borderColor: colors.mint },
  current: { backgroundColor: colors.lumen, borderColor: colors.lumen },
  todo: { borderColor: colors.whiteHalf },
  link: { width: 16, height: 2, borderRadius: 1, backgroundColor: colors.whiteHalf },
  linkDone: { backgroundColor: colors.mint },
  hint: {
    ...type.body, color: colors.white, alignSelf: 'center', maxWidth: 520, marginHorizontal: space.sm,
    paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md, backgroundColor: colors.mediaShade.mid,
  },
  target: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  float: { marginTop: 14, alignItems: 'center', paddingHorizontal: space.md },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, maxWidth: '100%',
    paddingLeft: space.sm + space.xs, paddingRight: 18, borderRadius: radius.pill, backgroundColor: colors.white,
  },
  tagText: { fontFamily: font.bold, fontSize: 16, lineHeight: 22, color: colors.navy, flexShrink: 1 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: space.sm,
    borderRadius: radius.pill, backgroundColor: colors.mediaShade.hint,
  },
  chipButton: { minHeight: 48 },
  chipText: { fontFamily: font.medium, fontSize: 15, lineHeight: 20, color: colors.white, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
