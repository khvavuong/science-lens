import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { colors, font, radius, space, touch } from '@/theme';

export type NavigationSection = 'library' | 'map' | 'scan' | 'challenge' | 'ranking';

type HomeAction = {
  section: NavigationSection;
  icon: number;
  name: string;
  label?: string;
  href: Href;
};

const actions: HomeAction[] = [
  { section: 'library', icon: require('../../assets/home-icons/explore.webp'), name: 'Kho khám phá', label: 'Khám phá', href: '/library' },
  { section: 'map', icon: require('../../assets/home-icons/map.webp'), name: 'Bản đồ', label: 'Bản đồ', href: { pathname: '/coming-soon', params: { feature: 'map' } } },
  { section: 'scan', icon: require('../../assets/home-icons/camera.webp'), name: 'Quét vật thể', href: '/scan' },
  { section: 'challenge', icon: require('../../assets/home-icons/challenge.webp'), name: 'Thử thách', label: 'Thử thách', href: '/hunt' },
  { section: 'ranking', icon: require('../../assets/home-icons/ranking.webp'), name: 'Bảng xếp hạng', label: 'Xếp hạng', href: '/badges' },
];

const cameraSize = touch + 12;
const sideIconSize = 30;
const sideFeedbackSize = touch - space.sm;
const sideFeedbackOffset = (sideIconSize - sideFeedbackSize) / 2;

export function HomeNavigation({ selected, atDestination }: { selected?: NavigationSection; atDestination: boolean }) {
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
        {actions.map(({ section, icon, name, label, href }) => {
          const camera = section === 'scan';
          const active = selected === section;
          return (
            <Pressable
              key={section}
              accessibilityRole="button"
              accessibilityLabel={name}
              aria-current={active ? 'page' : undefined}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (active && atDestination) return;
                haptic.tap();
                if (active) router.dismissTo(href);
                else router.push(href);
              }}
              style={({ pressed }) => [
                styles.action,
                camera ? styles.camera : styles.sideAction,
                camera && active && styles.cameraSelected,
                camera && pressed && styles.cameraPressed,
              ]}
            >
              {({ pressed }) => camera ? (
                <Image source={icon} style={styles.cameraIcon} contentFit="contain" accessible={false} />
              ) : (
                <>
                  <View style={styles.icon}>
                    {(active || pressed) && <View pointerEvents="none" style={styles.sidePressed} />}
                    <Image source={icon} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} />
                    {active && <View pointerEvents="none" style={styles.activeDot} />}
                  </View>
                  <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
                </>
              )}
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
    backgroundColor: colors.bg,
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
  sidePressed: {
    position: 'absolute',
    top: sideFeedbackOffset,
    left: sideFeedbackOffset,
    width: sideFeedbackSize,
    height: sideFeedbackSize,
    borderRadius: sideFeedbackSize / 2,
    backgroundColor: colors.brandSoft,
  },
  camera: {
    width: cameraSize,
    height: cameraSize,
    backgroundColor: colors.brand,
    boxShadow: [{ offsetX: 0, offsetY: 3, color: colors.brandPressed }],
  },
  cameraPressed: { backgroundColor: colors.brandPressed },
  cameraSelected: { borderWidth: 2, borderColor: colors.lumen },
  activeDot: {
    position: 'absolute', right: -space.xs, top: -space.xs,
    width: space.sm, height: space.sm, borderRadius: radius.pill, backgroundColor: colors.lumen,
  },
  icon: { width: sideIconSize, height: sideIconSize },
  cameraIcon: { width: 38, height: 38 },
  label: {
    width: '100%',
    textAlign: 'center',
    color: colors.brand,
    fontFamily: font.bold,
    fontSize: 10,
  },
  activeLabel: { color: colors.navy, fontFamily: font.black },
});
