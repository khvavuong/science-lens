import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SceneImage } from '@/components/SceneImage';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { motion } from '@/theme';

/**
 * Hình của một cảnh: ảnh (luôn có, là fallback) + video phủ lên khi sẵn sàng.
 * - Video tạo từ chính ảnh cảnh nên khung đầu trùng ảnh → chuyển mờ không giật.
 * - Video luôn tắt tiếng; giọng kể (useNarration) điều khiển phát/dừng và vị trí.
 * - Chỉ cảnh đang xem mới tạo player (tiết kiệm bộ nhớ). Reduce Motion → chỉ dùng ảnh.
 */
export function SceneVisual({ imageUri, videoUri, fallbackUri, active, playing, position, seed }: {
  imageUri?: string;
  videoUri?: string;
  fallbackUri?: string;
  active: boolean;
  /** Lời kể đang phát. */
  playing: boolean;
  /** Vị trí lời kể (giây); undefined khi không đồng bộ được (giọng thiết bị). */
  position?: number;
  seed?: number;
}) {
  const reduced = useReducedMotion();
  const withVideo = Boolean(videoUri && active && !reduced);
  return (
    <View style={StyleSheet.absoluteFill}>
      <SceneImage uri={imageUri} fallbackUri={fallbackUri} active={active && !withVideo} seed={seed} />
      {withVideo && <SceneVideo uri={videoUri!} playing={playing} position={position} />}
    </View>
  );
}

const DRIFT_S = 0.6;

function SceneVideo({ uri, playing, position }: { uri: string; playing: boolean; position?: number }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = false;
    // Không giành audio session của giọng kể.
    p.audioMixingMode = 'mixWithOthers';
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const [opacity] = useState(() => new Animated.Value(0));
  const ready = status === 'readyToPlay';

  // Hiện video khi đã tải được; lỗi → giữ nguyên ảnh bên dưới.
  useEffect(() => {
    if (!ready) return;
    Animated.timing(opacity, { toValue: 1, duration: motion.scene, useNativeDriver: true }).start();
  }, [ready, opacity]);

  // Phát/dừng theo lời kể; lệch quá DRIFT_S thì tua cho khớp (ví dụ video về khi đang đọc dở).
  /* eslint-disable react-hooks/immutability -- VideoPlayer là native object; gán currentTime là API chính thức của expo-video */
  useEffect(() => {
    if (!ready) return;
    if (!playing) { player.pause(); return; }
    if (position !== undefined && position < player.duration && Math.abs(player.currentTime - position) > DRIFT_S) {
      player.currentTime = position;
    }
    if (!player.playing) player.play();
  }, [ready, playing, position, player]);
  /* eslint-enable react-hooks/immutability */

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
    </Animated.View>
  );
}
