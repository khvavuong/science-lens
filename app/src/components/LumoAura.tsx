import { useEffect, useId, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors } from '@/theme';

/** Chiều cao cơ sở của aura (trước khi scale theo âm lượng). */
const AURA_HEIGHT = 260;
/** Biên độ trôi ngang của hai vùng sáng bên (dp). */
const DRIFT = 24;

/**
 * Aura của Lumo: vùng sáng mềm trồi lên từ mép dưới màn, sáng và cao theo giọng Lumo.
 * Ngoại lệ có chủ đích của quy tắc "không glow": chỉ dùng ở màn Thử thách trực tiếp.
 */
export function LumoAura({ level, active }: { level: number; active: boolean }) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  // id gradient không được chứa ký tự đặc biệt của useId (url(#...) trên native).
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [opacity] = useState(() => new Animated.Value(0));
  const [scaleY] = useState(() => new Animated.Value(0.75));
  const [drift] = useState(() => new Animated.Value(0));

  const clamped = Math.max(0, Math.min(1, level));

  // Độ sáng và độ cao theo âm lượng; im lặng thì tắt dần trong 300 ms.
  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: active ? 0.55 + 0.45 * clamped : 0,
        duration: active ? 90 : 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleY, {
        toValue: reduced ? 1 : active ? 0.75 + 0.5 * clamped : 0.75,
        duration: active ? 90 : 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [active, clamped, reduced, opacity, scaleY]);

  // Hai vùng bên trôi ngang chậm khi đang sáng; Reduce Motion thì đứng yên.
  useEffect(() => {
    if (reduced || !active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 1750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 1750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, active, drift]);

  const leftX = drift.interpolate({ inputRange: [0, 1], outputRange: [-DRIFT, DRIFT] });
  const rightX = drift.interpolate({ inputRange: [0, 1], outputRange: [DRIFT, -DRIFT] });
  const sideW = width * 0.8;
  const centerW = width * 0.9;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, { opacity, transform: [{ scaleY }] }]}
    >
      <Animated.View style={[styles.region, { left: -sideW / 2, width: sideW, transform: [{ translateX: leftX }] }]}>
        <Glow id={`auraL${uid}`} color={colors.brand} width={sideW} height={AURA_HEIGHT * 0.85} />
      </Animated.View>
      <Animated.View style={[styles.region, { right: -sideW / 2, width: sideW, transform: [{ translateX: rightX }] }]}>
        <Glow id={`auraR${uid}`} color={colors.brand} width={sideW} height={AURA_HEIGHT * 0.85} />
      </Animated.View>
      <View style={[styles.region, { left: (width - centerW) / 2, width: centerW }]}>
        <Glow id={`auraC${uid}`} color={colors.lumen} width={centerW} height={AURA_HEIGHT} />
      </View>
    </Animated.View>
  );
}

/** Một vùng sáng elip, tâm nằm ở mép dưới, mờ dần ra ngoài. */
function Glow({ id, color, width, height }: { id: string; color: string; width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={styles.glow}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.9} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={width / 2} cy={height} rx={width / 2} ry={height} fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: AURA_HEIGHT,
    overflow: 'visible',
    transformOrigin: 'bottom',
  },
  region: { position: 'absolute', bottom: 0, height: AURA_HEIGHT, justifyContent: 'flex-end' },
  glow: { alignSelf: 'center' },
});
