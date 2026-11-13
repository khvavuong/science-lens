import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { ChoiceOption } from '@/components/ChoiceOption';
import { OrbitPhoto } from '@/components/Illustrations';
import { VerticalStep, type NodeState } from '@/components/Trail';
import { mediaUrl, type AssetStatus } from '@/lib/api';
import { useJourney } from '@/lib/store';
import { useNarration } from '@/lib/useNarration';
import { colors, font, radius, space, type } from '@/theme';

const MAX_WAIT_MS = 25000; // Sau thời gian này cho vào truyện dù ảnh chưa xong (dùng ảnh gốc).

const fromAsset = (s?: AssetStatus): NodeState => (s === 'ready' ? 'done' : s === 'error' ? 'skipped' : 'loading');

export default function Prelude() {
  const insets = useSafeAreaInsets();
  const { photo, story, storyError, mysteryChoice, setMystery, label, startStory } = useJourney();
  const plan = story?.plan;

  // Người dùng vừa chủ động bấm "Bắt đầu khám phá" → phát lời mở đầu khi sẵn sàng.
  // TTS lỗi → đọc bằng giọng của điện thoại.
  const narration = plan?.prelude_narration;
  const preludeChunks = useMemo(
    () => (narration ? narration.match(/[^.!?]+[.!?]*/g)?.map((x) => x.trim()).filter(Boolean) ?? [] : []),
    [narration],
  );
  const voice = useNarration({
    url: mediaUrl(story?.assets.prelude_audio.url),
    status: story?.assets.prelude_audio.status,
    chunks: preludeChunks,
    key: story?.id ?? 'none',
    autoplay: true,
    muted: false,
  });
  const { silence } = voice;
  useFocusEffect(useCallback(() => () => silence(), [silence]));

  const [waitedEnough, setWaitedEnough] = useState(false);
  useEffect(() => {
    if (!plan) return;
    const t = setTimeout(() => setWaitedEnough(true), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [plan]);

  const s1 = story?.assets.scenes[0];
  const scene1Ready = !!s1 && s1.image.status !== 'pending' && s1.audio.status !== 'pending';
  const canStart = !!plan && (scene1Ready || waitedEnough);
  const failed = !!storyError || story?.status === 'error' || story?.status === 'unsafe';

  const enter = () => {
    silence();
    router.replace({ pathname: '/story', params: { autoplay: '1' } });
  };

  const steps: { label: string; detail?: string; state: NodeState }[] = [
    { label: 'Nhận ra đồ vật', state: 'done' },
    { label: 'Chọn câu chuyện', state: failed ? 'skipped' : plan ? 'done' : 'loading' },
    {
      label: 'Chuẩn bị giọng kể',
      state: plan ? fromAsset(story?.assets.prelude_audio.status) : 'todo',
      detail: story?.assets.prelude_audio.status === 'error' ? 'Dùng giọng của máy' : undefined,
    },
    {
      label: 'Vẽ cảnh đầu tiên',
      state: plan ? fromAsset(s1?.image.status) : 'todo',
      detail: s1?.image.status === 'error' ? 'Dùng ảnh bạn chụp' : undefined,
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space.sm }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <IconButton icon="chevron-back" label="Quay lại" onPress={() => router.back()} />
          <Pressable
            onPress={() => voice.canPlay && voice.toggle()}
            disabled={!voice.canPlay}
            accessibilityRole="button"
            accessibilityLabel={voice.playing ? 'Tạm dừng lời mở đầu' : 'Nghe lời mở đầu'}
            style={({ pressed }) => [styles.voiceBtn, voice.playing && styles.voiceOn, pressed && { opacity: 0.8 }]}
          >
            {!voice.canPlay ? <ActivityIndicator size="small" color={colors.brand} />
              : <Ionicons name={voice.playing ? 'pause' : 'volume-high'} size={20} color={voice.playing ? colors.white : colors.navy} />}
          </Pressable>
        </View>

        <OrbitPhoto uri={photo?.uri} size={118} />

        {!plan && !failed && (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brand} />
            <Text style={[type.bodyStrong, { flex: 1 }]}>Đang chọn câu chuyện về {label}…</Text>
          </View>
        )}

        {failed && (
          <View style={{ gap: space.md }}>
            <Text style={type.h2}>{story?.status === 'unsafe' ? 'Mình chưa tìm được câu chuyện phù hợp' : 'Chưa tạo được câu chuyện'}</Text>
            <Text style={[type.body, { color: colors.muted }]}>{storyError ?? 'Bạn thử lại hoặc chụp một đồ vật khác nhé.'}</Text>
            {story?.status !== 'unsafe' && (
              <Button label="Thử lại" variant="secondary" icon="refresh" onPress={() => { useJourney.setState({ story: null, storyError: null }); void startStory(label); }} />
            )}
          </View>
        )}

        {plan && (
          <>
            <View style={{ gap: space.sm }}>
              <Text style={type.h1} accessibilityRole="header">{plan.title}</Text>
              <Text style={[type.body, { color: colors.muted }]}>{plan.teaser}</Text>
            </View>

            <View style={styles.mystery}>
              <View style={styles.mysteryHead}>
                <View style={styles.qMark}><Text style={styles.qMarkText}>?</Text></View>
                <Text style={styles.mysteryQ}>{plan.mystery_question.question}</Text>
              </View>
              <View style={{ gap: 8 }} accessibilityRole="radiogroup">
                {plan.mystery_question.options.map((o, i) => (
                  <ChoiceOption key={i} tone="dark" index={i} text={o} state={mysteryChoice === i ? 'selected' : 'idle'} onPress={() => setMystery(i)} />
                ))}
              </View>
              <Text style={styles.mysteryHint}>
                {mysteryChoice === null ? 'Đoán thử nhé, đáp án có trong truyện.' : 'Nghe truyện để biết đáp án nhé!'}
              </Text>
            </View>
          </>
        )}

        {!failed && (
          <View accessibilityLabel="Tiến trình chuẩn bị">
            {steps.map((s, i) => (
              <VerticalStep key={s.label} state={s.state} last={i === steps.length - 1} size={22}>
                <Text style={[styles.stepText, s.state === 'todo' && { color: colors.muted }, s.state === 'loading' && styles.stepActive]}>{s.label}</Text>
                {s.detail && <Text style={type.caption}>{s.detail}</Text>}
              </VerticalStep>
            ))}
          </View>
        )}
      </ScrollView>

      {plan && (
        <View style={[styles.cta, { paddingBottom: insets.bottom + space.md }]}>
          <Button
            label={canStart ? 'Vào câu chuyện' : 'Đang vẽ cảnh đầu tiên…'}
            icon={canStart ? 'play' : undefined}
            loading={!canStart}
            disabled={!canStart}
            onPress={enter}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voiceBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center' },
  voiceOn: { backgroundColor: colors.brand },
  loading: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: colors.bgAlt },
  mystery: { borderRadius: radius.xl, backgroundColor: colors.navy, padding: 18, gap: 14 },
  mysteryHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  qMark: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lumen, alignItems: 'center', justifyContent: 'center' },
  qMarkText: { fontFamily: font.black, fontSize: 20, color: colors.navy },
  mysteryQ: { flex: 1, fontFamily: font.bold, fontSize: 18, lineHeight: 25, color: colors.white },
  mysteryHint: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.trail },
  stepText: { fontFamily: font.medium, fontSize: 15, lineHeight: 22, color: colors.text },
  stepActive: { fontFamily: font.bold, color: colors.navy },
  cta: { paddingHorizontal: space.lg, paddingTop: space.sm, backgroundColor: colors.bg },
});
