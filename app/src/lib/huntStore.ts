import { create } from 'zustand';
import { huntApi, type HuntResult } from '@/lib/api';
import { deleteHuntPhoto, loadHuntProgress, saveHuntPhoto, saveHuntProgress } from '@/lib/huntStorage';
import { applyHuntResult, HUNT_FILE_LIMIT, HUNT_TEXT_LIMIT, sameHuntPhoto, type HuntPhoto, type HuntProgress } from '@/lib/huntTypes';
import type { preparePhoto } from '@/lib/preparePhoto';
import topics from './hunt-topics.json';

export const huntTopics = topics;
export type HuntTopic = (typeof huntTopics)[number];
export const activeHuntTopics = huntTopics.filter((topic) =>
  !huntTopics.some((other) => other.id === topic.id && other.version > topic.version));

type HuntState = {
  progress: Record<string, HuntProgress>;
  loaded: boolean;
  savingError: Record<string, string | undefined>;
  submitting: Record<string, boolean>;
  error: Record<string, string | undefined>;
};

export const useHunts = create<HuntState>(() => ({ progress: {}, loaded: false, savingError: {}, submitting: {}, error: {} }));
const writes = new Map<string, Promise<unknown>>();
const unsavedResults = new Map<string, HuntResult>();
let loading: Promise<void> | undefined;

export function loadHunts() {
  if (useHunts.getState().loaded) return Promise.resolve();
  loading ??= Promise.all(activeHuntTopics.map(async (topic) => {
    const saved = await loadHuntProgress(topic.id);
    const empty = { topicId: topic.id, topicVersion: topic.version, updatedAt: Date.now(), accepted: [] };
    return [topic.id, saved ?? empty] as const;
  })).then((items) => {
    useHunts.setState({ loaded: true, progress: Object.fromEntries(items) });
  }).finally(() => { loading = undefined; });
  return loading;
}

function update(progress: HuntProgress) {
  useHunts.setState((state) => ({ progress: { ...state.progress, [progress.topicId]: progress } }));
}

function persist(progress: HuntProgress) {
  const id = progress.topicId;
  const write = (writes.get(id) ?? Promise.resolve()).catch(() => {}).then(() => saveHuntProgress(progress));
  writes.set(id, write);
  void write.then(
    () => {
      if (writes.get(id) === write) {
        writes.delete(id);
        useHunts.setState((state) => ({ savingError: { ...state.savingError, [id]: undefined } }));
      }
    },
    () => {
      if (writes.get(id) === write) {
        writes.delete(id);
        useHunts.setState((state) => ({ savingError: { ...state.savingError, [id]: 'Chưa lưu được bài. Em thử lưu lại nhé.' } }));
      }
    },
  );
  return write;
}

export async function retryHuntSave(topic: HuntTopic) {
  if (useHunts.getState().submitting[topic.id]) return;
  setSubmitting(topic.id, true);
  try {
    if (!await saveHuntResult(topic)) await persist(useHunts.getState().progress[topic.id]);
    setError(topic.id);
  } finally { setSubmitting(topic.id, false); }
}

export function editHuntExplanation(topicId: string, explanation: string) {
  const progress = useHunts.getState().progress[topicId];
  const draft = progress.draft;
  if (useHunts.getState().submitting[topicId] || !draft?.photo || draft.explanation === explanation) return;
  const next = { ...progress, updatedAt: Date.now(), draft: { ...draft, revision: draft.revision + 1, explanation } };
  unsavedResults.delete(topicId);
  update(next);
  void persist(next).catch(() => {});
}

function removePhoto(photo?: HuntPhoto) {
  if (!photo) return;
  try { deleteHuntPhoto(photo); } catch { /* Dọn ảnh cũ sau khi đã lưu bài. */ }
}

export async function setHuntPhoto(topicId: string, input: Awaited<ReturnType<typeof preparePhoto>>) {
  const approxBytes = Math.floor(input.base64.length * 3 / 4) - (input.base64.match(/=+$/)?.[0].length ?? 0);
  if (approxBytes > HUNT_FILE_LIMIT) throw new Error('Ảnh quá lớn. Em chọn ảnh nhỏ hơn nhé.');
  const progress = useHunts.getState().progress[topicId];
  if (progress.completedAt || useHunts.getState().submitting[topicId]) return;
  const old = progress.draft;
  const itemId = old?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const revision = (old?.revision ?? 0) + 1;
  const photo = await saveHuntPhoto(topicId, itemId, revision, input);
  if (progress.accepted.some((item) => sameHuntPhoto(item.photo, photo))) {
    removePhoto(photo);
    throw new Error('Ảnh này đã được tính. Em chụp một đồ vật khác nhé.');
  }
  const current = useHunts.getState().progress[topicId];
  if (current.draft !== old || current.completedAt || useHunts.getState().submitting[topicId]) {
    removePhoto(photo);
    return;
  }
  const sameObject = old?.result?.verdict === 'retake_photo';
  const next = { ...current, updatedAt: Date.now(), draft: { id: itemId, revision, photo, explanation: sameObject ? old.explanation : '' } };
  try { await persist(next); } catch (error) { removePhoto(photo); throw error; }
  unsavedResults.delete(topicId);
  update(next);
  removePhoto(old?.photo);
}

function setError(topicId: string, error?: string) {
  useHunts.setState((state) => ({ error: { ...state.error, [topicId]: error } }));
}

function setSubmitting(topicId: string, submitting: boolean) {
  useHunts.setState((state) => ({ submitting: { ...state.submitting, [topicId]: submitting } }));
}

async function saveHuntResult(topic: HuntTopic) {
  const result = unsavedResults.get(topic.id);
  if (!result) return false;
  const current = useHunts.getState().progress[topic.id];
  const next = applyHuntResult(current, result, topic.required);
  if (next !== current) {
    await persist(next);
    update(next);
  }
  unsavedResults.delete(topic.id);
  return next !== current;
}

export async function submitHunt(topic: HuntTopic, attachPhoto: (form: FormData, uri: string) => Promise<void>) {
  const state = useHunts.getState();
  const progress = state.progress[topic.id];
  const draft = progress.draft;
  const explanation = draft?.explanation.trim();
  if (state.submitting[topic.id] || !draft?.photo || !explanation || explanation.length > HUNT_TEXT_LIMIT) return;
  setSubmitting(topic.id, true);
  setError(topic.id);
  try {
    if (await saveHuntResult(topic)) return;
    await persist(progress);
    const body = new FormData();
    body.append('topicId', topic.id);
    body.append('topicVersion', String(topic.version));
    body.append('itemId', draft.id);
    body.append('revision', String(draft.revision));
    body.append('explanation', explanation);
    const previous = progress.accepted.map((item) => ({ objectLabel: item.result.objectLabel, explanation: item.explanation }));
    if (previous.length) body.append('acceptedObjects', JSON.stringify(previous));
    await attachPhoto(body, draft.photo.uri);
    unsavedResults.set(topic.id, await huntApi.evaluate(body));
    await saveHuntResult(topic);
  } catch (error) {
    if (!useHunts.getState().savingError[topic.id]) {
      setError(topic.id, error instanceof Error ? error.message : 'Chưa gửi được lời giải thích.');
    }
  } finally {
    setSubmitting(topic.id, false);
  }
}
