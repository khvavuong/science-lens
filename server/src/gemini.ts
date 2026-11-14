import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
import { config } from './config.js';
import { ffmpeg } from './ffmpeg.js';
import {
  IMAGE_NEGATIVE, IMAGE_STYLE_BASE, PLAN_SCHEMA, plannerSystem,
  RECOGNIZE_PROMPT, RECOGNIZE_SCHEMA, VIDEO_STYLE,
  HUNT_EVALUATION_PROMPT, HUNT_SCHEMA, HUNT_TRANSCRIPTION_PROMPT, HUNT_TRANSCRIPTION_SCHEMA, HUNT_VERDICTS,
} from './prompts.js';
import type { Plan, Recognition } from './types.js';

// v1beta bắt buộc cho JSON mode và speechConfig.
const ai = new GoogleGenAI({ apiKey: config.geminiKey, httpOptions: { apiVersion: 'v1beta' } });

export class QuotaError extends Error {}

function errInfo(e: any): { code?: number; msg: string } {
  const msg = String(e?.message ?? e);
  const m = msg.match(/"code":\s*(\d{3})/);
  return { code: e?.status ?? (m ? Number(m[1]) : undefined), msg };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class TimeoutError extends Error {}

/** Model đã hết quota ngày/phút → tạm bỏ qua để không tốn thời gian thử lại. */
const cooldownUntil = new Map<string, number>();
export function modelStatus() {
  const now = Date.now();
  return Object.fromEntries([...cooldownUntil].filter(([, t]) => t > now).map(([m, t]) => [m, new Date(t).toISOString()]));
}

/**
 * Thử lần lượt từng model; mỗi model thử lại khi 503/429 tạm thời.
 * Mỗi lần gọi có timeout riêng; hết giờ → chuyển sang model kế tiếp (không chờ vô hạn).
 */
async function withModels<T>(
  models: string[], label: string, timeoutMs: number,
  fn: (model: string, signal: AbortSignal) => Promise<T>,
  budgetMs = 200_000,
): Promise<T> {
  let last: unknown;
  const deadline = Date.now() + budgetMs;
  for (const model of models) {
    if ((cooldownUntil.get(model) ?? 0) > Date.now()) {
      last ??= new QuotaError(`${model}: đang hết quota`);
      continue;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      if (Date.now() >= deadline) throw new TimeoutError('Quá thời gian tạo nội dung');
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, deadline - Date.now()));
      try {
        return await Promise.race([
          fn(model, ctrl.signal),
          new Promise<never>((_, rej) => ctrl.signal.addEventListener('abort', () => rej(new TimeoutError(`${model}: quá ${timeoutMs}ms`)))),
        ]);
      } catch (e) {
        last = e;
        if (e instanceof TimeoutError) break;
        const { code, msg } = errInfo(e);
        if (code === 402) {
          // Hết credit trả trước của project: model nào cũng lỗi như nhau, không thử lại.
          cooldownUntil.set(model, Date.now() + 60 * 60_000);
          last = new QuotaError(`${model}: hết credit (402), cần nạp thêm`);
          break;
        }
        if (code === 429) {
          // Free tier không có quyền (limit: 0) hoặc hết quota ngày → bỏ qua model này 1 giờ.
          // Chạm spending cap tháng của project → mọi model đều lỗi đến khi nâng cap ở AI Studio.
          if (/limit: 0\b/.test(msg) || /per day/i.test(msg) || /spending cap/i.test(msg)) {
            cooldownUntil.set(model, Date.now() + 60 * 60_000);
            const why = /limit: 0\b/.test(msg) ? 'cần bật billing' : /spending cap/i.test(msg) ? 'chạm spending cap tháng' : 'giới hạn theo ngày';
            last = new QuotaError(`${model}: hết quota (${why})`);
            break;
          }
          if (attempt === 2) cooldownUntil.set(model, Date.now() + 60_000); // giới hạn theo phút
        }
        if (code === 404) {
          // Model không tồn tại hoặc đã ngừng cho key này (vd. gemini-2.5-flash với key mới) → bỏ qua 24 giờ.
          cooldownUntil.set(model, Date.now() + 24 * 60 * 60_000);
          break;
        }
        if (code === 400 || code === 403) break;
        const retryable = code === 429 || code === 500 || code === 503 || code === undefined;
        if (!retryable) break;
        await sleep(800 * 2 ** attempt + Math.random() * 400);
      } finally {
        clearTimeout(timer);
      }
    }
    console.warn(`[${label}] ${model} thất bại → thử model kế tiếp`, errInfo(last).msg.slice(0, 160));
  }
  throw last;
}

