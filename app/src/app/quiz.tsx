import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { ChoiceOption, type ChoiceState } from '@/components/ChoiceOption';
import { HorizontalTrail, type NodeState } from '@/components/Trail';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/lib/store';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, motion, radius, space, type } from '@/theme';

export default function Quiz() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { story, quizAnswers, answer } = useJourney();
  const quiz = story?.plan?.quiz ?? [];
  // Mở lại đúng câu đang làm dở.
  const [q, setQ] = useState(() => Math.max(0, quizAnswers.findIndex((a) => a === null)));
  const [selected, setSelected] = useState<number | null>(null);
  const [enter] = useState(() => new Animated.Value(1));
  const [sheet] = useState(() => new Animated.Value(0));

  useEffect(() => { if (!quiz.length) router.replace('/'); }, [quiz.length]);
  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: reduced ? 120 : motion.sheet, useNativeDriver: true }).start();
  }, [q, enter, reduced]);

  const item = quiz[q];
  const committed = quizAnswers[q];
  const checked = committed !== null && committed !== undefined;

  useEffect(() => {
    sheet.setValue(checked ? 0 : 1);
    if (checked) Animated.timing(sheet, { toValue: 1, duration: reduced ? 0 : motion.sheet, useNativeDriver: true }).start();
  }, [checked, q, sheet, reduced]);

  if (!item) return null;

  const isCorrect = checked && committed === item.answer_index;
  const scene = story?.plan?.scenes.find((s) => s.id === item.scene_ref);

  const stateOf = (i: number): ChoiceState => {
    if (!checked) return selected === i ? 'selected' : 'idle';
    if (i === item.answer_index) return 'correct';
    if (i === committed) return 'wrong';
    return 'dim';
  };

  const trail: NodeState[] = quiz.map((_, i) => (i < q || (i === q && checked) ? 'done' : i === q ? 'current' : 'todo'));

  const check = () => {
    if (selected === null) return;
    answer(q, selected);
    if (selected === item.answer_index) haptic.success();
    else haptic.error();
  };

  const goQ = (n: number) => { setSelected(null); setQ(n); };
  const next = () => {
    if (q < quiz.length - 1) goQ(q + 1);
    else router.replace('/complete');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" label={q > 0 ? 'Câu trước' : 'Quay lại câu chuyện'} onPress={() => (q > 0 ? goQ(q - 1) : router.back())} />
        <View style={{ flex: 1 }} accessibilityLabel={`Câu ${q + 1} trên ${quiz.length}`}>
          <HorizontalTrail states={trail} size={26} numbered />
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[type.h1, { marginBottom: space.lg }]} accessibilityRole="header">{item.question}</Text>
          <View style={{ gap: 10 }} accessibilityRole="radiogroup">
            {item.options.map((o, i) => (
              <ChoiceOption key={i} index={i} text={o} state={stateOf(i)} disabled={checked} onPress={() => setSelected(i)} />
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {checked ? (
        <Animated.View
          style={[styles.feedback, isCorrect ? styles.fbOk : styles.fbNo, { paddingBottom: insets.bottom + space.md },
            { transform: [{ translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }], opacity: sheet }]}
          accessibilityLiveRegion="assertive"
        >
          <View style={styles.fbHead}>
            <View style={[styles.fbIcon, !isCorrect && { backgroundColor: colors.surface }]}>
              <Ionicons name={isCorrect ? 'star' : 'bulb'} size={18} color={colors.navy} />
            </View>
            <Text style={styles.fbTitle}>{isCorrect ? 'Chính xác!' : 'Chưa đúng rồi, không sao nhé!'}</Text>
          </View>
          {!isCorrect && (
            <Text style={type.bodyStrong}>Đáp án đúng: {String.fromCharCode(65 + item.answer_index)}. {item.options[item.answer_index]}</Text>
          )}
          <Text style={type.body}>{item.explanation}</Text>
          {scene && <Text style={[styles.sceneRef, !isCorrect && { color: colors.brand }]}>Nhắc lại ở Bước {scene.id}: {scene.title}</Text>}
          <Button label={q < quiz.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'} chevron onPress={next} style={{ marginTop: space.sm }} />
        </Animated.View>
      ) : (
        <View style={[styles.cta, { paddingBottom: insets.bottom + space.md }]}>
          <Button label="Kiểm tra" onPress={check} disabled={selected === null} accessibilityHint="Xác nhận đáp án đã chọn" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingRight: space.lg },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  feedback: { paddingHorizontal: space.lg, paddingTop: 20, gap: 8, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  fbOk: { backgroundColor: colors.mintSoft },
  fbNo: { backgroundColor: colors.bgAlt },
  fbHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fbIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.lumen, alignItems: 'center', justifyContent: 'center' },
  fbTitle: { fontFamily: font.black, fontSize: 20, color: colors.navy },
  sceneRef: { fontFamily: font.semibold, fontSize: 14, color: colors.mintInk },
  cta: { paddingHorizontal: space.lg, paddingTop: space.sm },
});
