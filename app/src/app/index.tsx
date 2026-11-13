import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeNavigation } from '@/components/HomeNavigation';
import { HomeHero } from '@/components/Illustrations';
import { StartupScreen } from '@/components/StartupScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { Wordmark } from '@/components/Wordmark';
import { hasSeenOnboarding, markOnboardingSeen } from '@/lib/onboarding';
import { colors, space, type } from '@/theme';

export default function Home() {
  const [seen, setSeen] = useState<boolean>();
  const [busy, setBusy] = useState(false);
  const finishing = useRef(false);

  useEffect(() => {
    let active = true;
    void hasSeenOnboarding().then((value) => { if (active) setSeen(value); });
    return () => { active = false; };
  }, []);

  const finishWelcome = async (startScan: boolean) => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    await markOnboardingSeen();
    setSeen(true);
    if (startScan) router.push('/scan');
  };

  if (seen === undefined) return <StartupScreen />;
  if (!seen) {
    return <WelcomeScreen busy={busy} onStart={() => void finishWelcome(true)} onSkip={() => void finishWelcome(false)} />;
  }
  return <HomeScreen />;
}

function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + space.md,
            paddingLeft: insets.left + space.lg,
            paddingRight: insets.right + space.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Wordmark width={144} />

        <View style={styles.intro}>
          <Text style={type.hero} accessibilityRole="header">
            Chụp một đồ vật.{'\n'}Nghe câu chuyện khoa học của nó.
          </Text>
          <HomeHero height={196} />
        </View>
      </ScrollView>
      <HomeNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, alignSelf: 'center', width: '100%', maxWidth: 416 },
  intro: { flexGrow: 1, justifyContent: 'center', gap: space.md, paddingTop: space.lg, paddingBottom: space.xl },
});
