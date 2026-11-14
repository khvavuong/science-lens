import Constants from 'expo-constants';

/**
 * Địa chỉ backend. Mặc định lấy IP máy đang chạy `expo start` (cùng mạng LAN) + cổng 8787.
 * Ghi đè bằng EXPO_PUBLIC_API_URL trong app/.env nếu cần.
 */
function resolveBaseUrl() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:8787`;
}

export const API_URL = resolveBaseUrl();
export const mediaUrl = (path?: string) => (path ? `${API_URL}${path}` : undefined);

export interface Recognition {
  label: string;
  label_en: string;
  confidence: number;
  alternatives: string[];
  has_person: boolean;
  safe: boolean;
}

export interface Choice { question: string; options: string[]; answer_index: number }
export interface QuizItem extends Choice { explanation: string; scene_ref: number }
export interface Scene {
  id: number;
  title: string;
  timeline_label: string;
  narration: string;
  subtitle_chunks: string[];
  key_fact: string;
  confidence: 'high' | 'medium' | 'low';
  is_legend: boolean;
}
export interface Plan {
  safe: boolean;
  title: string;
  teaser: string;
  prelude_narration: string;
  mystery_question: Choice;
  timeline_mode: 'historical' | 'process';
  concept?: { name: string; definition: string };
  scenes: Scene[];
  quiz: QuizItem[];
}
export type AssetStatus = 'pending' | 'ready' | 'error';
export interface Asset { status: AssetStatus; url?: string; durationMs?: number; error?: string }
export interface Story {
  id: string;
  label: string;
  status: 'planning' | 'ready' | 'unsafe' | 'error';
  error?: string;
  plan?: Plan;
  /** `video` chỉ có ở cảnh AI chọn làm video; ảnh luôn là fallback. */
  assets: { prelude_audio: Asset; scenes: { image: Asset; audio: Asset; video?: Asset }[] };
}

class ApiError extends Error {}

async function req<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 30000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { ...(init?.body instanceof FormData ? {} : { 'content-type': 'application/json' }), ...(process.env.EXPO_PUBLIC_API_TOKEN ? { authorization: `Bearer ${process.env.EXPO_PUBLIC_API_TOKEN}` } : {}), ...(init?.headers ?? {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 413 && typeof body?.message !== 'string') throw new ApiError('Tệp quá lớn. Em chọn tệp nhỏ hơn nhé.');
      throw new ApiError(body?.message ?? body?.error ?? `Lỗi máy chủ (${res.status})`);
    }
    return body as T;
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    // expo/fetch (native) báo hết giờ bằng FetchError, không phải AbortError: dựa vào signal.
    if (ctrl.signal.aborted) throw new ApiError('Kết nối quá lâu. Vui lòng thử lại.');
    // Lỗi mạng: TypeError (web, fetch của RN) hoặc FetchError "fetch failed: …" (expo/fetch).
    if (e instanceof TypeError || String(e?.message).startsWith('fetch failed')) {
      throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng nhé.');
    }
    // Lỗi trong app trước khi gửi (vd. dựng body hỏng): không đổ cho mạng.
    console.warn(`[api] ${path}`, e);
    throw new ApiError('Ứng dụng chưa gửi được yêu cầu. Em thử lại nhé.');
  } finally {
    clearTimeout(timer);
  }
}

export type HuntVerdict = 'accepted' | 'needs_detail' | 'change_object' | 'retake_photo';
export type HuntResult = { itemId: string; revision: number; verdict: HuntVerdict; feedback: string; objectLabel?: string };

export const huntApi = {
  evaluate: (body: FormData) => req<HuntResult>('/api/hunt/evaluate', { method: 'POST', body, timeoutMs: 45_000 }),
  transcribe: (body: FormData) => req<{ transcript: string }>('/api/hunt/transcribe', { method: 'POST', body, timeoutMs: 50_000 }),
};

export const api = {
  recognize: (imageBase64: string) =>
    req<Recognition>('/api/recognize', { method: 'POST', body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }), timeoutMs: 45000 }),
  createStory: (label: string) => req<Story>('/api/stories', { method: 'POST', body: JSON.stringify({ label }) }),
  getStory: (id: string) => req<Story>(`/api/stories/${id}`, { timeoutMs: 10000 }),
  retry: (id: string) => req<Story>(`/api/stories/${id}/retry`, { method: 'POST', body: '{}' }),
};

/** Bỏ lời khen ở đầu giải thích quiz (truyện cũ trong cache): app đã hiện "Chính xác!"/"Chưa đúng" riêng. */
export function stripPraise(text: string): string {
  const out = text.replace(/^\s*(chính xác|đúng rồi|đúng vậy|giỏi lắm|tuyệt vời|rất tốt|tiếc quá|chưa đúng|sai rồi)\s*[!.,:]+\s*/iu, '');
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : text;
}

export function assetsSettled(s?: Story | null) {
  if (!s) return false;
  if (s.status === 'error' || s.status === 'unsafe') return true;
  if (s.status !== 'ready') return false;
  const all = [s.assets.prelude_audio, ...s.assets.scenes.flatMap((x) => [x.image, x.audio, ...(x.video ? [x.video] : [])])];
  return all.every((a) => a.status !== 'pending');
}
