import { setAudioModeAsync, useAudioPlayer, useAudioSampleListener } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { huntApi } from './api';
import { rmsLevel } from './huntLive';
import { LEVEL_TICK_MS, lumoFileName, safetyTimeoutMs, simulatedLevel } from './lumoVoiceUtil';

/** Mẫu sóng âm cũ hơn ngưỡng này coi như đã im. */
const SAMPLE_FRESH_MS = 300;
/** Sau khi có tiếng mà chưa nhận mẫu nào (nền tảng không hỗ trợ lấy mẫu) → giả lập. */
const SIM_AFTER_MS = 500;
/** Gọi play() mà quá lâu chưa có tiếng → coi như player lỗi, đọc bằng giọng máy. */
const START_WATCHDOG_MS = 4000;

// Cache câu thoại → uri, sống suốt phiên app (dùng chung giữa các màn).
const uriCache = new Map<string, string>();

function within<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((r) => setTimeout(r, ms))]);
}

/** Lấy uri phát được cho câu thoại: cache bộ nhớ → tệp cache có sẵn → gọi server rồi ghi tệp. */
async function loadUri(text: string): Promise<string> {
  const hit = uriCache.get(text);
  if (hit) return hit;
  const web = Platform.OS === 'web';
  if (!web) {
    const existing = [lumoFileName(text, 'audio/mpeg'), lumoFileName(text, 'audio/wav')]
      .map((name) => new File(Paths.cache, name))
      .find((f) => f.exists);
    if (existing) {
      uriCache.set(text, existing.uri);
      return existing.uri;
    }
  }
  const { audio, mime } = await huntApi.speak(text);
  if (!audio) throw new Error('Server không trả audio');
  const type = mime || 'audio/mpeg';
  let uri: string;
  if (web) {
    uri = `data:${type};base64,${audio}`;
  } else {
    const file = new File(Paths.cache, lumoFileName(text, type));
    try {
      await file.write(audio, { encoding: 'base64' });
    } catch (e) {
      try { if (file.exists) file.delete(); } catch {}
      throw e;
    }
    uri = file.uri;
  }
  uriCache.set(text, uri);
  return uri;
}

/** Bỏ cache của câu thoại phát lỗi (tệp hỏng) để lần sau tải lại. */
function forget(text: string) {
  const uri = uriCache.get(text);
  uriCache.delete(text);
  if (!uri || Platform.OS === 'web') return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {}
}

type Line = {
  id: number;
  text: string;
  resolve: () => void;
  /** fetch: đang lấy audio; file: player đang phát; device: giọng máy (expo-speech). */
  phase: 'fetch' | 'file' | 'device';
  /** Thời điểm bắt đầu có tiếng (0 = chưa). */
  soundAt: number;
  timers: ReturnType<typeof setTimeout>[];
};

/**
 * Giọng Lumo: phát câu thoại ngắn bằng audio server (cache theo câu), lỗi thì đọc bằng giọng máy.
 * `level` (0..1) bám theo sóng âm thật khi phát tệp, giả lập khi đọc giọng máy, 0 khi im.
 * `speak` không bao giờ reject; resolve khi đọc xong, bị dừng, bị câu mới chen hoặc unmount.
 */
