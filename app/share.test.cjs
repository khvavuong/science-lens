const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function load(name, deps, globals = {}) {
 const exports = {};
 const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'src', name), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
 vm.runInNewContext(code, { exports, require: n => deps[n], ...globals });
 return exports;
}
test('history serializes completion and recap writes and rejects a stale recap', async () => {
 let data;
 class File { constructor(...p) { this.uri = p.map(x => x.uri || x).join('/'); } get exists() { return true; } async copy() {} }
 const history = load('lib/history.ts', {
  '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => data, setItem: async (_, value) => { await new Promise(r => setTimeout(r, 2)); data = value; } } },
  'expo-file-system': { File, Paths: { document: { uri: 'docs' } } },
 });
 const record = { storyId: 'one', label: 'Cup', title: 'Heat', score: 2, total: 3, at: 1, photoUri: 'cache/photo.jpg', recapKey: 'first' };
 await Promise.all([history.saveJourney(record), history.saveRecap('one', 'first', 'docs/video.mp4')]);
 let rows = await history.loadHistory(); assert.equal(rows[0].videoUri, 'docs/video.mp4'); assert.equal(rows[0].photoUri, 'docs/discovery-one.jpg');
 await history.saveJourney(record); assert.equal((await history.loadHistory())[0].videoUri, 'docs/video.mp4');
 await history.saveJourney({ ...record, recapKey: 'second' });
 await history.saveRecap('one', 'first', 'stale.mp4');
 assert.equal((await history.loadHistory())[0].videoUri, undefined);
});
test('recap deduplicates requests, awaits file write, and retries failures', async () => {
 let requests = 0, written = false, fail = true;
 class File { constructor(...p) { this.uri = p.join('/'); } create() {} async write() { await Promise.resolve(); written = true; } }
 const recap = load('lib/recap.ts', {
  'expo-file-system': { File, Paths: { document: 'docs' } }, './api': { API_URL: 'https://test.invalid' },
  './history': { loadHistory: async () => [], saveRecap: async () => assert.ok(written) },
 }, { process: { env: {} }, AbortSignal, Uint8Array, fetch: async () => { requests++; if (fail) return { ok: false, status: 503, json: async () => ({ error: 'quota' }) }; return { ok: true, headers: { get: () => 'video/mp4' }, arrayBuffer: async () => new ArrayBuffer(8) }; } });
 const one = recap.buildRecap('one', 'key', 'photo', [1,2,0]);
 assert.equal(one, recap.buildRecap('one', 'key', 'photo', [1,2,0]));
 await assert.rejects(one, /quota/); fail = false;
 const uri = await recap.buildRecap('one', 'key', 'photo', [1,2,0]);
 assert.match(uri, /docs.*mp4/); assert.equal(requests, 2);
 await recap.buildRecap('one', 'key', 'photo', [1,2,0]); assert.equal(requests, 2);
});

test('card text keeps Vietnamese accents and truncates to the available lines', () => {
 const { cardLines } = load('components/DiscoveryShare.tsx', {
  'expo-file-system': {}, 'expo-sharing': {}, react: {}, 'react-native': { StyleSheet: { create: x => x } }, 'react-native-safe-area-context': {}, 'react-native-svg': {}, './Button': {}, '@/lib/history': {}, '@/theme': { colors: {}, space: {} },
 });
 assert.equal(cardLines('Khám phá ánh sáng', 30, 2)[0], 'Khám phá ánh sáng');
 const lines = cardLines('Một hai ba bốn năm sáu bảy tám chín', 12, 2);
 assert.equal(lines.length, 2); assert.ok(lines[1].endsWith('…'));
});