/**
 * Hedged request: gọi model[0]; nếu sau `staggerMs` chưa xong (hoặc lỗi) thì gọi thêm model kế tiếp song song.
 * Lấy kết quả về trước. Dùng cho bước người dùng đang chờ (nhận diện, lập câu chuyện) vì độ trễ Gemini dao động mạnh.
 */
async function hedged<T>(
  models: string[], label: string, staggerMs: number, timeoutMs: number,
  fn: (model: string, signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const list = models.filter((m) => (cooldownUntil.get(m) ?? 0) <= Date.now());
  if (!list.length) return withModels(models, label, timeoutMs, fn);
  return new Promise<T>((resolve, reject) => {
    let next = 0;
    let settled = 0;
    let done = false;
    let lastErr: unknown;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const launch = () => {
      if (done || next >= list.length) return;
      const model = list[next++];
      const t0 = Date.now();
      withModels([model], label, timeoutMs, fn).then(
        (v) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          console.log(`[${label}] ${model} ${Date.now() - t0}ms`);
          resolve(v);
        },
        (e) => {
          lastErr = e;
          settled++;
          if (done) return;
          if (next < list.length) { clearTimeout(timer); launch(); schedule(); }
          else if (settled >= next) { clearTimeout(timer); reject(lastErr); }
        },
      );
    };
    const schedule = () => {
      if (next >= list.length) return; // đã gọi hết model: không đặt timer nữa
      timer = setTimeout(() => { launch(); schedule(); }, staggerMs);
    };
    launch();
    schedule();
  });
}

function parseJson<T>(text: string | undefined): T {
  if (!text) throw new Error('Phản hồi rỗng');
  return JSON.parse(text.replace(/^```json\s*|```$/g, '').trim()) as T;
}

function thinkingFor(model: string, level: 'low' | 'medium') {
  return model.startsWith('gemini-2.5')
    ? { thinkingBudget: level === 'low' ? 0 : 1024 }
    : { thinkingLevel: level === 'low' ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM };
}

export async function recognize(imageBase64: string, mimeType = 'image/jpeg'): Promise<Recognition> {
  return hedged(config.models.vision, 'recognize', 6_000, 25_000, async (model, abortSignal) => {
    const r = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: RECOGNIZE_PROMPT }] }],
      config: { abortSignal, responseMimeType: 'application/json', responseJsonSchema: RECOGNIZE_SCHEMA, thinkingConfig: thinkingFor(model, 'low') as any },
    });
    const out = parseJson<Recognition>(r.text);
    out.label = out.label.trim().toLowerCase();
    out.alternatives = (out.alternatives ?? []).filter((a) => a && a.toLowerCase() !== out.label).slice(0, 3);
    return out;
  });
}

export type HuntEvaluation = {
  verdict: (typeof HUNT_VERDICTS)[number];
  feedback: string;
  objectLabel?: string;
};

export type HuntEvaluationInput = {
  photo: Buffer;
  mission: { title: string; task: string; criteria: string };
  explanation: string;
  acceptedObjects: { objectLabel: string; explanation: string }[];
};

export async function evaluateHunt(input: HuntEvaluationInput): Promise<HuntEvaluation> {
  return withModels(config.models.vision, 'hunt-evaluate', 15_000, async (model, abortSignal) => {
    const result = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [
        { inlineData: { data: input.photo.toString('base64'), mimeType: 'image/jpeg' } },
        { text: JSON.stringify({ explanation: input.explanation, acceptedObjects: input.acceptedObjects }) },
      ] }],
      config: {
        abortSignal,
        systemInstruction: `${HUNT_EVALUATION_PROMPT}\nTrusted mission: ${JSON.stringify({
          title: input.mission.title, task: input.mission.task, criteria: input.mission.criteria,
        })}`,
        responseMimeType: 'application/json',
        responseJsonSchema: HUNT_SCHEMA,
        thinkingConfig: thinkingFor(model, 'low'),
      },
    });
    return parseJson<HuntEvaluation>(result.text);
  }, 32_000);
}

export async function transcribeHunt(pcm: Buffer): Promise<string> {
  // mp3 32 kbps nhỏ hơn WAV khoảng 8 lần: Gemini trả lời nhanh gấp đôi mà chép lời vẫn chính xác.
  // Nén lỗi thì vẫn gửi WAV.
  const audio = await pcmToMp3(pcm, 16_000, { binary: ffmpeg ?? 'ffmpeg', bitrate: '32k' })
    .then((data) => ({ data, mimeType: 'audio/mp3' }))
    .catch(() => ({ data: wavFromPcm(pcm, 16_000), mimeType: 'audio/wav' }));
  const inlineData = { data: audio.data.toString('base64'), mimeType: audio.mimeType };
  // Trẻ đang chờ: model đầu chưa xong sau 4 giây thì gọi thêm model kế tiếp, lấy kết quả về trước.
  return hedged(config.models.transcribe, 'hunt-transcribe', 4_000, 15_000, async (model, abortSignal) => {
    const result = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ inlineData }] }],
      config: {
        abortSignal,
        systemInstruction: HUNT_TRANSCRIPTION_PROMPT,
        responseMimeType: 'application/json',
        responseJsonSchema: HUNT_TRANSCRIPTION_SCHEMA,
        thinkingConfig: thinkingFor(model, 'low'),
      },
    });
    const data = parseJson<{ transcript: unknown }>(result.text);
    if (typeof data.transcript !== 'string') throw new Error('Bản chép lời không hợp lệ');
    return data.transcript.trim();
  });
}

