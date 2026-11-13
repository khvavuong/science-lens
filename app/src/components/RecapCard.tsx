import { useIsFocused } from 'expo-router';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

export function RecapCard() {
  const { story, photo, quizAnswers, retryAssets } = useJourney();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [exported, setExported] = useState<string>();
  const videos = story?.assets.scenes.flatMap(s => s.video ? [s.video] : []) ?? [];
  const video = videos.find(v => v.status === 'ready' && v.url);
  const pending = videos.some(v => v.status === 'pending');
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
  return <View style={styles.card}>
    <Text style={type.h2}>Đồ quen. Bí mật lạ.</Text>
    <Text style={type.body}>Biến khám phá thành một clip dọc để khoe cùng bạn bè.</Text>
    {exported ? <Preview key={exported} uri={exported} narrated /> : <>
      {photo && <Image source={{ uri: photo.uri }} contentFit="contain" style={styles.photo} />}
      {video?.url && <Preview key={video.url} uri={mediaUrl(video.url)!} />}
    </>}
    {!video && <Text style={type.body}>{pending ? 'Clip đang được tạo. Bạn không cần thoát ra vào lại.' : 'Chưa có clip cho khám phá này. Bạn vẫn có thể chia sẻ kết quả ở phía trên.'}</Text>}
    {video && photo && <>
      <Text style={type.body}>Video sẽ tự ghép với ảnh của bạn và kết quả quiz, rồi lưu vào Kho khám phá.</Text>
      {exported && <Button label="Lưu / chia sẻ video" icon="share-outline" loading={busy} onPress={() => { void share(); }} />}
      {!exported && !!error && <Button label="Thử ghép lại" loading={busy} onPress={() => { void generate(); }} />}
    </>}
    {!pending && videos.some(v => v.status === 'error') && <Button label="Thử tạo clip lại" variant="ghost" onPress={() => { void retryAssets(); }} />}
    {busy && <Text accessibilityLiveRegion="polite" style={type.body}>Đang thu giọng và dựng clip… Bạn giữ màn hình này mở nhé.</Text>}
    {exported && <Text style={type.caption}>Xem trước rồi chọn Lưu video, Reels hoặc TikTok trong bảng chia sẻ.</Text>}
    {!!error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  card: { gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  video: { width: '100%', aspectRatio: 9 / 16, borderRadius: radius.md },
  photo: { width: '100%', height: 120, borderRadius: radius.md },
});
