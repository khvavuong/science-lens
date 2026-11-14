import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** true khi người dùng bật Reduce Motion: tắt Ken Burns/parallax, chỉ dùng fade ngắn. */
export function useReducedMotion(initial?: boolean): boolean;
export function useReducedMotion(initial: null): boolean | null;
export function useReducedMotion(initial: boolean | null = false) {
  const [reduced, setReduced] = useState<boolean | null>(initial);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}
