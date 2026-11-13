import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { networkInterfaces } from 'node:os';
import { config } from './config.js';
import { modelStatus, QuotaError, recognize } from './gemini.js';
import { getStory, publicStory, resetImageQuota, retryFailed, startStory } from './pipeline.js';

const app = Fastify({ logger: { level: 'warn' }, bodyLimit: 12 * 1024 * 1024 });
await app.register(cors, { origin: true });
await app.register(fastifyStatic, { root: config.mediaDir, prefix: '/media/', maxAge: '7d', immutable: true });

app.get('/api/health', async () => ({ ok: true, models: config.models, video: config.video, cooldown: modelStatus() }));

// Ảnh chỉ dùng trong bộ nhớ để nhận diện, KHÔNG lưu xuống đĩa.
app.post<{ Body: { imageBase64: string; mimeType?: string } }>('/api/recognize', async (req, reply) => {
  const { imageBase64, mimeType } = req.body ?? ({} as any);
  if (!imageBase64 || imageBase64.length < 100) return reply.code(400).send({ error: 'Thiếu ảnh' });
  const t = Date.now();
  try {
    const r = await recognize(imageBase64.replace(/^data:[^,]+,/, ''), mimeType ?? 'image/jpeg');
    req.log.info({ label: r.label, confidence: r.confidence, ms: Date.now() - t }, 'recognize');
    return r;
  } catch (e: any) {
    req.log.error(e?.message);
    if (e instanceof QuotaError) return reply.code(503).send({ error: 'Máy chủ AI đang tạm hết lượt. Bạn thử lại sau nhé.' });
    return reply.code(502).send({ error: 'Không nhận diện được. Vui lòng thử lại.' });
  }
});

app.post<{ Body: { label: string; fresh?: boolean } }>('/api/stories', async (req, reply) => {
  const label = String(req.body?.label ?? '').trim().slice(0, 80);
  if (!label) return reply.code(400).send({ error: 'Thiếu tên vật thể' });
  return publicStory(startStory(label, { fresh: req.body?.fresh }));
});

app.get<{ Params: { id: string } }>('/api/stories/:id', async (req, reply) => {
  const s = getStory(req.params.id);
  if (!s) return reply.code(404).send({ error: 'Không tìm thấy' });
  return publicStory(s);
});

app.post<{ Params: { id: string } }>('/api/stories/:id/retry', async (req, reply) => {
  const s = getStory(req.params.id);
  if (!s) return reply.code(404).send({ error: 'Không tìm thấy' });
  resetImageQuota();
  retryFailed(s);
  return publicStory(s);
});

await app.listen({ port: config.port, host: '0.0.0.0' });
const ips = Object.values(networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4' && !n.internal).map((n) => n!.address);
console.log(`LumosLab API: http://localhost:${config.port}  (LAN: ${ips.map((ip) => `http://${ip}:${config.port}`).join(', ')})`);
