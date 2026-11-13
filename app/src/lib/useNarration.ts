import { useIsFocused } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssetStatus } from './api';

let speechOwner: symbol | undefined;

export type NarrationMode = 'remote' | 'device' | 'loading';

/**
 * Một nguồn lời kể duy nhất cho mỗi màn hình:
 * - remote: file audio do server tạo (Gemini TTS).
 * - device: TTS lỗi/hết quota → đọc bằng giọng tiếng Việt của điện thoại (expo-speech), từng đoạn phụ đề.
 * - loading: audio đang được tạo.
 * Luôn ngắt tiếng cũ khi đổi `key` (đổi cảnh) – không bao giờ chồng tiếng.
 */
export function useNarration({ url, chunks, key, autoplay, muted }: {
  url?: string;
  status?: AssetStatus;
  chunks: string[];
  key: string | number;
  autoplay: boolean;
  muted: boolean;
}) {
  const focused = useIsFocused();
  const [owner] = useState(() => Symbol());
  // Giữ nguồn âm thanh suốt cảnh, không đọc lại khi TTS từ server về muộn.
  const [source, setSource] = useState({ key, url });
  if (source.key !== key) setSource({ key, url });
  const selectedUrl = source.key === key ? source.url : url;
  const mode: NarrationMode = selectedUrl ? 'remote' : chunks.length ? 'device' : 'loading';
  const player = useAudioPlayer(null);
  const st = useAudioPlayerStatus(player);

  // Ý định nghe của người dùng: chỉ phát khi đã chủ động bấm.
  const [intent, setIntent] = useState(autoplay);
  const intentRef = useRef(autoplay);
  const loaded = useRef<string | null>(null);
  const currentKey = useRef(key);
  const consent = useRef(autoplay);
  const focusedRef = useRef(focused);
  const token = useRef(0);
  const mutedRef = useRef(muted);

  // Trạng thái giọng thiết bị gắn với key để tự "reset" khi đổi cảnh (không cần setState trong effect).
  const [dev, setDev] = useState<{ key: string | number; idx: number; playing: boolean; done: boolean }>({ key, idx: 0, playing: false, done: false });
  const devState = dev.key === key ? dev : { key, idx: 0, playing: false, done: false };

  const stopDevice = () => {
    token.current++;
    if (speechOwner === owner) { speechOwner = undefined; Speech.stop().catch(() => {}); }
  };

  const speakFrom = (i: number) => {
    const tok = ++token.current;
    speechOwner = owner;
    const say = (j: number) => {
      if (!focusedRef.current || tok !== token.current || speechOwner !== owner) return;
      setDev({ key, idx: j, playing: true, done: false });
      Speech.speak(chunks[j], {
        language: 'vi-VN',
        rate: 0.95,
        volume: mutedRef.current ? 0 : 1,
        onDone: () => {
          if (tok !== token.current) return;
          if (j + 1 < chunks.length) say(j + 1);
          else setDev({ key, idx: j, playing: false, done: true });
        },
        onStopped: () => { if (tok === token.current) setDev((d) => ({ ...d, playing: false })); },
        onError: () => { if (tok === token.current) setDev((d) => ({ ...d, playing: false })); },
      });
    };
    Speech.stop().catch(() => {}).finally(() => { if (tok === token.current) say(i); });
  };

  // Đổi cảnh hoặc audio vừa sẵn sàng.
  useEffect(() => {
    focusedRef.current = focused;
    stopDevice();
    if (!focused) { try { player.pause(); } catch {} return; }
    if (currentKey.current !== key) { currentKey.current = key; intentRef.current = consent.current; }
    if (mode !== 'remote' || !selectedUrl) {
      try { player.pause(); } catch {}
      loaded.current = null;
      if (mode === 'device' && intentRef.current && chunks.length) speakFrom(0);
      return;
    }
    if (loaded.current === selectedUrl) return;
    try { player.pause(); } catch {}
    player.replace({ uri: selectedUrl });
    loaded.current = selectedUrl;
    if (intentRef.current) {
      const generation = ++token.current;
      speechOwner = undefined;
      void Speech.stop().catch(() => {}).then(() => {
        if (focusedRef.current && generation === token.current && intentRef.current) player.play();
      });
    }
  }, [mode, selectedUrl, key, focused]); // eslint-disable-line react-hooks/exhaustive-deps

  /* eslint-disable react-hooks/immutability -- AudioPlayer là native object; gán `muted` là API chính thức của expo-audio */
  useEffect(() => {
    mutedRef.current = muted;
    player.muted = muted;
  }, [muted, player]);
  /* eslint-enable react-hooks/immutability */

  // Rời màn hình / unmount → im lặng.
  useEffect(() => () => { token.current++; if (speechOwner === owner) { speechOwner = undefined; Speech.stop().catch(() => {}); } }, [owner]);

  const playing = mode === 'remote' ? st.playing : mode === 'device' ? devState.playing : false;

  const play = () => {
    if (!focused) return;
    consent.current = true;
    intentRef.current = true;
    setIntent(true);
    if (mode === 'remote') {
      if (st.didJustFinish || (st.duration > 0 && st.currentTime >= st.duration - 0.25)) player.seekTo(0);
      player.play();
    } else if (mode === 'device') {
      speakFrom(devState.done ? 0 : devState.idx);
    }
  };

  const pause = () => {
    intentRef.current = false;
    setIntent(false);
    try { player.pause(); } catch {}
    stopDevice();
    setDev((d) => ({ ...d, playing: false }));
  };

  /** Tạm dừng do rời màn hình: giữ nguyên ý định nghe. Ổn định (chỉ phụ thuộc player) để dùng trong useFocusEffect. */
  const silence = useCallback(() => {
    focusedRef.current = false;
    try { player.pause(); } catch {}
    token.current++;
    if (speechOwner === owner) { speechOwner = undefined; Speech.stop().catch(() => {}); }
  }, [player, owner]);

  // Tiến độ & đoạn phụ đề hiện tại.
  const { frac, chunkIdx } = (() => {
    const n = Math.max(1, chunks.length);
    if (mode === 'device') return { frac: devState.done ? 1 : devState.idx / n, chunkIdx: devState.idx };
    if (mode !== 'remote' || !(st.duration > 0)) return { frac: 0, chunkIdx: 0 };
    const f = Math.min(1, st.currentTime / st.duration);
    const lens = chunks.map((c) => c.length);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    for (let i = 0; i < lens.length; i++) {
      acc += lens[i];
      if (f < acc / total) return { frac: f, chunkIdx: i };
    }
    return { frac: f, chunkIdx: lens.length - 1 };
  })();

  const didFinish = mode === 'remote' ? st.didJustFinish : mode === 'device' && devState.done;

  /** Vị trí đang đọc (giây) – để video cùng cảnh chạy khớp lời kể. Giọng thiết bị không có vị trí chính xác. */
  const position = mode === 'remote' ? st.currentTime : 0;

  return {
    mode, playing, intent, frac, chunkIdx, didFinish, position,
    canPlay: mode !== 'loading' && chunks.length > 0,
    toggle: () => (playing ? pause() : play()),
    play, pause, silence,
  };
}
