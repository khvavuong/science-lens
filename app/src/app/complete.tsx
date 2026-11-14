import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { Medal } from '@/components/Illustrations';
import { DiscoveryShare } from '@/components/DiscoveryShare';
import { recapKey } from '@/lib/recap';
import { RecapCard } from '@/components/RecapCard';
import { haptic } from '@/lib/haptics';
import { BADGES, badgeFor, saveJourney, type BadgeId } from '@/lib/history';
import { useJourney } from '@/lib/store';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, radius, space, touch, type } from '@/theme';

// Câu khích lệ theo huy hiệu: không nhắc lại điểm, điểm đã có hàng sao.
const CHEER: Record<BadgeId, string> = {
  scientist: 'Không câu nào làm khó được bạn!',
  explorer: 'Trí tò mò đã đưa bạn đi rất xa.',
  sprout: 'Mỗi lần khám phá, hạt mầm lại lớn thêm.',
};

export default function Complete() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const { story, photo, quizAnswers, mysteryChoice, reset, setScene } = useJourney();
  const plan = story?.plan;
  const [pop] = useState(() => new Animated.Value(0.6));

  const [completedAt] = useState(() => Date.now());
  const [sharing, setSharing] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const total = plan?.quiz.length ?? 0;
  const score = plan ? plan.quiz.filter((q, i) => quizAnswers[i] === q.answer_index).length : 0;
  const badgeId = badgeFor(score, total);
  const badge = BADGES[badgeId];

  useEffect(() => {
    if (!plan || !story) return;
    haptic.success();
    if (reduced) pop.setValue(1);
    else Animated.spring(pop, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 160 }).start();
    void saveJourney({
      storyId: story.id, label: story.label, title: plan.title, score, total, at: completedAt,
      photoUri: photo?.uri, concept: plan.concept?.name, recapKey: photo ? recapKey(photo.uri, quizAnswers) : undefined,
    }).catch(() => setSaveFailed(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (focused && !plan) router.dismissTo('/'); }, [focused, plan]);

  if (!plan) return null;
  const mq = plan.mystery_question;
  // Truyện tạo trước khi có trường `concept`: lấy đáp án câu hỏi bí ẩn làm tên khái niệm.
  const concept = plan.concept ?? { name: mq.options[mq.answer_index] ?? plan.title, definition: plan.scenes[0]?.key_fact ?? '' };
  const replay = () => { setScene(0); router.replace({ pathname: '/story', params: { from, autoplay: '1' } }); };

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.topRow}>
        <IconButton icon="home-outline" label="Về trang chủ" onPress={() => { reset(); router.dismissTo('/'); }} />
        {/* Báo lỗi lưu nằm giữa thanh trên: không đẩy nội dung xuống. */}
        <View style={styles.notice}>
          {saveFailed && (
            <View style={styles.noticePill} accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.noticeText} numberOfLines={2} maxFontSizeMultiplier={1.3}>Chưa lưu được vào Kho khám phá</Text>
            </View>
          )}
        </View>
        <IconButton icon="share-outline" label="Chia sẻ kết quả" onPress={() => setSharing(true)} />
      </View>

      {sharing && story && <DiscoveryShare record={{ storyId: story.id, label: story.label, title: plan.title, score, total, at: completedAt, photoUri: photo?.uri, concept: concept.name }} onClose={() => setSharing(false)} />}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tên huy hiệu đã hiện bằng chữ bên dưới nên ẩn Medal khỏi trình đọc màn hình để không đọc hai lần. */}
        <Animated.View style={{ transform: [{ scale: pop }] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Medal uri={photo?.uri} size={height < 700 ? 104 : 132} label={badge.name} />
        </Animated.View>

        <View style={styles.hero}>
          <Text style={[type.caption, styles.center]}>Xong hành trình {story?.label}</Text>
          <Text style={[type.h1, styles.center]} accessibilityRole="header">{badge.name}</Text>
          <Text style={[type.body, styles.center, styles.cheer]}>{CHEER[badgeId]}</Text>
          <View style={styles.stars} accessible accessibilityLabel={`Đúng ${score} trên ${total} câu`}>
            {Array.from({ length: total }, (_, i) => (
              <View key={i} style={[styles.star, i < score ? styles.starOn : styles.starOff]}>
                <Ionicons name="star" size={14} color={i < score ? colors.navy : colors.divider} />
              </View>
            ))}
            <Text style={styles.score}>{score}/{total}</Text>
          </View>
        </View>

        <View style={styles.concept}>
          <View style={styles.conceptHead}>
            <View style={styles.bulb}><Ionicons name="bulb" size={18} color={colors.navy} /></View>
            <View style={styles.flex}>
              <Text style={styles.conceptKicker}>Khái niệm mới</Text>
              <Text style={styles.conceptName}>{concept.name}</Text>
            </View>
          </View>
          <Text style={styles.conceptDef}>{concept.definition}</Text>
          {mysteryChoice !== null && (
            <Text style={styles.mystery}>
              Câu hỏi bí ẩn: {mq.options[mq.answer_index]}.{' '}
              {mysteryChoice === mq.answer_index ? 'Bạn đoán đúng từ đầu!' : 'Giờ bạn đã biết rồi!'}
            </Text>
          )}
        </View>

        <View style={styles.facts}>
          <View style={styles.factsHead}>
            <Text style={type.h2}>Ghi nhớ</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Xem lại câu chuyện" hitSlop={4} onPress={() => { haptic.tap(); replay(); }}
              style={({ pressed }) => [styles.replay, pressed && styles.replayPressed]}>
              <Ionicons name="play-circle-outline" size={20} color={colors.brand} />
              <Text style={styles.replayText} maxFontSizeMultiplier={1.3}>Xem lại truyện</Text>
            </Pressable>
          </View>
          {plan.scenes.slice(0, 3).map((s) => (
            <View key={s.id} style={styles.fact}>
              <View style={styles.check}><Ionicons name="checkmark" size={12} color={colors.navy} /></View>
              <Text style={[type.body, styles.flex]}>{s.key_fact}</Text>
            </View>
          ))}
        </View>
        <RecapCard key={story?.id} />
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + space.sm }]}>
        <Button label="Khám phá vật thể khác" icon="camera" onPress={() => { reset(); router.replace('/scan'); }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md },
  notice: { flex: 1, alignItems: 'center' },
  noticePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.dangerSoft,
  },
  noticeText: { flexShrink: 1, fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.text },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.lg, gap: space.lg },
  center: { textAlign: 'center' },
  hero: { gap: space.xs, alignItems: 'center', marginTop: -space.sm },
  cheer: { color: colors.muted },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm },
  star: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  starOn: { backgroundColor: colors.lumen },
  starOff: { backgroundColor: colors.bgAlt, borderWidth: 1.5, borderColor: colors.divider },
  score: { fontFamily: font.bold, fontSize: 16, lineHeight: 23, color: colors.navy, marginLeft: 4 },
  concept: { borderRadius: radius.xl, backgroundColor: colors.navy, padding: space.md + 2, gap: 10 },
  conceptHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulb: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.lumen, alignItems: 'center', justifyContent: 'center' },
  conceptKicker: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.onDarkMuted },
  conceptName: { fontFamily: font.black, fontSize: 20, lineHeight: 26, color: colors.white },
  conceptDef: { fontFamily: font.medium, fontSize: 16, lineHeight: 23, color: colors.onDarkMuted },
  mystery: { fontFamily: font.semibold, fontSize: 13, lineHeight: 19, color: colors.lumen },
  facts: { gap: 10 },
  factsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replay: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: touch,
    paddingHorizontal: space.sm, marginRight: -space.sm, borderRadius: radius.pill,
  },
  replayPressed: { backgroundColor: colors.brandSoft },
  replayText: { fontFamily: font.semibold, fontSize: 16, color: colors.brand },
  fact: { flexDirection: 'row', gap: 10 },
  check: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.lumen, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  cta: { paddingHorizontal: space.lg, paddingTop: space.sm },
});
