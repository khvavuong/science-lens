import { GoogleGenAI } from '@google/genai';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
import { config } from './config.js';
import {
  IMAGE_NEGATIVE, IMAGE_STYLE_BASE, PLAN_SCHEMA, PLANNER_SYSTEM,
  RECOGNIZE_PROMPT, RECOGNIZE_SCHEMA,
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
): Promise<T> {
  let last: unknown;
  for (const model of models) {
    if ((cooldownUntil.get(model) ?? 0) > Date.now()) {
      last ??= new QuotaError(`${model}: đang hết quota`);
      continue;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        return await Promise.race([
          fn(model, ctrl.signal),
          new Promise<never>((_, rej) => ctrl.signal.addEventListener('abort', () => rej(new TimeoutError(`${model}: quá ${timeoutMs}ms`)))),
        ]);
      } catch (e) {
        last = e;
        if (e instanceof TimeoutError) break;
        const { code, msg } = errInfo(e);
        if (code === 429) {
          // Free tier không có quyền (limit: 0) hoặc hết quota ngày → bỏ qua model này 1 giờ.
          if (/limit: 0\b/.test(msg) || /per day/i.test(msg)) {
            cooldownUntil.set(model, Date.now() + 60 * 60_000);
            last = new QuotaError(`${model}: hết quota (${/limit: 0\b/.test(msg) ? 'cần bật billing' : 'giới hạn theo ngày'})`);
            break;
          }
          if (attempt === 2) cooldownUntil.set(model, Date.now() + 60_000); // giới hạn theo phút
        }
        if (code === 404 || code === 400 || code === 403) break;
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
  return model.startsWith('gemini-2.5') ? { thinkingBudget: level === 'low' ? 0 : 1024 } : { thinkingLevel: level };
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

export async function planStory(label: string): Promise<Plan> {
  return hedged(config.models.planner, 'plan', 12_000, 45_000, async (model, abortSignal) => {
    const r = await ai.models.generateContent({
      model,
      contents: `Vật thể trẻ vừa chụp: "${label}". Hãy lập kế hoạch câu chuyện.`,
      config: {
        abortSignal,
        systemInstruction: PLANNER_SYSTEM,
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
  p.quiz = p.quiz.slice(0, 3).map((q) => ({ ...fixQ(q), scene_ref: Math.min(Math.max(1, q.scene_ref), p.scenes.length) }));
  if (p.quiz.length < 3) throw new Error('Plan thiếu quiz');
  if (!p.concept?.name) p.concept = { name: p.title, definition: p.scenes[0].key_fact };
  return p;
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

/** TTS tiếng Việt → mp3 (hoặc wav nếu không có ffmpeg) + thời lượng. */
export async function synthesize(text: string): Promise<{ data: Buffer; ext: 'mp3' | 'wav'; durationMs: number }> {
  const { pcm, rate } = await withModels(config.models.tts, 'tts', 45_000, async (model, abortSignal) => {
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
  const durationMs = Math.round((pcm.length / 2 / rate) * 1000);
  try {
    return { data: await pcmToMp3(pcm, rate), ext: 'mp3', durationMs };
  } catch {
    return { data: wavFromPcm(pcm, rate), ext: 'wav', durationMs };
  }
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

function pcmToMp3(pcm: Buffer, rate: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-loglevel', 'error', '-f', 's16le', '-ar', String(rate), '-ac', '1', '-i', 'pipe:0', '-b:a', '64k', '-f', 'mp3', 'pipe:1']);
    const chunks: Buffer[] = [];
    p.stdout.on('data', (c) => chunks.push(c));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error('ffmpeg ' + code))));
    p.stdin.end(pcm);
  });
}
