import { useIsFocused } from 'expo-router';
import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssetStatus } from './api';

let speechOwner: symbol | undefined;
let speechQueue = Promise.resolve();
let vietnameseVoice: Promise<string | undefined> | undefined;
const enqueue = (action: () => Promise<void>) => {
  speechQueue = speechQueue.catch(() => {}).then(action);
  return speechQueue;
};
export type NarrationMode = 'remote' | 'device' | 'loading';

// Một giọng Việt cố định trên thiết bị cho toàn hành trình, không đổi sang Gemini khi asset về muộn.
export function useNarration({ chunks, key, autoplay, muted }: {
  url?: string; status?: AssetStatus; chunks: string[]; key: string | number; autoplay: boolean; muted: boolean;
}) {
  const focused = useIsFocused();
  const [owner] = useState(() => Symbol());
  const generation = useRef(0);
  const [state, setState] = useState({ key, idx: 0, playing: false, done: false });
  const current = state.key === key ? state : { key, idx: 0, playing: false, done: false };
  const [intent, setIntent] = useState(autoplay);
  const text = chunks.join('\u0001');

  const silence = useCallback(() => {
    generation.current++;
    if (speechOwner === owner) {
      speechOwner = undefined;
      void enqueue(() => Speech.stop());
    }
  }, [owner]);

  const speak = useCallback((start: number) => {
    silence();
    const id = ++generation.current;
    const parts = text.split('\u0001').filter(Boolean);
    if (!parts.length) return;
    vietnameseVoice ??= Speech.getAvailableVoicesAsync().then(voices =>
      voices.filter(v => v.language.toLowerCase().startsWith('vi')).sort((a, b) => a.identifier.localeCompare(b.identifier))[0]?.identifier,
    ).catch(() => undefined);
    void enqueue(async () => {
      const voice = await vietnameseVoice;
      if (id !== generation.current) return;
      await Speech.stop();
      await setAudioModeAsync({ playsInSilentMode: true });
      if (id !== generation.current) return;
      speechOwner = owner;
      const say = (idx: number) => {
        if (id !== generation.current || speechOwner !== owner) return;
        setState({ key, idx, playing: true, done: false });
        Speech.speak(parts[idx], {
          language: 'vi-VN', voice, rate: 0.95, useApplicationAudioSession: true,
          onDone: () => {
            if (id !== generation.current || speechOwner !== owner) return;
            if (idx + 1 < parts.length) say(idx + 1);
            else setState({ key, idx, playing: false, done: true });
          },
          onError: () => { if (id === generation.current) setState({ key, idx, playing: false, done: false }); },
        });
      };
      say(start);
    }).catch(() => { if (id === generation.current) setState({ key, idx: start, playing: false, done: false }); });
  }, [key, text, owner, silence]);

  useEffect(() => {
    // Vuốt sang cảnh mới luôn phát; pause chỉ áp dụng cho cảnh đang xem.
    if (focused && autoplay && !muted && text) speak(0);
    return silence;
  }, [focused, autoplay, muted, text, speak, silence]);

  const playing = focused && !muted && current.playing;
  const play = () => { if (focused && !muted) { setIntent(true); speak(current.done ? 0 : current.idx); } };
  const pause = () => { silence(); setIntent(false); setState(s => ({ ...s, playing: false })); };
  return {
    mode: (text ? 'device' : 'loading') as NarrationMode,
    playing, intent, frac: current.done ? 1 : current.idx / Math.max(1, chunks.length), chunkIdx: current.idx,
    didFinish: current.done, position: 0, canPlay: !!text,
    toggle: () => playing ? pause() : play(), play, pause, silence,
  };
}
