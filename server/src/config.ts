import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = process.env.VERCEL ? join(tmpdir(), 'lumoslab') : join(dirname(fileURLToPath(import.meta.url)), '..');

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
  // Có key ElevenLabs → giọng kể chỉ dùng ElevenLabs; lỗi thì app tự đọc bằng giọng máy (expo-speech).
  // Không có key → quay về Gemini TTS ở trên.
  elevenlabs: {
    key: process.env.ELEVEN_LAB_KEY ?? process.env.ELEVENLABS_API_KEY ?? '',
    // "Saigon Lily": nữ, giọng miền Nam, nhẹ nhàng.
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? 'WFDoCi084FlAxSbpBEfC',
    models: (process.env.ELEVENLABS_MODEL ?? 'eleven_v4,eleven_turbo_v2_5').split(','),
    // Kể chuyện vui nhộn: stability thấp + style cao = lên xuống giọng nhiều hơn; speed hơi nhanh cho có nhịp.
    // Đẩy stability < 0.3 dễ đọc lệch/vấp chữ tiếng Việt.
    voiceSettings: {
      stability: Number(process.env.ELEVENLABS_STABILITY ?? 0.35),
      similarity_boost: 0.8,
      style: Number(process.env.ELEVENLABS_STYLE ?? 0.45),
      use_speaker_boost: true,
      speed: Number(process.env.ELEVENLABS_SPEED ?? 1.05),
    },
  },
  // Video (Gemini Omni Flash, không có free tier ~ $0.07/giây ở 720p).
  video: {
    enabled: process.env.VIDEO_ENABLED !== '0',
    models: (process.env.MODEL_VIDEO ?? 'gemini-omni-1.2-flash').split(','),
    maxScenes: Number(process.env.VIDEO_MAX_SCENES ?? 2),
    resolution: process.env.VIDEO_RESOLUTION ?? '720p',
  },
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
