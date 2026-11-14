import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { accessSync, constants } from 'node:fs';

// Đường dẫn tĩnh để Vercel đóng gói binary Linux cùng function.
const cloudBinary = new URL('../node_modules/ffmpeg-static/ffmpeg', import.meta.url);
if (process.env.VERCEL) accessSync(cloudBinary, constants.X_OK);
export const ffmpeg: string | null = process.env.VERCEL
  ? fileURLToPath(cloudBinary)
  : createRequire(import.meta.url)('ffmpeg-static');
