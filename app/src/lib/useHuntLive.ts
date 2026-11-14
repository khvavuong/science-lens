import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useCameraPermissions, type CameraView } from 'expo-camera';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import { api, huntApi, type HuntVerdict, type Recognition } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { askFor, lockDecision } from '@/lib/huntLive';
import {
  afterFeedback, chipForDecision, evaluationOutcome, introLine, isNoSpeechError, mergeTranscript,
  NO_SPEECH_CAPTION, NOT_CLEAR_LINE, REVIEW_COUNTDOWN_MS, scanChipText, type EvaluationOutcome, type LivePhase,
} from '@/lib/huntScreen';
import { editHuntExplanation, retryHuntSave, setHuntPhoto, submitHunt, useHunts, type HuntTopic } from '@/lib/huntStore';
import { HUNT_TEXT_LIMIT } from '@/lib/huntTypes';
import { appendHuntFile, discardHuntAudio } from '@/lib/huntUpload';
import { preparePhoto } from '@/lib/preparePhoto';
import { useAutoListen } from '@/lib/useAutoListen';
import { useLumoVoice } from '@/lib/useLumoVoice';
import { useScanLoop } from '@/lib/useScanLoop';

export type LiveCaption = { text: string; tone: 'say' | 'alert' };

/** Chip lỗi (lưu ảnh, nhận diện ảnh thư viện) tự ẩn sau chừng này. */
const CHIP_FLASH_MS = 5000;
const PICK_FAILED = 'Chưa nhận ra được ảnh. Em thử lại nhé.';

type Photo = { uri: string; base64: string };

/** Xóa ảnh tạm của vòng quét/ảnh thư viện (store đã chép sang thư mục riêng). Web giữ nguyên. */
function discardTemp(uri: string | undefined) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch { /* Ảnh tạm nằm trong cache. */ }
}

/**
 * Điều phối màn Thử thách trực tiếp: quét → khóa vật → Lumo hỏi → nghe → chép lời → đếm 2 giây → chấm → Lumo nhận xét.
 * Mỗi bước bất đồng bộ giữ một "lượt" (`flow`); hành động mới của em hoặc rời màn tăng lượt nên bước cũ tự bỏ.
 * Quy tắc: luôn `listen.stop()` trước `voice.speak()` để không ghi âm giọng Lumo.
 */
