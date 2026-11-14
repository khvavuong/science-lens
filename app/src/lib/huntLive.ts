// Logic thuần cho chế độ Thử thách trực tiếp. Không import module native để chạy được trong Node.

export type VadEvent = 'none' | 'speech' | 'end' | 'no-speech' | 'max';

export interface VoiceDetectorOptions {
  calibrateMs?: number;
  holdMs?: number;
  silenceMs?: number;
  noSpeechMs?: number;
  maxMs?: number;
}

/** Phát hiện giọng nói từ mức dB đo theo thời gian; `atMs` tính từ lúc bắt đầu ghi. */
export function createVoiceDetector(opts: VoiceDetectorOptions = {}) {
  const calibrateMs = opts.calibrateMs ?? 300;
  const holdMs = opts.holdMs ?? 200;
  const silenceMs = opts.silenceMs ?? 1200;
  const noSpeechMs = opts.noSpeechMs ?? 8000;
  const maxMs = opts.maxMs ?? 30000;

  let sum = 0;
  let count = 0;
  let threshold: number | undefined;
  let spoken = false;
  let done = false;
  let aboveSince: number | undefined;
  let belowSince: number | undefined;

  return {
    push(db: number, atMs: number): VadEvent {
      if (done) return 'none';
      if (atMs >= maxMs) {
        done = true;
        return 'max';
      }
      if (atMs < calibrateMs) {
        sum += db;
        count += 1;
        return 'none';
      }
      if (threshold === undefined) {
        const floor = count > 0 ? sum / count : db;
        threshold = Math.max(floor + 12, -50);
      }
      const loud = db > threshold;
      if (!spoken) {
        if (loud) {
          aboveSince ??= atMs;
          if (atMs - aboveSince >= holdMs) {
            spoken = true;
            belowSince = undefined;
            return 'speech';
          }
        } else {
          aboveSince = undefined;
        }
        if (atMs >= noSpeechMs) {
          done = true;
          return 'no-speech';
        }
        return 'none';
      }
      if (loud) {
        belowSince = undefined;
      } else {
        belowSince ??= atMs;
        if (atMs - belowSince >= silenceMs) {
          done = true;
          return 'end';
        }
      }
      return 'none';
    },
  };
}

/** Map -60…-10 dB sang 0…1 để vẽ thanh âm lượng. */
export function levelFromDb(db: number | undefined): number {
  if (db === undefined || Number.isNaN(db)) return 0;
  return Math.min(1, Math.max(0, (db + 60) / 50));
}

/** RMS của khung mẫu, nhân 3 rồi kẹp 0…1. */
export function rmsLevel(frames: number[]): number {
  if (frames.length === 0) return 0;
  let sq = 0;
  for (const f of frames) sq += f * f;
  return Math.min(1, Math.max(0, Math.sqrt(sq / frames.length) * 3));
}

/** Thay mọi `{object}` trong mẫu câu hỏi bằng tên đồ vật. */
export function askFor(template: string, object: string): string {
  return template.split('{object}').join(object);
}

export type LockDecision = 'lock' | 'person' | 'unsafe' | 'unsure';

export function lockDecision(r: { has_person: boolean; safe: boolean; confidence: number }): LockDecision {
  if (r.has_person) return 'person';
  if (!r.safe) return 'unsafe';
  if (r.confidence < 0.6) return 'unsure';
  return 'lock';
}
