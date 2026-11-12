import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';

/**
 * Minh họa vector tạm thay cho hình 3D trong mockup.
 * Khi có file ảnh gốc (PNG nền trong), thay nội dung các component này bằng <Image>.
 */

/** Hero trang chủ: quả táo, nguyên tử, địa cầu, chồng sách trên nền mây xanh nhạt. */
export function HomeHero({ height = 200 }: { height?: number }) {
  return (
    <View style={{ height }} accessible accessibilityRole="image" accessibilityLabel="Quả táo, nguyên tử, quả địa cầu và chồng sách">
      <Svg width="100%" height="100%" viewBox="0 0 340 200" preserveAspectRatio="xMidYMid meet">
        <Path d="M10 170 C10 120 60 105 95 118 C110 80 170 70 200 100 C230 70 300 85 300 130 C335 135 340 170 320 180 L20 180 C12 180 10 175 10 170 Z" fill={colors.surface} />
        {/* chồng sách */}
        <Rect x="120" y="150" width="150" height="20" rx="6" fill={colors.lumen} />
        <Rect x="120" y="150" width="150" height="6" rx="3" fill="#F2B11E" />
        <Rect x="132" y="135" width="128" height="17" rx="6" fill={colors.brand} />
        <Rect x="250" y="138" width="6" height="11" rx="2" fill={colors.white} opacity={0.7} />
        {/* quả táo */}
        <Path d="M170 62 C150 48 112 54 112 92 C112 128 140 152 170 144 C200 152 228 128 228 92 C228 54 190 48 170 62 Z" fill="#E5484D" />
        <Path d="M128 90 C130 74 140 66 152 63" fill="none" stroke={colors.white} strokeWidth={7} strokeLinecap="round" opacity={0.45} />
        <Path d="M170 62 C170 50 174 40 182 34" fill="none" stroke="#7A4A2A" strokeWidth={5} strokeLinecap="round" />
        <Path d="M176 46 C188 30 210 30 218 38 C206 52 186 54 176 46 Z" fill={colors.mint} />
        {/* nguyên tử */}
        <G transform="translate(282 52)">
          <Ellipse rx="34" ry="12" fill="none" stroke={colors.brand} strokeWidth={3} />
          <Ellipse rx="34" ry="12" fill="none" stroke={colors.brand} strokeWidth={3} transform="rotate(60)" />
          <Ellipse rx="34" ry="12" fill="none" stroke={colors.brand} strokeWidth={3} transform="rotate(-60)" />
          <Circle r="6" fill={colors.lumen} />
        </G>
        {/* địa cầu */}
        <G transform="translate(52 148)">
          <Circle r="26" fill="#3C8DEB" />
          <Path d="M-18 -10 C-8 -16 0 -8 -4 0 C-8 8 -18 6 -22 2 Z M4 -20 C14 -18 20 -8 14 -2 C8 2 2 -6 4 -20 Z M2 8 C10 6 18 10 14 18 C8 22 0 18 2 8 Z" fill="#48C98B" />
        </G>
        {/* tia sáng */}
        <Path d="M70 40 L74 52 L86 56 L74 60 L70 72 L66 60 L54 56 L66 52 Z" fill={colors.lumen} />
        <Circle cx="248" cy="16" r="4" fill={colors.lumen} />
      </Svg>
    </View>
  );
}

