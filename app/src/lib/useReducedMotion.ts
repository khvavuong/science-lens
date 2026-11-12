import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** true khi người dùng bật Reduce Motion: tắt Ken Burns/parallax, chỉ dùng fade ngắn. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}
