// Hàm thuần cho giọng Lumo (không import gì để test được bằng node:test).

/** Nhịp cập nhật `level` (ms). */
export const LEVEL_TICK_MS = 80;

/**
 * Băm chuỗi tất định, không cần crypto: ghép FNV-1a 32-bit và djb2 → 16 ký tự hex.
 * Đủ để đặt tên tệp cache cho vài trăm câu thoại mà không lo trùng.
 */
export function textHash(text: string): string {
  let a = 0x811c9dc5;
  let b = 5381;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = (Math.imul(b, 33) + c) | 0;
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

/** Đuôi tệp theo mime server trả về: wav nếu là WAV, còn lại mp3. */
export function audioExt(mime: string): 'mp3' | 'wav' {
  return /wav/i.test(mime) ? 'wav' : 'mp3';
}

/** Tên tệp cache `lumo-<hash>.<mp3|wav>` cho một câu thoại. */
export function lumoFileName(text: string, mime: string): string {
  return `lumo-${textHash(text)}.${audioExt(mime)}`;
}

/** Thời gian chờ tối đa cho một câu: max(8 s, 120 ms × số ký tự), phòng khi không có sự kiện kết thúc. */
export function safetyTimeoutMs(text: string): number {
  return Math.max(8000, 120 * text.length);
}

/** Mức giả lập khi đọc bằng giọng máy (không có mẫu sóng âm): 0.35 + 0.35 × |sin(t × 9)|, t tính bằng giây. */
export function simulatedLevel(tSec: number): number {
  return 0.35 + 0.35 * Math.abs(Math.sin(tSec * 9));
}
