import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { ChoiceOption, type ChoiceState } from '@/components/ChoiceOption';
import { HorizontalTrail, type NodeState } from '@/components/Trail';
import { stripPraise } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/lib/store';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, motion, radius, space, type } from '@/theme';

const letterOf = (i: number) => String.fromCharCode(65 + i);

/** Câu đố sau truyện: một câu mỗi màn, chọn → "Kiểm tra" → sheet phản hồi ở đáy (kiểu Duolingo). */
export default function Quiz() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { story, quizAnswers, answer } = useJourney();
  const quiz = story?.plan?.quiz ?? [];
  // Mở lại đúng câu đang làm dở.
  const [q, setQ] = useState(() => Math.max(0, quizAnswers.findIndex((a) => a === null)));
  const [selected, setSelected] = useState<number | null>(null);
  const [enter] = useState(() => new Animated.Value(1));
  const [sheet] = useState(() => new Animated.Value(0));
  const scroll = useRef<ScrollViewInstance>(null);

  useEffect(() => { if (focused && !quiz.length) router.dismissTo('/'); }, [focused, quiz.length]);
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
  const answerText = `${letterOf(item.answer_index)}. ${item.options[item.answer_index]}`;

  const stateOf = (i: number): ChoiceState => {
    if (!checked) return selected === i ? 'selected' : 'idle';
    if (i === item.answer_index) return 'correct';
    if (i === committed) return 'wrong';
    return 'dim';
  };

  // Câu đã trả lời: đúng = 'done' (tích xanh), sai = 'missed' (chấm trung tính), không bao giờ hiện tích cho câu sai.
  const trail: NodeState[] = quiz.map((it, i) => {
    const a = quizAnswers[i];
    if (a !== null && a !== undefined) return a === it.answer_index ? 'done' : 'missed';
    return i === q ? 'current' : 'todo';
  });
  const nodeWord: Record<NodeState, string> = {
    done: 'đúng', missed: 'chưa đúng', current: 'đang làm', todo: 'chưa làm',
    locked: 'chưa mở', loading: 'đang tải', skipped: 'bỏ qua',
  };
  const trailLabel = `Câu đố, câu ${q + 1} trên ${quiz.length}. ${trail.map((s, i) => `Câu ${i + 1}: ${nodeWord[s]}`).join(', ')}`;

  const check = () => {
    if (selected === null) return;
    answer(q, selected);
    const right = selected === item.answer_index;
    if (right) haptic.success();
    else haptic.error();
    // Android đọc qua accessibilityLiveRegion của sheet; iOS cần thông báo chủ động.
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(right ? 'Chính xác!' : `Chưa đúng. Đáp án đúng là ${answerText}`);
    }
  };

  const goQ = (n: number) => { setSelected(null); setQ(n); };
  const next = () => {
    if (q < quiz.length - 1) goQ(q + 1);
    else router.replace({ pathname: '/complete', params: { from } });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" label={q > 0 ? 'Câu trước' : 'Quay lại câu chuyện'} onPress={() => (q > 0 ? goQ(q - 1) : router.back())} />
        <View style={{ flex: 1 }} accessible accessibilityLabel={trailLabel}>
          <HorizontalTrail states={trail} size={26} numbered />
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        {/* Câu hỏi ở trên, đáp án dồn xuống vùng ngón cái. Khi sheet phản hồi mở, khoảng trống co lại;
            màn nhỏ thì cuộn tới cuối để vẫn thấy các đáp án đã tô màu. */}
        <ScrollView
          key={q}
          ref={scroll}
          contentContainerStyle={styles.scroll}
          onLayout={() => { if (checked) scroll.current?.scrollToEnd({ animated: !reduced }); }}
        >
          <Text style={type.h1} accessibilityRole="header">{item.question}</Text>
          <View style={styles.options} accessibilityRole="radiogroup">
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
          {/* Khi sai, đáp án đúng đã tô xanh kèm chữ "Đúng" trong danh sách nên không lặp lại trên sheet;
              trình đọc màn hình vẫn nghe đáp án đúng qua accessibilityLabel của tiêu đề. */}
          <View
            style={styles.fbHead}
            accessible
            accessibilityRole="header"
            accessibilityLabel={isCorrect ? 'Chính xác!' : `Chưa đúng, không sao! Đáp án đúng là ${answerText}`}
          >
            <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={28} color={isCorrect ? colors.mintInk : colors.danger} />
            <Text style={[styles.fbTitle, { color: isCorrect ? colors.mintInk : colors.danger }]}>
              {isCorrect ? 'Chính xác!' : 'Chưa đúng, không sao!'}
            </Text>
          </View>
          <Text style={type.body}>{stripPraise(item.explanation)}</Text>
          {scene && (
            <View style={styles.sceneRef}>
              <Ionicons name="book-outline" size={14} color={colors.muted} />
              <Text style={[type.caption, { flex: 1 }]}>Trong cảnh: {scene.title}</Text>
            </View>
          )}
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
  scroll: { flexGrow: 1, justifyContent: 'space-between', gap: space.lg, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md },
  options: { gap: 12 },
  feedback: { paddingHorizontal: space.lg, paddingTop: 20, gap: 10, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  fbOk: { backgroundColor: colors.mintSoft },
  fbNo: { backgroundColor: colors.dangerSoft },
  fbHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  fbTitle: { flex: 1, fontFamily: font.black, fontSize: 20, lineHeight: 26 },
  sceneRef: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cta: { paddingHorizontal: space.lg, paddingTop: space.sm },
});
