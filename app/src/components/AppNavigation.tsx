import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useGlobalSearchParams, usePathname, useRootNavigationState } from 'expo-router';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, PanResponder, Platform, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeNavigation, type NavigationSection } from '@/components/HomeNavigation';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { colors, motion, space, touch } from '@/theme';

const webSwipeStyle = { flex: 1, minHeight: 0, touchAction: 'pan-y' } as const;

type SwipeOptions = {
  width: number;
  reduced: boolean;
  back: () => void;
  finish: () => void;
};

function createBackSwipe() {
  const offset = new Animated.Value(0);
  let origin = { x: 0, y: 0 };
  let options: SwipeOptions | undefined;
  let animation: Animated.CompositeAnimation | undefined;
  let settling = false;

  function animate(toValue: number, duration: number, done?: () => void) {
    animation?.stop();
    if (duration === 0) {
      offset.setValue(toValue);
      done?.();
      return;
    }
    animation = Animated.timing(offset, {
      toValue, duration, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => { if (finished) done?.(); });
  }

  function track(event: GestureResponderEvent) {
    if (!options) return;
    const dx = event.nativeEvent.pageX - origin.x;
    offset.setValue(Math.max(0, Math.min(dx, options.width)));
  }

  function cancel() {
    const duration = options?.reduced ? 0 : motion.tap;
    options = undefined;
    animate(0, duration);
  }

  const pan = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (event, { numberActiveTouches }) => {
      if (!options) return false;
      const { pageX, pageY } = event.nativeEvent;
      const dx = pageX - origin.x;
      const dy = pageY - origin.y;
      // Hướng chạm đầu tiên quyết định cuộn dọc hay quay lại.
      if (numberActiveTouches > 1 || (Math.abs(dy) > 12 && Math.abs(dy) >= dx)) options = undefined;
      return !!options && dx > space.sm && dx > Math.abs(dy) * 1.6;
    },
    onPanResponderGrant: (event) => { animation?.stop(); track(event); },
    onPanResponderMove: track,
    onPanResponderRelease: (event, { vx }) => {
      if (!options) return;
      const { pageX, pageY } = event.nativeEvent;
      const dx = pageX - origin.x;
      const dy = pageY - origin.y;
      if (dx <= Math.abs(dy) * 1.5 || (dx < 72 && (dx < 40 || vx <= 0.45))) {
        cancel();
        return;
      }
      const { width, reduced, finish, back } = options;
      options = undefined;
      settling = true;
      finish();
      animate(width, reduced ? 0 : motion.tap, back);
    },
    onPanResponderTerminate: cancel,
    onPanResponderStart: (_, { numberActiveTouches }) => {
      if (numberActiveTouches > 1 && options) cancel();
    },
  });
  return {
    offset,
    handlers: pan.panHandlers,
    start: (event: GestureResponderEvent, allowed: boolean, next: SwipeOptions) => {
      const { pageX, pageY, touches } = event.nativeEvent;
      if (settling || (touches.length > 1 && options)) return false;
      origin = { x: pageX, y: pageY };
      options = touches.length === 1 && allowed ? next : undefined;
      return pan.panHandlers.onStartShouldSetResponderCapture(event);
    },
    reset: () => {
      animation?.stop();
      settling = false;
      options = undefined;
      offset.setValue(0);
    },
  };
}

export function AppNavigation({ children, enabled }: { children: (swipeBack: boolean) => ReactNode; enabled: boolean }) {
  const pathname = usePathname();
  const { feature, from } = useGlobalSearchParams<{ feature?: string; from?: string }>();
  const navigation = useRootNavigationState();
  const routeKey = navigation?.routes[navigation.index]?.key ?? pathname;
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [swipe] = useState(createBackSwipe);
  const [finishingRoute, setFinishingRoute] = useState<string>();
  const huntDetail = pathname.startsWith('/hunt/');

  useLayoutEffect(() => { swipe.reset(); return swipe.reset; }, [routeKey, pathname, feature, swipe]);

  let selected: NavigationSection | undefined;
  switch (pathname) {
    case '/library': selected = 'library'; break;
    case '/badges': selected = 'ranking'; break;
    case '/coming-soon': selected = feature === 'map' || feature === 'path' ? 'map' : 'challenge'; break;
    case '/scan':
    case '/prelude': selected = 'scan'; break;
    case '/story':
    case '/quiz':
    case '/complete': selected = from === 'library' ? 'library' : 'scan'; break;
    default: if (pathname === '/hunt' || huntDetail) selected = 'challenge';
  }

  const showNavigation = enabled && (pathname === '/' || selected !== undefined);
  const canSwipe = showNavigation && pathname !== '/';
  const atDestination = pathname === '/scan' || pathname === '/library' || pathname === '/badges'
    || pathname === '/hunt' || (pathname === '/coming-soon' && selected === 'map');

  return (
    <View style={styles.root}>
      <View
        style={[styles.viewport, canSwipe && Platform.OS === 'web' && webSwipeStyle]}
        onLayout={({ nativeEvent: { layout: { width, height } } }) => {
          setViewport(previous => previous.width === width && previous.height === height ? previous : { width, height });
        }}
        {...(canSwipe ? swipe.handlers : {})}
        onStartShouldSetResponderCapture={canSwipe ? (event) => {
          const { pageX, pageY } = event.nativeEvent;
          const leftEdge = pageX <= insets.left + (pathname === '/story' ? space.lg : space.xl + space.sm);
          const lowerLeft = pathname !== '/story' && pageY >= viewport.height * 0.55 && pageX <= viewport.width * 0.42;
          return swipe.start(event, viewport.width > 0 && (leftEdge || lowerLeft), {
            width: viewport.width,
            reduced,
            finish: () => setFinishingRoute(routeKey),
            back: () => {
              if (router.canGoBack()) router.back();
              else router.replace(huntDetail ? '/hunt' : '/');
            },
          });
        } : undefined}
      >
        {canSwipe && (
          <View pointerEvents="none" aria-hidden style={[styles.backdrop, { paddingLeft: insets.left + space.md }]}>
            <Ionicons name="chevron-back" size={space.lg} color={colors.brand} />
          </View>
        )}
        <Animated.View style={[styles.content, { transform: [{ translateX: swipe.offset }] }]}>
          <SafeAreaInsetsContext.Provider value={showNavigation ? { ...insets, bottom: 0 } : insets}>
            {children(finishingRoute === routeKey)}
          </SafeAreaInsetsContext.Provider>
        </Animated.View>
      </View>
      {showNavigation && <HomeNavigation selected={selected} atDestination={atDestination} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  viewport: { flex: 1, minHeight: 0, overflow: 'hidden' },
  content: { flex: 1, minHeight: 0, backgroundColor: colors.bg },
  backdrop: {
    ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'flex-start',
    paddingBottom: touch, backgroundColor: colors.bgAlt,
  },
});
