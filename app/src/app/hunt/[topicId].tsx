import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { HuntAudio, HuntComposerRow, HuntField } from '@/components/HuntAudio';
import { HuntFrame, HuntIconButton } from '@/components/HuntFrame';
import { HorizontalTrail, type NodeState } from '@/components/Trail';
import type { HuntVerdict } from '@/lib/api';
import { editHuntExplanation, huntTopics, loadHunts, retryHuntSave, setHuntPhoto, submitHunt, useHunts } from '@/lib/huntStore';
import { HUNT_TEXT_LIMIT } from '@/lib/huntTypes';
import { appendHuntFile } from '@/lib/huntUpload';
import { preparePhoto } from '@/lib/preparePhoto';
import { colors, radius, space, type } from '@/theme';

const verdictLabels: Record<HuntVerdict, string> = {
  accepted: 'Đạt',
  needs_detail: 'Bổ sung lời giải thích',
  retake_photo: 'Chọn ảnh rõ hơn',
  change_object: 'Thử một vật khác',
};

const verdictIcons: Record<HuntVerdict, keyof typeof Ionicons.glyphMap> = {
  accepted: 'checkmark-circle',
  needs_detail: 'chatbubble-ellipses-outline',
  retake_photo: 'camera-outline',
  change_object: 'swap-horizontal',
};

// Bộ đếm ký tự chỉ hiện khi gần chạm giới hạn.
const COUNTER_FROM = Math.floor(HUNT_TEXT_LIMIT * 0.8);

