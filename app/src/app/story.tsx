import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Animated, FlatList, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { RoadmapSheet, titleRepeatsLabel } from '@/components/RoadmapSheet';
import { SceneImage } from '@/components/SceneImage';
import { mediaUrl, type Scene } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/lib/store';
import { useNarration } from '@/lib/useNarration';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, motion, radius, space } from '@/theme';

// Bỏ qua chạm trên tay nắm "Hành trình" ngay sau khi vào màn: nút "Vào câu chuyện" ở Prelude
// nằm đúng chỗ tay nắm nên cú chạm có thể lọt sang và tự mở sheet.
const HANDLE_ARM_DELAY = 600;
// Vùng chuyển từ trong suốt sang đậm phía trên tiêu đề.
const SCRIM_LEAD = 96;
// Khi chưa sẵn sàng: nhận rồi nuốt cú chạm để nó không rơi xuống ảnh (chạm ảnh = phát/dừng).
const swallowTouch = { onStartShouldSetResponder: () => true };

/** Giữ chỗ cho nút ẩn để hàng điều khiển không nhảy bố cục. */
function Slot({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  return (
    <View
      style={hidden && styles.hiddenSlot}
      pointerEvents={hidden ? 'none' : 'auto'}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
    >
      {children}
    </View>
  );
}

export default function Story() {
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(0);
  const { from, autoplay } = useLocalSearchParams<{ from?: string; autoplay?: string }>();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { story, photo, sceneIndex: index, maxViewed, setScene } = useJourney();
  const plan = story?.plan;
  const scenes = plan?.scenes ?? [];
  const last = scenes.length - 1;

  const list = useRef<FlatList<Scene>>(null);
  const [muted, setMuted] = useState(false);
  const [overlay, setOverlay] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [handleArmed, setHandleArmed] = useState(false);
  const [blockH, setBlockH] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));

  useEffect(() => { if (focused && !plan) router.dismissTo('/'); }, [focused, plan]);

  useEffect(() => {
    const t = setTimeout(() => setHandleArmed(true), HANDLE_ARM_DELAY);
    return () => clearTimeout(t);
  }, []);

  const scene = scenes[index];
  const slot = story?.assets.scenes[index];
  const audioState = slot?.audio.status;

  // Chỉ phát tiếng khi người dùng đã chủ động (bấm "Vào câu chuyện" hoặc nút Play).
  // TTS lỗi → tự chuyển sang giọng đọc của điện thoại; luôn ngắt tiếng cũ khi đổi cảnh.
  const voice = useNarration({
    url: mediaUrl(slot?.audio.url),
    status: audioState,
    chunks: scene?.subtitle_chunks ?? [],
    key: index,
    autoplay: autoplay === '1',
    muted,
  });


  const goTo = useCallback((i: number, animated = true) => {
    if (i < 0 || i > last) return;
    list.current?.scrollToIndex({ index: i, animated: animated && !reduced });
    setScene(i);
  }, [last, reduced, setScene]);

  // Fade overlay chữ mỗi lần đổi cảnh.
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: reduced ? 120 : motion.scene, useNativeDriver: true }).start();
  }, [index, fade, reduced]);

  const togglePlay = () => { if (voice.canPlay) voice.toggle(); };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) { haptic.select(); setScene(i); }
  };
  const openQuiz = () => router.push({ pathname: '/quiz', params: { from } });

  // Vuốt lên từ vùng tay nắm "Hành trình" để mở bottom sheet (tránh xung đột với vuốt ngang).
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -10 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderRelease: (_, g) => { if (g.dy < -30) setSheet(true); },
    }),
  );

  if (!plan || !scene) return null;

  const isFirst = index === 0;
  const isLast = index >= last;
  // Tiêu đề đã có năm (vd. "Khu vườn nhà năm 1666") thì không lặp nhãn năm phía trên.
  const showYear = plan.timeline_mode === 'historical' && !!scene.timeline_label && !titleRepeatsLabel(scene.title, scene.timeline_label);

  // Scrim đáy kiểu Stories: trong suốt phía trên tiêu đề, đậm hẳn từ phụ đề trở xuống.
  const scrimH = blockH ? Math.min(height, blockH + SCRIM_LEAD) : height * 0.5;
  const lead = blockH && scrimH ? SCRIM_LEAD / scrimH : 0.3;
  const scrimLocations = [0, lead, Math.min(1, lead + 0.15), 1] as const;

  const { frac, chunkIdx } = voice;
  const subtitle = scene.subtitle_chunks[chunkIdx] ?? '';
  // Karaoke: phần đã đọc trắng đậm, phần sắp đọc mờ (giúp trẻ đọc theo). Cắt ở ranh giới từ.
  const spokenLen = (() => {
    if (!voice.playing && frac === 0) return subtitle.length;
    if (voice.mode === 'device') return subtitle.length;
    const lens = scene.subtitle_chunks.map((c) => c.length);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    const start = lens.slice(0, chunkIdx).reduce((a, b) => a + b, 0) / total;
    const end = start + (lens[chunkIdx] ?? 0) / total;
    const inner = end > start ? Math.min(1, Math.max(0, (frac - start) / (end - start))) : 1;
    const cut = Math.round(inner * subtitle.length);
    const space = subtitle.indexOf(' ', cut);
    return space === -1 ? subtitle.length : space;
  })();

  return (
    <View style={styles.root} onLayout={event => setHeight(event.nativeEvent.layout.height)}>
      {/* Chỉ giữ status bar sáng khi màn đang hiển thị, tránh chữ trắng trên nền kem ở Quiz/Complete. */}
      {focused && <StatusBar style="light" />}
      <FlatList
        ref={list}
        data={scenes}
        extraData={story?.assets}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={onScrollEnd}
        keyExtractor={(s) => String(s.id)}
        windowSize={3}
        renderItem={({ item, index: i }) => (
          <Pressable
            style={{ width, height }}
            onPress={togglePlay}
            onLongPress={() => setOverlay(false)}
            onPressOut={() => setOverlay(true)}
            delayLongPress={350}
            accessibilityLabel={`Cảnh ${i + 1}: ${item.title}. Chạm để phát hoặc tạm dừng.`}
          >
            <SceneImage
              uri={mediaUrl(story!.assets.scenes[i]?.image.url)}
              fallbackUri={photo?.uri}
              active={focused && i === index}
              seed={i}
            />
          </Pressable>
        )}
      />

      {overlay && (
        <>
          <LinearGradient pointerEvents="none" colors={[colors.mediaShade.top, colors.mediaShade.clear]} style={[styles.topShade, { height: insets.top + 96 }]} />
          <LinearGradient
            pointerEvents="none"
            colors={[colors.mediaShade.clear, colors.mediaShade.mid, colors.mediaShade.bottom, colors.mediaShade.bottom]}
            locations={scrimLocations}
            style={[styles.bottomShade, { height: scrimH }]}
          />

          <View style={[styles.top, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
            <View style={styles.segments} accessibilityLabel={`Cảnh ${index + 1} trên ${scenes.length}`}>
              {scenes.map((_, i) => (
                <View key={i} style={styles.segment}>
                  <View style={[styles.segmentFill, i === index && { backgroundColor: colors.lumen }, { width: `${i < index ? 100 : i === index ? Math.max(4, Math.round(frac * 100)) : 0}%` }]} />
                </View>
              ))}
            </View>
            <View style={styles.topRow}>
              <IconButton icon="close" label="Thoát câu chuyện" dark onPress={() => router.dismissTo('/')} />
              <IconButton icon={muted ? 'volume-mute' : 'volume-high'} label={muted ? 'Bật tiếng' : 'Tắt tiếng'} dark onPress={() => setMuted((m) => !m)} />
            </View>
          </View>

          <Animated.View
            style={[styles.bottom, { paddingBottom: insets.bottom + space.xs, opacity: fade }]}
            pointerEvents="box-none"
            onLayout={(e) => setBlockH(e.nativeEvent.layout.height)}
          >
            {showYear && <Text style={styles.year} maxFontSizeMultiplier={1.3}>{scene.timeline_label}</Text>}
            <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.3} numberOfLines={2}>{scene.title}</Text>

            <Text style={styles.subtitle} maxFontSizeMultiplier={1.4} accessibilityLiveRegion="polite" accessibilityLabel={subtitle}>
              <Text style={styles.spoken}>{subtitle.slice(0, spokenLen)}</Text>
              {subtitle.slice(spokenLen)}
            </Text>

            {voice.mode === 'loading' && (
              <View style={styles.note}><ActivityIndicator size="small" color={colors.white} /><Text style={styles.noteText} maxFontSizeMultiplier={1.3}>Đang chuẩn bị giọng kể…</Text></View>
            )}

            <View style={styles.controls}>
              <Slot hidden={isFirst}>
                <IconButton icon="play-skip-back" label="Cảnh trước" dark onPress={() => goTo(index - 1)} />
              </Slot>
              <Pressable
                onPress={togglePlay}
                disabled={!voice.canPlay}
                accessibilityRole="button"
                accessibilityLabel={voice.playing ? 'Tạm dừng' : 'Phát lời kể'}
                accessibilityState={{ disabled: !voice.canPlay }}
                style={({ pressed }) => [styles.play, !voice.canPlay && { opacity: 0.5 }, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                <Ionicons name={voice.playing ? 'pause' : 'play'} size={28} color={colors.navy} style={!voice.playing && { marginLeft: 3 }} />
              </Pressable>
              {/* Cảnh cuối: chỉ còn nút lớn "Giải câu đố", nút ⏭ ẩn nhưng giữ chỗ. */}
              <Slot hidden={isLast}>
                <IconButton icon="play-skip-forward" label="Cảnh tiếp theo" dark onPress={() => goTo(index + 1)} />
              </Slot>
            </View>

            {isLast && (
              <Button label="Giải câu đố" icon="extension-puzzle" chevron onPress={openQuiz} accessibilityHint="Trả lời 3 câu hỏi về câu chuyện" />
            )}

            <View {...(handleArmed ? pan.panHandlers : swallowTouch)}>
              <Pressable
                onPress={() => setSheet(true)}
                disabled={!handleArmed}
                style={styles.handle}
                accessibilityRole="button"
                accessibilityLabel="Mở hành trình khám phá"
                accessibilityHint="Vuốt lên hoặc chạm để xem các mốc"
              >
                <View style={styles.grabber} />
                <Text style={styles.handleText} maxFontSizeMultiplier={1.3}>Hành trình</Text>
              </Pressable>
            </View>
          </Animated.View>

          {!voice.intent && voice.canPlay && !voice.playing && isFirst && (
            <View pointerEvents="none" style={styles.tapHint}><Text style={styles.tapHintText} maxFontSizeMultiplier={1.3}>Chạm ▶ để nghe</Text></View>
          )}
        </>
      )}

      <RoadmapSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        scenes={scenes}
        current={index}
        maxViewed={maxViewed}
        mode={plan.timeline_mode}
        onSelect={(i) => { setSheet(false); if (i !== index) goTo(i, false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottomShade: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: space.md, gap: space.sm },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.whiteVeil, overflow: 'hidden' },
  segmentFill: { height: 4, backgroundColor: colors.white },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, gap: space.sm },
  year: { fontFamily: font.bold, fontSize: 14, color: colors.lumen },
  title: { fontFamily: font.black, fontSize: 22, lineHeight: 28, color: colors.white, letterSpacing: -0.3 },
  subtitle: { fontFamily: font.semibold, fontSize: 19, lineHeight: 28, color: colors.onDarkMuted, minHeight: 56 },
  spoken: { color: colors.white },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.whiteSubtle },
  noteText: { fontFamily: font.medium, fontSize: 14, color: colors.white },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xl },
  hiddenSlot: { opacity: 0 },
  play: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  handle: { alignItems: 'center', justifyContent: 'center', minHeight: 48, gap: 6 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.whiteHalf },
  handleText: { fontFamily: font.semibold, fontSize: 14, color: colors.onDarkMuted },
  tapHint: { position: 'absolute', alignSelf: 'center', top: '42%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.mediaShade.hint },
  tapHintText: { fontFamily: font.semibold, fontSize: 14, color: colors.white },
});
