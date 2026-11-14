const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');

const out = { exports: {} };
runInNewContext(ts.transpileModule(readFileSync(join(__dirname, 'src/lib/huntScreen.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: out.exports, module: out });
const {
  afterFeedback, evaluationOutcome, mergeTranscript, isNoSpeechError, liveBarState, micAction,
  chipForDecision, scanChipText, introLine,
} = out.exports;
// Đối tượng tạo trong vm khác realm: chuyển về đối tượng thường trước khi so sánh sâu.
const plain = (value) => JSON.parse(JSON.stringify(value));

test('sau nhận xét: đạt → quét tiếp hoặc hoàn thành; bổ sung → nghe; ảnh/vật → quét', () => {
  assert.equal(afterFeedback('accepted', false), 'scanning');
  assert.equal(afterFeedback('accepted', true), 'complete');
  assert.equal(afterFeedback('needs_detail', false), 'listening');
  assert.equal(afterFeedback('retake_photo', false), 'scanning');
  assert.equal(afterFeedback('change_object', false), 'scanning');
});

test('kết quả chấm đọc từ store', () => {
  const ok = { result: { verdict: 'accepted', feedback: 'Giỏi lắm!' } };
  // Số vật đạt tăng → đạt, nhận xét ở vật cuối (draft đã bị xóa).
  assert.deepEqual(plain(evaluationOutcome({ acceptedBefore: 0, revision: 2, accepted: [ok] })),
    { kind: 'verdict', verdict: 'accepted', feedback: 'Giỏi lắm!' });
  // Lỗi mạng → lỗi, kể cả khi draft còn kết quả cũ.
  assert.deepEqual(plain(evaluationOutcome({
    acceptedBefore: 0, revision: 3, accepted: [], error: 'Mất mạng',
    draftResult: { verdict: 'needs_detail', feedback: 'Cũ', revision: 2 },
  })), { kind: 'error', message: 'Mất mạng' });
  // Kết quả đúng bản vừa gửi.
  assert.deepEqual(plain(evaluationOutcome({
    acceptedBefore: 1, revision: 4, accepted: [ok],
    draftResult: { verdict: 'needs_detail', feedback: 'Em thấy gì nữa?', revision: 4 },
  })), { kind: 'verdict', verdict: 'needs_detail', feedback: 'Em thấy gì nữa?' });
  // Kết quả cũ của bản trước không được đọc lại.
  assert.deepEqual(plain(evaluationOutcome({
    acceptedBefore: 0, revision: 5, accepted: [],
    draftResult: { verdict: 'change_object', feedback: 'Cũ', revision: 4 },
  })), { kind: 'none' });
  assert.deepEqual(plain(evaluationOutcome({ acceptedBefore: 0, revision: 1, accepted: [] })), { kind: 'none' });
});

test('ghép bản chép lời', () => {
  assert.equal(mergeTranscript('', ' Nó dính vào. ', true), 'Nó dính vào.');
  assert.equal(mergeTranscript('Nó dính vào.', 'Kêu cạch.', true), 'Nó dính vào. Kêu cạch.');
  assert.equal(mergeTranscript('Nó dính vào.', 'Kêu cạch.', false), 'Kêu cạch.');
  assert.equal(mergeTranscript('Nó dính vào.', '  ', true), 'Nó dính vào.');
});

test('nhận ra lỗi 422 không có lời nói', () => {
  assert.equal(isNoSpeechError('Chưa nghe rõ lời giải thích. Em có thể ghi lại hoặc nhập chữ.'), true);
  assert.equal(isNoSpeechError('Lỗi máy chủ (500)'), false);
});

test('thanh sóng theo pha', () => {
  const base = { phase: 'scanning', speaking: false, listening: false, paused: false, micDenied: false };
  assert.equal(liveBarState({ ...base, phase: 'ready' }), null);
  assert.deepEqual(plain(liveBarState({ ...base, phase: 'ready', speaking: true })), { tone: 'lumo', label: 'Lumo' });
  assert.deepEqual(plain(liveBarState(base)), { tone: 'idle', label: 'Đang tìm' });
  assert.deepEqual(plain(liveBarState({ ...base, phase: 'listening', listening: true })), { tone: 'me', label: 'Em' });
  assert.deepEqual(plain(liveBarState({ ...base, phase: 'listening' })), { tone: 'me', label: 'Em' });
  assert.deepEqual(plain(liveBarState({ ...base, phase: 'transcribing' })),{ tone: 'idle', label: 'Đang nghĩ…' });
  assert.deepEqual(plain(liveBarState({ ...base, phase: 'evaluating' })), { tone: 'idle', label: 'Đang nghĩ…' });
  assert.deepEqual(plain(liveBarState({ ...base, phase: 'review', paused: true })), { tone: 'paused', label: 'Tạm dừng' });
  assert.equal(liveBarState({ ...base, phase: 'review', micDenied: true }), null);
  assert.deepEqual(plain(liveBarState({ ...base, phase: 'scanning', micDenied: true })), { tone: 'idle', label: 'Đang tìm' });
});

test('nút tròn: đang nghe → tạm dừng; có chữ → gửi; còn lại → micro', () => {
  assert.equal(micAction({ listening: true, hasText: true }), 'pause');
  assert.equal(micAction({ listening: false, hasText: true }), 'send');
  assert.equal(micAction({ listening: false, hasText: false }), 'start');
});

test('chuỗi cố định', () => {
  assert.equal(chipForDecision('person'), 'person');
  assert.equal(chipForDecision('unsafe'), 'unsafe');
  assert.equal(chipForDecision('unsure'), 'aim');
  assert.equal(scanChipText.paused, 'Chạm để quét tiếp');
  assert.equal(introLine('Tìm ba vật.'), 'Mình cùng tìm nhé! Tìm ba vật.');
});
