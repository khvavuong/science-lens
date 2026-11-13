import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, motion, radius, space } from '@/theme';

const lumo = require('../../assets/onboarding-lumo.webp');
const wave = require('../../assets/onboarding-lumo-wave.webp');
const greetingBody = require('../../assets/onboarding-lumo-greeting-body.webp');
const greetingArm = require('../../assets/onboarding-lumo-greeting-arm.webp');
const greetingEyes = [
  { source: require('../../assets/onboarding-lumo-eye-1.webp'), x: 233, y: 330, width: 76, height: 114 },
  { source: require('../../assets/onboarding-lumo-eye-2.webp'), x: 419, y: 284, width: 77, height: 115 },
];
const spinningTop = require('../../assets/onboarding-spinning-top.webp');
const useNativeDriver = Platform.OS !== 'web';

export function LumoGreeting({ width, active }: { width: number; active: boolean }) {
  const reduced = useReducedMotion(true);
  const [loaded, setLoaded] = useState(false);
  const [layers, setLayers] = useState(0);
  const [entrance] = useState(() => new Animated.Value(0));
  const [expression] = useState(() => new Animated.Value(0));
  const ready = layers === 15;

  useEffect(() => {
    if (!active || !loaded || reduced) return;
    entrance.setValue(0);
    const animation = Animated.timing(entrance, {
      toValue: 1, duration: motion.scene, easing: Easing.out(Easing.cubic), useNativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [active, entrance, loaded, reduced]);

  useEffect(() => {
    if (!active || !ready || reduced) return;
    expression.setValue(0);
    const animation = Animated.timing(expression, {
      toValue: 1, delay: motion.tap, duration: 620, easing: Easing.linear, useNativeDriver,
    });
    animation.start();
    return () => { animation.stop(); expression.setValue(0); };
  }, [active, expression, ready, reduced]);

  const slide = entrance.interpolate({ inputRange: [0, 1], outputRange: [width, 0] });
  const spriteWidth = width * 1.72;
  const scale = spriteWidth / 744;
  const armAngle = expression.interpolate({
    inputRange: [0, 0.24, 0.48, 0.73, 1], outputRange: ['0deg', '-7deg', '3deg', '-4deg', '0deg'],
  });
  const blink = expression.interpolate({
    inputRange: [0, 0.39, 0.49, 0.53, 0.66, 1], outputRange: [1, 1, 0.12, 0.12, 1, 1],
  });
  const layersOpacity = expression.interpolate({ inputRange: [0, 0.06, 0.93, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View pointerEvents="none" style={[styles.greeting, { width }]}>
      <Animated.View style={[
        styles.wavePose,
        !reduced && { transform: [{ translateX: slide }] },
      ]}>
        <View style={[styles.greetingSprite, { width: spriteWidth, height: 832 * scale }]}>
          <Image source={wave} onLoad={() => setLoaded(true)} style={StyleSheet.absoluteFill} accessible={false} />
          {!reduced && (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: layersOpacity, backgroundColor: colors.bg }]}>
              <Animated.View style={{ position: 'absolute', left: 470 * scale, top: 365 * scale,
                width: 264 * scale, height: 245 * scale, transformOrigin: [54 * scale, 176 * scale, 0],
                transform: [{ rotate: armAngle }],
              }}>
                <Image source={greetingArm} style={StyleSheet.absoluteFill} accessible={false} onLoad={() => setLayers(mask => mask | 1)} />
              </Animated.View>
              <Image source={greetingBody} style={StyleSheet.absoluteFill} accessible={false} onLoad={() => setLayers(mask => mask | 2)} />
              {greetingEyes.map((eye, i) => (
                <Animated.View key={eye.x} style={{ position: 'absolute', left: eye.x * scale, top: eye.y * scale,
                  width: eye.width * scale, height: eye.height * scale,
                  transform: [{ rotate: '-13deg' }, { scaleY: blink }, { rotate: '13deg' }],
                }}>
                  <Image source={eye.source} style={StyleSheet.absoluteFill} accessible={false} onLoad={() => setLayers(mask => mask | (4 << i))} />
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

export function SpinningTopScan({ size, active }: { size: number; active: boolean }) {
  const reduced = useReducedMotion(true);
  const [loaded, setLoaded] = useState(false);
  const [scan] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!active || !loaded || reduced) return;
    scan.setValue(0);
    const animation = Animated.timing(scan, {
      toValue: 1, duration: motion.scene * 2, easing: Easing.inOut(Easing.ease), useNativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [active, loaded, reduced, scan]);

  const beamY = scan.interpolate({
    inputRange: [0, 1], outputRange: [size * 0.17, size * 0.6],
  });

  return (
    <View pointerEvents="none" style={[styles.scanScene, { width: size, paddingBottom: size * 0.08 }]}>
      <View style={[styles.scanner, { height: size }]}>
        <Image source={spinningTop} onLoad={() => setLoaded(true)} contentFit="contain" style={styles.scanObject} accessible={false} />
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <Animated.View style={[
          styles.beam,
          { transform: [{ translateY: reduced ? size * 0.6 : beamY }] },
        ]}>
          <View style={styles.scanDot} />
        </Animated.View>
      </View>
      <Image source={lumo} contentFit="contain" style={[styles.scanLumo, { width: size * 0.36, height: size * 0.36 }]} accessible={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { aspectRatio: 0.61, overflow: 'hidden' },
  wavePose: StyleSheet.absoluteFill,
  // Đưa tay chào vào vùng nhìn thấy, để thân dưới khuất sau mép phải.
  greetingSprite: { position: 'absolute', right: '-60%', top: '-8%', transform: [{ rotate: '-52deg' }, { scaleX: -1 }] },
  scanScene: { alignSelf: 'center' },
  scanner: { backgroundColor: colors.brandSoft, borderRadius: radius.xl, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  scanObject: { width: '76%', height: '76%' },
  corner: { position: 'absolute', width: space.lg, height: space.lg, borderColor: colors.brand },
  topLeft: { top: space.sm, left: space.sm, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radius.sm },
  topRight: { top: space.sm, right: space.sm, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radius.sm },
  bottomLeft: { bottom: space.sm, left: space.sm, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radius.sm },
  bottomRight: { bottom: space.sm, right: space.sm, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: radius.sm },
  beam: { position: 'absolute', top: 0, left: space.md, right: space.md, height: 2, borderRadius: radius.pill, backgroundColor: colors.lumen, alignItems: 'flex-end', justifyContent: 'center' },
  scanDot: { width: space.sm, height: space.sm, borderRadius: radius.pill, backgroundColor: colors.lumen },
  scanLumo: { position: 'absolute', right: '-5%', bottom: 0 },
});
