import type { HuntResult } from '@/lib/api';

export const HUNT_FILE_LIMIT = 2_000_000;
export const HUNT_TEXT_LIMIT = 500;
export const HUNT_RECORD_SECONDS = 30;

export type HuntPhoto = { uri: string; revision: number; digest?: string };
export type HuntDraft = { id: string; revision: number; photo?: HuntPhoto; explanation: string; result?: HuntResult };
export type HuntAccepted = HuntDraft & { photo: HuntPhoto; result: HuntResult & { objectLabel: string } };
export type HuntProgress = {
  topicId: string;
  topicVersion: number;
  updatedAt: number;
  accepted: HuntAccepted[];
  draft?: HuntDraft;
  completedAt?: number;
};

export function applyHuntResult(progress: HuntProgress, result: HuntResult, required: number, now = Date.now()): HuntProgress {
  const draft = progress.draft;
  if (!draft?.photo || draft.id !== result.itemId || draft.revision !== result.revision || progress.completedAt) return progress;
  if (result.verdict !== 'accepted') return { ...progress, updatedAt: now, draft: { ...draft, result } };
  const photo = draft.photo;
  if (!result.objectLabel || progress.accepted.some((item) => item.id === draft.id || sameHuntPhoto(item.photo, photo))) return progress;
  const accepted = [...progress.accepted, { ...draft, photo: draft.photo, result: { ...result, objectLabel: result.objectLabel } }];
  return { ...progress, updatedAt: now, accepted, draft: undefined, completedAt: accepted.length === required ? now : undefined };
}

export function sameHuntPhoto(first: HuntPhoto, second: HuntPhoto) {
  return first.uri === second.uri || (!!first.digest && first.digest === second.digest);
}
