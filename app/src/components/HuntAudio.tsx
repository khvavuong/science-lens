import Ionicons from '@expo/vector-icons/Ionicons';
import {
  RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { HuntIconButton } from '@/components/HuntFrame';
import { huntApi } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { HUNT_RECORD_SECONDS } from '@/lib/huntTypes';
import { appendHuntFile, discardHuntAudio } from '@/lib/huntUpload';
import { colors, radius, space, type } from '@/theme';

const options: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64_000,
  web: { mimeType: 'audio/webm', bitsPerSecond: 64_000 },
};

type AudioState = 'idle' | 'starting' | 'recording' | 'captured' | 'transcribing';

/**
 * Ô soạn lời giải thích có micro: `children` là ô nhập chữ. Khi đang ghi, thanh ghi âm thay chỗ ô nhập;
 * khi đã ghi, hàng "Chuyển thành chữ"/"Bỏ" hiện ngay trên ô nhập.
 */
export function HuntAudio({ onTranscript, onBusy, disabled, children, trailing }: {
  onTranscript: (value: string) => void;
  onBusy: (busy: boolean) => void;
  disabled: boolean;
  children: ReactNode;
  /** Nút gửi đứng cạnh ô nhập, như ô soạn tin nhắn. */
  trailing?: ReactNode;
}) {
  const [state, setState] = useState<AudioState>('idle');
  const [error, setError] = useState('');
  const phase = useRef<AudioState>('idle');
  const file = useRef<string | null>(null);
  const active = useRef(false);
  const closing = useRef(false);
  const recorder = useAudioRecorder(options, (status) => {
    if (status.hasError && active.current && phase.current === 'recording') {
      void finishRecording(null);
    } else if (status.isFinished) {
      void finishRecording(status.url);
    }
  });
  const { durationMillis } = useAudioRecorderState(recorder, 250);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      if (file.current) discardHuntAudio(file.current);
      if (recorder.isRecording) void recorder.stop().catch(() => {});
      if (Platform.OS !== 'web') void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [recorder]);

  function move(next: AudioState) {
    phase.current = next;
    setState(next);
    onBusy(next === 'starting' || next === 'recording' || next === 'transcribing');
  }

  async function finishRecording(uri: string | null) {
    if (!active.current) {
      if (uri) discardHuntAudio(uri);
      return;
    }
    if (phase.current !== 'recording' || closing.current) return;
    closing.current = true;
    if (Platform.OS !== 'web') await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    if (!active.current) {
      if (uri) discardHuntAudio(uri);
      return;
    }
    file.current = uri;
    if (!uri) setError('Chưa ghi được âm thanh. Em có thể thử ghi lại hoặc nhập chữ.');
    move(uri ? 'captured' : 'idle');
  }

  async function start() {
    if (phase.current !== 'idle') return;
    setError('');
    closing.current = false;
    move('starting');
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!active.current) return;
      if (!permission.granted) throw new Error('Em có thể nhập lời giải thích hoặc bật quyền micro trong cài đặt.');
      if (Platform.OS !== 'web') await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (!active.current) return;
      await recorder.prepareToRecordAsync();
      if (!active.current) return;
      move('recording');
      recorder.record({ forDuration: HUNT_RECORD_SECONDS });
    } catch (cause) {
      if (Platform.OS !== 'web') await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      if (!active.current) return;
      setError(cause instanceof Error && cause.message.startsWith('Em có thể') ? cause.message : 'Chưa ghi được âm thanh. Em có thể nhập chữ.');
      move('idle');
    }
  }

  async function stop() {
    if (!recorder.isRecording || phase.current !== 'recording') return;
    try { await recorder.stop(); await finishRecording(recorder.uri); }
    catch { await finishRecording(null); }
  }

  function discard() {
    if (file.current) discardHuntAudio(file.current);
    file.current = null;
    move('idle');
  }

  async function transcribe() {
    if (phase.current !== 'captured' || !file.current) return;
    setError('');
    move('transcribing');
    try {
      const body = new FormData();
      await appendHuntFile(body, 'audio', file.current);
      const { transcript } = await huntApi.transcribe(body);
      if (!active.current) return;
      if (typeof transcript !== 'string' || !transcript.trim()) throw new Error('Chưa nghe rõ lời giải thích. Em thử lại nhé.');
      onTranscript(transcript);
      discard();
    } catch (cause) {
      if (!active.current) return;
      setError(cause instanceof Error ? cause.message : 'Chưa chép được lời giải thích.');
      move('captured');
    }
  }

  const seconds = Math.min(HUNT_RECORD_SECONDS, Math.floor(durationMillis / 1000));
  const transcribing = state === 'transcribing';

  return (
    <View style={styles.stack}>
      {(state === 'captured' || transcribing) && (
        <View style={styles.clip}>
          <Text style={[type.bodyStrong, styles.grow]} numberOfLines={1}>Đã ghi âm</Text>
          <HuntIconButton icon="trash-outline" label="Bỏ bản ghi" disabled={transcribing || disabled} onPress={discard} />
          <Pressable accessibilityRole="button" accessibilityLabel="Chuyển ghi âm thành chữ"
            accessibilityState={{ disabled: transcribing || disabled, busy: transcribing }}
            disabled={transcribing || disabled} hitSlop={4}
            onPress={() => { haptic.tap(); void transcribe(); }}
            style={({ pressed }) => [styles.convert, pressed && styles.convertPressed, disabled && !transcribing && styles.convertOff]}>
            {transcribing ? <ActivityIndicator color={colors.white} /> : <Ionicons name="text" size={18} color={colors.white} />}
            <Text style={styles.convertLabel} maxFontSizeMultiplier={1.3}>Chuyển thành chữ</Text>
          </Pressable>
        </View>
      )}
      <HuntComposerRow trailing={trailing}>{state === 'recording' ? (
        <View style={[styles.field, styles.recording]} accessible accessibilityLabel={`Đang ghi âm, ${seconds} trên ${HUNT_RECORD_SECONDS} giây`}>
          <View style={styles.dot} />
          <Text style={[type.bodyStrong, styles.grow, styles.timer]} maxFontSizeMultiplier={1.3}>
            Đang ghi {clock(seconds)}<Text style={styles.limit}> / {clock(HUNT_RECORD_SECONDS)}</Text>
          </Text>
          <HuntIconButton icon="stop" tone="danger" label="Dừng ghi âm" onPress={() => void stop()} />
        </View>
      ) : (
        <HuntField>
          {children}
          {(state === 'idle' || state === 'starting') && (
            <HuntIconButton icon="mic-outline" label="Ghi âm lời giải thích" loading={state === 'starting'} disabled={disabled} onPress={() => void start()} />
          )}
        </HuntField>
      )}</HuntComposerRow>
      {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    </View>
  );
}

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Ô soạn lời giải thích kiểu ô nhập tin nhắn: chữ bên trái, nút micro nằm trong ô. */
export function HuntField({ children }: { children: ReactNode }) {
  return <View style={styles.field}>{children}</View>;
}

/** Hàng soạn tin: ô nhập (hoặc thanh ghi âm) giãn hết chiều ngang, nút gửi ở bên phải. */
export function HuntComposerRow({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.grow}>{children}</View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.sm },
  grow: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  field: {
    flexDirection: 'row', alignItems: 'flex-end', minHeight: 56, paddingLeft: space.md, paddingRight: space.xs, paddingVertical: space.xs,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg,
  },
  recording: { alignItems: 'center', gap: space.sm, borderColor: colors.danger },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  timer: { fontVariant: ['tabular-nums'] },
  limit: { ...type.body, color: colors.muted },
  clip: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingLeft: space.sm },
  convert: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 40, paddingHorizontal: space.md,
    borderRadius: radius.pill, backgroundColor: colors.brand,
  },
  convertPressed: { backgroundColor: colors.brandPressed },
  convertOff: { opacity: 0.45 },
  convertLabel: { ...type.bodyStrong, color: colors.white },
  error: { ...type.caption, color: colors.danger },
});
