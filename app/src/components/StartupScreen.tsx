import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StartupWordmark } from '@/components/StartupWordmark';
import { Wordmark } from '@/components/Wordmark';
import { colors, space } from '@/theme';

export function StartupScreen({ onIntroEnd }: { onIntroEnd?: () => void }) {
  return (
    <View style={styles.root}>
      {onIntroEnd ? <StartupWordmark onIntroEnd={onIntroEnd} /> : <Wordmark width={224} />}
      <ActivityIndicator
        color={colors.brand}
        accessibilityRole="progressbar"
        accessibilityLabel="Đang mở lumoslab"
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
