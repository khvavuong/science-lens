import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/Button';
import { Leaderboard } from '@/components/Leaderboard';
import { loadHistory, type JourneyRecord } from '@/lib/history';
import { pointsFromHistory } from '@/lib/leaderboard';
import { colors, space, touch, type } from '@/theme';

export default function Ranking() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<JourneyRecord[]>();
  useFocusEffect(useCallback(() => { loadHistory().then(setHistory); }, []));

  // undefined = đang đọc, null = chưa có hành trình nào.
  const youPoints = history === undefined ? undefined : history.length > 0 ? pointsFromHistory(history) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.header}>
        <IconButton
          icon="chevron-back"
          label="Quay lại"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          size={touch}
        />
        <Text style={styles.title} accessibilityRole="header">Bảng xếp hạng</Text>
        <View style={styles.headerBalance} />
      </View>
      <Leaderboard bottomInset={insets.bottom} youPoints={youPoints} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingBottom: space.sm },
  title: { ...type.h2, flex: 1, textAlign: 'center', marginHorizontal: space.sm },
  headerBalance: { width: touch },
});
