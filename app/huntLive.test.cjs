const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');

const out = { exports: {} };
runInNewContext(ts.transpileModule(readFileSync(join(__dirname, 'src/lib/huntLive.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: out.exports, module: out, Math, Infinity, Number });
const { createVoiceDetector, levelFromDb, rmsLevel, askFor, lockDecision } = out.exports;

// Chạy chuỗi (dB, thời lượng ms) mỗi 100 ms, trả danh sách sự kiện khác 'none' kèm thời điểm.
function run(segments, opts) {
  const d = createVoiceDetector(opts);
  const events = [];
  let t = 0;
  for (const [db, ms] of segments) {
    for (let end = t + ms; t < end; t += 100) {
      const e = d.push(db, t);
      if (e !== 'none') events.push([e, t]);
    }
  }
  return events;
}

test('nói rồi im: đúng một speech rồi end, không end sớm', () => {
  const ev = run([[-55, 300], [-30, 1000], [-55, 1300]]);
  assert.deepEqual(ev.map((e) => e[0]), ['speech', 'end']);
  const silenceStart = 1300;
  assert.ok(ev[1][1] - silenceStart >= 1200);
});

test('phòng ồn: không speech, no-speech ở 8000 ms', () => {
  const ev = run([[-30, 9000]]);
  assert.deepEqual(ev, [['no-speech', 8000]]);
});

test('nói liên tục: max ở 30000 ms', () => {
  const ev = run([[-55, 300], [-20, 30500]]);
  assert.deepEqual(ev.map((e) => e[0]), ['speech', 'max']);
  assert.equal(ev[1][1], 30000);
});

test('tiếng ngắn 100 ms không tính là speech', () => {
  const ev = run([[-55, 300], [-30, 100], [-55, 1000]]);
  assert.deepEqual(ev, []);
});

test('levelFromDb', () => {
  assert.equal(levelFromDb(-60), 0);
  assert.equal(levelFromDb(-10), 1);
  assert.equal(levelFromDb(-35), 0.5);
  assert.equal(levelFromDb(-200), 0);
  assert.equal(levelFromDb(undefined), 0);
});

test('rmsLevel', () => {
  assert.equal(rmsLevel([]), 0);
  assert.equal(rmsLevel([0.5, -0.5]), 1);
  assert.ok(Math.abs(rmsLevel([0.1, -0.1]) - 0.3) < 1e-9);
});

test('askFor thay {object}', () => {
  assert.equal(askFor('Khi em đưa nam châm lại gần {object}, em thấy gì?', 'kẹp giấy'), 'Khi em đưa nam châm lại gần kẹp giấy, em thấy gì?');
  assert.equal(askFor('{object} và {object}', 'x'), 'x và x');
});

test('lockDecision', () => {
  assert.equal(lockDecision({ has_person: true, safe: true, confidence: 0.9 }), 'person');
  assert.equal(lockDecision({ has_person: false, safe: false, confidence: 0.9 }), 'unsafe');
  assert.equal(lockDecision({ has_person: false, safe: true, confidence: 0.59 }), 'unsure');
  assert.equal(lockDecision({ has_person: false, safe: true, confidence: 0.6 }), 'lock');
});