export async function planStory(label: string): Promise<Plan> {
  return hedged(config.models.planner, 'plan', 12_000, 45_000, async (model, abortSignal) => {
    const r = await ai.models.generateContent({
      model,
      contents: `The object photographed by the child is "${label}". Plan one science story about this object. Follow the system instructions and return the required JSON.`,
      config: {
        abortSignal,
        systemInstruction: plannerSystem(config.video.enabled ? config.video.maxScenes : 0),
        responseMimeType: 'application/json',
        responseJsonSchema: PLAN_SCHEMA,
        thinkingConfig: thinkingFor(model, 'low') as any,
        temperature: 0.8,
      },
    });
    return validatePlan(parseJson<Plan>(r.text));
  });
}

function validatePlan(p: Plan): Plan {
  if (!p.safe) return p;
  if (!Array.isArray(p.scenes) || p.scenes.length < 3) throw new Error('Plan thiếu scene');
  p.scenes = p.scenes.slice(0, 5).map((s, i) => {
    const chunks = (s.subtitle_chunks ?? []).map((c) => c.trim()).filter(Boolean);
    return { ...s, id: i + 1, subtitle_chunks: chunks.length ? chunks : [s.narration] };
  });
  if (p.timeline_mode === 'historical' && p.scenes.some((s) => s.confidence !== 'high' || !/\d{3,4}/.test(s.timeline_label))) {
    p.timeline_mode = 'process';
  }
  if (p.timeline_mode === 'process') p.scenes.forEach((s, i) => (s.timeline_label = `Bước ${i + 1}`));
  const fixQ = <Q extends { options: string[]; answer_index: number }>(q: Q) => {
    q.options = q.options.slice(0, 4);
    if (q.answer_index < 0 || q.answer_index >= q.options.length) throw new Error('answer_index sai');
    return q;
  };
  p.mystery_question = fixQ(p.mystery_question);
  p.quiz = p.quiz.slice(0, 3).map((q) => ({
    ...fixQ(q),
    explanation: stripPraise(q.explanation),
    scene_ref: Math.min(Math.max(1, q.scene_ref), p.scenes.length),
  }));
  if (p.quiz.length < 3) throw new Error('Plan thiếu quiz');
  if (!p.concept?.name) p.concept = { name: p.title, definition: p.scenes[0].key_fact };
  // Giữ tối đa N cảnh video (theo thứ tự cảnh); không có motion_prompt thì không làm video.
  let videos = config.video.enabled ? config.video.maxScenes : 0;
  p.scenes.forEach((s) => {
    s.video_worthy = Boolean(s.video_worthy && s.motion_prompt?.trim() && videos-- > 0);
  });
  return p;
}

/** Bỏ lời khen/đánh giá ở đầu giải thích quiz: app đã hiện "Chính xác!"/"Chưa đúng" riêng. */
export function stripPraise(text: string): string {
  const out = text.replace(/^\s*(chính xác|đúng rồi|đúng vậy|giỏi lắm|tuyệt vời|rất tốt|tiếc quá|chưa đúng|sai rồi)\s*[!.,:]+\s*/iu, '');
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : text;
}

/** Sinh ảnh scene → JPEG đã nén. */
export async function generateImage(scenePrompt: string, characterSheet: string): Promise<Buffer> {
  const prompt = [IMAGE_STYLE_BASE, characterSheet, `Scene: ${scenePrompt}`, IMAGE_NEGATIVE].filter(Boolean).join('\n\n');
  return withModels(config.models.image, 'image', 60_000, async (model, abortSignal) => {
    const r = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { abortSignal, responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '9:16' } },
    });
    const part = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) throw new Error('Model không trả ảnh');
    return sharp(Buffer.from(part.inlineData.data, 'base64'))
      .resize({ width: 1080, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  });
}

/**
 * Image-to-video bằng Gemini Omni Flash (Interactions API): khung đầu là ảnh của cảnh,
 * độ dài khớp giọng kể. Video có âm thanh gốc nhưng app luôn tắt tiếng, chỉ phát giọng kể TTS.
 */
