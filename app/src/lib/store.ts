import { create } from 'zustand';
import { api, assetsSettled, type Recognition, type Story } from './api';

interface Photo { uri: string; base64: string }

interface JourneyState {
  photo: Photo | null;
  recognition: Recognition | null;
  recognizeError: string | null;
  label: string;
  story: Story | null;
  storyError: string | null;
  mysteryChoice: number | null;
  sceneIndex: number;
  maxViewed: number;
  quizAnswers: (number | null)[];

  reset: () => void;
  setPhoto: (p: Photo) => void;
  runRecognition: () => Promise<void>;
  startStory: (label: string) => Promise<void>;
  openStory: (id: string) => Promise<void>;
  retryAssets: () => Promise<void>;
  setMystery: (i: number) => void;
  setScene: (i: number) => void;
  answer: (q: number, choice: number) => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let recogToken = 0;

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

const initial = {
  photo: null,
  recognition: null,
  recognizeError: null,
  label: '',
  story: null,
  storyError: null,
  mysteryChoice: null,
  sceneIndex: 0,
  maxViewed: 0,
  quizAnswers: [null, null, null] as (number | null)[],
};

export const useJourney = create<JourneyState>((set, get) => {
  /** Hỏi trạng thái story mỗi 1.5s cho đến khi mọi ảnh/voice xong. */
  function poll(id: string) {
    stopPolling();
    pollTimer = setInterval(async () => {
      try {
        const s = await api.getStory(id);
        if (get().story?.id !== id) return stopPolling();
        set({ story: s });
        if (assetsSettled(s)) stopPolling();
      } catch {
        /* mạng chập chờn: giữ trạng thái cũ, thử lại lần sau */
      }
    }, 1500);
  }

  return {
    ...initial,

    reset: () => {
      stopPolling();
      recogToken++;
      set({ ...initial, quizAnswers: [null, null, null] });
    },

    setPhoto: (photo) => {
      stopPolling();
      set({ ...initial, quizAnswers: [null, null, null], photo });
    },

    runRecognition: async () => {
      const { photo } = get();
      if (!photo) return;
      const token = ++recogToken;
      set({ recognition: null, recognizeError: null });
      try {
        const r = await api.recognize(photo.base64);
        if (token !== recogToken) return;
        set({ recognition: r, label: r.label });
        // Bắt đầu lập câu chuyện ngay, không chờ người dùng xác nhận (tiết kiệm ~10s).
        if (r.safe && r.confidence >= 0.4) void get().startStory(r.label);
      } catch (e: any) {
        if (token === recogToken) set({ recognizeError: e.message });
      }
    },

    startStory: async (label) => {
      const clean = label.trim().toLowerCase();
      if (!clean) return;
      const cur = get().story;
      if (cur && cur.label === clean && cur.status !== 'error') return;
      stopPolling();
      set({ label: clean, story: null, storyError: null, mysteryChoice: null, sceneIndex: 0, maxViewed: 0, quizAnswers: [null, null, null] });
      try {
        const s = await api.createStory(clean);
        if (get().label !== clean) return;
        set({ story: s });
        if (!assetsSettled(s)) poll(s.id);
      } catch (e: any) {
        set({ storyError: e.message });
      }
    },

    openStory: async (id) => {
      stopPolling();
      set({ ...initial, quizAnswers: [null, null, null] });
      const s = await api.getStory(id);
      set({ story: s, label: s.label });
      if (!assetsSettled(s)) poll(s.id);
    },

    retryAssets: async () => {
      const s = get().story;
      if (!s) return;
      try {
        const next = await api.retry(s.id);
        set({ story: next });
        poll(s.id);
      } catch { /* giữ nguyên */ }
    },

    setMystery: (i) => set({ mysteryChoice: i }),
    setScene: (i) => set((st) => ({ sceneIndex: i, maxViewed: Math.max(st.maxViewed, i) })),
    answer: (q, choice) => set((st) => {
      const a = [...st.quizAnswers];
      a[q] = choice;
      return { quizAnswers: a };
    }),
  };
});
