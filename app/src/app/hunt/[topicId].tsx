import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/Button';
import { HuntFrame } from '@/components/HuntFrame';
import { HuntLivePanel, type Caption } from '@/components/HuntLivePanel';
import { HuntLiveTarget, HuntLiveTop } from '@/components/HuntLiveTop';
import { LumoAura } from '@/components/LumoAura';
import { HorizontalTrail, type NodeState } from '@/components/Trail';
import { liveBarState, micAction, scanChipText } from '@/lib/huntScreen';
import { huntTopics, loadHunts, useHunts } from '@/lib/huntStore';
import { HUNT_TEXT_LIMIT } from '@/lib/huntTypes';
import { useHuntLive } from '@/lib/useHuntLive';
import { colors, radius, space, type } from '@/theme';

// Bộ đếm ký tự chỉ hiện khi gần chạm giới hạn.
const COUNTER_FROM = Math.floor(HUNT_TEXT_LIMIT * 0.8);
/** Khung ngắm đặt ở ~13% chiều cao màn. */
const RETICLE_TOP = 0.13;

/**
 * Thử thách trực tiếp: camera toàn màn tự quét, Lumo hỏi bằng giọng, micro tự nghe, tự gửi chấm.
 * Hoàn thành thì hiện danh sách đồ vật đã đạt.
 */
