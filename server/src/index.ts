import cors from '@fastify/cors';
import Fastify from 'fastify';
import { networkInterfaces } from 'node:os';
import { timingSafeEqual } from 'node:crypto';
import { cloudEnabled, cloudGet, cloudStart, cloudRetry, schedule, mediaRedirect } from './cloud.js';
import { config } from './config.js';
import { modelStatus, recognize } from './gemini.js';
import { getStory, publicStory, resetImageQuota, retryFailed, startStory } from './pipeline.js';

const app = Fastify({ logger: { level: 'warn' }, bodyLimit: 12 * 1024 * 1024 });
if (cloudEnabled && !process.env.APP_API_TOKEN) throw new Error('Missing APP_API_TOKEN');
app.addHook('onRequest', async (req, reply) => {
  if (!cloudEnabled || req.url.startsWith('/media/') || req.url === '/api/health' || req.method === 'OPTIONS') return;
  const expected = Buffer.from(`Bearer ${process.env.APP_API_TOKEN}`);
  const actual = Buffer.from(req.headers.authorization ?? '');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return reply.code(401).send({ error: 'Ứng dụng chưa được cấp quyền.' });
});
await app.register(cors, { origin: true });
if (!cloudEnabled) await app.register((await import('@fastify/static')).default, { root: config.mediaDir, prefix: '/media/', maxAge: '7d', immutable: true });
else app.get<{ Params: { '*': string } }>('/media/*', async (req, reply) => {
  const url = await mediaRedirect(req.params['*']);
  return url ? reply.redirect(url) : reply.code(404).send({ error: 'Không tìm thấy' });
});

app.get('/api/health', async () => ({ ok: true, models: config.models, cooldown: modelStatus() }));

// Ảnh chỉ dùng trong bộ nhớ để nhận diện, KHÔNG lưu xuống đĩa.
app.post<{ Body: { imageBase64: string; mimeType?: string } }>('/api/recognize', async (req, reply) => {
  const { imageBase64, mimeType } = req.body ?? ({} as any);
  if (typeof imageBase64 !== 'string' || imageBase64.length < 100 || imageBase64.length > 4_000_000) return reply.code(400).send({ error: 'Ảnh không hợp lệ hoặc quá lớn' });
  const t = Date.now();
  try {
    const r = await recognize(imageBase64.replace(/^data:[^,]+,/, ''), mimeType ?? 'image/jpeg');
    req.log.info({ label: r.label, confidence: r.confidence, ms: Date.now() - t }, 'recognize');
    return r;
  } catch (e: any) {
    req.log.error(e?.message);
    return reply.code(502).send({ error: 'Không nhận diện được. Vui lòng thử lại.' });
  }
});

app.post<{ Body: { label: string; fresh?: boolean } }>('/api/stories', async (req, reply) => {
  const label = String(req.body?.label ?? '').trim().slice(0, 80);
  if (!label) return reply.code(400).send({ error: 'Thiếu tên vật thể' });
  if (cloudEnabled) {
    let s = await cloudStart(label);
    if (s.status === 'error') s = (await cloudRetry(s.id))!;
    schedule(s);
    return publicStory(s);
  }
  return publicStory(startStory(label, { fresh: req.body?.fresh }));
});

app.get<{ Params: { id: string } }>('/api/stories/:id', async (req, reply) => {
  const s = cloudEnabled ? await cloudGet(req.params.id) : getStory(req.params.id);
  if (!s) return reply.code(404).send({ error: 'Không tìm thấy' });
  if (cloudEnabled) schedule(s);
  return publicStory(s);
});

app.post<{ Params: { id: string } }>('/api/stories/:id/retry', async (req, reply) => {
  const s = cloudEnabled ? await cloudGet(req.params.id) : getStory(req.params.id);
  if (!s) return reply.code(404).send({ error: 'Không tìm thấy' });
  if (cloudEnabled) { const next = (await cloudRetry(s.id))!; schedule(next); return publicStory(next); }
  resetImageQuota();
  retryFailed(s);
  return publicStory(s);
});

void app.listen({ port: config.port, host: '0.0.0.0' }).catch((error) => { app.log.error(error); process.exitCode = 1; });
const ips = Object.values(networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4' && !n.internal).map((n) => n!.address);
console.log(`LumosLab API: http://localhost:${config.port}  (LAN: ${ips.map((ip) => `http://${ip}:${config.port}`).join(', ')})`);
