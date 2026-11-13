import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/lib/store';
import { colors, font, radius, space, type } from '@/theme';

/** Thu nhỏ ảnh còn ~768px để gửi nhận diện nhanh (ảnh chỉ dùng tạm, không lưu trên server). */
async function prepare(uri: string) {
  const ctx = ImageManipulator.manipulate(uri).resize({ width: 768 });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.72, base64: true });
  return { uri: out.uri, base64: out.base64! };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Quét + Nhận diện trong một màn:
 * camera → chụp/chọn ảnh → ảnh giữ full màn, thẻ kết quả trượt lên → "Bắt đầu khám phá".
 */
export default function Scan() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(true);
  const cam = useRef<CameraView>(null);
  const { photo, recognition, recognizeError, label, story, storyError, setPhoto, reset, runRecognition, startStory } = useJourney();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // Tắt camera khi rời màn hình để tiết kiệm pin.
  useFocusEffect(useCallback(() => { setFocused(true); setBusy(false); return () => setFocused(false); }, []));
  useEffect(() => { if (recognition?.safe) haptic.success(); }, [recognition]);

  const go = async (uri: string) => {
    try {
      setPhoto(await prepare(uri));
      setEditing(false);
      void useJourney.getState().runRecognition();
    } catch {
      Alert.alert('Không xử lý được ảnh', 'Bạn thử chụp lại nhé.');
    } finally {
      setBusy(false);
    }
  };

  const capture = async () => {
    if (photo) { reset(); return; } // đang xem kết quả → nút chụp = chụp lại
    if (!cam.current || busy) return;
    setBusy(true);
    haptic.tap();
    try {
      const pic = await cam.current.takePictureAsync({ quality: 0.8 });
      await go(pic.uri);
    } catch {
      setBusy(false);
    }
  };

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy(true);
    await go(res.assets[0].uri);
  };

  const submitDraft = () => {
    const v = draft.trim();
    if (!v) return;
    setEditing(false);
    useJourney.setState({ label: v.toLowerCase() });
    void startStory(v);
  };

  const begin = () => {
    if (!story && !storyError) void startStory(label);
    router.push('/prelude');
  };

  // --- Chưa có quyền camera và chưa có ảnh: giải thích lý do + cho chọn ảnh từ thư viện ---
  if (!permission?.granted && !photo) {
    const denied = permission && !permission.canAskAgain;
    return (
      <View style={[styles.permRoot, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md }]}>
        <StatusBar style="dark" />
        <IconButton icon="chevron-back" label="Quay lại" onPress={() => router.back()} />
        <View style={styles.permBody}>
          <View style={styles.permIcon}><Ionicons name="camera" size={40} color={colors.brand} /></View>
          <Text style={[type.h1, { textAlign: 'center' }]}>Cho LumosLab mượn camera nhé</Text>
          <Text style={[type.body, { textAlign: 'center', color: colors.muted }]}>
            Camera giúp bạn chụp một đồ vật để nghe câu chuyện khoa học của nó.
          </Text>
        </View>
        <View style={{ gap: space.sm }}>
          {permission === null ? (
            <ActivityIndicator color={colors.brand} />
          ) : denied ? (
            <Button label="Mở Cài đặt" icon="settings-outline" onPress={() => Linking.openSettings()} />
          ) : (
            <Button label="Cho phép camera" icon="camera" onPress={requestPermission} />
          )}
          <Button label="Chọn ảnh từ thư viện" icon="images-outline" variant="secondary" onPress={pick} loading={busy} />
        </View>
      </View>
    );
  }

  const recognizing = !!photo && !recognition && !recognizeError;
  const unsafe = recognition && !recognition.safe;
  const unsure = recognition && recognition.safe && recognition.confidence < 0.6;
  const storyFailed = !!storyError || story?.status === 'error';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {photo ? (
        <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Ảnh bạn vừa chụp" />
      ) : (
        focused && permission?.granted && <CameraView ref={cam} style={StyleSheet.absoluteFill} facing={facing} animateShutter />
      )}

      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <IconButton icon="chevron-back" label="Quay lại" dark onPress={() => { reset(); router.back(); }} />
        {!photo && <View style={styles.hint}><Text style={styles.hintText}>Đặt đồ vật vào giữa khung</Text></View>}
        <View style={{ width: 44 }} />
      </View>

      <View pointerEvents="none" style={[styles.frameWrap, photo && { paddingBottom: 260 }]}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.bottomWrap}>
        {photo && (
          <View style={styles.card}>
            {recognizing && (
              <View style={styles.cardRow}>
                <ActivityIndicator color={colors.brand} />
                <Text style={type.bodyStrong}>Đang nhìn xem đây là gì…</Text>
              </View>
            )}

            {recognizeError && (
              <View style={{ gap: space.sm }}>
                <Text style={type.h2}>Mình chưa nhận ra được</Text>
                <Text style={[type.body, { color: colors.muted }]}>{recognizeError}</Text>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Button label="Thử lại" variant="secondary" icon="refresh" onPress={runRecognition} style={{ flex: 1 }} />
                  <Button label="Tự nhập tên" variant="secondary" onPress={() => { setDraft(''); setEditing(true); }} style={{ flex: 1 }} />
                </View>
              </View>
            )}

            {unsafe && (
              <View style={{ gap: 4 }}>
                <Text style={type.h2}>Đồ vật này chưa phù hợp</Text>
                <Text style={[type.body, { color: colors.muted }]}>Thử một đồ vật khác nhé, như quả táo hay chiếc lá.</Text>
              </View>
            )}

            {recognition?.safe && !editing && (
              <>
                <View style={styles.cardRow}>
                  <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={type.caption}>{unsure ? 'Mình đoán đây là' : 'Mình nhận ra đây là'}</Text>
                    <Text style={styles.label} accessibilityRole="header" numberOfLines={2}>{cap(label)}</Text>
                  </View>
                  <Pressable onPress={() => { setDraft(label); setEditing(true); }} accessibilityRole="button" accessibilityLabel="Sửa tên đồ vật" hitSlop={10} style={styles.editBtn}>
                    <Ionicons name="pencil" size={14} color={colors.brand} />
                    <Text style={styles.editText}>Sửa tên</Text>
                  </Pressable>
                </View>
                {unsure && recognition.alternatives.length > 0 && (
                  <View style={styles.chips}>
                    {[recognition.label, ...recognition.alternatives].filter((x, i, a) => a.indexOf(x) === i).map((alt) => (
                      <Pressable
                        key={alt}
                        onPress={() => { haptic.select(); useJourney.setState({ label: alt }); void startStory(alt); }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: alt === label }}
                        style={[styles.chip, alt === label && styles.chipOn]}
                      >
                        <Text style={[styles.chipText, alt === label && { color: colors.white }]}>{cap(alt)}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            )}

            {editing && (
              <View style={{ gap: space.sm }}>
                <Text style={type.caption}>Tên đồ vật</Text>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Ví dụ: quả chuối"
                  placeholderTextColor={colors.muted}
                  autoFocus
                  maxLength={60}
                  returnKeyType="done"
                  onSubmitEditing={submitDraft}
                  style={styles.input}
                  accessibilityLabel="Tên đồ vật"
                />
              </View>
            )}

            {storyFailed && !editing && (
              <Text style={[type.caption, { color: colors.danger }]}>{storyError ?? 'Chưa tạo được câu chuyện.'} Bấm nút bên dưới để thử lại.</Text>
            )}

            {editing ? (
              <Button label="Xong" onPress={submitDraft} disabled={!draft.trim()} />
            ) : recognition?.safe ? (
              <Button
                label="Bắt đầu khám phá"
                chevron
                onPress={() => {
                  if (storyFailed) { useJourney.setState({ story: null, storyError: null }); void startStory(label); }
                  begin();
                }}
              />
            ) : null}
          </View>
        )}

        <View style={[styles.controls, { paddingBottom: insets.bottom + space.md }, photo && styles.controlsOnCard]}>
          <IconButton icon="images-outline" label="Chọn ảnh từ thư viện" dark={!photo} size={52} onPress={pick} />
          <Pressable
            onPress={capture}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={photo ? 'Chụp lại' : 'Chụp ảnh'}
            style={({ pressed }) => [styles.shutter, photo && styles.shutterLight, pressed && { transform: [{ scale: 0.94 }] }]}
          >
            {busy ? <ActivityIndicator color={colors.brand} /> : <View style={[styles.shutterInner, photo && styles.shutterInnerLight]} />}
          </Pressable>
          <IconButton icon="sync-outline" label="Đổi camera" dark={!photo} size={52} onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const C = 34;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  top: { position: 'absolute', left: 0, right: 0, zIndex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md },
  hint: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.navyLabel },
  hintText: { fontFamily: font.medium, fontSize: 14, color: colors.white },
  frameWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  frame: { width: '68%', aspectRatio: 0.9 },
  corner: { position: 'absolute', width: C, height: C, borderColor: colors.white },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
  bottomWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  card: {
    backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md, gap: space.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface },
  label: { fontFamily: font.black, fontSize: 28, lineHeight: 34, color: colors.navy, letterSpacing: -0.4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, minHeight: 36, borderRadius: radius.pill, backgroundColor: colors.surface },
  editText: { fontFamily: font.semibold, fontSize: 13, color: colors.brand },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.bgAlt },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontFamily: font.medium, fontSize: 15, color: colors.text },
  input: { minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.brand, paddingHorizontal: space.md, fontFamily: font.semibold, fontSize: 17, color: colors.text },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingTop: space.md, backgroundColor: colors.cameraShade },
  controlsOnCard: { backgroundColor: colors.bg, paddingTop: space.xs },
  shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.whiteHalf },
  shutterLight: { width: 64, height: 64, borderRadius: 32, borderColor: colors.divider },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.brand },
  shutterInnerLight: { width: 46, height: 46, borderRadius: 23, borderColor: colors.navy },
  permRoot: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  permBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  permIcon: { width: 88, height: 88, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
});
