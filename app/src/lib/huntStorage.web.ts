import type { preparePhoto } from '@/lib/preparePhoto';
import type { HuntPhoto, HuntProgress } from '@/lib/huntTypes';

function openHuntDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lumoslab-hunt', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('progress');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadHuntProgress(topic: string): Promise<HuntProgress | undefined> {
  const db = await openHuntDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('progress').objectStore('progress').get(topic);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function saveHuntProgress(progress: HuntProgress) {
  const db = await openHuntDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('progress', 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
      transaction.objectStore('progress').put(progress, progress.topicId);
    });
  } finally { db.close(); }
}

export async function saveHuntPhoto(_topic: string, _id: string, revision: number, photo: Awaited<ReturnType<typeof preparePhoto>>): Promise<HuntPhoto> {
  const uri = `data:image/jpeg;base64,${photo.base64}`;
  // So chính xác nội dung ảnh qua URI trong IndexedDB, không lưu thêm bản sao.
  return { uri, revision };
}

export function deleteHuntPhoto(_photo: HuntPhoto) {
  // Ảnh web nằm trong bản ghi tiến độ và được thay cùng bản ghi.
}
