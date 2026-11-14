import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Button } from '@/components/Button';
import { LiveBar } from '@/components/VoiceBars';
import type { HuntVerdict } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { REVIEW_COUNTDOWN_MS, verdictIcons, verdictLabels, type LiveTone, type MicAction } from '@/lib/huntScreen';
import { colors, font, space, type } from '@/theme';

export type Caption = { text: string; tone: 'say' | 'dim' | 'alert' };

const MIC = 56;
const RING_STROKE = 3;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  caption: Caption;
  verdict: HuntVerdict | null;
  bar: { tone: LiveTone; label: string } | null;
  barLevel: number;
  /** Trước khi bắt đầu: chỉ có câu đề bài và nút chính. */
  onStart?: () => void;
  /** Camera bị từ chối và chưa có vật: chọn ảnh từ thư viện thay cho khung ngắm. */
  picker?: { busy: boolean; onPick: () => void };
  composer?: {
    value: string;
    editable: boolean;
    onFocus: () => void;
    onChangeText: (value: string) => void;
    mic: MicAction;
    /** Micro đã tạm dừng: icon micro gạch. */
    micPaused: boolean;
    /** Có chữ và chưa nghe: thêm nút micro nhỏ trong ô để nói thêm. */
    canTalkMore: boolean;
    onTalkMore: () => void;
    actionDisabled: boolean;
    sending: boolean;
    countdown: boolean;
    onAction: () => void;
    counter: { length: number; limit: number } | null;
  };
  saving?: { message: string; busy: boolean; onRetry: () => void };
};

/** Dải đáy navy của Thử thách trực tiếp: phụ đề, dòng nhận xét, thanh sóng, ô nhập + nút tròn. */
export function HuntLivePanel({ caption, verdict, bar, barLevel, onStart, picker, composer, saving }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.panel, { paddingLeft: insets.left + space.md, paddingRight: insets.right + space.md, paddingBottom: insets.bottom + space.sm }]}>
      <View style={styles.inner}>
        <View style={styles.captionRow} accessible accessibilityLiveRegion="polite" accessibilityLabel={caption.text}>
          {caption.tone === 'alert' && <Ionicons name="alert-circle" size={20} color={colors.lumen} style={styles.captionIcon} />}
          <Text style={[styles.caption, caption.tone === 'dim' && styles.dim]} maxFontSizeMultiplier={1.3}>{caption.text}</Text>
        </View>
        {verdict && (
          <View style={styles.verdict} accessible accessibilityLabel={`Kết quả: ${verdictLabels[verdict]}`}>
            <Ionicons name={verdictIcons[verdict]} size={20} color={verdict === 'accepted' ? colors.mint : colors.lumen} />
            <Text style={styles.verdictText} maxFontSizeMultiplier={1.3}>{verdictLabels[verdict]}</Text>
          </View>
        )}
        {bar && <LiveStatus tone={bar.tone} label={bar.label} level={barLevel} />}
        {saving && (
          <View style={styles.saving}>
            <Text accessibilityLiveRegion="polite" style={styles.savingText} maxFontSizeMultiplier={1.3}>{saving.message}</Text>
            <Button label="Thử lưu lại" variant="secondary" loading={saving.busy} onPress={saving.onRetry} />
          </View>
        )}
        {onStart ? (
          <Button label="Bắt đầu tìm" icon="scan-outline" onPress={onStart} />
        ) : picker ? (
          <View style={styles.picker}>
            <Text style={styles.pickerText} maxFontSizeMultiplier={1.3}>Em có thể chọn ảnh từ thư viện</Text>
            <Button label="Chọn ảnh" icon="images-outline" loading={picker.busy} onPress={picker.onPick} />
          </View>
        ) : composer ? (
          <Composer {...composer} />
        ) : null}
      </View>
    </View>
  );
}

/** LiveBar chỉ đẩy vạch mới khi mức đổi: khi đang nói/nghe thêm nhiễu nhỏ mỗi ~100 ms để sóng chạy đều. */
function LiveStatus({ tone, label, level }: { tone: LiveTone; label: string; level: number }) {
  const moving = tone === 'lumo' || tone === 'me';
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!moving) return;
    const timer = setInterval(() => setTick((n) => (n + 1) % 1000), 100);
    return () => clearInterval(timer);
  }, [moving]);
  const jitter = moving ? (tick % 2) * 0.03 : 0;
  return <LiveBar tone={tone} label={label} level={Math.min(1, Math.max(0, level) + jitter)} />;
}

