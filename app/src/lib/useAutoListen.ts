import {
  RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState,
  type AudioRecorder, type RecordingOptions,
} from 'expo-audio';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { createVoiceDetector, levelFromDb } from '@/lib/huntLive';
import { HUNT_RECORD_SECONDS } from '@/lib/huntTypes';
import { discardHuntAudio } from '@/lib/huntUpload';

// Giống HuntAudio.tsx, thêm đo mức âm để phát hiện tiếng nói.
const options: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64_000,
  isMeteringEnabled: true,
  web: { mimeType: 'audio/webm', bitsPerSecond: 64_000 },
};

const DENIED_MESSAGE = 'Em có thể nhập lời giải thích hoặc bật quyền micro trong cài đặt.';
const FAILED_MESSAGE = 'Chưa ghi được âm thanh. Em có thể nhập lời giải thích.';

type Phase = 'idle' | 'starting' | 'recording' | 'stopping';
/** audio: giao tệp; no-speech: xóa tệp rồi báo; discard: xóa tệp, không báo; error: xóa tệp rồi báo lỗi. */
type Outcome = 'audio' | 'no-speech' | 'discard' | 'error';

export interface AutoListenHandlers {
  onAudio(uri: string): void;
  onNoSpeech(): void;
  onError(message: string): void;
}

function recorderUri(recorder: AudioRecorder): string | null {
  try { return recorder.uri; } catch { return null; }
}

function releaseAudioMode() {
  if (Platform.OS !== 'web') void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
}

/**
 * Tự nghe sau khi Lumo hỏi: `start()` bật micro, tự dừng khi trẻ im lặng (`onAudio`),
 * khi không nói gì (`onNoSpeech`) hoặc khi chạm giới hạn HUNT_RECORD_SECONDS (`onAudio`).
 * Mỗi lần ghi gọi tối đa một handler; không gọi gì sau `stop()`, `pause()` hay unmount.
 */
export function useAutoListen(handlers: AutoListenHandlers) {
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const [denied, setDenied] = useState(false);
  const handlersRef = useRef(handlers);
  const phase = useRef<Phase>('idle');
  // Tăng mỗi lần bắt đầu/kết thúc để công việc async cũ biết mình đã hết hạn.
  const session = useRef(0);
  const detector = useRef<ReturnType<typeof createVoiceDetector> | null>(null);
  const pending = useRef<Promise<void> | null>(null);
  const mounted = useRef(false);

  const recorder = useAudioRecorder(options, (status) => {
    // Listener gắn một lần theo recorder.id: chỉ đọc ref.
    if (phase.current !== 'recording') return;
    if (status.hasError) void end('error');
    else if (status.isFinished) void end('audio', status.url); // tự dừng ở forDuration: coi như 'max'
  });
  const recState = useAudioRecorderState(recorder, 100);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      session.current += 1;
      detector.current = null;
      const wasRecording = phase.current === 'recording';
      // 'stopping' tự xóa tệp khi thấy mounted = false.
      if (phase.current !== 'stopping') phase.current = 'idle';
      if (wasRecording) {
        const before = recorderUri(recorder);
        void recorder.stop().catch(() => {}).then(() => {
          const uri = recorderUri(recorder) ?? before;
          if (uri) discardHuntAudio(uri);
        });
      }
      releaseAudioMode();
    };
  }, [recorder]);

  // Mỗi lần state recorder đổi (~100 ms) đẩy một mẫu vào bộ phát hiện.
  const feed = useEffectEvent((db: number | undefined, atMs: number, isRecording: boolean) => {
    const d = detector.current;
    // Thiếu metering thì không đoán được: để recorder tự dừng ở giới hạn (listener coi là 'max').
    if (!d || phase.current !== 'recording' || !isRecording || db === undefined) return;
    const event = d.push(db, atMs);
    if (event === 'end' || event === 'max') void end('audio');
    else if (event === 'no-speech') void end('no-speech');
  });
  useEffect(() => {
    feed(recState.metering, recState.durationMillis, recState.isRecording);
  }, [recState]);

  /** Kết thúc lần ghi hiện tại đúng một lần; gọi lại khi đang dừng trả về cùng promise. */
  function end(outcome: Outcome, knownUrl?: string | null): Promise<void> {
    if (phase.current === 'idle') return Promise.resolve();
    if (phase.current === 'stopping') return pending.current ?? Promise.resolve();
    const wasRecording = phase.current === 'recording';
    phase.current = 'stopping';
    session.current += 1;
    detector.current = null;
    const job = finish(outcome, wasRecording, knownUrl ?? null).finally(() => {
      if (pending.current === job) pending.current = null;
    });
    pending.current = job;
    return job;
  }

  async function finish(outcome: Outcome, wasRecording: boolean, knownUrl: string | null) {
    let uri = knownUrl;
    if (wasRecording) {
      const before = recorderUri(recorder);
      try { if (recorder.isRecording) await recorder.stop(); } catch { /* đã dừng hoặc đã giải phóng */ }
      uri = uri ?? recorderUri(recorder) ?? before;
    }
    if (Platform.OS !== 'web') await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    phase.current = 'idle';
    if (!mounted.current) {
      if (uri) discardHuntAudio(uri);
      return;
    }
    setListening(false);
    const h = handlersRef.current;
    if (outcome === 'audio' && uri) {
      h.onAudio(uri);
      return;
    }
    if (uri) discardHuntAudio(uri);
    if (outcome === 'no-speech') h.onNoSpeech();
    else if (outcome === 'error' || outcome === 'audio') h.onError(FAILED_MESSAGE); // 'audio' mà không có tệp
  }

  async function start() {
    if (pending.current) await pending.current;
    if (phase.current !== 'idle' || !mounted.current) return;
    phase.current = 'starting';
    const id = ++session.current;
    const stale = () => !mounted.current || session.current !== id;
    // Phiên đã bị hủy: trả lại chế độ âm thanh nếu không có phiên mới nào đang chạy.
    const abandon = () => { if (phase.current === 'idle') releaseAudioMode(); };
    setPaused(false);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (stale()) return abandon();
      setDenied(!permission.granted);
      if (!permission.granted) {
        phase.current = 'idle';
        handlersRef.current.onError(DENIED_MESSAGE);
        return;
      }
      if (Platform.OS !== 'web') await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (stale()) return abandon();
      await recorder.prepareToRecordAsync();
      if (stale()) return abandon();
      detector.current = createVoiceDetector({ maxMs: HUNT_RECORD_SECONDS * 1000 });
      phase.current = 'recording';
      recorder.record({ forDuration: HUNT_RECORD_SECONDS });
      setListening(true);
    } catch {
      if (stale()) return abandon();
      detector.current = null;
      phase.current = 'idle';
      releaseAudioMode();
      setListening(false);
      handlersRef.current.onError(FAILED_MESSAGE);
    }
  }

  function stop() {
    setPaused(false);
    setListening(false);
    void end('discard');
  }

  function pause() {
    setPaused(true);
    setListening(false);
    void end('discard');
  }

  const level = listening && recState.isRecording ? levelFromDb(recState.metering) : 0;

  return { start, stop, pause, listening, paused, level, denied };
}
