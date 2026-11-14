import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { ChoiceOption } from '@/components/ChoiceOption';
import { OrbitPhoto } from '@/components/Illustrations';
import { mediaUrl, type AssetStatus } from '@/lib/api';
import { useJourney } from '@/lib/store';
import { useNarration } from '@/lib/useNarration';
import { colors, font, radius, space, touch, type } from '@/theme';

const MAX_WAIT_MS = 25000; // Sau thời gian này cho vào truyện dù ảnh chưa xong (dùng ảnh gốc).

type Step = 'done' | 'current' | 'todo';

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

  const plannedStoryId = plan ? story?.id : undefined;
  const [waitedStoryId, setWaitedStoryId] = useState<string>();
  useEffect(() => {
    if (!plannedStoryId) return;
    // Polling thay đối tượng plan, nhưng bộ đếm chỉ chạy một lần cho mỗi truyện.
    const t = setTimeout(() => setWaitedStoryId(plannedStoryId), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [plannedStoryId]);

  const s1 = story?.assets.scenes[0];
  const scene1Ready = !!s1 && s1.image.status !== 'pending' && s1.audio.status !== 'pending';
  const canStart = !!plannedStoryId && (scene1Ready || waitedStoryId === plannedStoryId);
  const failed = !!storyError || story?.status === 'error' || story?.status === 'unsafe';

  const enter = () => {
    silence();
    router.replace({ pathname: '/story', params: { autoplay: '1' } });
  };

  // Tiến trình thật (không % giả): nhận diện → chọn truyện → giọng kể → cảnh đầu tiên.
  const preludeAudio = story?.assets.prelude_audio.status;
  const finished = (s?: AssetStatus) => !!plan && s !== undefined && s !== 'pending';
  const doneFlags = [true, !!plan, finished(preludeAudio), finished(s1?.image.status)];
  const firstPending = doneFlags.indexOf(false);
  const steps: Step[] = doneFlags.map((d, i) => (d ? 'done' : i === firstPending ? 'current' : 'todo'));
  const status = !plan
    ? `Đang chọn câu chuyện về ${label}…`
    : !finished(preludeAudio) ? 'Đang chuẩn bị giọng kể…'
    : !finished(s1?.image.status) ? 'Đang vẽ cảnh đầu tiên…'
    : 'Sắp xong rồi…';

  // Fallback vẫn báo cho bạn nhỏ biết, nhưng gọn trong một dòng dưới nút.
  const fallbacks: string[] = [];
  if (preludeAudio === 'error' || s1?.audio.status === 'error') fallbacks.push('giọng của máy');
  if (s1?.image.status === 'error') fallbacks.push('ảnh bạn chụp');

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space.sm }]} showsVerticalScrollIndicator={false}>
        {/* Ảnh đồ vật nằm giữa hai nút để tiết kiệm chiều cao cho câu hỏi bí ẩn. */}
        <View style={styles.header}>
          <IconButton icon="chevron-back" label="Quay lại" size={touch} onPress={() => router.back()} />
          <OrbitPhoto uri={photo?.uri} size={84} />
          <Pressable
            onPress={() => voice.canPlay && voice.toggle()}
            disabled={!voice.canPlay}
            accessibilityRole="button"
            accessibilityLabel={voice.playing ? 'Tạm dừng lời mở đầu' : 'Nghe lời mở đầu'}
            accessibilityState={{ disabled: !voice.canPlay }}
            style={({ pressed }) => [styles.voiceBtn, voice.playing && styles.voiceOn, !voice.canPlay && styles.voiceOff, pressed && styles.pressed]}
          >
            <Ionicons name={voice.playing ? 'pause' : 'volume-high'} size={22} color={voice.playing ? colors.white : colors.navy} />
          </Pressable>
        </View>

        {failed && (
          <View style={styles.block}>
            <Text style={type.h2}>{story?.status === 'unsafe' ? 'Mình chưa tìm được câu chuyện phù hợp' : 'Chưa tạo được câu chuyện'}</Text>
            <Text style={[type.body, styles.muted]}>{storyError ?? 'Bạn thử lại hoặc chụp một đồ vật khác nhé.'}</Text>
            {story?.status !== 'unsafe' && (
              <Button label="Thử lại" variant="secondary" icon="refresh" onPress={() => { useJourney.setState({ story: null, storyError: null }); void startStory(label); }} />
            )}
          </View>
        )}

        {/* Khung chờ tĩnh đúng vị trí tiêu đề và câu hỏi, để màn không trống khi đang chọn truyện. */}
        {!plan && !failed && (
          <View style={styles.block} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <View style={styles.titleText}>
              <View style={[styles.skelLine, { width: '78%' }]} />
              <View style={[styles.skelLine, { width: '52%' }]} />
            </View>
            <View style={styles.mystery}>
              <View style={[styles.skelDark, { width: '70%', height: 18 }]} />
              {[0, 1, 2].map((i) => <View key={i} style={[styles.skelDark, styles.skelOption]} />)}
            </View>
          </View>
        )}

        {plan && (
          <View style={styles.block}>
            <View style={styles.titleText}>
              <Text style={type.h1} accessibilityRole="header">{plan.title}</Text>
              <Text style={[type.body, styles.muted]} numberOfLines={3}>{plan.teaser}</Text>
            </View>

            <View style={styles.mystery}>
              <View style={styles.mysteryHead}>
                <View style={styles.qMark}>
                  {mysteryChoice === null
                    ? <Text style={styles.qMarkText}>?</Text>
                    : <Ionicons name="checkmark" size={16} color={colors.navy} />}
                </View>
                <Text style={styles.mysteryHint} accessibilityLiveRegion="polite">
                  {mysteryChoice === null ? 'Đoán thử trước, đáp án có trong truyện' : 'Đã ghi lại dự đoán của bạn'}
                </Text>
              </View>
              <Text style={styles.mysteryQ}>{plan.mystery_question.question}</Text>
              <View style={styles.options} accessibilityRole="radiogroup">
                {plan.mystery_question.options.map((o, i) => (
                  <ChoiceOption key={i} tone="dark" index={i} text={o} state={mysteryChoice === i ? 'selected' : 'idle'} onPress={() => setMystery(i)} />
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {!failed && (
        <View style={[styles.cta, { paddingBottom: insets.bottom + space.md }]}>
          {!canStart && (
            <View
              style={styles.status}
              accessible
              accessibilityLiveRegion="polite"
              accessibilityLabel={`${status} Bước ${firstPending < 0 ? steps.length : firstPending + 1} trên ${steps.length}.`}
            >
              <View style={styles.bars}>
                {steps.map((s, i) => <View key={i} style={[styles.bar, styles[s]]} />)}
              </View>
              <Text style={[type.caption, styles.statusText]} numberOfLines={1}>{status}</Text>
            </View>
          )}
          <Button
            label="Vào câu chuyện"
            icon={canStart ? 'play' : undefined}
            loading={!canStart}
            disabled={!canStart}
            onPress={enter}
          />
          {canStart && fallbacks.length > 0 && (
            <Text style={[type.caption, styles.note]}>Truyện sẽ dùng {fallbacks.join(' và ')}.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  voiceBtn: { width: touch, height: touch, borderRadius: touch / 2, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center' },
  voiceOn: { backgroundColor: colors.brand },
  voiceOff: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  block: { gap: space.md },
  titleText: { gap: space.xs },
  muted: { color: colors.muted },
  mystery: { borderRadius: radius.xl, backgroundColor: colors.navy, padding: space.md, gap: 12 },
  mysteryHead: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  qMark: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.lumen, alignItems: 'center', justifyContent: 'center' },
  qMarkText: { fontFamily: font.black, fontSize: 14, color: colors.navy },
  mysteryHint: { flex: 1, fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.onDarkMuted },
  mysteryQ: { fontFamily: font.bold, fontSize: 18, lineHeight: 25, color: colors.white },
  options: { gap: space.sm },
  skelLine: { height: 22, borderRadius: radius.sm / 2, backgroundColor: colors.surface },
  skelDark: { borderRadius: radius.sm / 2, backgroundColor: colors.navySoft },
  skelOption: { height: 50, borderRadius: 14 },
  cta: { paddingHorizontal: space.lg, paddingTop: space.sm, backgroundColor: colors.bg, gap: space.sm },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bars: { flexDirection: 'row', gap: space.xs },
  bar: { width: 16, height: 4, borderRadius: 2 },
  done: { backgroundColor: colors.brand },
  current: { backgroundColor: colors.lumen },
  todo: { backgroundColor: colors.divider },
  statusText: { flex: 1 },
  note: { textAlign: 'center' },
});
