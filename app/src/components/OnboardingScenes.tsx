import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, font, motion, radius, space } from '@/theme';

const wave = require('../../assets/onboarding-lumo-wave.webp');
const greetingBody = require('../../assets/onboarding-lumo-greeting-body.webp');
const greetingArm = require('../../assets/onboarding-lumo-greeting-arm.webp');
const greetingEyes = [
  { source: require('../../assets/onboarding-lumo-eye-1.webp'), x: 233, y: 330, width: 76, height: 114 },
  { source: require('../../assets/onboarding-lumo-eye-2.webp'), x: 419, y: 284, width: 77, height: 115 },
];
const mysteryObject = require('../../assets/onboarding-mystery-object.webp');
const useNativeDriver = Platform.OS !== 'web';
const entranceDuration = motion.scene + 60;
const greetingDuration = entranceDuration + 560;
const entranceEnd = entranceDuration / greetingDuration;
const waveStart = (entranceDuration - 90) / greetingDuration;
const expressionTime = (fraction: number) => waveStart + (1 - waveStart) * fraction;
const entranceStops = [0, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 1];
// Giảm tốc ở mỗi lần đổi hướng để tay dừng nhẹ trước khi vẫy ngược lại.
const armPoses = [
  { time: 0, angle: 0 }, { time: 0.24, angle: -7 }, { time: 0.48, angle: 3 },
  { time: 0.73, angle: -4 }, { time: 1, angle: 0 },
];
const armKeyframes = armPoses.slice(1).flatMap((end, index) => {
  const start = armPoses[index];
  return [0, 0.25, 0.5, 0.75].map(progress => ({
    time: start.time + (end.time - start.time) * progress,
    angle: start.angle + (end.angle - start.angle) * Easing.inOut(Easing.sin)(progress),
  }));
}).concat(armPoses.slice(-1));

