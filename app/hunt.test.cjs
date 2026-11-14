const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');

const source = readFileSync(join(__dirname, 'src/lib/huntTypes.ts'), 'utf8');
const exportsForTest = {};
runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsForTest });
const { applyHuntResult, sameHuntPhoto } = exportsForTest;

test('only accepted, distinct and current revisions count once toward completion', () => {
  const empty = { topicId: 'sound', topicVersion: 1, updatedAt: 10, accepted: [] };
  const draft = (n) => ({ id: String(n), revision: 2, photo: { uri: `data:image/jpeg;base64,${n}` }, explanation: 'Em nghe tiếng lách cách.' });
  const response = (n, verdict = 'accepted', revision = 2) => ({ itemId: String(n), revision, verdict, feedback: 'Em đã nêu được âm thanh.', objectLabel: 'Hộp' });
  const first = { ...empty, draft: draft(1) };
  assert.equal(applyHuntResult(first, response(1, 'accepted', 1), 3), first);
  const offeredHint = applyHuntResult(first, response(1, 'needs_detail'), 3);
  assert.equal(offeredHint.accepted.length, 0);
  assert.equal(offeredHint.draft.result.verdict, 'needs_detail');
  const accepted = applyHuntResult(offeredHint, response(1), 3);
  assert.equal(accepted.accepted.length, 1);
  assert.equal(applyHuntResult(accepted, response(1), 3), accepted);
  const duplicate = { ...accepted, draft: { ...draft(2), photo: draft(1).photo } };
  assert.equal(applyHuntResult(duplicate, response(2), 3), duplicate);
  assert.equal(sameHuntPhoto({ uri: 'x', digest: 'same' }, { uri: 'y', digest: 'same' }), true);
  const second = applyHuntResult({ ...accepted, draft: draft(2) }, response(2), 3);
  const final = applyHuntResult({ ...second, draft: draft(3) }, response(3), 3, 99);
  assert.equal(final.accepted.length, 3);
  assert.equal(final.completedAt, 99);
  assert.equal(final.draft, undefined);
});

// Nạp file TS của app/expo trong sandbox, thay module native bằng stub.
function loadTs(path, stubs) {
  const out = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports: out.exports, module: out,
    require: (id) => { if (id in stubs) return stubs[id]; throw new Error(`Thiếu stub cho ${id}`); },
    Blob, TextEncoder, Uint8Array, Promise, Error, Object, Math, encodeURIComponent,
  });
  return out.exports;
}

test('tệp native gửi được qua expo/fetch (SDK 58 không nhận phần FormData kiểu { uri })', async () => {
  const bytes = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]);
  class StubFile {
    constructor(uri) { this.uri = uri; this.exists = true; this.size = bytes.length; this.name = 'recording-1.m4a'; this.type = ''; }
    async bytes() { return bytes; }
  }
  const { appendHuntFile } = loadTs(join(__dirname, 'src/lib/huntUpload.ts'), {
    'expo-file-system': { File: StubFile },
    'react-native': { Platform: { OS: 'android' } },
    '@/lib/huntTypes': { HUNT_FILE_LIMIT: 2_000_000 },
  });
  const { convertFormDataAsync } = loadTs(require.resolve('expo/src/winter/fetch/convertFormData.ts'), {
    '../../utils/blobUtils': { blobToArrayBufferAsync: (b) => b.arrayBuffer() },
  });
  const parts = [];
  const form = { append: (name, value) => parts.push([name, value]), entries: () => parts };
  await appendHuntFile(form, 'audio', 'file:///cache/recording-1.m4a');
  const { body } = await convertFormDataAsync(form, 'B');
  const text = Buffer.from(body).toString('latin1');
  assert.match(text, /content-disposition: form-data; name="audio"; filename="audio\.m4a"/);
  assert.match(text, /content-type: audio\/mp4/);
  assert.ok(Buffer.from(body).includes(Buffer.from(bytes)));
});

test('api phân biệt lỗi mạng, hết giờ và lỗi trong app (expo/fetch không ném AbortError)', async () => {
  const load = (fetchImpl, fireTimer = false) => {
    const out = { exports: {} };
    runInNewContext(ts.transpileModule(readFileSync(join(__dirname, 'src/lib/api.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText, {
      exports: out.exports, module: out, process: { env: {} },
      require: () => ({ __esModule: true, default: { expoConfig: { hostUri: 'localhost:8090' } } }),
      fetch: fetchImpl, AbortController, FormData, Error, TypeError, String, Promise, console: { warn() {} },
      setTimeout: (fn) => { if (fireTimer) fn(); return 0; }, clearTimeout() {},
    });
    return out.exports.huntApi;
  };
  const message = (p) => p.then(() => '', (e) => e.message);
  // Dựng body hỏng trong app: không được đổ cho mạng.
  assert.doesNotMatch(await message(load(async () => { throw new Error('Unsupported FormDataPart implementation'); }).transcribe(new FormData())), /kết nối/i);
  // Lỗi mạng của expo/fetch và của web.
  assert.match(await message(load(async () => { throw new Error('fetch failed: Network is unreachable'); }).transcribe(new FormData())), /Không kết nối được/);
  assert.match(await message(load(async () => { throw new TypeError('Failed to fetch'); }).transcribe(new FormData())), /Không kết nối được/);
  // Hết giờ: expo/fetch ném FetchError chứ không phải AbortError.
  assert.match(await message(load(async () => { throw new Error('fetch failed: The operation was aborted.'); }, true).transcribe(new FormData())), /quá lâu/);
});