export default function HuntMission() {
  const { topicId } = useLocalSearchParams<{ topicId?: string }>();
  const id = typeof topicId === 'string' ? topicId : '';
  const progress = useHunts((state) => state.progress[id]);
  const loaded = useHunts((state) => state.loaded);
  const sending = useHunts((state) => state.submitting[id]);
  const savingError = useHunts((state) => state.savingError[id]);
  const topic = huntTopics.find((candidate) => candidate.id === id && candidate.version === progress?.topicVersion);
  const [loadError, setLoadError] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const { height } = useWindowDimensions();
  const camera = useRef<CameraView>(null);
  const live = useHuntLive(topic, camera);

  useEffect(() => { void loadHunts().catch(() => setLoadError(true)); }, []);

  if (loadError) return <HuntFrame back="/hunt">
    <Text style={type.body}>Chưa mở được bài đã lưu.</Text>
    <Button label="Thử mở lại" onPress={() => { setLoadError(false); void loadHunts().catch(() => setLoadError(true)); }} />
  </HuntFrame>;
  if (!loaded) return <HuntFrame back="/hunt"><ActivityIndicator accessibilityLabel="Đang mở nhiệm vụ" color={colors.brand} /></HuntFrame>;
  if (!topic || !progress) return <HuntFrame back="/hunt"><Text style={type.body}>Chủ đề này chưa có trên thiết bị.</Text></HuntFrame>;

  const count = progress.accepted.length;

  if (progress.completedAt) {
    const trail = Array.from({ length: topic.required }, (): NodeState => 'done');
    const toggle = (itemId: string) => setExpanded((open) => open.includes(itemId) ? open.filter((value) => value !== itemId) : [...open, itemId]);
    return (
      <HuntFrame back="/hunt" title={topic.title} footer={
        <Button label="Chọn chủ đề khác" icon="grid-outline"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/hunt')} />
      }>
        <View style={styles.intro}>
          <View style={styles.badge}>
            <Ionicons name="star" size={40} color={colors.navy} />
          </View>
          <Text style={styles.cheer} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
            Em đã tìm đủ {topic.required} đồ vật!
          </Text>
          <Text style={styles.task}>{topic.task}</Text>
          <View style={styles.progress} accessible accessibilityLiveRegion="polite" accessibilityLabel="Nhiệm vụ hoàn thành">
            <View style={styles.trail}><HorizontalTrail states={trail} size={20} /></View>
            <Ionicons name="checkmark-circle" size={20} color={colors.mintInk} />
            <Text style={styles.doneText}>Hoàn thành</Text>
          </View>
        </View>
        <View style={styles.found}>
          <Text style={styles.section} accessibilityRole="header">Đồ vật đã đạt</Text>
          {progress.accepted.map((item) => {
            const open = expanded.includes(item.id);
            return (
              <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ expanded: open }}
                accessibilityLabel={`${item.result.objectLabel}. ${item.result.feedback}`}
                accessibilityHint={open ? 'Thu gọn' : 'Xem lời giải thích của em'}
                onPress={() => toggle(item.id)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                <Image source={{ uri: item.photo.uri }} contentFit="cover" style={styles.thumb} accessibilityLabel={item.result.objectLabel} />
                <View style={styles.itemText}>
                  <Text style={type.bodyStrong}>{item.result.objectLabel}</Text>
                  <Text style={type.caption} numberOfLines={open ? undefined : 2}>{item.result.feedback}</Text>
                  {open && <Text style={styles.quote}>“{item.explanation}”</Text>}
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      </HuntFrame>
    );
  }

  const { phase, voice, listen, scan, draft } = live;
  const busy = phase === 'transcribing' || phase === 'evaluating' || !!sending;
  const locked = !!live.label && !!draft?.photo;
  const length = draft?.explanation.trim().length ?? 0;
  const listeningNow = phase === 'listening' || listen.listening;
  const action = micAction({ listening: listeningNow, hasText: live.hasText });

  // Phụ đề: lời Lumo đang nói (trắng đậm); câu cũ khi đang nghe/chờ thì mờ.
  const base = live.caption ?? { text: topic.task, tone: 'say' as const };
  const caption: Caption = base.tone === 'say' && !voice.speaking && phase !== 'ready' && phase !== 'scanning' && phase !== 'asking'
    ? { text: base.text, tone: 'dim' } : base;
  const bar = liveBarState({ phase, speaking: voice.speaking, listening: listen.listening, paused: listen.paused, micDenied: listen.denied });
  const barLevel = bar?.tone === 'lumo' ? voice.level : bar?.tone === 'me' ? listen.level : 0;

  // Chip dưới khung ngắm: lỗi tạm thời, hoặc gợi ý của vòng quét (camera mode).
  const scanChip = phase === 'scanning' && !live.cameraDenied ? scanChipText[scan.hint] : null;
  const chip = live.chipError ?? scanChip;
  const chipTappable = !live.chipError && phase === 'scanning' && scan.hint === 'paused' && !scan.scanning;
  const reticleSize = Math.min(200, Math.round(height * 0.26));
  const reticle = phase === 'scanning' && scan.scanning ? 'scanning' : locked && phase !== 'scanning' ? 'locked' : 'idle';
  const showCamera = live.live && live.cameraGranted;

  return (
    <View style={styles.root}>
      {live.live && <StatusBar style="light" />}
      {showCamera && <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" animateShutter={false} />}
      <HuntLiveTarget top={Math.round(height * RETICLE_TOP)} size={reticleSize} reticle={reticle}
        showReticle={showCamera && !live.cameraDenied} chip={chip} onChip={chipTappable ? live.resumeScan : undefined}
        tag={locked && phase !== 'scanning' ? live.label : null} onTag={busy ? undefined : live.rescan} />
      <HuntLiveTop count={count} required={topic.required} hint={topic.hint} hintOpen={hintOpen} onToggleHint={() => setHintOpen((open) => !open)} />
      {/* Aura nằm dưới dải đáy, trên camera. */}
      <LumoAura active={voice.speaking} level={voice.level} />
      <KeyboardAvoidingView pointerEvents="box-none" style={styles.bottom} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <HuntLivePanel
          caption={caption}
          verdict={live.verdict}
          bar={bar}
          barLevel={barLevel}
          onStart={phase === 'ready' ? () => void live.begin() : undefined}
          startLabel={count > 0 ? 'Tìm tiếp' : 'Bắt đầu tìm'}
          picker={live.cameraDenied && !locked ? { busy: live.picking, onPick: () => void live.pickPhoto() } : undefined}
          saving={savingError ? { message: savingError, busy: live.retrying, onRetry: () => void live.retrySave() } : undefined}
          composer={{
            // Đang quét vật mới: không hiện chữ của vật trước trong ô đang tắt.
            value: locked ? draft?.explanation ?? '' : '',
            editable: locked && !busy,
            onFocus: live.takeOver,
            onChangeText: live.edit,
            mic: action,
            micPaused: listen.paused,
            canTalkMore: action === 'send' && !listen.denied && locked && !busy,
            onTalkMore: live.talk,
            actionDisabled: !locked || busy || (action === 'send' && length > HUNT_TEXT_LIMIT),
            sending: phase === 'evaluating' || !!sending,
            countdown: live.counting,
            onAction: live.micPress,
            counter: length > COUNTER_FROM ? { length, limit: HUNT_TEXT_LIMIT } : null,
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  bottom: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  pressed: { opacity: 0.6 },
  intro: { alignItems: 'center', gap: space.sm },
  badge: {
    width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.lumen, marginTop: space.sm,
  },
  cheer: { ...type.h1, textAlign: 'center' },
  task: { ...type.body, textAlign: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 28 },
  trail: { width: 108 },
  doneText: { ...type.bodyStrong, color: colors.mintInk },
  found: { gap: space.xs },
  section: { ...type.caption, marginTop: space.sm },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.sm, minHeight: 72 },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.bgAlt },
  itemText: { flex: 1, gap: 2 },
  quote: { ...type.body, marginTop: space.xs },
});
