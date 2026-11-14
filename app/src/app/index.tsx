import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useContext, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { HomeHero } from '@/components/Illustrations';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { Wordmark } from '@/components/Wordmark';
import { haptic } from '@/lib/haptics';
import { loadHistory, type JourneyRecord } from '@/lib/history';
import { markOnboardingSeen, OnboardingSeenContext } from '@/lib/onboarding';
import { useJourney } from '@/lib/store';
import { colors, font, radius, space, type } from '@/theme';

export default function Home() {
  const { seen, finishOnboarding } = useContext(OnboardingSeenContext);
  const [busy, setBusy] = useState(false);
  const finishing = useRef(false);

  const finishWelcome = async (startScan: boolean) => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    await markOnboardingSeen();
    finishOnboarding();
    if (startScan) router.push('/scan');
  };

  if (!seen) {
    return <WelcomeScreen busy={busy} onStart={() => void finishWelcome(true)} onSkip={() => void finishWelcome(false)} />;
  }
  return <HomeScreen />;
}

// Đọc lịch sử sớm (lúc tải module, khi màn khởi động còn chạy) để lần đầu vào Trang chủ
// hàng "Khám phá gần đây" có sẵn, không làm bố cục nhảy.
let recentCache: JourneyRecord[] | undefined;
void loadHistory().then((list) => { recentCache ??= list; });

const RECENT_LIMIT = 5;
const HERO_RATIO = 340 / 200; // viewBox của HomeHero
const HERO_MIN = 96; // thấp hơn thì ẩn minh họa thay vì vẽ quá nhỏ
const HERO_MAX = 220;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [recent, setRecent] = useState(() => recentCache);
  // Chỗ còn lại cho minh họa: ước lượng theo màn hình, đo lại chính xác khi layout xong.
  const [heroBox, setHeroBox] = useState(() => ({ width: Math.min(width, 416) - 2 * space.lg, height: Math.round(height * 0.24) }));
  const openStory = useJourney((s) => s.openStory);
  const opening = useRef(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadHistory().then((list) => {
      recentCache = list;
      if (active) setRecent(list);
    });
    return () => { active = false; };
  }, []));

  const reopen = async (r: JourneyRecord) => {
    if (opening.current) return;
    opening.current = true;
    haptic.tap();
    try {
      await openStory(r.storyId);
      router.push({ pathname: '/story', params: { from: 'library', autoplay: '1' } });
    } catch {
      Alert.alert('Chưa mở được', 'Cần kết nối mạng để mở lại câu chuyện này.');
    } finally {
      opening.current = false;
    }
  };

  const items = recent?.slice(0, RECENT_LIMIT) ?? [];
  const heroHeight = Math.min(heroBox.height, heroBox.width / HERO_RATIO, HERO_MAX);
  const gutter = { paddingLeft: insets.left + space.lg, paddingRight: insets.right + space.lg };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.scroll, gutter, { paddingTop: insets.top + space.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Wordmark width={144} />

        <Text style={[width < 380 ? type.h1 : type.hero, styles.headline]} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
          Đồ vật nào cũng có một câu chuyện khoa học.
        </Text>

        <View
          style={styles.hero}
          onLayout={({ nativeEvent: { layout } }) => {
            setHeroBox((prev) => prev.width === layout.width && prev.height === layout.height ? prev : { width: layout.width, height: layout.height });
          }}
        >
          {heroHeight >= HERO_MIN && <HomeHero height={heroHeight} />}
        </View>

        {items.length > 0 && (
          <View style={styles.recent}>
            <View style={styles.recentHeader}>
              <Text style={type.bodyStrong} accessibilityRole="header" maxFontSizeMultiplier={1.3}>Khám phá gần đây</Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Xem tất cả khám phá"
                hitSlop={{ top: 15, bottom: 15, left: 12, right: 12 }}
                onPress={() => { haptic.tap(); router.push('/library'); }}
                style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
              >
                <Text style={styles.seeAllLabel} maxFontSizeMultiplier={1.3}>Tất cả</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.brand} />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginLeft: -gutter.paddingLeft, marginRight: -gutter.paddingRight }}
              contentContainerStyle={[styles.recentRow, gutter]}
            >
              {items.map((r) => (
                <Pressable
                  key={r.storyId}
                  accessibilityRole="button"
                  accessibilityLabel={`Xem lại câu chuyện về ${r.label}`}
                  onPress={() => void reopen(r)}
                  style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
                >
                  <View style={styles.thumb}>
                    <Text style={styles.initial} maxFontSizeMultiplier={1}>{cap(r.label).charAt(0)}</Text>
                    {r.photoUri && <Image source={{ uri: r.photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />}
                  </View>
                  <Text style={styles.tileLabel} numberOfLines={1} maxFontSizeMultiplier={1.3}>{cap(r.label)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* CTA chính ghim trong vùng ngón cái, ngay trên thanh điều hướng. */}
      <View style={[styles.cta, gutter]}>
        <Button label="Chụp đồ vật" icon="camera" onPress={() => router.push('/scan')} accessibilityHint="Mở camera để quét một đồ vật" style={styles.ctaButton} />
      </View>
    </View>
  );
}

const THUMB = 64;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  scroll: { flexGrow: 1, alignSelf: 'center', width: '100%', maxWidth: 416, paddingBottom: space.md },
  headline: { marginTop: space.lg },
  // Co giãn theo khoảng trống còn lại; minh họa canh giữa trong đó.
  hero: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0, justifyContent: 'center', marginVertical: space.md },
  recent: { gap: space.sm },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllLabel: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, color: colors.brand },
  recentRow: { gap: space.md },
  tile: { width: THUMB + space.sm, alignItems: 'center', gap: 6 },
  thumb: {
    width: THUMB, height: THUMB, borderRadius: radius.md, overflow: 'hidden',
    backgroundColor: colors.lumenSoft, alignItems: 'center', justifyContent: 'center',
  },
  initial: { fontFamily: font.black, fontSize: 26, color: colors.navy },
  tileLabel: { ...type.caption, color: colors.text, textAlign: 'center', alignSelf: 'stretch' },
  pressed: { opacity: 0.7 },
  cta: { paddingTop: space.sm, paddingBottom: space.xs },
  ctaButton: { alignSelf: 'center', width: '100%', maxWidth: 416 - 2 * space.lg },
});
