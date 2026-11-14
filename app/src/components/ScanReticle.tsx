import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors } from '@/theme';

const CORNER = 30;
const STROKE = 4;
const CORNER_RADIUS = 14;
/** Nửa chu kỳ "thở" (tổng 1 600 ms). */
const HALF_BREATH = 800;

/**
 * Khung ngắm 4 góc trên camera. Đang quét thì "thở" (scale 0.92↔1, opacity 0.7↔1);
 * khóa được vật thì góc chuyển vàng Lumen. Reduce Motion: chỉ đổi opacity.
 */
export function ScanReticle({ state, size = 200 }: { state: 'scanning' | 'locked' | 'idle'; size?: number }) {
  const reduced = useReducedMotion();
  const [breath] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (state !== 'scanning') {
      breath.stopAnimation();
      breath.setValue(0);
      return;
    }
    const ease = Easing.inOut(Easing.ease);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: HALF_BREATH, easing: ease, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: HALF_BREATH, easing: ease, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      breath.setValue(0);
    };
  }, [state, breath]);

  const opacity = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const color = state === 'locked' ? colors.lumen : colors.white;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, opacity, transform: [{ scale: reduced ? 1 : scale }] }}
    >
      <View style={[styles.corner, styles.tl, { borderColor: color }]} />
      <View style={[styles.corner, styles.tr, { borderColor: color }]} />
      <View style={[styles.corner, styles.bl, { borderColor: color }]} />
      <View style={[styles.corner, styles.br, { borderColor: color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  tl: { top: 0, left: 0, borderTopWidth: STROKE, borderLeftWidth: STROKE, borderTopLeftRadius: CORNER_RADIUS },
  tr: { top: 0, right: 0, borderTopWidth: STROKE, borderRightWidth: STROKE, borderTopRightRadius: CORNER_RADIUS },
  bl: { bottom: 0, left: 0, borderBottomWidth: STROKE, borderLeftWidth: STROKE, borderBottomLeftRadius: CORNER_RADIUS },
  br: { bottom: 0, right: 0, borderBottomWidth: STROKE, borderRightWidth: STROKE, borderBottomRightRadius: CORNER_RADIUS },
});
