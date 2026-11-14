import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/Button';
import { colors, radius, space, touch, type } from '@/theme';

export default function ComingSoon() {
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  const insets = useSafeAreaInsets();
  const isMap = feature === 'map' || feature === 'path';
  const title = isMap ? 'Bản đồ' : 'Thử thách';

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <IconButton
          icon="chevron-back"
          label="Quay lại"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          size={touch}
        />
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        <View style={styles.headerBalance} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.icon}>
          {isMap ? (
            <Image
              source={require('../../assets/home-icons/map.webp')}
              style={styles.mapImage}
              contentFit="contain"
              accessible={false}
            />
          ) : (
            <Ionicons name="trophy-outline" size={38} color={colors.brand} />
          )}
        </View>
        <Text style={type.h2}>Sắp ra mắt</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md },
  title: { ...type.h2, flex: 1, textAlign: 'center', marginHorizontal: space.sm },
  headerBalance: { width: touch },
  content: { alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.xl },
  icon: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  mapImage: { width: 44, height: 44 },
});
