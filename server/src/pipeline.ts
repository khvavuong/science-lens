import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { nanoid } from 'nanoid';
import { config } from './config.js';
import { generateImage, planStory, QuotaError, synthesize } from './gemini.js';
import type { Asset, Story } from './types.js';

const stories = new Map<string, Story>();
const byLabel = new Map<string, string>();
const running = new Set<string>();
let imagesDisabledUntil = 0;

const norm = (s: string) => s.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');

// Nạp các câu chuyện đã lưu (cache để mở lại ngay).
for (const f of readdirSync(config.storiesDir).filter((f) => f.endsWith('.json'))) {
  try {
    const s = JSON.parse(readFileSync(join(config.storiesDir, f), 'utf8')) as Story;
    if (s.status === 'planning') continue;
    stories.set(s.id, s);
    if (s.status === 'ready') byLabel.set(norm(s.label), s.id);
  } catch { /* bỏ qua file hỏng */ }
}

function save(s: Story) {
  writeFileSync(join(config.storiesDir, `${s.id}.json`), JSON.stringify(s));
}

export function getStory(id: string) {
  return stories.get(id);
}

/** Bản gửi cho app: bỏ prompt ảnh nội bộ. */
export function publicStory(s: Story) {
  if (!s.plan) return s;
  const { character_sheet, ...plan } = s.plan;
  return { ...s, plan: { ...plan, scenes: plan.scenes.map(({ image_prompt, ...sc }) => sc) } };
}

export function startStory(label: string, opts: { fresh?: boolean } = {}): Story {
  const key = norm(label);
  const cachedId = byLabel.get(key);
  if (cachedId && !opts.fresh) {
    const s = stories.get(cachedId)!;
    retryFailed(s);
    return s;
  }
  const s: Story = {
    id: nanoid(10), label: key, status: 'planning', createdAt: Date.now(),
    assets: { prelude_audio: { status: 'pending' }, scenes: [] },
  };
  stories.set(s.id, s);
  void run(s);
  return s;
}

async function run(s: Story) {
  const t0 = Date.now();
  try {
    const plan = await planStory(s.label);
    console.log(`[story ${s.id}] plan "${s.label}" ${Date.now() - t0}ms`);
    if (!plan.safe) {
      s.status = 'unsafe';
      save(s);
      return;
    }
    s.plan = plan;
    s.assets.scenes = plan.scenes.map(() => ({ image: { status: 'pending' }, audio: { status: 'pending' } }));
    s.status = 'ready';
    byLabel.set(s.label, s.id);
    save(s);
    await produceAssets(s);
    console.log(`[story ${s.id}] assets done ${Date.now() - t0}ms`);
  } catch (e: any) {
    console.error(`[story ${s.id}] lỗi`, e?.message?.slice(0, 300));
    s.status = 'error';
    s.error = 'Không tạo được câu chuyện. Vui lòng thử lại.';
    save(s);
  }
}

/** Ưu tiên: voice mở đầu → ảnh/voice scene 1 → các scene còn lại. */
async function produceAssets(s: Story) {
  if (running.has(s.id)) return;
  running.add(s.id);
  try {
    const plan = s.plan!;
    const audioJobs: (() => Promise<void>)[] = [];
    const imageJobs: (() => Promise<void>)[] = [];

    if (s.assets.prelude_audio.status !== 'ready') {
      audioJobs.push(() => fill(s, s.assets.prelude_audio, 'prelude', async () => {
        const a = await synthesize(plan.prelude_narration);
        return { data: a.data, ext: a.ext, durationMs: a.durationMs };
      }));
    }
    plan.scenes.forEach((scene, i) => {
      const slot = s.assets.scenes[i];
      if (slot.image.status !== 'ready') {
        imageJobs.push(() => fill(s, slot.image, `s${i + 1}`, async () => {
          if (Date.now() < imagesDisabledUntil) throw new QuotaError('Sinh ảnh tạm tắt (hết quota)');
          try {
            return { data: await generateImage(scene.image_prompt, plan.character_sheet), ext: 'jpg' };
          } catch (e) {
            if (e instanceof QuotaError) imagesDisabledUntil = Date.now() + 10 * 60_000;
            throw e;
          }
        }));
      }
      if (slot.audio.status !== 'ready') {
        audioJobs.push(() => fill(s, slot.audio, `s${i + 1}`, async () => {
          const a = await synthesize(scene.narration);
          return { data: a.data, ext: a.ext, durationMs: a.durationMs };
        }));
      }
    });

    await Promise.all([pool(audioJobs, 3), pool(imageJobs, 2)]);
  } finally {
    running.delete(s.id);
  }
}

async function fill(s: Story, asset: Asset, name: string, make: () => Promise<{ data: Buffer; ext: string; durationMs?: number }>) {
  asset.status = 'pending';
  delete asset.error;
  try {
    const out = await make();
    const file = `${s.id}-${name}-${Date.now().toString(36)}.${out.ext}`;
    writeFileSync(join(config.mediaDir, file), out.data);
    asset.url = `/media/${file}`;
    if (out.durationMs) asset.durationMs = out.durationMs;
    asset.status = 'ready';
  } catch (e: any) {
    asset.status = 'error';
    asset.error = e instanceof QuotaError ? 'quota' : 'failed';
    console.warn(`[story ${s.id}] ${name} lỗi:`, String(e?.message ?? e).slice(0, 160));
  }
  save(s);
}

async function pool(jobs: (() => Promise<void>)[], n: number) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, jobs.length) }, async () => {
    while (i < jobs.length) await jobs[i++]();
  }));
}

/** Tạo lại các asset lỗi (ví dụ sau khi bật billing cho sinh ảnh). */
export function retryFailed(s: Story) {
  if (s.status !== 'ready' || !s.plan) return;
  const failed = [s.assets.prelude_audio, ...s.assets.scenes.flatMap((x) => [x.image, x.audio])].some((a) => a.status !== 'ready');
  if (failed) void produceAssets(s);
}

export function resetImageQuota() {
  imagesDisabledUntil = 0;
}
