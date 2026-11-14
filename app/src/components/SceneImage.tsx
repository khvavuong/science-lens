import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors } from '@/theme';

/**
 * Ảnh scene full-bleed.
 * - Ảnh AI sẵn sàng → hiển thị ảnh đó (fade-in).
 * - Chưa có / lỗi → ảnh gốc người dùng chụp + chuyển động Ken Burns nhẹ (spec: "ảnh sinh chậm").
 * - Không có ảnh gốc → nền gradient rất nhẹ + icon minh họa, không để khung trống.
 */
export function SceneImage({ uri, fallbackUri, active, seed = 0 }: {
  uri?: string; fallbackUri?: string; active: boolean; seed?: number;
}) {
  const reduced = useReducedMotion();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced || !active) { anim.stopAnimation(); return; }
    anim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduced, anim]);

  const dir = seed % 2 === 0 ? 1 : -1;
  const kenBurns = {
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.06, uri ? 1.1 : 1.16] }) },
      { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 14 * dir] }) },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
    ],
  };

  const src = uri ?? fallbackUri;
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[colors.bgAlt, colors.surface]} style={StyleSheet.absoluteFill} />
      {src ? (
        <>
          <Animated.View style={[StyleSheet.absoluteFill, kenBurns]}>
            <Image
              source={{ uri: src }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="top center"
              transition={reduced ? 0 : 400}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
          {/* Ảnh AI hay có dải màu phẳng ở đáy (vùng chừa cho phụ đề): phủ gradient tối cố định
              (không chạy theo Ken Burns) để đường cắt hòa vào nền navy của màn truyện. */}
          <LinearGradient
            pointerEvents="none"
            colors={[colors.mediaShade.clear, colors.mediaShade.top, colors.mediaShade.bottom]}
            locations={[0, 0.45, 1]}
            style={styles.bottomFade}
          />
        </>
      ) : (
        <View style={styles.center}>
          <Ionicons name="sparkles-outline" size={72} color={colors.brand} style={{ opacity: 0.35 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' },
});
