import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { Medal } from '@/components/Illustrations';
import { haptic } from '@/lib/haptics';
import { BADGES, badgeFor, saveJourney } from '@/lib/history';
import { useJourney } from '@/lib/store';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, radius, space, type } from '@/theme';

export default function Complete() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { story, photo, quizAnswers, mysteryChoice, reset, setScene } = useJourney();
  const plan = story?.plan;
  const [pop] = useState(() => new Animated.Value(0.6));

  const total = plan?.quiz.length ?? 0;
  const score = plan ? plan.quiz.filter((q, i) => quizAnswers[i] === q.answer_index).length : 0;
  const badge = BADGES[badgeFor(score, total)];

  useEffect(() => {
    if (!plan || !story) { router.replace('/'); return; }
    haptic.success();
    if (reduced) pop.setValue(1);
    else Animated.spring(pop, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 160 }).start();
    void saveJourney({
      storyId: story.id, label: story.label, title: plan.title, score, total, at: Date.now(),
      photoUri: photo?.uri, concept: plan.concept?.name,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!plan) return null;
  const mq = plan.mystery_question;
  // Truyện tạo trước khi có trường `concept`: lấy đáp án câu hỏi bí ẩn làm tên khái niệm.
  const concept = plan.concept ?? { name: mq.options[mq.answer_index] ?? plan.title, definition: plan.scenes[0]?.key_fact ?? '' };

  const share = () =>
    Share.share({ message: `Mình vừa khám phá "${plan.title}" trên LumosLab và trả lời đúng ${score} trên ${total} câu!` }).catch(() => {});

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.topRow}>
        <IconButton icon="home-outline" label="Về trang chủ" onPress={() => { reset(); router.replace('/'); }} />
        <IconButton icon="share-outline" label="Chia sẻ kết quả" onPress={share} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <Medal uri={photo?.uri} size={132} label={badge.name} />
        </Animated.View>

        <Text style={[type.h1, styles.center]} accessibilityRole="header">Xong hành trình{'\n'}{story?.label}!</Text>

        <View style={styles.stars} accessibilityLabel={`Đúng ${score} trên ${total} câu`}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={[styles.star, i < score ? styles.starOn : styles.starOff]}>
              <Ionicons name="star" size={15} color={i < score ? colors.navy : colors.divider} />
            </View>
          ))}
        </View>
        <Text style={[styles.score, styles.center]}>Đúng {score}/{total} câu</Text>

        <View style={styles.concept}>
          <View style={styles.conceptHead}>
            <View style={styles.bulb}><Ionicons name="bulb" size={18} color={colors.navy} /></View>
            <View style={{ flex: 1 }}>
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

        <View style={{ gap: 10 }}>
          <Text style={type.h2}>Ghi nhớ</Text>
          {plan.scenes.slice(0, 3).map((s) => (
            <View key={s.id} style={styles.fact}>
              <View style={styles.check}><Ionicons name="checkmark" size={12} color={colors.navy} /></View>
              <Text style={[type.body, { flex: 1, fontSize: 15, lineHeight: 21 }]}>{s.key_fact}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + space.sm }]}>
        <Button label="Khám phá vật thể khác" icon="camera" onPress={() => { reset(); router.replace('/scan'); }} />
        <Button label="Xem lại câu chuyện" variant="ghost" onPress={() => { setScene(0); router.replace('/story'); }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.md },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md },
  center: { textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  star: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  starOn: { backgroundColor: colors.lumen },
  starOff: { borderWidth: 2, borderColor: colors.divider },
  score: { fontFamily: font.bold, fontSize: 17, color: colors.navy, marginTop: -6 },
  concept: { borderRadius: radius.xl, backgroundColor: colors.navy, padding: 18, gap: 10 },
  conceptHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulb: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.lumen, alignItems: 'center', justifyContent: 'center' },
  conceptKicker: { fontFamily: font.medium, fontSize: 13, color: colors.trail },
  conceptName: { fontFamily: font.black, fontSize: 22, lineHeight: 28, color: colors.white },
  conceptDef: { fontFamily: font.medium, fontSize: 15, lineHeight: 22, color: '#E3ECFB' },
  mystery: { fontFamily: font.semibold, fontSize: 13, lineHeight: 19, color: colors.lumen },
  fact: { flexDirection: 'row', gap: 10 },
  check: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.lumen, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  cta: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: 2, borderTopWidth: 1, borderTopColor: colors.divider },
});
