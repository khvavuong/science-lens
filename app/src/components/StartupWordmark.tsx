import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Wordmark, wordmarkAspectRatio } from '@/components/Wordmark';
import { useReducedMotion } from '@/lib/useReducedMotion';

const wordmarkIntro = require('../../assets/lumoslab-wordmark-intro.webp');
const logoWidth = 224;
// Cùng thời lượng với scripts/generate-startup-wordmark.mjs.
const introDuration = 1562;

export function StartupWordmark({ onIntroEnd }: { onIntroEnd: () => void }) {
  const reduced = useReducedMotion(null);
  const [displayed, setDisplayed] = useState(false);
  const [useStaticLogo, setUseStaticLogo] = useState(false);
  const staticLogo = reduced === true || useStaticLogo;

  useEffect(() => {
    if (staticLogo) {
      onIntroEnd();
      return;
    }

    if (displayed) {
      const timer = setTimeout(onIntroEnd, introDuration);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setUseStaticLogo(true), reduced === null ? 300 : 1800);
    return () => clearTimeout(timer);
  }, [displayed, onIntroEnd, reduced, staticLogo]);

  if (staticLogo) return <Wordmark width={logoWidth} />;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel="lumoslens" style={styles.logo}>
      {reduced === false && (
        <Image
          source={wordmarkIntro}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          onDisplay={() => setDisplayed(true)}
          onError={() => setUseStaticLogo(true)}
          accessible={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { width: '100%', maxWidth: logoWidth, aspectRatio: wordmarkAspectRatio },
});
