import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/Button';
import { captureCrop } from '@/lib/captureCrop';
import { haptic } from '@/lib/haptics';
import { preparePhoto } from '@/lib/preparePhoto';
import { useJourney } from '@/lib/store';
import { colors, font, radius, space, type } from '@/theme';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Quét + Nhận diện trong một màn:
 * camera → chụp/chọn ảnh → ảnh giữ full màn, thẻ kết quả trượt lên → "Bắt đầu khám phá".
 */
export default function Scan() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [busy, setBusy] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const cam = useRef<CameraView>(null);
  const { photo, recognition, recognizeError, label, story, storyError, setPhoto, reset, runRecognition, startStory } = useJourney();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // Ảnh mà người dùng đã tự đặt tên (lưu theo uri để ảnh mới không mang theo tên cũ).
  const [namedUri, setNamedUri] = useState<string | null>(null);

  // Camera chỉ bật khi màn đang hiển thị (useIsFocused) để tiết kiệm pin.
  useFocusEffect(useCallback(() => { setBusy(false); }, []));
  useEffect(() => { if (recognition?.safe) haptic.success(); }, [recognition]);

  const go = async (uri: string, crop?: ReturnType<typeof captureCrop>) => {
    try {
      setPhoto(await preparePhoto(uri, crop));
      setEditing(false);
      setNamedUri(null);
      void useJourney.getState().runRecognition();
    } catch {
      Alert.alert('Không xử lý được ảnh', 'Bạn thử chụp lại nhé.');
    } finally {
      setBusy(false);
    }
  };

  const capture = async () => {
    if (!cam.current || busy) return;
    setBusy(true);
    haptic.tap();
    try {
      const pic = await cam.current.takePictureAsync({ quality: 0.8 });
      await go(pic.uri, captureCrop(pic, viewport));
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

  // Có camera → quay lại khung ngắm; không có quyền camera → mở thư viện chọn ảnh khác.
  const canShoot = !!permission?.granted;
  const retake = () => {
    setEditing(false);
    setNamedUri(null);
    if (canShoot) reset();
    else void pick();
  };

  const startEditing = (initial: string) => { setDraft(initial); setEditing(true); };

  const submitDraft = () => {
    const v = draft.trim();
    if (!v || !photo) return;
    haptic.select();
    setEditing(false);
    setNamedUri(photo.uri);
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
        {isFocused && <StatusBar style="dark" />}
        <IconButton icon="chevron-back" label="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
        <View style={styles.permBody}>
          <View style={styles.permIcon}><Ionicons name="camera" size={40} color={colors.brand} /></View>
          <Text style={[type.h1, { textAlign: 'center' }]}>Cho LumosLens mượn camera nhé</Text>
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

  const unsafe = !!recognition && !recognition.safe;
  // Tự đặt tên chỉ có hiệu lực cho đúng ảnh hiện tại và không bao giờ lách được kết quả "chưa phù hợp".
  const named = !!photo && namedUri === photo.uri && !unsafe && !!label;
  const hasName = !!photo && !unsafe && (!!recognition?.safe || named);
  const failed = !!recognizeError && !named;
  const recognizing = !!photo && !recognition && !recognizeError;
  const unsure = !!recognition?.safe && recognition.confidence < 0.6 && !named;
  const storyFailed = !!storyError || story?.status === 'error';

  return (
    <View style={styles.root} onLayout={e => setViewport(e.nativeEvent.layout)}>
      {isFocused && <StatusBar style="light" />}
      {photo ? (
        <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel="Ảnh trong khung bạn vừa chụp" />
      ) : (
        isFocused && <CameraView ref={cam} style={StyleSheet.absoluteFill} facing={facing} animateShutter />
      )}

      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <IconButton icon="chevron-back" label="Quay lại" dark onPress={() => { reset(); if (router.canGoBack()) router.back(); else router.replace('/'); }} />
        {!photo && <View style={styles.pill}><Text style={styles.pillText}>Đặt đồ vật vào giữa khung</Text></View>}
        {photo && !unsafe && !editing ? (
          <Pressable
            onPress={() => { haptic.tap(); retake(); }}
            accessibilityRole="button"
            accessibilityLabel={canShoot ? 'Chụp lại' : 'Chọn ảnh khác'}
            hitSlop={4}
            style={({ pressed }) => [styles.pill, styles.retake, pressed && { backgroundColor: colors.navy }]}
          >
            <Ionicons name={canShoot ? 'camera-outline' : 'images-outline'} size={18} color={colors.white} />
            <Text style={styles.pillText}>{canShoot ? 'Chụp lại' : 'Chọn ảnh khác'}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {!photo && <View pointerEvents="none" style={styles.frameWrap}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.bottomWrap}>
        {photo ? (
          <View style={[styles.card, { paddingBottom: insets.bottom + space.md }]}>
            {editing ? (
              // Đang sửa tên: chỉ còn ô nhập + "Xong", ẩn mọi nội dung khác của thẻ.
              <>
                <View style={styles.editHead}>
                  <Text style={type.caption}>Tên đồ vật</Text>
                  <IconButton icon="close" label="Hủy sửa tên" onPress={() => setEditing(false)} />
                </View>
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
                <Button label="Xong" onPress={submitDraft} disabled={!draft.trim()} />
              </>
            ) : recognizing ? (
              <View style={styles.cardRow}>
                <ActivityIndicator color={colors.brand} />
                <Text style={type.bodyStrong}>Đang nhìn xem đây là gì…</Text>
              </View>
            ) : unsafe ? (
              <>
                <View style={{ gap: space.xs }}>
                  <Text style={type.h2}>Đồ vật này chưa phù hợp</Text>
                  <Text style={[type.body, { color: colors.muted }]}>Thử một đồ vật khác nhé, như quả táo hay chiếc lá.</Text>
                </View>
                <Button label={canShoot ? 'Chụp đồ vật khác' : 'Chọn ảnh khác'} icon={canShoot ? 'camera' : 'images-outline'} onPress={retake} />
              </>
            ) : failed ? (
              <>
                <View style={{ gap: space.xs }}>
                  <Text style={type.h2}>Mình chưa nhận ra được</Text>
                  <Text style={[type.body, { color: colors.muted }]}>{recognizeError}</Text>
                </View>
                <View style={{ gap: space.xs }}>
                  <Button label="Thử lại" icon="refresh" onPress={runRecognition} />
                  <Button label="Tự nhập tên" variant="ghost" icon="create-outline" onPress={() => startEditing('')} />
                </View>
              </>
            ) : hasName ? (
              <>
                <View style={styles.cardRow}>
                  <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={type.caption}>{named ? 'Bạn đặt tên là' : unsure ? 'Mình đoán đây là' : 'Mình nhận ra đây là'}</Text>
                    <Text style={styles.label} accessibilityRole="header" numberOfLines={2} maxFontSizeMultiplier={1.3}>{cap(label)}</Text>
                  </View>
                  <IconButton icon="pencil" label="Sửa tên đồ vật" onPress={() => startEditing(label)} />
                </View>
                {unsure && recognition && recognition.alternatives.length > 0 && (
                  <View style={styles.chips}>
                    {[recognition.label, ...recognition.alternatives].filter((x, i, a) => a.indexOf(x) === i).map((alt) => (
                      <Pressable
                        key={alt}
                        onPress={() => { haptic.select(); useJourney.setState({ label: alt }); void startStory(alt); }}
                        accessibilityRole="button"
                        accessibilityLabel={cap(alt)}
                        accessibilityState={{ selected: alt === label }}
                        hitSlop={4}
                        style={[styles.chip, alt === label && styles.chipOn]}
                      >
                        <Text style={[styles.chipText, alt === label && { color: colors.white }]}>{cap(alt)}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {storyFailed && (
                  <Text style={[type.caption, { color: colors.danger }]}>{storyError ?? 'Chưa tạo được câu chuyện.'}</Text>
                )}
                {storyFailed ? (
                  <Button
                    label="Thử lại"
                    icon="refresh"
                    onPress={() => {
                      useJourney.setState({ story: null, storyError: null });
                      void startStory(label);
                      begin();
                    }}
                  />
                ) : (
                  <Button label="Bắt đầu khám phá" chevron onPress={begin} />
                )}
              </>
            ) : null}
          </View>
        ) : (
          <View style={[styles.controls, { paddingBottom: insets.bottom + space.md }]}>
            <IconButton icon="images-outline" label="Chọn ảnh từ thư viện" dark size={52} onPress={pick} />
            <Pressable
              onPress={capture}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Chụp ảnh"
              style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]}
            >
              {busy ? <ActivityIndicator color={colors.brand} /> : <View style={styles.shutterInner} />}
            </Pressable>
            <IconButton icon="sync-outline" label="Đổi camera" dark size={52} onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const C = 34;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  top: { position: 'absolute', left: 0, right: 0, zIndex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md },
  pill: { paddingHorizontal: 14, paddingVertical: space.sm, borderRadius: radius.pill, backgroundColor: colors.navyLabel },
  pillText: { fontFamily: font.semibold, fontSize: 14, color: colors.white },
  retake: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingVertical: 0 },
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
    paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thumb: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface },
  label: { fontFamily: font.black, fontSize: 28, lineHeight: 34, color: colors.navy, letterSpacing: -0.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.bgAlt },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontFamily: font.medium, fontSize: 16, color: colors.text },
  input: { minHeight: 56, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.brand, paddingHorizontal: space.md, fontFamily: font.semibold, fontSize: 17, color: colors.text },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingTop: space.md, backgroundColor: colors.cameraShade },
  shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.whiteHalf },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.brand },
  permRoot: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  permBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  permIcon: { width: 88, height: 88, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
});
