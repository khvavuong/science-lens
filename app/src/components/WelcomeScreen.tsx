import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { LumoGreeting, SpinningTopScan } from '@/components/OnboardingScenes';
import { Wordmark } from '@/components/Wordmark';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, motion, radius, space, touch, type } from '@/theme';

const apple = require('../../assets/onboarding-apple.webp');
const webSwipeStyle = { overflow: 'hidden', touchAction: 'pan-y' } as const;

const steps = [
  {
    title: 'Chào bạn, mình là Lumo!',
    body: 'Cùng mình tìm xem những đồ vật quanh bạn có gì thú vị nhé.',
  },
  {
    title: 'Một đồ vật, một câu chuyện',
    body: 'Bạn có thể chụp hoặc chọn ảnh một đồ vật. Mình sẽ kể bạn nghe điều khoa học thú vị về nó.',
  },
  {
    title: 'Đến lượt bạn!',
    body: 'Vì sao con quay không đổ ngay khi xoay? Thử quét một đồ vật để khám phá nhé!',
  },
];

export function WelcomeScreen({ onStart, onSkip, busy }: {
  onStart: () => void;
  onSkip: () => void;
  busy: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [position] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion(true);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pageWidth = Math.min(width, 520);
  const artSize = Math.min(308, pageWidth - 2 * space.lg, Math.max(138, height * 0.32));
  const scanSize = Math.min(268, pageWidth - 2 * space.xl, height * 0.36);
  const greetingWidth = Math.min(248, width * 0.52, Math.max(132, height * 0.26));
  const last = index === steps.length - 1;
  const progress = `Bước ${index + 1} trên ${steps.length}`;
  const { gesture, goTo } = useMemo(() => {
    const moveTo = (page: number) => {
      const next = Math.max(0, Math.min(steps.length - 1, page));
      setIndex(next);
      if (reduced) position.setValue(next);
      else Animated.timing(position, {
        toValue: next, duration: motion.sheet, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web',
      }).start();
    };

    return {
      goTo: moveTo,
      gesture: PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, { dx, dy, numberActiveTouches }) =>
          !busy && numberActiveTouches <= 1 && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5,
        onPanResponderMove: (_, { dx }) => {
          if (!reduced) position.setValue(Math.max(0, Math.min(steps.length - 1, index - dx / pageWidth)));
        },
        onPanResponderRelease: (_, { dx, vx }) => {
          const passedThreshold = Math.abs(dx) > pageWidth * 0.2 || (Math.abs(dx) > 25 && Math.abs(vx) > 0.35);
          moveTo(passedThreshold ? index - Math.sign(dx) : index);
        },
        onPanResponderTerminate: () => moveTo(index),
      }),
    };
  }, [busy, index, pageWidth, position, reduced]);
  const translateX = position.interpolate({ inputRange: [0, 1], outputRange: [0, -pageWidth] });

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md }]}>
      <View style={styles.header}>
        <View style={styles.backSlot}>
          {index > 0 && !busy && <IconButton icon="arrow-back" label="Quay lại" size={touch} onPress={() => goTo(index - 1)} />}
        </View>
        <View style={styles.brand}>
          <Wordmark width={128} />
        </View>
        <Button label="Bỏ qua" variant="ghost" onPress={onSkip} disabled={busy} style={styles.skip} />
      </View>
      <View {...gesture.panHandlers} style={[styles.pager, { width: pageWidth }, Platform.OS === 'web' && webSwipeStyle]}>
        <Animated.View style={[styles.track, { width: pageWidth * steps.length, transform: [{ translateX }] }]}>
          {steps.map((step, page) => (
            <View key={step.title} style={{ width: pageWidth }} accessibilityElementsHidden={page !== index}
              importantForAccessibility={page === index ? 'auto' : 'no-hide-descendants'} aria-hidden={page !== index}>
              <ScrollView contentContainerStyle={[styles.content, page === 0 && styles.greetingContent]}>
                {page === 0 ? (
                  <View style={styles.greetingStage}>
                    <View style={styles.greetingCopy}>
                      <Text accessibilityRole="header" style={type.h1}>{step.title}</Text>
                      <Text style={type.body}>{step.body}</Text>
                    </View>
                    <LumoGreeting width={greetingWidth} active={page === index} />
                  </View>
                ) : (
                  <>
                    {page === 2 ? <SpinningTopScan size={scanSize} active={page === index} /> : (
                      <View style={[styles.art, { width: artSize, height: artSize }]}>
                        <Image source={apple} style={styles.illustration} contentFit="cover" accessible={false} />
                        <View style={styles.camera}>
                          <Ionicons name="camera" size={22} color={colors.brand} />
                        </View>
                      </View>
                    )}
                    <Text accessibilityRole="header" style={styles.title}>{step.title}</Text>
                    <Text style={[styles.body, page === 2 && styles.scanBody]}>{step.body}</Text>
                  </>
                )}
              </ScrollView>
            </View>
          ))}
        </Animated.View>
      </View>
      <View style={styles.actions}>
        <View accessible accessibilityRole="progressbar" accessibilityLabel={progress} accessibilityLiveRegion="polite"
          aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index + 1} style={styles.progress}>
          {steps.map((step, page) => (
            <View key={step.title} style={[styles.segment, page < index && styles.segmentDone, page === index && styles.segmentCurrent]} />
          ))}
        </View>
        <Button
          label={last ? 'Quét vật thể đầu tiên' : 'Tiếp tục'}
          icon={last ? 'camera' : undefined}
          chevron={!last}
          onPress={last ? onStart : () => goTo(index + 1)}
          disabled={busy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: colors.bg },
  header: { width: '100%', maxWidth: 520, paddingLeft: space.md, paddingRight: space.xs, flexDirection: 'row', alignItems: 'center' },
  backSlot: { width: touch, height: touch },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
  skip: { flexShrink: 0 },
  pager: { flex: 1, overflow: 'hidden' },
  track: { flex: 1, flexDirection: 'row' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm, gap: space.sm },
  greetingContent: { paddingHorizontal: 0 },
  greetingStage: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, gap: space.xs },
  greetingCopy: { flex: 1, gap: space.sm, paddingVertical: space.sm },
  art: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  illustration: { width: '100%', height: '100%' },
  camera: { position: 'absolute', right: space.xs, bottom: space.md, width: touch, height: touch, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.hero, textAlign: 'center' },
  body: { ...type.body, textAlign: 'center' },
  scanBody: { maxWidth: 295, alignSelf: 'center' },
  actions: { width: '100%', maxWidth: 488, paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.md },
  progress: { width: 126, alignSelf: 'center', flexDirection: 'row', gap: space.xs },
  segment: { flex: 1, height: 5, borderRadius: radius.pill, backgroundColor: colors.divider },
  segmentDone: { backgroundColor: colors.brand },
  segmentCurrent: { backgroundColor: colors.lumen },
});
