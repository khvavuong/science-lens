import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { mediaUrl } from '@/lib/api';
import { buildRecap, recapKey } from '@/lib/recap';
import { useJourney } from '@/lib/store';
import { colors, radius, space, type } from '@/theme';

function Preview({ uri, narrated = false }: { uri: string; narrated?: boolean }) {
  const focused = useIsFocused();
  const player = useVideoPlayer(uri, p => { p.muted = !narrated; p.audioMixingMode = 'mixWithOthers'; });
  useEffect(() => { if (!focused) player.pause(); }, [focused, player]);
  return <VideoView player={player} nativeControls contentFit="contain" style={styles.video} />;
}

/** Một dòng trạng thái: vòng quay khi đang chờ, icon cảnh báo khi lỗi. */
function Status({ text, tone }: { text: string; tone: 'wait' | 'error' | 'info' }) {
  return (
    <View style={styles.status} accessible accessibilityRole={tone === 'error' ? 'alert' : 'text'} accessibilityLiveRegion="polite">
      {tone === 'wait' && <ActivityIndicator size="small" color={colors.brand} />}
      {tone === 'error' && <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />}
      <Text style={[type.caption, styles.statusText]}>{text}</Text>
    </View>
  );
}

export function RecapCard() {
  const { story, photo, quizAnswers, retryAssets } = useJourney();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [exported, setExported] = useState<string>();
  const videos = story?.assets.scenes.flatMap(s => s.video ? [s.video] : []) ?? [];
  const video = videos.find(v => v.status === 'ready' && v.url);
  const pending = videos.some(v => v.status === 'pending');
  const failed = videos.some(v => v.status === 'error');
  const attempted = useRef(false);
  const generate = async () => {
    if (!story || !photo || busy) return;
    setBusy(true); setError('');
    try { setExported(await buildRecap(story.id, recapKey(photo.uri, quizAnswers), photo.base64, quizAnswers)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Chưa ghép được video.'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (video && photo && !attempted.current) {
      attempted.current = true;
      void generate();
    }
  });
  const share = async () => {
    if (!exported || busy) return;
    setBusy(true); setError('');
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Thiết bị chưa hỗ trợ chia sẻ video.');
      await Sharing.shareAsync(exported, { mimeType: 'video/mp4', UTI: 'public.mpeg-4', dialogTitle: 'Chia sẻ khám phá của bạn' });
    } catch (e) { setError(e instanceof Error ? e.message : 'Chưa chia sẻ được video.'); }
    finally { setBusy(false); }
  };

  // Truyện không có cảnh video (vd. tắt video ở server): không có gì để ghép, ẩn hẳn mục này.
  if (!videos.length && !exported) return null;

  // Chỉ một dòng trạng thái tại một thời điểm, ưu tiên lỗi.
  const status: { text: string; tone: 'wait' | 'error' | 'info' } | null =
    error ? { text: error, tone: 'error' }
    : busy && !exported ? { text: 'Đang dựng clip, bạn giữ màn hình này mở nhé.', tone: 'wait' }
    : !video && pending ? { text: 'Clip đang được tạo…', tone: 'wait' }
    : !video && failed ? { text: 'Chưa tạo được clip lần này.', tone: 'error' }
    : !video ? { text: 'Chưa có clip cho khám phá này.', tone: 'info' }
    : null;

  return <View style={styles.section}>
    <View style={styles.head}>
      <Text style={type.h2}>Clip khám phá</Text>
      <Text style={type.caption}>Ảnh của bạn, clip AI và điểm quiz trong một video dọc.</Text>
    </View>
    {exported ? <Preview key={exported} uri={exported} narrated />
      : video?.url ? <Preview key={video.url} uri={mediaUrl(video.url)!} /> : null}
    {status && <Status {...status} />}
    {video && photo && exported && <Button label="Lưu / chia sẻ video" icon="share-outline" loading={busy} onPress={() => { void share(); }} />}
    {video && photo && !exported && !!error && <Button label="Thử ghép lại" icon="refresh" variant="secondary" loading={busy} onPress={() => { void generate(); }} />}
    {!pending && failed && <Button label="Thử tạo clip lại" icon="refresh" variant="secondary" onPress={() => { void retryAssets(); }} />}
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: space.md },
  head: { gap: space.xs },
  video: { width: '72%', alignSelf: 'center', aspectRatio: 9 / 16, borderRadius: radius.md, backgroundColor: colors.navy },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  statusText: { flex: 1 },
});