function Composer({
  value, editable, onFocus, onChangeText, mic, micPaused, canTalkMore, onTalkMore, actionDisabled, sending, countdown, onAction, counter,
}: NonNullable<Props['composer']>) {
  const live = mic === 'pause';
  const icon: keyof typeof Ionicons.glyphMap = mic === 'send' ? 'paper-plane' : micPaused ? 'mic-off' : 'mic';
  const label = mic === 'send'
    ? countdown ? 'Gửi lời giải thích ngay' : 'Gửi lời giải thích'
    : live ? 'Tạm dừng micro' : 'Nói ngay';
  const off = actionDisabled || sending;
  return (
    <View style={styles.composerStack}>
      {counter && (
        <Text accessibilityLiveRegion="polite" style={[styles.counter, counter.length > counter.limit && styles.over]}>
          {counter.length}/{counter.limit}
        </Text>
      )}
      <View style={styles.composer}>
        <View style={[styles.field, !editable && styles.fieldOff]}>
          <TextInput
            accessibilityLabel="Lời giải thích"
            value={value}
            editable={editable}
            multiline
            onFocus={onFocus}
            onChangeText={onChangeText}
            placeholder="Nhập lời giải thích…"
            placeholderTextColor={colors.muted}
            maxFontSizeMultiplier={1.3}
            style={styles.input}
          />
          {canTalkMore && (
            <Pressable accessibilityRole="button" accessibilityLabel="Nói thêm" disabled={!editable}
              onPress={() => { haptic.tap(); onTalkMore(); }} style={({ pressed }) => [styles.talkMore, pressed && styles.pressed]}>
              <Ionicons name="mic-outline" size={22} color={colors.brand} />
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={countdown ? 'Lời giải thích sẽ tự gửi sau 2 giây. Chạm ô nhập để sửa.' : undefined}
          accessibilityState={{ disabled: off, busy: sending }}
          disabled={off}
          onPress={() => { haptic.tap(); onAction(); }}
          style={({ pressed }) => [styles.mic, live && styles.micLive, off && styles.micOff, pressed && styles.pressed]}
        >
          {sending ? <ActivityIndicator color={colors.white} />
            : <Ionicons name={icon} size={26} color={live ? colors.brand : colors.white} />}
          {countdown && !sending && <CountdownRing />}
        </Pressable>
      </View>
    </View>
  );
}

/** Vòng vàng chạy hết trong REVIEW_COUNTDOWN_MS quanh nút gửi (mount lại mỗi lần đếm). */
function CountdownRing() {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.timing(progress, { toValue: 1, duration: REVIEW_COUNTDOWN_MS, easing: Easing.linear, useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [progress]);
  const r = (MIC - RING_STROKE) / 2;
  const length = 2 * Math.PI * r;
  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [length, 0] });
  return (
    <Svg width={MIC} height={MIC} style={styles.ring} pointerEvents="none">
      <Circle cx={MIC / 2} cy={MIC / 2} r={r} stroke={colors.whiteSubtle} strokeWidth={RING_STROKE} fill="none" />
      <AnimatedCircle cx={MIC / 2} cy={MIC / 2} r={r} stroke={colors.lumen} strokeWidth={RING_STROKE} fill="none"
        strokeDasharray={`${length} ${length}`} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${MIC / 2} ${MIC / 2})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  panel: { paddingTop: space.md, backgroundColor: colors.cameraBand },
  inner: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: space.md - space.xs },
  captionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  captionIcon: { marginTop: 2 },
  caption: { fontFamily: font.semibold, fontSize: 17, lineHeight: 23, color: colors.white, flex: 1 },
  dim: { fontFamily: font.medium, color: colors.onDarkMuted },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  verdictText: { ...type.bodyStrong, color: colors.white },
  saving: { gap: space.sm },
  savingText: { ...type.body, color: colors.white },
  picker: { gap: space.sm },
  pickerText: { ...type.body, color: colors.white },
  composerStack: { gap: space.xs },
  counter: { ...type.caption, color: colors.onDarkMuted, alignSelf: 'flex-end' },
  over: { color: colors.lumen },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  field: {
    flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: MIC, borderRadius: MIC / 2,
    paddingLeft: 20, paddingRight: space.xs, backgroundColor: colors.white,
  },
  fieldOff: { opacity: 0.6 },
  input: {
    ...type.body, flex: 1, minHeight: MIC, maxHeight: 120,
    paddingTop: 16, paddingBottom: 16, paddingLeft: 0, paddingRight: space.sm, textAlignVertical: 'center',
  },
  talkMore: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  mic: {
    width: MIC, height: MIC, borderRadius: MIC / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand,
  },
  micLive: {
    backgroundColor: colors.white, outlineColor: colors.lumen, outlineStyle: 'solid', outlineWidth: 3, outlineOffset: 3,
  },
  micOff: { opacity: 0.5 },
  ring: { position: 'absolute', top: 0, left: 0 },
  pressed: { opacity: 0.75 },
});

