import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  port: Number(process.env.PORT ?? 8787),
  geminiKey: process.env.GEMINI_KEY ?? process.env.GEMINI_API_KEY ?? '',
  models: {
    // Danh sách theo thứ tự ưu tiên; model sau dùng khi model trước quá tải (503) hoặc lỗi.
    vision: (process.env.MODEL_VISION ?? 'gemini-2.5-flash,gemini-3.1-flash-lite').split(','),
    planner: (process.env.MODEL_PLANNER ?? 'gemini-3.5-flash,gemini-2.5-flash,gemini-3.1-flash-lite').split(','),
    image: (process.env.MODEL_IMAGE ?? 'gemini-3.1-flash-image,gemini-2.5-flash-image').split(','),
    // Free tier: mỗi model TTS chỉ ~10 request/ngày → xếp nhiều model để cộng dồn quota.
    tts: (process.env.MODEL_TTS ?? 'gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts,gemini-2.5-pro-preview-tts').split(','),
  },
  ttsVoice: process.env.TTS_VOICE ?? 'Kore',
  dataDir: join(root, 'data'),
  mediaDir: join(root, 'data', 'media'),
  storiesDir: join(root, 'data', 'stories'),
};

if (!config.geminiKey) {
  console.error('Thiếu GEMINI_KEY trong .env (thư mục gốc project).');
  process.exit(1);
}

mkdirSync(config.mediaDir, { recursive: true });
mkdirSync(config.storiesDir, { recursive: true });