export function useLumoVoice() {
  const player = useAudioPlayer(null);
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const lineRef = useRef<Line | null>(null);
  const seq = useRef(0);
  const sample = useRef({ level: 0, at: 0 });
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);

  // Native chỉ gửi mẫu khi đang phát; Android cần quyền RECORD_AUDIO (màn hình xin trước).
  useAudioSampleListener(player, (s) => {
    const frames = s.channels[0]?.frames;
    if (frames && frames.length > 0) sample.current = { level: rmsLevel(frames), at: Date.now() };
  });

  /** Câu đang nói nếu vẫn là `id` (token hủy cho callback muộn). */
  const live = (id: number) => (lineRef.current?.id === id ? lineRef.current : null);

  const stopTick = () => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  };

  const startTick = () => {
    stopTick();
    let last = -1;
    tick.current = setInterval(() => {
      const line = lineRef.current;
      const now = Date.now();
      let next = 0;
      if (line && line.soundAt) {
        if (line.phase === 'device') {
          next = simulatedLevel((now - line.soundAt) / 1000);
        } else if (line.phase === 'file') {
          const s = sample.current;
          if (s.at > 0) next = now - s.at < SAMPLE_FRESH_MS ? s.level : 0;
          else if (now - line.soundAt > SIM_AFTER_MS) next = simulatedLevel((now - line.soundAt) / 1000);
        }
      }
      next = Math.round(next * 100) / 100;
      if (next !== last) {
        last = next;
        setLevel(next);
      }
    }, LEVEL_TICK_MS);
  };

  const arm = (line: Line, ms: number, fn: () => void) => {
    line.timers.push(setTimeout(fn, ms));
  };

  /** Kết thúc câu `id`: dọn hẹn giờ, về trạng thái im, resolve promise. `halt` = cắt tiếng đang phát. */
  const endLine = (id: number, halt = false) => {
    const line = live(id);
    if (!line) return;
    lineRef.current = null;
    line.timers.forEach(clearTimeout);
    stopTick();
    if (halt) {
      try { player.pause(); } catch {}
      if (line.phase === 'device') Speech.stop().catch(() => {});
    }
    if (alive.current) {
      setSpeaking(false);
      setLevel(0);
    }
    line.resolve();
  };

  const deviceSpeak = (id: number, text: string) => {
    const line = live(id);
    if (!line) return;
    try { player.pause(); } catch {}
    line.timers.forEach(clearTimeout);
    line.timers = [];
    line.phase = 'device';
    line.soundAt = Date.now();
    arm(line, safetyTimeoutMs(text), () => endLine(id, true));
    const done = () => endLine(id);
    try {
      Speech.speak(text, { language: 'vi-VN', rate: 0.95, onDone: done, onStopped: done, onError: done });
    } catch {
      done();
    }
  };

  const run = async (id: number, text: string) => {
    try {
      const uri = await loadUri(text);
      if (!live(id)) return;
      // Màn hình đã tắt micro; chỉ chuyển phiên audio sang chế độ phát.
      // Lỗi đặt audio mode không chặn việc thử phát (watchdog lo phần còn lại).
      await within(setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {}), 1500);
      const line = live(id);
      if (!line) return;
      // Bật lại lấy mẫu: lần bật lúc mount có thể bị bỏ qua vì khi đó chưa có quyền micro (Android).
      if (player.isAudioSamplingSupported) {
        try { player.setAudioSamplingEnabled(true); } catch {}
      }
      line.phase = 'file';
      player.replace({ uri });
      player.play();
      arm(line, START_WATCHDOG_MS, () => {
        if (live(id) && !line.soundAt) {
          forget(text);
          deviceSpeak(id, text);
        }
      });
    } catch {
      // Mạng, 503, ghi tệp, player… → giọng máy.
      deviceSpeak(id, text);
    }
  };

  // Theo dõi player: có tiếng → hẹn giờ an toàn; xong → resolve; lỗi trước khi có tiếng → giọng máy.
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (st) => {
      const line = lineRef.current;
      if (!line || line.phase !== 'file') return;
      if (st.error && !line.soundAt) {
        forget(line.text);
        deviceSpeak(line.id, line.text);
        return;
      }
      if (!line.soundAt && (st.playing || st.currentTime > 0)) {
        line.soundAt = Date.now();
        const id = line.id;
        arm(line, safetyTimeoutMs(line.text), () => endLine(id, true));
      }
      if (st.didJustFinish || st.error) endLine(line.id);
    });
    return () => sub.remove();
  }, [player]); // eslint-disable-line react-hooks/exhaustive-deps -- các hàm trên chỉ dùng ref/setter ổn định

  // Unmount: cắt tiếng, resolve câu đang chờ, không đổi state nữa.
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      const line = lineRef.current;
      if (line) endLine(line.id, true);
      stopTick();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ chạy khi mount/unmount

  /** Dừng câu đang nói (nếu có) và resolve promise của nó. */
  const stop = () => {
    const line = lineRef.current;
    if (line) endLine(line.id, true);
  };

  /** Nói một câu. Dừng câu trước, không bao giờ reject. */
  const speak = (raw: string): Promise<void> => {
    stop();
    const text = raw.trim();
    if (!text) return Promise.resolve();
    const id = ++seq.current;
    return new Promise<void>((resolve) => {
      lineRef.current = { id, text, resolve, phase: 'fetch', soundAt: 0, timers: [] };
      sample.current = { level: 0, at: 0 };
      setSpeaking(true);
      setLevel(0);
      startTick();
      void run(id, text);
    });
  };

  return { speak, stop, speaking, level };
}
