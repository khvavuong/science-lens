import { useIsFocused } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { API_URL, mediaUrl } from '@/lib/api';
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
  const share = async () => {
    if (!story || !photo || busy) return;
    setBusy(true); setError('');
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Thiết bị chưa hỗ trợ chia sẻ video.');
      let uri = exported;
      if (!uri) {
        const response = await fetch(`${API_URL}/api/stories/${story.id}/recap`, {
          method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.EXPO_PUBLIC_API_TOKEN ?? ''}` },
          body: JSON.stringify({ photoBase64: photo.base64, answers: quizAnswers }), signal: AbortSignal.timeout(120_000),
        });
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          throw new Error(detail.error ?? `Xuất video bị gián đoạn (${response.status}). Thử lại nhé.`);
        }
        if (!response.headers.get('content-type')?.includes('video/mp4')) throw new Error('Máy chủ chưa trả về MP4 hợp lệ.');
        const file = new File(Paths.cache, `lumoslab-${story.id}.mp4`);
        file.create({ overwrite: true });
        file.write(new Uint8Array(await response.arrayBuffer()));
        uri = file.uri; setExported(uri);
      }
      await Sharing.shareAsync(uri, { mimeType: 'video/mp4', UTI: 'public.mpeg-4', dialogTitle: 'Chia sẻ khám phá của bạn' });
    } catch (e) { setError(e instanceof Error ? e.message : 'Chưa chia sẻ được video.'); }
    finally { setBusy(false); }
  };
  return <View style={styles.card}>
    <Text style={type.h2}>Khoe khám phá của bạn</Text>
    <Text style={type.body}>Ảnh bạn chụp → bí mật của đồ vật → kết quả thử thách.</Text>
    {exported ? <Preview key={exported} uri={exported} narrated /> : <>
      {photo && <Image source={{ uri: photo.uri }} contentFit="contain" style={styles.photo} />}
      {video?.url && <Preview key={video.url} uri={mediaUrl(video.url)!} />}
    </>}
    {!video && <Text style={type.body}>{pending ? 'Clip đang được tạo. Bạn không cần thoát ra vào lại.' : 'Chưa có clip cho khám phá này. Bạn vẫn có thể chia sẻ kết quả ở phía trên.'}</Text>}
    {video && photo && <>
      <Text style={type.body}>Khi xuất, ảnh được gửi để ghép MP4 dọc có chữ, câu đùa khoa học và giọng kể. Bạn có thể thêm nhạc trong TikTok. Ảnh chỉ dùng tạm, không lưu vào kho cloud.</Text>
      <Button label={exported ? 'Chia sẻ MP4' : 'Xuất & chia sẻ MP4'} icon="share-outline" loading={busy} onPress={() => { void share(); }} />
    </>}
    {!pending && videos.some(v => v.status === 'error') && <Button label="Thử tạo clip lại" variant="ghost" onPress={() => { void retryAssets(); }} />}
    {!!error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  card: { gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface },
  video: { width: '100%', aspectRatio: 9 / 16, borderRadius: radius.md },
  photo: { width: '100%', height: 120, borderRadius: radius.md },
});
