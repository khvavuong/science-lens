import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { colors, font, radius, space, touch } from '@/theme';

type HomeAction = {
  icon: number;
  name: string;
  label?: string;
  href: Href;
};

const actions: HomeAction[] = [
  { icon: require('../../assets/home-icons/explore.webp'), name: 'Kho khám phá', label: 'Khám phá', href: '/library' },
  { icon: require('../../assets/home-icons/map.webp'), name: 'Bản đồ', label: 'Bản đồ', href: { pathname: '/coming-soon', params: { feature: 'map' } } },
  { icon: require('../../assets/home-icons/camera.webp'), name: 'Quét vật thể', href: '/scan' },
  { icon: require('../../assets/home-icons/challenge.webp'), name: 'Thử thách', label: 'Thử thách', href: { pathname: '/coming-soon', params: { feature: 'challenge' } } },
  { icon: require('../../assets/home-icons/ranking.webp'), name: 'Bảng xếp hạng', label: 'Xếp hạng', href: '/badges' },
];

const cameraSize = touch + 12;

export function HomeNavigation() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        {
          paddingBottom: insets.bottom + space.md,
          paddingLeft: insets.left + space.sm,
          paddingRight: insets.right + space.sm,
        },
      ]}
    >
      <View style={styles.pill}>
        {actions.map(({ icon, name, label, href }) => {
          const camera = label === undefined;
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={name}
              onPress={() => {
                haptic.tap();
                router.push(href);
              }}
              style={({ pressed }) => [
                styles.action,
                camera ? styles.camera : styles.sideAction,
                pressed && (camera ? styles.cameraPressed : styles.sidePressed),
              ]}
            >
              <Image source={icon} style={camera ? styles.cameraIcon : styles.icon} contentFit="contain" accessible={false} />
              {label ? <Text style={styles.label}>{label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: space.sm,
  },
  pill: {
    width: '100%',
    maxWidth: 368,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingVertical: 6,
    paddingHorizontal: space.xs,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    boxShadow: [{ offsetX: 0, offsetY: 6, blurRadius: 14, color: colors.pillShadow }],
  },
  action: {
    minWidth: touch,
    minHeight: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  sideAction: {
    flex: 1,
    minHeight: 56,
    gap: space.xs,
    paddingVertical: space.xs,
  },
  sidePressed: { backgroundColor: colors.brandSoft },
  camera: {
    width: cameraSize,
    height: cameraSize,
    backgroundColor: colors.brand,
    boxShadow: [{ offsetX: 0, offsetY: 3, color: colors.brandPressed }],
  },
  cameraPressed: { backgroundColor: colors.brandPressed },
  icon: { width: 30, height: 30 },
  cameraIcon: { width: 38, height: 38 },
  label: {
    width: '100%',
    textAlign: 'center',
    color: colors.brand,
    fontFamily: font.bold,
    fontSize: 10,
  },
});