export function LumoGreeting({ width, active }: { width: number; active: boolean }) {
  const reduced = useReducedMotion(null);
  const [useStaticPose, setUseStaticPose] = useState(false);
  const [layers, setLayers] = useState(0);
  const [greeting] = useState(() => new Animated.Value(0));
  const ready = layers === 15;
  const showFallback = reduced === true || useStaticPose;

  useEffect(() => {
    if (reduced !== null) return;
    const timeout = setTimeout(() => setUseStaticPose(true), 300);
    return () => clearTimeout(timeout);
  }, [reduced]);

  useEffect(() => {
    if (!active || reduced !== false || !ready || showFallback) return;
    const animation = Animated.timing(greeting, {
      toValue: 1, duration: greetingDuration, easing: Easing.linear, useNativeDriver,
    });
    animation.start();
    return () => { animation.stop(); greeting.setValue(0); };
  }, [active, greeting, ready, reduced, showFallback]);

  // Các mốc của đường giảm tốc được nội suy trên UI thread cùng với tay và mắt.
  const slide = greeting.interpolate({
    inputRange: entranceStops.map(stop => stop * entranceEnd),
    outputRange: entranceStops.map(stop => width * (1 - stop) ** 3),
    extrapolate: 'clamp',
  });
  const spriteWidth = width * 1.72;
  const scale = spriteWidth / 744;
  const armAngle = greeting.interpolate({
    inputRange: armKeyframes.map(pose => expressionTime(pose.time)),
    outputRange: armKeyframes.map(pose => `${pose.angle}deg`), extrapolate: 'clamp',
  });
  const blink = greeting.interpolate({
    inputRange: [0.39, 0.49, 0.53, 0.66].map(expressionTime),
    outputRange: [1, 0.12, 0.12, 1], extrapolate: 'clamp',
  });

  return (
    <View pointerEvents="none" style={[styles.greeting, { width }]}>
      <Animated.View style={[
        styles.wavePose,
        !showFallback && { transform: [{ translateX: slide }] },
      ]}>
        <View style={[styles.greetingSprite, { width: spriteWidth, height: 832 * scale }]}>
          {showFallback ? <Image source={wave} style={StyleSheet.absoluteFill} accessible={false} /> : (
            <View style={StyleSheet.absoluteFill}>
              <Animated.View style={{ position: 'absolute', left: 470 * scale, top: 365 * scale,
                width: 264 * scale, height: 245 * scale, transformOrigin: [54 * scale, 176 * scale, 0],
                transform: [{ rotate: armAngle }],
              }}>
                <Image source={greetingArm} style={StyleSheet.absoluteFill} accessible={false} onDisplay={() => setLayers(mask => mask | 1)} onError={() => setUseStaticPose(true)} />
              </Animated.View>
              <Image source={greetingBody} style={StyleSheet.absoluteFill} accessible={false} onDisplay={() => setLayers(mask => mask | 2)} onError={() => setUseStaticPose(true)} />
              {greetingEyes.map((eye, i) => (
                <Animated.View key={eye.x} style={{ position: 'absolute', left: eye.x * scale, top: eye.y * scale,
                  width: eye.width * scale, height: eye.height * scale,
                  transform: [{ rotate: '-13deg' }, { scaleY: blink }, { rotate: '13deg' }],
                }}>
                  <Image source={eye.source} style={StyleSheet.absoluteFill} accessible={false} onDisplay={() => setLayers(mask => mask | (4 << i))} onError={() => setUseStaticPose(true)} />
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

export function ChallengeScan({ size, active }: { size: number; active: boolean }) {
  const reduced = useReducedMotion(true);
  const [loaded, setLoaded] = useState(false);
  const [open] = useState(() => new Animated.Value(0));
  const [scan] = useState(() => new Animated.Value(0));
  const screenHeight = size * 0.78;

  useEffect(() => {
    if (!active || !loaded || reduced) return;
    open.setValue(0);
    scan.setValue(0);
    const animation = Animated.sequence([
      Animated.spring(open, {
        toValue: 1, stiffness: 300, damping: 17, mass: 0.7, useNativeDriver,
      }),
      Animated.timing(scan, {
        toValue: 1, duration: motion.scene * 2, easing: Easing.inOut(Easing.ease), useNativeDriver,
      }),
    ]);
    animation.start();
    return () => { animation.stop(); open.setValue(0); scan.setValue(0); };
  }, [active, loaded, open, reduced, scan]);

  const beamY = scan.interpolate({
    inputRange: [0, 1], outputRange: [screenHeight * 0.16, screenHeight * 0.82],
  });
  const beamOpacity = scan.interpolate({
    inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 1, 1, 0],
  });
  const scale = open.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  const lift = open.interpolate({ inputRange: [0, 1], outputRange: [space.md, 0] });

  return (
    <Animated.View pointerEvents="none" style={[styles.scanScene, { width: size },
      !reduced && { transform: [{ translateY: lift }, { scale }] },
    ]}>
      <View style={styles.scanHeader}>
        <View style={styles.scanStatus} />
        <Text style={styles.scanLabel} maxFontSizeMultiplier={1.4}>Chưa nhận diện</Text>
      </View>
      <View style={[styles.scanner, { height: screenHeight }]}>
        <View style={styles.scanGrid}>
          <View style={styles.gridHorizontal} />
          <View style={styles.gridVertical} />
        </View>
        <Image source={mysteryObject} onLoad={() => setLoaded(true)} contentFit="contain" style={styles.scanObject} accessible={false} />
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <Animated.View style={[
          styles.beam,
          { opacity: reduced ? 1 : beamOpacity, transform: [{ translateY: reduced ? screenHeight * 0.65 : beamY }] },
        ]}>
          <View style={styles.scanDot} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  greeting: { aspectRatio: 0.61, overflow: 'hidden' },
  wavePose: StyleSheet.absoluteFill,
  // Đưa tay chào vào vùng nhìn thấy, để thân dưới khuất sau mép phải.
  greetingSprite: { position: 'absolute', right: '-60%', top: '-8%', transform: [{ rotate: '-52deg' }, { scaleX: -1 }] },
  scanScene: {
    alignSelf: 'center', backgroundColor: colors.brand, borderColor: colors.brandPressed,
    borderWidth: 1, borderBottomWidth: space.xs, borderRadius: radius.xl,
    padding: space.sm, gap: space.sm,
  },
  scanHeader: { minHeight: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm },
  scanStatus: { width: space.sm, height: space.sm, borderRadius: radius.pill, backgroundColor: colors.lumen },
  scanLabel: { flexShrink: 1, fontFamily: font.semibold, fontSize: 12, color: colors.white },
  scanner: { backgroundColor: colors.brandSoft, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  scanObject: { width: '80%', height: '83%' },
  scanGrid: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  gridHorizontal: { position: 'absolute', width: '84%', height: StyleSheet.hairlineWidth, backgroundColor: colors.pillShadow },
  gridVertical: { position: 'absolute', height: '84%', width: StyleSheet.hairlineWidth, backgroundColor: colors.pillShadow },
  corner: { position: 'absolute', width: space.lg, height: space.lg, borderColor: colors.brand },
  topLeft: { top: space.sm, left: space.sm, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radius.sm },
  topRight: { top: space.sm, right: space.sm, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radius.sm },
  bottomLeft: { bottom: space.sm, left: space.sm, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radius.sm },
  bottomRight: { bottom: space.sm, right: space.sm, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: radius.sm },
  beam: { position: 'absolute', top: 0, left: space.md, right: space.md, height: 2, borderRadius: radius.pill, backgroundColor: colors.lumen, alignItems: 'flex-end', justifyContent: 'center' },
  scanDot: { width: space.sm, height: space.sm, borderRadius: radius.pill, backgroundColor: colors.lumen },
});
