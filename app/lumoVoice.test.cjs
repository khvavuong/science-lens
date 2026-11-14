const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');

const out = { exports: {} };
runInNewContext(ts.transpileModule(readFileSync(join(__dirname, 'src/lib/lumoVoiceUtil.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: out.exports, module: out, Math, setTimeout, clearTimeout });
const { textHash, audioExt, lumoFileName, safetyTimeoutMs, simulatedLevel, within, LEVEL_TICK_MS } = out.exports;

test('hash tất định, 16 ký tự hex, khác nhau theo câu', () => {
  const a = textHash('Chào bạn, mình là Lumo!');
  assert.equal(a, textHash('Chào bạn, mình là Lumo!'));
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.notEqual(a, textHash('Chào bạn, mình là Lumo?'));
  assert.notEqual(textHash('ab'), textHash('ba'));
  assert.match(textHash(''), /^[0-9a-f]{16}$/);
});

test('không trùng hash trên vài nghìn câu gần giống nhau', () => {
  const seen = new Set();
  for (let i = 0; i < 5000; i++) seen.add(textHash(`Bạn tìm được vật số ${i} rồi!`));
  assert.equal(seen.size, 5000);
});

test('tên tệp theo mime', () => {
  assert.equal(audioExt('audio/mpeg'), 'mp3');
  assert.equal(audioExt('audio/wav'), 'wav');
  assert.equal(audioExt('audio/x-wav'), 'wav');
  assert.equal(audioExt(''), 'mp3');
  assert.match(lumoFileName('xin chào', 'audio/mpeg'), /^lumo-[0-9a-f]{16}\.mp3$/);
  assert.match(lumoFileName('xin chào', 'audio/wav'), /^lumo-[0-9a-f]{16}\.wav$/);
});

test('hẹn giờ an toàn = max(8 s, 120 ms × độ dài)', () => {
  assert.equal(safetyTimeoutMs('ngắn'), 8000);
  assert.equal(safetyTimeoutMs('a'.repeat(100)), 12000);
});

test('mức giả lập nằm trong 0.35..0.7 và dao động', () => {
  const vals = [];
  for (let t = 0; t < 2; t += LEVEL_TICK_MS / 1000) vals.push(simulatedLevel(t));
  for (const v of vals) assert.ok(v >= 0.35 && v <= 0.7 + 1e-9);
  assert.equal(simulatedLevel(0), 0.35);
  assert.ok(Math.max(...vals) - Math.min(...vals) > 0.2);
});

const delay = (ms, v, fail) => new Promise((res, rej) => setTimeout(() => (fail ? rej(new Error(v)) : res(v)), ms));

test('within: trả giá trị khi xong trước hạn', async () => {
  assert.equal(await within(delay(5, 'uri'), 200), 'uri');
});

test('within: quá hạn trả undefined, promise gốc vẫn chạy tiếp', async () => {
  let finished = false;
  const slow = delay(80, 'uri').then((v) => { finished = true; return v; });
  const t0 = Date.now();
  assert.equal(await within(slow, 20), undefined);
  assert.ok(Date.now() - t0 < 70);
  assert.equal(await slow, 'uri');
  assert.ok(finished);
});

test('within: lỗi trước hạn thì reject theo', async () => {
  await assert.rejects(within(delay(5, '503', true), 200), /503/);
});

test('within: dọn hẹn giờ (không giữ tiến trình sống)', async () => {
  const t0 = Date.now();
  await within(Promise.resolve(1), 60_000);
  assert.ok(Date.now() - t0 < 1000);
});
