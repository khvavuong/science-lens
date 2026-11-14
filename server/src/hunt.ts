import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { decodeHuntAudio } from './huntAudio.js';
import { evaluateHunt, transcribeHunt, type HuntEvaluationInput } from './gemini.js';
import { HUNT_VERDICTS } from './prompts.js';

type HuntTopic = HuntEvaluationInput['mission'] & { id: string; version: number };
const topics: HuntTopic[] = JSON.parse(readFileSync(new URL('./hunt-topics.json', import.meta.url), 'utf8'));
const maxFileBytes = 2_000_000;

class HuntError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}

const invalid = () => new HuntError(400, 'INVALID_INPUT', 'Bài gửi chưa hợp lệ. Em kiểm tra rồi thử lại nhé.');
const tooLarge = () => new HuntError(413, 'FILE_TOO_LARGE', 'Tệp quá lớn. Em chọn ảnh nhỏ hơn hoặc ghi âm ngắn hơn nhé.');
const unsupported = () => new HuntError(415, 'UNSUPPORTED_MEDIA', 'Tệp chưa đúng định dạng. Em thử chọn ảnh hoặc ghi âm lại nhé.');

function boundedText(value: unknown, limit: number) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length <= limit ? trimmed : '';
}

async function readSubmission(req: FastifyRequest, fileName: string, fieldNames: string[]) {
  if (!req.isMultipart()) throw unsupported();
  const fields = new Map<string, string>();
  let file: { data: Buffer; mime: string } | undefined;
  for await (const part of req.parts({ limits: { fields: fieldNames.length, files: 1, parts: fieldNames.length + 2 } })) {
    if (part.type === 'file') {
      if (part.fieldname !== fileName) throw invalid();
      const data = await part.toBuffer();
      if (part.file.truncated) throw tooLarge();
      file = { data, mime: part.mimetype.split(';')[0].toLowerCase() };
    } else {
      if (part.valueTruncated || fields.has(part.fieldname) || !fieldNames.includes(part.fieldname) || typeof part.value !== 'string') throw invalid();
      fields.set(part.fieldname, part.value);
    }
  }
  if (!file?.data.length) throw invalid();
  return { fields, file };
}

function readPrevious(raw?: string) {
  if (!raw) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw invalid(); }
  if (!Array.isArray(parsed) || parsed.length > 2) throw invalid();
  return parsed.map((row) => {
    const objectLabel = boundedText(row?.objectLabel, 100);
    const explanation = boundedText(row?.explanation, 500);
    if (!objectLabel || !explanation) throw invalid();
    return { objectLabel, explanation };
  });
}

async function normalizePhoto(file: { mime: string; data: Buffer }) {
  if (file.mime !== 'image/jpeg') throw unsupported();
  try {
    const photo = sharp(file.data, { limitInputPixels: 12_000_000 });
    if ((await photo.metadata()).format !== 'jpeg') throw unsupported();
    return await photo.rotate().resize({ width: 896, height: 896, fit: 'inside', withoutEnlargement: true }).jpeg().toBuffer();
  } catch {
    throw unsupported();
  }
}

const models = { evaluate: evaluateHunt, transcribe: transcribeHunt };

export async function registerHunt(app: FastifyInstance, { ai = models }: { ai?: typeof models }) {
  await app.register(multipart, { limits: { fileSize: maxFileBytes, fieldSize: 8192 } });
  await app.register(rateLimit, { global: false });

  app.setErrorHandler((error, req, reply) => {
    if (error instanceof HuntError) return reply.code(error.status).send({ code: error.code, message: error.message });
    const status = error instanceof Error && 'statusCode' in error ? error.statusCode : undefined;
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    if (status === 413) return reply.code(413).send({ code: 'FILE_TOO_LARGE', message: tooLarge().message });
    if (status === 429) return reply.code(429).send({ code: 'RATE_LIMITED', message: 'Em gửi hơi nhanh. Đợi một chút rồi thử lại nhé.' });
    if (status === 415) return reply.code(415).send({ code: 'UNSUPPORTED_MEDIA', message: unsupported().message });
    if ((typeof code === 'string' && code.startsWith('FST_')) || status === 400) {
      return reply.code(400).send({ code: 'INVALID_INPUT', message: invalid().message });
    }
    req.log.warn({ code: 'HUNT_UNAVAILABLE' }, 'Không xử lý được bài săn đồ vật');
    return reply.code(503).send({ code: 'HUNT_UNAVAILABLE', message: 'Chưa xử lý được bài của em. Hãy thử lại nhé.' });
  });

  app.post('/api/hunt/transcribe', { config: { rateLimit: { max: 12, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { file } = await readSubmission(req, 'audio', []);
    const audio = await decodeHuntAudio(file);
    if (audio.status !== 'ready') {
      if (audio.status === 'too_long') throw new HuntError(400, 'RECORDING_TOO_LONG', 'Em ghi âm tối đa 30 giây nhé.');
      throw unsupported();
    }
    const transcript = boundedText(await ai.transcribe(audio.pcm), 5000);
    if (!transcript) throw new HuntError(422, 'NO_SPEECH', 'Chưa nghe rõ lời giải thích. Em có thể ghi lại hoặc nhập chữ.');
    return reply.header('Cache-Control', 'no-store').send({ transcript });
  });

  app.post('/api/hunt/evaluate', { config: { rateLimit: { max: 18, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { fields, file } = await readSubmission(req, 'photo', ['topicId', 'topicVersion', 'itemId', 'revision', 'explanation', 'acceptedObjects']);
    const mission = topics.find((topic) => topic.id === fields.get('topicId') && String(topic.version) === fields.get('topicVersion'));
    if (!mission) throw new HuntError(400, 'UNKNOWN_TOPIC', 'Chủ đề này chưa được hỗ trợ. Em mở lại danh sách nhé.');
    const itemId = fields.get('itemId') ?? '';
    const revision = Number(fields.get('revision'));
    const explanation = boundedText(fields.get('explanation'), 500);
    if (!/^[a-z0-9-]{1,64}$/i.test(itemId) || !Number.isSafeInteger(revision) || revision < 1 || !explanation) throw invalid();
    const result = await ai.evaluate({
      mission, photo: await normalizePhoto(file), explanation, acceptedObjects: readPrevious(fields.get('acceptedObjects')),
    });
    const feedback = boundedText(result?.feedback, 600);
    const objectLabel = boundedText(result?.objectLabel, 100);
    if (!HUNT_VERDICTS.includes(result?.verdict) || !feedback || (result.verdict === 'accepted' && !objectLabel)) {
      throw new Error('Phản hồi đánh giá không hợp lệ');
    }
    return reply.header('Cache-Control', 'no-store').send({
      itemId, revision, verdict: result.verdict, feedback, ...(objectLabel ? { objectLabel } : {}),
    });
  });
}
