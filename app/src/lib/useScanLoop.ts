import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { CameraView } from 'expo-camera';
import { File } from 'expo-file-system';
import { api, type Recognition } from '@/lib/api';
import { lockDecision } from '@/lib/huntLive';
import { preparePhoto } from '@/lib/preparePhoto';

export type ScanHint = 'aim' | 'person' | 'unsafe' | 'paused';

const SCAN_WINDOW_MS = 60000;
const GAP_MS = 800;
const ERROR_GAP_MS = 1500;

function discard(uri: string | undefined) {
  if (!uri) return;
  try {
    new File(uri).delete();
  } catch {
    // Ảnh tạm có thể đã bị xóa, bỏ qua.
  }
}

/** Vòng quét: camera chụp ảnh nhỏ im lặng, nhận diện đến khi khóa được một đồ vật. */
export function useScanLoop(
  camera: RefObject<CameraView | null>,
  onLock: (photo: { uri: string; base64: string }, recognition: Recognition) => void,
) {
  const [scanning, setScanning] = useState(false);
  const [hint, setHint] = useState<ScanHint>('aim');
  const token = useRef(0);
  const active = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onLockRef = useRef(onLock);

  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  const halt = useCallback(() => {
    token.current += 1;
    active.current = false;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const stop = useCallback(() => {
    halt();
    setScanning(false);
  }, [halt]);

  const start = useCallback(() => {
    if (active.current) return;
    token.current += 1;
    const mine = token.current;
    active.current = true;
    setScanning(true);
    setHint('aim');

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.current.push(setTimeout(resolve, ms));
      });

    timers.current.push(
      setTimeout(() => {
        if (token.current !== mine) return;
        halt();
        setScanning(false);
        setHint('paused');
      }, SCAN_WINDOW_MS),
    );

    (async () => {
      while (token.current === mine) {
        let gap = GAP_MS;
        let rawUri: string | undefined;
        let preparedUri: string | undefined;
        let locked = false;
        try {
          const cam = camera.current;
          if (!cam) throw new Error('Camera chưa sẵn sàng.');
          const pic = await cam.takePictureAsync({ quality: 0.5, shutterSound: false });
          rawUri = pic.uri;
          if (token.current !== mine) break;
          const photo = await preparePhoto(pic.uri);
          preparedUri = photo.uri;
          if (token.current !== mine) break;
          const recognition = await api.recognize(photo.base64);
          if (token.current !== mine) break;
          const decision = lockDecision(recognition);
          if (decision === 'lock') {
            locked = true;
            halt();
            setScanning(false);
            onLockRef.current(photo, recognition);
            break;
          }
          setHint(decision === 'person' ? 'person' : decision === 'unsafe' ? 'unsafe' : 'aim');
        } catch {
          gap = ERROR_GAP_MS;
        } finally {
          discard(rawUri);
          if (!locked) discard(preparedUri);
        }
        if (token.current !== mine) break;
        await wait(gap);
      }
    })();
  }, [camera, halt]);

  useEffect(() => halt, [halt]);

  return { start, stop, scanning, hint };
}