/** Ảnh đồ vật người dùng chụp, cắt tròn, có vành quỹ đạo vàng (màn Mở đầu). */
export function OrbitPhoto({ uri, size = 132 }: { uri?: string; size?: number }) {
  const w = size * 1.9;
  const h = size * 1.15;
  const ring = { rx: size * 0.86, ry: size * 0.2 };
  return (
    <View style={{ width: w, height: h, alignSelf: 'center' }} accessible accessibilityRole="image" accessibilityLabel="Ảnh đồ vật bạn vừa chụp">
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Ellipse cx={w / 2} cy={h * 0.82} rx={w * 0.48} ry={h * 0.14} fill={colors.surface} />
        {/* nửa sau của vành: nằm sau ảnh */}
        <G transform={`rotate(-12 ${w / 2} ${h / 2})`}>
          <Path d={`M ${w / 2 - ring.rx} ${h / 2} A ${ring.rx} ${ring.ry} 0 0 1 ${w / 2 + ring.rx} ${h / 2}`} fill="none" stroke={colors.lumen} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
        </G>
      </Svg>
      <View style={{ position: 'absolute', left: (w - size) / 2, top: (h - size) / 2, width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 4, borderColor: colors.white }}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="sparkles" size={size * 0.35} color={colors.brand} /></View>
        )}
      </View>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* nửa trước của vành: vẽ đè lên ảnh */}
        <G transform={`rotate(-12 ${w / 2} ${h / 2})`}>
          <Path d={`M ${w / 2 + ring.rx} ${h / 2} A ${ring.rx} ${ring.ry} 0 0 1 ${w / 2 - ring.rx} ${h / 2}`} fill="none" stroke={colors.lumen} strokeWidth={6} strokeLinecap="round" />
        </G>
        <Circle cx={w * 0.86} cy={h * 0.2} r={5} fill={colors.lumen} />
        <Circle cx={w * 0.12} cy={h * 0.66} r={3.5} fill={colors.brand} opacity={0.5} />
      </Svg>
    </View>
  );
}

function burst(cx: number, cy: number, outer: number, inner: number, points: number) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'} ${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
}

/** Huy hiệu hoàn thành: viền răng cưa vàng, vòng nguyệt quế, ảnh đồ vật ở giữa. */
export function Medal({ uri, size = 150, label }: { uri?: string; size?: number; label: string }) {
  const c = size / 2;
  const inner = size * 0.27;
  const leaf = (x: number, y: number, rot: number) => (
    <Path d="M0 0 C6 -10 18 -12 24 -8 C18 0 8 4 0 0 Z" fill={colors.lumen} transform={`translate(${x} ${y}) rotate(${rot})`} />
  );
  return (
    <View style={{ width: size * 1.6, height: size, alignSelf: 'center' }} accessible accessibilityRole="image" accessibilityLabel={`Huy hiệu ${label}`}>
      <Svg width={size * 1.6} height={size} style={StyleSheet.absoluteFill}>
        <G transform={`translate(${size * 0.3} 0)`}>
          {leaf(c - size * 0.52, c + 20, -110)}
          {leaf(c - size * 0.56, c - 4, -80)}
          {leaf(c - size * 0.5, c - 28, -50)}
          {leaf(c + size * 0.52, c + 20, -70)}
          {leaf(c + size * 0.56, c - 4, -100)}
          {leaf(c + size * 0.5, c - 28, -130)}
          <Path d={burst(c, c, size * 0.42, size * 0.37, 18)} fill={colors.lumen} />
          <Circle cx={c} cy={c} r={size * 0.33} fill="#F7B92B" />
          <Circle cx={c} cy={c} r={inner + 5} fill={colors.white} />
        </G>
        <Rect x={size * 0.2} y={size * 0.12} width={8} height={4} rx={2} fill={colors.brand} transform={`rotate(-30 ${size * 0.2} ${size * 0.12})`} />
        <Rect x={size * 1.36} y={size * 0.1} width={8} height={4} rx={2} fill="#E5484D" transform={`rotate(25 ${size * 1.36} ${size * 0.1})`} />
        <Circle cx={size * 1.42} cy={size * 0.32} r={3} fill={colors.mint} />
        <Circle cx={size * 0.16} cy={size * 0.36} r={3} fill={colors.lumen} />
      </Svg>
      <View style={{ position: 'absolute', left: size * 0.8 - inner, top: c - inner, width: inner * 2, height: inner * 2, borderRadius: inner, overflow: 'hidden', backgroundColor: colors.lumenSoft, alignItems: 'center', justifyContent: 'center' }}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="star" size={inner} color={colors.navy} />}
      </View>
    </View>
  );
}