export async function generateVideo(image: Buffer, motionPrompt: string, seconds: number): Promise<Buffer> {
  const duration = `${Math.min(15, Math.max(3, Math.round(seconds)))}s`;
  const text = `${motionPrompt.trim()}\n\n${VIDEO_STYLE}`;
  return withModels(config.video.models, 'video', 6 * 60_000, async (model, signal) => {
    const r = await ai.interactions.create(
      {
        model,
        input: [
          { type: 'image', data: image.toString('base64'), mime_type: 'image/jpeg' },
          { type: 'text', text },
        ],
        response_format: { type: 'video', aspect_ratio: '9:16', resolution: config.video.resolution, duration, delivery: 'inline' },
        store: false,
      },
      { fetch_options: { signal } },
    );
    const v = r.output_video;
    if (v?.data) return Buffer.from(v.data, 'base64');
    if (v?.uri) {
      // Phòng khi API trả file URI (video lớn): tải bằng key của server.
      const res = await fetch(v.uri, { headers: { 'x-goog-api-key': config.geminiKey }, signal });
      if (!res.ok) throw new Error(`Tải video lỗi ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    }
    throw new Error('Model không trả video');
  });
}

/** TTS tiếng Việt → mp3 (hoặc wav nếu không có ffmpeg) + thời lượng. */
export async function synthesize(text: string): Promise<{ data: Buffer; ext: 'mp3' | 'wav'; durationMs: number }> {
  const { pcm, rate } = config.elevenlabs.key ? await elevenLabsPcm(text) : await geminiPcm(text);
  const durationMs = Math.round((pcm.length / 2 / rate) * 1000);
  try {
    return { data: await pcmToMp3(pcm, rate), ext: 'mp3', durationMs };
  } catch {
    return { data: wavFromPcm(pcm, rate), ext: 'wav', durationMs };
  }
}

/**
 * ElevenLabs TTS → PCM 16-bit mono 24kHz (cùng định dạng với Gemini để dùng chung bước tính độ dài + mp3).
 * Không chuyển sang Gemini khi lỗi: asset báo `error` → app đọc bằng expo-speech, phụ đề vẫn chạy.
 */
async function elevenLabsPcm(text: string): Promise<{ pcm: Buffer; rate: number }> {
  const rate = 24000;
  const { key, voiceId, models } = config.elevenlabs;
  const pcm = await withModels(models, 'tts-elevenlabs', 45_000, async (model, signal) => {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=pcm_${rate}`,
      {
        method: 'POST',
        signal,
        headers: { 'xi-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({ text, model_id: model, language_code: 'vi' }),
      },
    );
    if (!res.ok) {
      // Gắn status để withModels phân loại (429/5xx thử lại, 4xx khác bỏ qua).
      const err = new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
      (err as any).status = res.status;
      throw err;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error('ElevenLabs không trả audio');
    return buf;
  });
  return { pcm, rate };
}

async function geminiPcm(text: string): Promise<{ pcm: Buffer; rate: number }> {
  return withModels(config.models.tts, 'tts', 45_000, async (model, abortSignal) => {
    const r = await ai.models.generateContent({
      model,
      // Chỉ gửi lời kể: model TTS đọc nguyên văn mọi chữ, kể cả câu chỉ dẫn giọng.
      contents: text,
      config: {
        abortSignal,
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: config.ttsVoice } } },
      },
    });
    const part = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) throw new Error('Model không trả audio');
    return toPcm(Buffer.from(part.inlineData.data, 'base64'), part.inlineData.mimeType ?? '');
  });
}

function toPcm(buf: Buffer, mime: string): { pcm: Buffer; rate: number } {
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF') {
    const rate = buf.readUInt32LE(24);
    let off = 12;
    while (off + 8 <= buf.length) {
      const id = buf.subarray(off, off + 4).toString('ascii');
      const size = buf.readUInt32LE(off + 4);
      if (id === 'data') return { pcm: buf.subarray(off + 8, Math.min(buf.length, off + 8 + size)), rate };
      off += 8 + size + (size % 2);
    }
    return { pcm: buf.subarray(44), rate };
  }
  const m = mime.match(/rate=(\d+)/i);
  return { pcm: buf, rate: m ? Number(m[1]) : 24000 };
}

function wavFromPcm(pcm: Buffer, rate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

function pcmToMp3(pcm: Buffer, rate: number, { binary = 'ffmpeg', bitrate = '64k' } = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const p = spawn(binary, ['-loglevel', 'error', '-f', 's16le', '-ar', String(rate), '-ac', '1', '-i', 'pipe:0', '-b:a', bitrate, '-f', 'mp3', 'pipe:1'], { windowsHide: true });
    const chunks: Buffer[] = [];
    p.stdout.on('data', (c) => chunks.push(c));
    p.stdin.on('error', reject);
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error('ffmpeg ' + code))));
    p.stdin.end(pcm);
  });
}
