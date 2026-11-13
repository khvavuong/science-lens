import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, FlatList, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { RoadmapSheet } from '@/components/RoadmapSheet';
import { SceneVisual } from '@/components/SceneVisual';
import { mediaUrl, type Scene } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/lib/store';
import { useNarration } from '@/lib/useNarration';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, motion, radius, space } from '@/theme';

const AUTO_ADVANCE_MS = 1200;

export default function Story() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const params = useLocalSearchParams<{ autoplay?: string }>();
  const { story, photo, sceneIndex: index, maxViewed, setScene, retryAssets } = useJourney();
  const plan = story?.plan;
  const scenes = plan?.scenes ?? [];
  const last = scenes.length - 1;

  const list = useRef<FlatList<Scene>>(null);
  const [muted, setMuted] = useState(false);
  const [overlay, setOverlay] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [fade] = useState(() => new Animated.Value(1));

  useEffect(() => { if (!plan) router.replace('/'); }, [plan]);

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
    autoplay: params.autoplay === '1',
    muted,
  });
  const { silence } = voice;

  // Rời màn hình → dừng tiếng.
  useFocusEffect(useCallback(() => () => silence(), [silence]));

  const goTo = useCallback((i: number, animated = true) => {
    if (i < 0 || i > last) return;
    list.current?.scrollToIndex({ index: i, animated: animated && !reduced });
    setScene(i);
  }, [last, reduced, setScene]);

  // Hết lời kể → tự chuyển cảnh tiếp theo (chỉ khi đang ở chế độ nghe).
  useEffect(() => {
    if (!voice.didFinish || !voice.intent) return;
    if (index >= last) { haptic.success(); return; }
    const at = index;
    const t = setTimeout(() => { if (useJourney.getState().sceneIndex === at) goTo(at + 1); }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [voice.didFinish, voice.intent, index, last, goTo]);

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

  // Vuốt lên từ vùng tay nắm "Hành trình" để mở bottom sheet (tránh xung đột với vuốt ngang).
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -10 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderRelease: (_, g) => { if (g.dy < -30) setSheet(true); },
    }),
  );

  if (!plan || !scene) return null;

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
    <View style={styles.root}>
      <StatusBar style="light" />
      <FlatList
        ref={list}
        data={scenes}
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
            <SceneVisual
              imageUri={mediaUrl(story!.assets.scenes[i]?.image.url)}
              videoUri={mediaUrl(story!.assets.scenes[i]?.video?.url)}
              fallbackUri={photo?.uri}
              active={i === index}
              playing={i === index && voice.playing}
              position={voice.mode === 'remote' ? voice.position : undefined}
              seed={i}
            />
          </Pressable>
        )}
      />

      {overlay && (
        <>
          {/* Overlay tối cục bộ: chỉ ở mép trên & dưới để chữ đủ tương phản, không che chủ thể. */}
          <LinearGradient pointerEvents="none" colors={['rgba(10,20,45,0.55)', 'rgba(10,20,45,0)']} style={[styles.topShade, { height: insets.top + 120 }]} />
          <LinearGradient pointerEvents="none" colors={['rgba(10,20,45,0)', 'rgba(10,20,45,0.78)', 'rgba(10,20,45,0.9)']} locations={[0, 0.4, 1]} style={[styles.bottomShade, { height: height * 0.5 }]} />

          <View style={[styles.top, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
            <View style={styles.segments} accessibilityLabel={`Cảnh ${index + 1} trên ${scenes.length}`}>
              {scenes.map((_, i) => (
                <View key={i} style={styles.segment}>
                  <View style={[styles.segmentFill, i === index && { backgroundColor: colors.lumen }, { width: `${i < index ? 100 : i === index ? Math.max(4, Math.round(frac * 100)) : 0}%` }]} />
                </View>
              ))}
            </View>
            <View style={styles.topRow}>
              <IconButton icon="close" label="Thoát câu chuyện" dark onPress={() => router.replace('/')} />
              <View style={styles.when}>
                <Text style={styles.whenText}>{index + 1} / {scenes.length}</Text>
              </View>
              <IconButton icon={muted ? 'volume-mute' : 'volume-high'} label={muted ? 'Bật tiếng' : 'Tắt tiếng'} dark onPress={() => setMuted((m) => !m)} />
            </View>
          </View>

          <Animated.View style={[styles.bottom, { paddingBottom: insets.bottom + space.sm, opacity: fade }]} pointerEvents="box-none">
            {plan.timeline_mode === 'historical' && <Text style={styles.year}>{scene.timeline_label}</Text>}
            <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.3}>{scene.title}</Text>

            <Text style={styles.subtitle} maxFontSizeMultiplier={1.4} accessibilityLiveRegion="polite" accessibilityLabel={subtitle}>
              <Text style={styles.spoken}>{subtitle.slice(0, spokenLen)}</Text>
              {subtitle.slice(spokenLen)}
            </Text>

            {audioState === 'pending' && (
              <View style={styles.note}><ActivityIndicator size="small" color={colors.white} /><Text style={styles.noteText}>Đang chuẩn bị giọng kể…</Text></View>
            )}
            {audioState === 'error' && (
              <Pressable onPress={retryAssets} style={styles.note} accessibilityRole="button" accessibilityLabel="Đang dùng giọng đọc của máy. Chạm để thử tạo lại giọng kể">
                <Ionicons name="phone-portrait-outline" size={16} color={colors.white} />
                <Text style={styles.noteText}>Giọng của máy · Chạm để thử lại</Text>
              </Pressable>
            )}

            <View style={styles.controls}>
              <IconButton icon="play-skip-back" label="Cảnh trước" dark onPress={() => goTo(index - 1)} />
              <Pressable
                onPress={togglePlay}
                disabled={!voice.canPlay}
                accessibilityRole="button"
                accessibilityLabel={voice.playing ? 'Tạm dừng' : 'Phát lời kể'}
                style={({ pressed }) => [styles.play, !voice.canPlay && { opacity: 0.5 }, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                <Ionicons name={voice.playing ? 'pause' : 'play'} size={30} color={colors.navy} style={!voice.playing && { marginLeft: 3 }} />
              </Pressable>
              <IconButton
                icon={index >= last ? 'trophy' : 'play-skip-forward'}
                label={index >= last ? 'Làm thử thách' : 'Cảnh tiếp theo'}
                dark
                onPress={() => (index >= last ? router.push('/quiz') : goTo(index + 1))}
              />
            </View>

            {index >= last ? (
              <Button label="Làm thử thách" icon="trophy" chevron onPress={() => router.push('/quiz')} style={{ marginTop: space.sm }} />
            ) : null}

            <View {...pan.panHandlers}>
              <Pressable onPress={() => setSheet(true)} style={styles.handle} accessibilityRole="button" accessibilityLabel="Mở hành trình khám phá" accessibilityHint="Vuốt lên hoặc chạm để xem các mốc">
                <View style={styles.grabber} />
                <Text style={styles.handleText}>Hành trình</Text>
              </Pressable>
            </View>
          </Animated.View>

          {!voice.intent && voice.canPlay && !voice.playing && index === 0 && (
            <View pointerEvents="none" style={styles.tapHint}><Text style={styles.tapHintText}>Chạm ▶ để nghe</Text></View>
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
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  segmentFill: { height: 5, backgroundColor: colors.white },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  when: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(15,36,82,0.5)' },
  whenText: { fontFamily: font.bold, fontSize: 14, color: colors.white },
  year: { fontFamily: font.semibold, fontSize: 14, color: colors.lumen },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, gap: space.sm },
  title: { fontFamily: font.black, fontSize: 24, lineHeight: 30, color: colors.white, letterSpacing: -0.3 },
  subtitle: { fontFamily: font.semibold, fontSize: 19, lineHeight: 28, color: 'rgba(255,255,255,0.55)', minHeight: 56 },
  spoken: { color: colors.white },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.14)' },
  noteText: { fontFamily: font.medium, fontSize: 13, color: colors.white },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xl, marginTop: space.sm },
  play: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  handle: { alignItems: 'center', paddingTop: space.md, paddingBottom: space.xs, minHeight: 48 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)', marginBottom: 6 },
  handleText: { fontFamily: font.semibold, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  tapHint: { position: 'absolute', alignSelf: 'center', top: '42%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: 'rgba(10,20,45,0.6)' },
  tapHintText: { fontFamily: font.semibold, fontSize: 15, color: colors.white },
});
