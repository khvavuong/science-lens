import { createClient } from '@supabase/supabase-js';
import { waitUntil } from '@vercel/functions';
import { randomUUID } from 'node:crypto';
import { generateImage, generateVideo, planStory, synthesize, QuotaError } from './gemini.js';
import type { Asset, Story } from './types.js';

export const cloudEnabled = !!process.env.SUPABASE_URL;
const db = cloudEnabled ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(15_000) }) },
}) : undefined;
const bucket = 'story-media';
export const slots = (s: Story) => [s.assets.prelude_audio, ...s.assets.scenes.flatMap(x => [x.image, x.audio, ...(x.video ? [x.video] : [])])];
export const unfinished = (s: Story) => s.status === 'planning' || (s.status === 'ready' && slots(s).some(a => a.status === 'pending'));

export async function cloudGet(id: string): Promise<Story | undefined> {
  const { data, error } = await db!.from('stories').select('document').eq('id', id).maybeSingle();
  if (error) throw error;
  return data?.document as Story | undefined;
}

export async function cloudStart(label: string): Promise<Story> {
  label = label.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
  const s: Story = { id: randomUUID(), label, createdAt: Date.now(), status: 'planning', assets: { prelude_audio: { status: 'pending' }, scenes: [] } };
  const { error } = await db!.from('stories').upsert({ id: s.id, label, document: s }, { onConflict: 'label', ignoreDuplicates: true });
  if (error) throw error;
  const result = await db!.from('stories').select('document').eq('label', label).single();
  if (result.error) throw result.error;
  return result.data.document as Story;
}

export function schedule(s: Story) {
  // shortcut: polling tiếp tục job khi mở app; thêm queue nếu cần hoàn tất lúc app đóng.
  if (unfinished(s)) waitUntil(step(s.id).catch(() => console.error('Cloud story step failed')));
}

export async function cloudRetry(id: string): Promise<Story | undefined> {
  const token = randomUUID();
  const claimed = await db!.rpc('claim_story', { story_id: id, token });
  if (claimed.error) throw claimed.error;
  if (!claimed.data?.length) return cloudGet(id);
  const s = claimed.data[0].document as Story;
  if (s.status === 'error') { s.status = 'planning'; delete s.error; }
  for (const a of slots(s)) if (a.status === 'error') { a.status = 'pending'; delete a.error; }
  const { error } = await db!.from('stories').update({ document: s, lease_token: null, lease_until: null }).eq('id', id).eq('lease_token', token);
  if (error) throw error;
  return s;
}

async function step(id: string) {
  const token = randomUUID();
  const claimed = await db!.rpc('claim_story', { story_id: id, token });
  if (claimed.error) throw claimed.error;
  if (!claimed.data?.length) return;
  const s = claimed.data[0].document as Story;
  let asset: Asset | undefined;
  try {
    if (s.status === 'planning') {
      const plan = await planStory(s.label);
      if (!plan.safe) s.status = 'unsafe';
      else {
        s.plan = plan;
        s.status = 'ready';
        s.assets.scenes = plan.scenes.map(sc => ({ image: { status: 'pending' }, audio: { status: 'pending' }, ...(sc.video_worthy ? { video: { status: 'pending' } as Asset } : {}) }));
      }
    } else if (s.status === 'ready' && s.plan) {
      const jobs = [
        { asset: s.assets.prelude_audio, make: () => synthesize(s.plan!.prelude_narration) },
        ...s.plan.scenes.flatMap((scene, i) => [
          { asset: s.assets.scenes[i].image, make: async () => ({ data: await generateImage(scene.image_prompt, s.plan!.character_sheet), ext: 'jpg', durationMs: undefined }) },
          { asset: s.assets.scenes[i].audio, make: () => synthesize(scene.narration) },
        ]),
        ...s.plan.scenes.flatMap((scene, i) => {
          const slot = s.assets.scenes[i];
          return slot.video ? [{ asset: slot.video, make: async () => {
            if (slot.image.status !== 'ready' || slot.audio.status !== 'ready' || !slot.image.url || !scene.motion_prompt) throw new Error('Missing video prerequisites');
            const frame = await db!.storage.from(bucket).download(slot.image.url.replace(/^\/media\//, ''));
            if (frame.error) throw frame.error;
            const data = await generateVideo(Buffer.from(await frame.data.arrayBuffer()), scene.motion_prompt, (slot.audio.durationMs ?? 10_000) / 1000 + 1);
            return { data, ext: 'mp4', durationMs: undefined };
          } }] : [];
        }),
      ];
      const job = jobs.find(j => j.asset.status === 'pending');
      if (job) {
        asset = job.asset;
        const output = await job.make();
        const file = `${id}/${randomUUID()}.${output.ext}`;
        const { error } = await db!.storage.from(bucket).upload(file, output.data, {
          contentType: output.ext === 'jpg' ? 'image/jpeg' : output.ext === 'mp3' ? 'audio/mpeg' : output.ext === 'mp4' ? 'video/mp4' : 'audio/wav',
          cacheControl: '604800',
        });
        if (error) throw error;
        asset.url = `/media/${file}`;
        asset.durationMs = output.durationMs;
        asset.status = 'ready';
        delete asset.error;
      }
    }
  } catch (e) {
    if (asset) { asset.status = 'error'; asset.error = e instanceof QuotaError ? 'quota' : 'failed'; }
    else { s.status = 'error'; s.error = 'Không tạo được câu chuyện. Vui lòng thử lại.'; }
  }
  // Lease token ngăn worker cũ ghi đè kết quả worker mới sau timeout.
  const { error } = await db!.from('stories').update({ document: s, lease_token: null, lease_until: null }).eq('id', id).eq('lease_token', token);
  if (error) throw error;
}

export async function mediaRedirect(path: string) {
  if (!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|mp3|wav|mp4)$/.test(path)) return undefined;
  const { data, error } = await db!.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return undefined;
  return data.signedUrl;
}
