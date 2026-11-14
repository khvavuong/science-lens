import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StartupWordmark } from '@/components/StartupWordmark';
import { colors, space } from '@/theme';

export function StartupScreen({ onIntroEnd }: { onIntroEnd: () => void }) {
  return (
    <View style={styles.root}>
      <StartupWordmark onIntroEnd={onIntroEnd} />
      <ActivityIndicator
        color={colors.brand}
        accessibilityRole="progressbar"
        accessibilityLabel="Đang mở lumoslens"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md,
    paddingHorizontal: space.lg, backgroundColor: colors.bg,
  },
});
