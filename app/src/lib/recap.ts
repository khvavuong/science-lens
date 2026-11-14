import { File, Paths } from 'expo-file-system';
import { API_URL } from './api';
import { loadHistory, saveRecap } from './history';

const jobs = new Map<string, Promise<string>>();
export const recapKey = (photoUri: string, answers: (number | null)[]) => JSON.stringify([photoUri, answers]);

export function buildRecap(storyId: string, key: string, photoBase64: string, answers: (number | null)[]) {
  const jobKey = `${storyId}:${key}`;
  const running = jobs.get(jobKey);
  if (running) return running;
  const job = (async () => {
    const saved = (await loadHistory()).find(r => r.storyId === storyId && r.recapKey === key);
    if (saved?.videoUri && new File(saved.videoUri).exists) return saved.videoUri;
    const response = await fetch(`${API_URL}/api/stories/${storyId}/recap`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.EXPO_PUBLIC_API_TOKEN ?? ''}` },
      body: JSON.stringify({ photoBase64, answers }), signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error ?? `Xuất video bị gián đoạn (${response.status}). Thử lại nhé.`);
    }
    if (!response.headers.get('content-type')?.includes('video/mp4')) throw new Error('Máy chủ chưa trả về MP4 hợp lệ.');
    const file = new File(Paths.document, `lumoslens-${storyId}-${Date.now()}.mp4`);
    file.create();
    await file.write(new Uint8Array(await response.arrayBuffer()));
    await saveRecap(storyId, key, file.uri);
    return file.uri;
  })();
  jobs.set(jobKey, job);
  void job.catch(() => { jobs.delete(jobKey); });
  return job;
}