export function useHuntLive(topic: HuntTopic | undefined, camera: RefObject<CameraView | null>) {
  const focused = useIsFocused();
  // Chỉ coi là rời màn khi app xuống nền ('inactive' của iOS là tạm thời, vd. hộp xin quyền).
  const [appActive, setAppActive] = useState(AppState.currentState !== 'background');
  /** Đang mở hộp xin quyền/thư viện ảnh: Android báo 'background' dù em vẫn ở màn này → bỏ qua. */
  const systemUi = useRef(0);
  const live = focused && appActive;

  const [cameraPermission, requestCamera] = useCameraPermissions();
  /** null = chưa hỏi trong lượt này; false = bị từ chối → chọn ảnh từ thư viện. */
  const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);

  const [phase, setPhase] = useState<LivePhase>('ready');
  const [caption, setCaption] = useState<LiveCaption | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [chipError, setChipError] = useState<string | null>(null);
  const [counting, setCounting] = useState(false);
  const [verdict, setVerdict] = useState<HuntVerdict | null>(null);
  const [picking, setPicking] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const flow = useRef(0);
  const countdown = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Nối bản chép lời vào chữ có sẵn (sau lần trả lời đầu, khi em đã gõ, khi cần bổ sung). */
  const appendNext = useRef(false);
  const scanAllowed = useRef(false);
  // Các hook con đổi identity mỗi render: bước bất đồng bộ gọi qua ref này.
  const ctl = useRef<{
    voice: ReturnType<typeof useLumoVoice>;
    listen: ReturnType<typeof useAutoListen>;
    scan: ReturnType<typeof useScanLoop>;
  } | null>(null);

  const topicId = topic?.id ?? '';
  const bump = () => ++flow.current;
  const alive = (id: number) => flow.current === id;

  /** Chạy một hộp thoại hệ thống mà không bị coi là rời màn. */
  async function withSystemUi<T>(run: () => Promise<T>): Promise<T> {
    systemUi.current += 1;
    try {
      return await run();
    } finally {
      // Không đồng bộ lại ở đây: lúc promise xong, Android có thể vẫn đang báo 'background'.
      systemUi.current -= 1;
    }
  }

  function clearCountdown() {
    if (countdown.current) clearTimeout(countdown.current);
    countdown.current = null;
    setCounting(false);
  }

  function flash(message: string) {
    if (chipTimer.current) clearTimeout(chipTimer.current);
    setChipError(message);
    chipTimer.current = setTimeout(() => setChipError(null), CHIP_FLASH_MS);
  }

  function show(text: string, tone: LiveCaption['tone']) {
    setCaption({ text, tone });
    // iOS: live region không đọc lại khi chữ đổi → báo trực tiếp cho VoiceOver.
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(text);
  }

  /** Lumo nói một câu (tắt micro trước). Trả về true nếu lượt `id` vẫn còn hiệu lực khi nói xong. */
  async function say(text: string, id: number) {
    const c = ctl.current;
    if (!c) return false;
    c.listen.stop();
    show(text, 'say');
    await c.voice.speak(text);
    return alive(id);
  }

  function listenNow() {
    const c = ctl.current;
    if (!c) return;
    c.voice.stop();
    setPhase('listening');
    void c.listen.start();
  }

  function startScan() {
    bump();
    clearCountdown();
    const c = ctl.current;
    c?.voice.stop();
    c?.listen.stop();
    setPhase('scanning');
    setLabel(null);
    setVerdict(null);
    setCaption(null);
    if (scanAllowed.current) c?.scan.start();
  }

  function startCountdown(id: number) {
    clearCountdown();
    setCounting(true);
    countdown.current = setTimeout(() => {
      countdown.current = null;
      setCounting(false);
      if (alive(id)) void send();
    }, REVIEW_COUNTDOWN_MS);
  }

  async function begin() {
    if (!topic || phase !== 'ready') return;
    const id = bump();
    setPhase('asking');
    setCaption(null);
    setLabel(null);
    setVerdict(null);
    setChipError(null);
    let granted = cameraPermission?.granted ?? false;
    if (!granted) {
      try { granted = (await withSystemUi(requestCamera)).granted; } catch { granted = false; }
    }
    if (!alive(id)) return;
    scanAllowed.current = granted;
    setCameraAllowed(granted);
    // Xin quyền micro ngay trong lần bấm này: Android cần quyền để lấy mẫu sóng âm cho aura.
    try { await withSystemUi(requestRecordingPermissionsAsync); } catch { /* useAutoListen báo lại khi nghe */ }
    if (!alive(id)) return;
    if (await say(introLine(topic.task), id)) startScan();
  }

  async function handleLock(photo: Photo, recognition: Recognition) {
    if (!topic) return discardTemp(photo.uri);
    const id = bump();
    clearCountdown();
    void haptic.success();
    setChipError(null);
    setVerdict(null);
    setLabel(recognition.label);
    setPhase('asking');
    appendNext.current = false;
    try {
      await setHuntPhoto(topic.id, photo);
    } catch (error) {
      discardTemp(photo.uri);
      if (!alive(id)) return;
      startScan();
      flash(error instanceof Error ? error.message : 'Chưa lưu được ảnh. Em thử lại nhé.');
      return;
    }
    discardTemp(photo.uri);
    if (!alive(id)) return;
    if (!useHunts.getState().progress[topic.id]?.draft?.photo) return startScan();
    if (await say(askFor(topic.ask, recognition.label), id)) listenNow();
  }

  async function handleAudio(uri: string) {
    if (!topic) return discardHuntAudio(uri);
    const id = bump();
    setPhase('transcribing');
    let text = '';
    let failure: string | null = null;
    try {
      const form = new FormData();
      await appendHuntFile(form, 'audio', uri);
      const { transcript } = await huntApi.transcribe(form);
      text = typeof transcript === 'string' ? transcript.trim() : '';
    } catch (error) {
      failure = error instanceof Error ? error.message : 'Chưa chép được lời giải thích.';
    } finally {
      discardHuntAudio(uri);
    }
    if (!alive(id)) return;
    if (!text && (!failure || isNoSpeechError(failure))) {
      // 422 hoặc chép ra rỗng: Lumo nhắc rồi nghe lại.
      if (await say(NOT_CLEAR_LINE, id)) listenNow();
      return;
    }
    if (failure) {
      show(failure, 'alert');
      setPhase('review');
      return;
    }
    const draft = useHunts.getState().progress[topic.id]?.draft;
    const merged = mergeTranscript(draft?.explanation ?? '', text, appendNext.current);
    appendNext.current = true;
    editHuntExplanation(topic.id, merged);
    setPhase('review');
    if (merged.length <= HUNT_TEXT_LIMIT) startCountdown(id);
  }

  /** Lumo đọc nhận xét rồi đi tiếp theo kết quả. */
  async function deliver(outcome: Extract<EvaluationOutcome, { kind: 'verdict' }>, id: number) {
    if (!topic) return;
    setVerdict(outcome.verdict);
    setPhase('feedback');
    if (outcome.verdict === 'accepted') {
      void haptic.success();
      setLabel(null);
    }
    if (!await say(outcome.feedback, id)) return;
    const complete = !!useHunts.getState().progress[topic.id]?.completedAt;
    const step = afterFeedback(outcome.verdict, complete);
    if (step === 'listening') {
      appendNext.current = true;
      listenNow();
    } else if (step === 'scanning') {
      startScan();
    } else {
      // Đủ số vật: màn chuyển sang chế độ hoàn thành.
      setPhase('ready');
    }
  }

  async function send() {
    if (!topic) return;
    clearCountdown();
    const state = useHunts.getState();
    const progress = state.progress[topic.id];
    const draft = progress?.draft;
    if (!draft?.photo || state.submitting[topic.id]) return;
    const id = bump();
    const c = ctl.current;
    c?.listen.stop();
    c?.voice.stop();
    setPhase('evaluating');
    setVerdict(null);
    const before = progress.accepted.length;
    await submitHunt(topic, (form, uri) => appendHuntFile(form, 'photo', uri));
    if (!alive(id)) return;
    const after = useHunts.getState();
    const next = after.progress[topic.id];
    const outcome = evaluationOutcome({
      acceptedBefore: before, revision: draft.revision, accepted: next.accepted, draftResult: next.draft?.result, error: after.error[topic.id],
    });
    if (outcome.kind === 'verdict') return deliver(outcome, id);
    // Lỗi mạng: giữ ảnh và chữ, nút gửi để gửi lại. Lỗi lưu: dải đáy hiện "Thử lưu lại".
    if (outcome.kind === 'error') show(outcome.message, 'alert');
    setPhase('review');
  }

  async function retrySave() {
    if (!topic || retrying) return;
    const before = useHunts.getState().progress[topic.id];
    const id = bump();
    setRetrying(true);
    try { await retryHuntSave(topic); } catch { /* savingError vẫn hiện */ } finally { setRetrying(false); }
    if (!alive(id)) return;
    const after = useHunts.getState();
    const next = after.progress[topic.id];
    const outcome = evaluationOutcome({
      acceptedBefore: before.accepted.length, revision: before.draft?.revision ?? -1, accepted: next.accepted, draftResult: next.draft?.result,
    });
    if (outcome.kind === 'verdict' && !after.savingError[topic.id]) void deliver(outcome, id);
  }

  async function pickPhoto() {
    if (!topic || picking) return;
    const id = bump();
    setPicking(true);
    setChipError(null);
    let prepared: Photo | undefined;
    try {
      const picked = await withSystemUi(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 }));
      if (picked.canceled || !picked.assets[0] || !alive(id)) return;
      prepared = await preparePhoto(picked.assets[0].uri);
      const recognition = await api.recognize(prepared.base64);
      if (!alive(id)) return;
      const decision = lockDecision(recognition);
      if (decision === 'lock') {
        const photo = prepared;
        prepared = undefined;
        void handleLock(photo, recognition);
        return;
      }
      flash(scanChipText[chipForDecision(decision)]);
    } catch {
      if (alive(id)) flash(PICK_FAILED);
    } finally {
      discardTemp(prepared?.uri);
      setPicking(false);
    }
  }

  const voice = useLumoVoice();
  const listen = useAutoListen({
    onAudio: (uri) => void handleAudio(uri),
    onNoSpeech: () => {
      bump();
      setPhase('review');
      show(NO_SPEECH_CAPTION, 'alert');
    },
    onError: (message) => {
      bump();
      setPhase('review');
      show(message, 'alert');
    },
  });
  const scan = useScanLoop(camera, (photo, recognition) => void handleLock(photo, recognition));

  useEffect(() => {
    ctl.current = { voice, listen, scan };
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (systemUi.current === 0) setAppActive(state !== 'background');
    });
    return () => sub.remove();
  }, []);

  // Rời màn hoặc app xuống nền: dừng tiếng, micro, quét; quay lại thì chờ em bấm "Bắt đầu tìm".
  const [wasLive, setWasLive] = useState(live);
  if (wasLive !== live) {
    setWasLive(live);
    if (!live) {
      setPhase('ready');
      setCounting(false);
      setCaption(null);
      setLabel(null);
      setVerdict(null);
      setChipError(null);
    }
  }
  useEffect(() => {
    if (!live) return;
    const timers = { countdown, chipTimer };
    return () => {
      flow.current += 1;
      if (timers.countdown.current) clearTimeout(timers.countdown.current);
      timers.countdown.current = null;
      if (timers.chipTimer.current) clearTimeout(timers.chipTimer.current);
      const c = ctl.current;
      c?.voice.stop();
      c?.listen.stop();
      c?.scan.stop();
    };
  }, [live]);

  // --- Hành động của em ---

  const draft = useHunts((state) => state.progress[topicId]?.draft);
  const hasText = !!draft?.explanation.trim();

  /** Em chủ động gõ/chạm ô: hủy đếm, tắt micro, bỏ bước tự động đang chờ (Lumo vẫn nói nốt). */
  function takeOver() {
    clearCountdown();
    if (phase === 'asking' || phase === 'listening' || phase === 'feedback') {
      bump();
      listen.stop();
      setPhase('review');
    }
  }

  function edit(value: string) {
    takeOver();
    appendNext.current = true;
    editHuntExplanation(topicId, value);
  }

  function talk() {
    if (!draft?.photo || !label) return;
    bump();
    clearCountdown();
    listenNow();
  }

  function micPress() {
    if (phase === 'listening' || listen.listening) {
      bump();
      listen.pause();
      setPhase('review');
      return;
    }
    if (hasText) return void send();
    talk();
  }

  function rescan() {
    if (phase === 'evaluating' || phase === 'transcribing') return;
    startScan();
  }

  function resumeScan() {
    setChipError(null);
    scan.start();
  }

  return {
    live, phase, caption, label, chipError, counting, verdict, picking, retrying,
    cameraGranted: !!cameraPermission?.granted,
    cameraDenied: cameraAllowed === false,
    voice, listen, scan, draft, hasText,
    begin, edit, takeOver, talk, micPress, rescan, resumeScan, pickPhoto, retrySave,
    send: () => void send(),
  };
}
