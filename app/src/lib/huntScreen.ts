// Logic thuần của màn Thử thách trực tiếp (điều phối pha). Không import module native để test được trong Node.
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { HuntVerdict } from '@/lib/api';
import type { LockDecision } from '@/lib/huntLive';

export type LivePhase = 'ready' | 'scanning' | 'asking' | 'listening' | 'transcribing' | 'review' | 'evaluating' | 'feedback';

/** Chép lời xong thì tự gửi sau chừng này, trừ khi em chạm ô để sửa. */
export const REVIEW_COUNTDOWN_MS = 2000;

export const verdictLabels: Record<HuntVerdict, string> = {
  accepted: 'Đạt',
  needs_detail: 'Kể thêm một chút',
  retake_photo: 'Cần ảnh rõ hơn',
  change_object: 'Thử một vật khác',
};

export const verdictIcons: Record<HuntVerdict, keyof typeof Ionicons.glyphMap> = {
  accepted: 'checkmark-circle',
  needs_detail: 'chatbubble-ellipses-outline',
  retake_photo: 'camera-outline',
  change_object: 'swap-horizontal',
};

export type ScanChip = 'aim' | 'person' | 'unsafe' | 'paused';

export const scanChipText: Record<ScanChip, string> = {
  aim: 'Đưa đồ vật vào khung',
  person: 'Đặt vật xuống, chỉ để vật trong khung nhé',
  unsafe: 'Thử một vật khác nhé',
  paused: 'Chạm để quét tiếp',
};

/** Ảnh chọn từ thư viện không khóa được → chip tương ứng ('unsure' dùng câu nhắc ngắm). */
export function chipForDecision(decision: Exclude<LockDecision, 'lock'>): ScanChip {
  return decision === 'person' ? 'person' : decision === 'unsafe' ? 'unsafe' : 'aim';
}

export const introLine = (task: string) => `Mình cùng tìm nhé! ${task}`;
export const NO_SPEECH_CAPTION = 'Lumo chưa nghe thấy em. Chạm micro để nói nhé.';
export const NOT_CLEAR_LINE = 'Lumo chưa nghe rõ. Em nói lại nhé.';

/** Server trả 422 (không có lời nói) với câu bắt đầu bằng "Chưa nghe rõ"; api.ts không lộ mã HTTP. */
export function isNoSpeechError(message: string): boolean {
  return message.trim().startsWith('Chưa nghe rõ');
}

/** Ghép bản chép lời vào ô: nối thêm khi đang bổ sung ý hoặc em đã tự gõ, không thì thay. */
export function mergeTranscript(previous: string, transcript: string, append: boolean): string {
  const next = transcript.trim();
  const before = previous.trim();
  if (!append || !before) return next;
  if (!next) return before;
  return `${before} ${next}`;
}

/** Pha kế tiếp sau khi Lumo đọc xong nhận xét. */
export function afterFeedback(verdict: HuntVerdict, complete: boolean): 'scanning' | 'listening' | 'complete' {
  if (verdict === 'accepted') return complete ? 'complete' : 'scanning';
  if (verdict === 'needs_detail') return 'listening';
  return 'scanning';
}

type Judged = { verdict: HuntVerdict; feedback: string };

export type EvaluationOutcome =
  | { kind: 'verdict'; verdict: HuntVerdict; feedback: string }
  | { kind: 'error'; message: string }
  | { kind: 'none' };

/**
 * Đọc kết quả chấm từ store sau `submitHunt`: số vật đạt tăng → đạt (nhận xét ở vật cuối);
 * có lỗi → lỗi; kết quả của đúng bản vừa gửi → verdict đó; còn lại (chưa gửi, lỗi lưu) → none.
 */
export function evaluationOutcome(input: {
  acceptedBefore: number;
  revision: number;
  accepted: { result: Judged }[];
  draftResult?: Judged & { revision: number };
  error?: string;
}): EvaluationOutcome {
  if (input.accepted.length > input.acceptedBefore) {
    const last = input.accepted[input.accepted.length - 1].result;
    return { kind: 'verdict', verdict: 'accepted', feedback: last.feedback };
  }
  if (input.error) return { kind: 'error', message: input.error };
  const result = input.draftResult;
  if (result && result.revision === input.revision) return { kind: 'verdict', verdict: result.verdict, feedback: result.feedback };
  return { kind: 'none' };
}

export type LiveTone = 'lumo' | 'me' | 'idle' | 'paused';

/** Thanh sóng: ai đang nói. null = ẩn (trước khi bắt đầu, hoặc micro bị từ chối mà không còn gì để báo). */
export function liveBarState(s: {
  phase: LivePhase;
  speaking: boolean;
  listening: boolean;
  paused: boolean;
  micDenied: boolean;
}): { tone: LiveTone; label: string } | null {
  if (s.speaking) return { tone: 'lumo', label: 'Lumo' };
  if (s.phase === 'ready') return null;
  // Pha nghe gồm cả lúc micro đang mở (chưa ghi) để thanh không nháy sang "Tạm dừng".
  if (s.listening || s.phase === 'listening') return { tone: 'me', label: 'Em' };
  if (s.phase === 'transcribing' || s.phase === 'evaluating') return { tone: 'idle', label: 'Đang nghĩ…' };
  if (s.phase === 'scanning') return { tone: 'idle', label: 'Đang tìm' };
  if (s.phase === 'asking' || s.phase === 'feedback') return { tone: 'lumo', label: 'Lumo' };
  // Micro bị từ chối: ẩn phần sóng của em, ô nhập dùng bình thường.
  if (s.micDenied) return null;
  return { tone: 'paused', label: 'Tạm dừng' };
}

export type MicAction = 'pause' | 'start' | 'send';

/** Nút tròn cạnh ô nhập: đang nghe → tạm dừng; có chữ → gửi; còn lại → bật micro. */
export function micAction(s: { listening: boolean; hasText: boolean }): MicAction {
  if (s.listening) return 'pause';
  return s.hasText ? 'send' : 'start';
}
