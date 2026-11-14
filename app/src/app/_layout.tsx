import {
  BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_600SemiBold, BeVietnamPro_700Bold, BeVietnamPro_800ExtraBold, useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { setAudioModeAsync } from 'expo-audio';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigation } from '@/components/AppNavigation';
import { StartupScreen } from '@/components/StartupScreen';
import { hasSeenOnboarding, OnboardingSeenContext } from '@/lib/onboarding';
import { colors } from '@/theme';

export default function RootLayout() {
  const [introDone, setIntroDone] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState<boolean>();
  const finishIntro = useCallback(() => setIntroDone(true), []);
  const finishOnboarding = useCallback(() => setOnboardingSeen(true), []);
  const [loaded, error] = useFonts({
    BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_600SemiBold, BeVietnamPro_700Bold, BeVietnamPro_800ExtraBold,
  });

  useEffect(() => {
    // Vẫn phát lời kể khi máy để chế độ im lặng (iOS); người dùng có nút tắt tiếng trong app.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    void hasSeenOnboarding().then((seen) => { if (active) setOnboardingSeen(seen); });
    return () => { active = false; };
  }, []);

  if (!introDone || onboardingSeen === undefined || (!loaded && !error)) {
    return <StartupScreen onIntroEnd={finishIntro} />;
  }

  return (
    <OnboardingSeenContext.Provider value={{ seen: onboardingSeen, finishOnboarding }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigation enabled={onboardingSeen}>
          {(swipeBack) => (
            <Stack screenOptions={({ route }) => ({
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              gestureEnabled: false,
              // Cử chỉ đã chạy chuyển động quay lại ở ngoài Stack.
              animation: swipeBack ? 'none' : route.name === 'scan' ? 'slide_from_bottom'
                : rightSlideScreens.has(route.name) ? 'slide_from_right' : 'fade',
            })}>
              <Stack.Screen name="index" />
              <Stack.Screen name="scan" />
              <Stack.Screen name="prelude" />
              <Stack.Screen name="story" />
              <Stack.Screen name="quiz" />
              <Stack.Screen name="complete" />
              <Stack.Screen name="library" />
              <Stack.Screen name="badges" />
              <Stack.Screen name="coming-soon" />
            </Stack>
          )}
        </AppNavigation>
      </SafeAreaProvider>
    </OnboardingSeenContext.Provider>
  );
}

const rightSlideScreens = new Set(['quiz', 'library', 'badges', 'coming-soon']);