export default function HuntMission() {
  const focused = useIsFocused();
  const { topicId } = useLocalSearchParams<{ topicId?: string }>();
  const id = typeof topicId === 'string' ? topicId : '';
  const progress = useHunts((state) => state.progress[id]);
  const loaded = useHunts((state) => state.loaded);
  const sending = useHunts((state) => state.submitting[id]);
  const apiError = useHunts((state) => state.error[id]);
  const savingError = useHunts((state) => state.savingError[id]);
  const topic = huntTopics.find((candidate) => candidate.id === id && candidate.version === progress?.topicVersion);
  const [loadError, setLoadError] = useState(false);
  const [hint, setHint] = useState(false);
  const [choosing, setChoosing] = useState<false | 'camera' | 'library'>(false);
  const [replacing, setReplacing] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const choosingLock = useRef(false);

  useEffect(() => { void loadHunts().catch(() => setLoadError(true)); }, []);
  useFocusEffect(useCallback(() => () => setAudioBusy(false), [setAudioBusy]));

  async function pick(camera: boolean) {
    if (choosingLock.current || sending || audioBusy) return;
    choosingLock.current = true;
    setChoosing(camera ? 'camera' : 'library');
    setPhotoError('');
    try {
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Em có thể chọn ảnh từ thư viện hoặc bật quyền camera trong cài đặt.');
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.85 };
      const picked = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!picked.canceled && picked.assets[0]) {
        await setHuntPhoto(id, await preparePhoto(picked.assets[0].uri));
        setReplacing(false);
      }
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Chưa mở được ảnh. Em thử lại nhé.');
    } finally {
      choosingLock.current = false;
      setChoosing(false);
    }
  }

  if (loadError) return <HuntFrame back="/hunt">
    <Text style={type.body}>Chưa mở được bài đã lưu.</Text>
    <Button label="Thử mở lại" onPress={() => { setLoadError(false); void loadHunts().catch(() => setLoadError(true)); }} />
  </HuntFrame>;
  if (!loaded) return <HuntFrame back="/hunt"><ActivityIndicator accessibilityLabel="Đang mở nhiệm vụ" color={colors.brand} /></HuntFrame>;
  if (!topic || !progress) return <HuntFrame back="/hunt"><Text style={type.body}>Chủ đề này chưa có trên thiết bị.</Text></HuntFrame>;

  const draft = progress.draft;
  const photo = draft?.photo;
  const complete = Boolean(progress.completedAt);
  const count = progress.accepted.length;
  const trail = Array.from({ length: topic.required }, (_, index): NodeState => index < count ? 'done' : index === count ? 'current' : 'todo');
  const busy = !!choosing || !!sending || audioBusy;
  const length = draft?.explanation.trim().length ?? 0;
  const tooLong = length > HUNT_TEXT_LIMIT;
  const picking = !photo || replacing;
  const toggle = (itemId: string) => setExpanded((open) => open.includes(itemId) ? open.filter((value) => value !== itemId) : [...open, itemId]);

  const input = draft && (
    <TextInput accessibilityLabel="Lời giải thích" value={draft.explanation} multiline
      editable={!sending && !choosing && !audioBusy}
      onChangeText={(value) => editHuntExplanation(id, value)}
      placeholder="Vì sao em chọn vật này?" placeholderTextColor={colors.muted} style={styles.input} maxFontSizeMultiplier={1.4} />
  );
  const send = (
    <HuntIconButton icon="paper-plane" tone="primary" size={56} label="Gửi lời giải thích" loading={sending}
      disabled={!!choosing || audioBusy || !length || tooLong}
      onPress={() => void submitHunt(topic, (form, uri) => appendHuntFile(form, 'photo', uri))} />
  );

  const footer = complete ? undefined : (
    <>
      {!!photoError && <Text accessibilityLiveRegion="polite" style={styles.error}>{photoError}</Text>}
      {!!apiError && <Text accessibilityLiveRegion="polite" style={styles.error}>{apiError}</Text>}
      {!!savingError && <>
        <Text accessibilityLiveRegion="polite" style={styles.error}>{savingError}</Text>
        <Button label="Thử lưu lại" variant="secondary" disabled={busy} onPress={() => void retryHuntSave(topic).catch(() => {})} />
      </>}
      {picking && (
        <View style={styles.pickRow}>
          {replacing && <HuntIconButton icon="close" tone="soft" square size={56} label="Giữ ảnh hiện tại" disabled={busy} onPress={() => setReplacing(false)} />}
          <Button style={styles.grow} icon="camera-outline" label={photo ? 'Chụp ảnh khác' : 'Chụp đồ vật'}
            loading={choosing === 'camera'} disabled={busy} onPress={() => void pick(true)} />
          <HuntIconButton icon="images-outline" tone="soft" square size={56} label="Chọn ảnh từ thư viện"
            loading={choosing === 'library'} disabled={busy} onPress={() => void pick(false)} />
        </View>
      )}
      {/* Ô soạn vẫn được giữ (ẩn) khi thay ảnh để không mất bản ghi âm chưa chuyển thành chữ. */}
      {photo && draft && (
        <View style={[styles.composer, replacing && styles.hidden]}>
          {length > COUNTER_FROM && (
            <Text accessibilityLiveRegion="polite" style={[styles.counter, tooLong && styles.over]}>{length}/{HUNT_TEXT_LIMIT}</Text>
          )}
          {focused ? (
            <HuntAudio key={`${draft.id}-${photo.revision}`} onTranscript={(value) => editHuntExplanation(id, value)}
              onBusy={setAudioBusy} disabled={!!sending || !!choosing} trailing={send}>{input}</HuntAudio>
          ) : (
            <HuntComposerRow trailing={send}><HuntField>{input}</HuntField></HuntComposerRow>
          )}
        </View>
      )}
    </>
  );

  return (
    <HuntFrame back="/hunt" title={topic.title} footer={footer}>
      <View style={styles.intro}>
        <Text style={styles.task}>{topic.task}</Text>
        <View style={styles.progress} accessible accessibilityLiveRegion="polite"
          accessibilityLabel={complete ? 'Nhiệm vụ hoàn thành' : `Đã tìm ${count} trên ${topic.required} đồ vật`}>
          <View style={styles.trail}><HorizontalTrail states={trail} size={20} /></View>
          {complete ? <>
            <Ionicons name="checkmark-circle" size={20} color={colors.mintInk} />
            <Text style={styles.doneText}>Hoàn thành</Text>
          </> : <Text style={type.bodyStrong}>{count}/{topic.required}</Text>}
        </View>
        {!complete && (
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: hint }} accessibilityLabel={hint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
            onPress={() => setHint(!hint)} hitSlop={4} style={({ pressed }) => [styles.hintToggle, pressed && styles.pressed]}>
            <Ionicons name={hint ? 'bulb' : 'bulb-outline'} size={18} color={colors.brand} />
            <Text style={styles.link}>{hint ? 'Ẩn gợi ý' : 'Xem gợi ý'}</Text>
          </Pressable>
        )}
        {!complete && hint && <Text accessibilityLiveRegion="polite" style={styles.hint}>{topic.hint}</Text>}
      </View>

      {!complete && photo && (
        <View style={styles.draft}>
          <View>
            <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="cover" accessibilityLabel="Ảnh đồ vật em chọn" />
            {!replacing && (
              <View style={styles.previewAction}>
                <HuntIconButton icon="camera-outline" tone="overlay" label="Thay ảnh" disabled={busy} onPress={() => setReplacing(true)} />
              </View>
            )}
          </View>
          {!!draft?.result && (
            <View style={styles.feedback}>
              <View style={styles.feedbackHead}>
                <Ionicons name={verdictIcons[draft.result.verdict]} size={20} color={colors.brand} />
                <Text accessibilityLiveRegion="polite" style={type.bodyStrong}>{verdictLabels[draft.result.verdict]}</Text>
              </View>
              <Text style={type.body}>{draft.result.feedback}</Text>
            </View>
          )}
        </View>
      )}

      {count > 0 && (
        <View style={styles.found}>
          <Text style={styles.section} accessibilityRole="header">Đồ vật đã đạt</Text>
          {progress.accepted.map((item) => {
            const open = expanded.includes(item.id);
            return (
              <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ expanded: open }}
                accessibilityLabel={`${item.result.objectLabel}. ${item.result.feedback}`}
                accessibilityHint={open ? 'Thu gọn' : 'Xem lời giải thích của em'}
                onPress={() => toggle(item.id)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                <Image source={{ uri: item.photo.uri }} contentFit="cover" style={styles.thumb} accessibilityLabel={item.result.objectLabel} />
                <View style={styles.itemText}>
                  <Text style={type.bodyStrong}>{item.result.objectLabel}</Text>
                  <Text style={type.caption} numberOfLines={open ? undefined : 2}>{item.result.feedback}</Text>
                  {open && <Text style={styles.quote}>“{item.explanation}”</Text>}
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </HuntFrame>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  pressed: { opacity: 0.6 },
  intro: { alignItems: 'center', gap: space.sm },
  task: { ...type.body, textAlign: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 28 },
  trail: { width: 108 },
  doneText: { ...type.bodyStrong, color: colors.mintInk },
  hintToggle: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 48, paddingHorizontal: space.sm },
  link: { ...type.bodyStrong, color: colors.brand },
  hint: { ...type.body, color: colors.muted, textAlign: 'center' },
  draft: { gap: space.sm },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.bgAlt },
  previewAction: { position: 'absolute', top: space.sm, right: space.sm },
  feedback: { padding: space.md, gap: space.xs, borderRadius: radius.lg, backgroundColor: colors.brandSoft },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  found: { gap: space.xs },
  section: { ...type.caption, marginTop: space.sm },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.sm, minHeight: 72 },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.bgAlt },
  itemText: { flex: 1, gap: 2 },
  quote: { ...type.body, marginTop: space.xs },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  composer: { gap: space.xs },
  hidden: { display: 'none' },
  counter: { ...type.caption, alignSelf: 'flex-end' },
  over: { color: colors.danger },
  input: { ...type.body, flex: 1, minHeight: 48, maxHeight: 132, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 0, textAlignVertical: 'top' },
  error: { ...type.body, color: colors.danger },
});
