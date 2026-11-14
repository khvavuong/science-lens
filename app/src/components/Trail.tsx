import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, font } from '@/theme';

/**
 * "Đường ánh sáng": motif chính của giao diện v2.
 * done = xanh brand + dấu tích, current = vàng Lumen (đang sáng), todo = vòng rỗng, locked = ổ khóa.
 */
export type NodeState = 'done' | 'current' | 'todo' | 'locked' | 'loading' | 'skipped';

export function TrailNode({ state, size = 26, label }: { state: NodeState; size?: number; label?: string }) {
  const r = size / 2;
  if (state === 'done') {
    return (
      <View style={[styles.node, { width: size, height: size, borderRadius: r, backgroundColor: colors.brand }]}>
        <Ionicons name="checkmark" size={size * 0.6} color={colors.white} />
      </View>
    );
  }
  if (state === 'current' || state === 'loading') {
    return (
      <View style={[styles.node, { width: size, height: size, borderRadius: r, backgroundColor: colors.lumen, borderWidth: 4, borderColor: colors.lumenSoft }]}>
        {state === 'loading' ? <ActivityIndicator size="small" color={colors.navy} style={{ transform: [{ scale: 0.6 }] }} />
          : label ? <Text style={[styles.num, { fontSize: size * 0.42 }]}>{label}</Text>
          : <View style={{ width: size * 0.28, height: size * 0.28, borderRadius: size, backgroundColor: colors.navy }} />}
      </View>
    );
  }
  if (state === 'locked') {
    return (
      <View style={[styles.node, { width: size, height: size, borderRadius: r, backgroundColor: colors.bgAlt }]}>
        <Ionicons name="lock-closed" size={size * 0.45} color={colors.muted} />
      </View>
    );
  }
  return (
    <View style={[styles.node, { width: size, height: size, borderRadius: r, borderWidth: 2, borderColor: colors.trail, backgroundColor: colors.bg }]}>
      {state === 'skipped' ? <Ionicons name="remove" size={size * 0.5} color={colors.muted} /> : label ? <Text style={[styles.num, { fontSize: size * 0.42, color: colors.muted }]}>{label}</Text> : null}
    </View>
  );
}

/** Đường ánh sáng ngang: 1 — 2 — 3 (tiến độ quiz). */
export function HorizontalTrail({ states, size = 26, numbered }: { states: NodeState[]; size?: number; numbered?: boolean }) {
  return (
    <View style={styles.row}>
      {states.map((s, i) => (
        <View key={i} style={[styles.row, i < states.length - 1 && { flex: 1 }]}>
          <TrailNode state={s} size={size} label={numbered ? String(i + 1) : undefined} />
          {i < states.length - 1 && <View style={[styles.hLine, s === 'done' && { borderColor: colors.brand, borderStyle: 'solid' }]} />}
        </View>
      ))}
    </View>
  );
}

/** Một bước của đường ánh sáng dọc (tiến trình chuẩn bị, roadmap). */
export function VerticalStep({ state, last, children, size = 24 }: { state: NodeState; last?: boolean; children: React.ReactNode; size?: number }) {
  return (
    <View style={styles.vRow}>
      <View style={{ width: size + 8, alignItems: 'center' }}>
        <TrailNode state={state} size={size} />
        {!last && <View style={[styles.vLine, state === 'done' && { borderColor: colors.brand, borderStyle: 'solid' }]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 14 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  node: { alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: font.black, color: colors.navy },
  row: { flexDirection: 'row', alignItems: 'center' },
  hLine: { flex: 1, marginHorizontal: 6, borderTopWidth: 2, borderColor: colors.trail, borderStyle: 'dashed' },
  vRow: { flexDirection: 'row', gap: 10 },
  vLine: { flex: 1, minHeight: 12, marginVertical: 3, borderLeftWidth: 2, borderColor: colors.trail, borderStyle: 'dashed' },
});
