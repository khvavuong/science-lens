import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import Fastify from 'fastify';
import sharp from 'sharp';
import { ffmpeg } from './ffmpeg.js';

process.env.GEMINI_KEY ||= 'test-only';
const { registerHunt } = await import('./hunt.js');

test('validates hunt uploads and returns feedback for the current item revision', async () => {
  const jpg = await sharp({ create: { width: 64, height: 64, channels: 3, background: 'blue' } }).jpeg().toBuffer();
  const app = Fastify();
  let evaluations = 0;
  let audioCalls = 0;
  await app.register(registerHunt, {
    ai: {
      evaluate: async ({ mission, explanation, acceptedObjects }) => {
        evaluations++;
        assert.match(mission.criteria, /âm thanh/);
        assert.deepEqual(acceptedObjects, []);
        return explanation === 'Thiếu phản hồi'
          ? { verdict: 'accepted', feedback: '' }
          : { verdict: 'needs_detail', feedback: 'Em nghe thấy tiếng gì?' };
      },
      transcribe: async (pcm) => {
        audioCalls++;
        assert.ok(pcm.length > 0 && pcm.length <= 30 * 32000);
        return audioCalls === 1 ? 'Em nghe tiếng lách cách.' : '';
      },
    },
  });

  async function send(route: string, form: FormData) {
    const request = new Request('http://local', { method: 'POST', body: form });
    return app.inject({
      method: 'POST', url: `/api/hunt/${route}`,
      headers: { 'content-type': request.headers.get('content-type')! },
      payload: Buffer.from(await request.arrayBuffer()),
    });
  }
  function report(topic = 'sound', text = 'Em lắc hộp.', image = jpg) {
    const form = new FormData();
    for (const [key, value] of Object.entries({
      topicId: topic, topicVersion: '1', itemId: 'item-1', revision: '2', explanation: text,
    })) form.append(key, value);
    form.append('photo', new Blob([Uint8Array.from(image)], { type: 'image/jpeg' }), 'object.jpg');
    return form;
  }
  function recording(seconds: number, format: 'wav' | 'webm' | 'm4a' = 'wav') {
    const temp = mkdtempSync(join(tmpdir(), 'hunt-fixture-'));
    try {
      // Giữ bảng mẫu M4A ở cuối như bản ghi của thiết bị.
      const path = join(temp, `voice.${format}`);
      const result = spawnSync(ffmpeg ?? 'ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440', '-t', String(seconds), '-ar', '16000', path]);
      assert.equal(result.status, 0, result.stderr.toString());
      const form = new FormData();
      const mime = format === 'm4a' ? 'audio/mp4' : `audio/${format}`;
      form.append('audio', new Blob([Uint8Array.from(readFileSync(path))], { type: mime }), `voice.${format}`);
      return form;
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }
  try {
    const valid = await send('evaluate', report());
    assert.equal(valid.statusCode, 200, valid.body);
    assert.deepEqual(valid.json(), { itemId: 'item-1', revision: 2, verdict: 'needs_detail', feedback: 'Em nghe thấy tiếng gì?' });
    assert.equal((await send('evaluate', report('unknown'))).json().code, 'UNKNOWN_TOPIC');
    assert.equal((await send('evaluate', report('sound', '  '))).statusCode, 400);
    assert.equal((await send('evaluate', report('sound', 'Ảnh sai.', Buffer.from('invalid')))).statusCode, 415);
    assert.equal((await send('evaluate', report('sound', 'Ảnh to.', Buffer.alloc(2_000_001)))).statusCode, 413);
    assert.equal((await send('evaluate', report('sound', 'Thiếu phản hồi'))).statusCode, 503);
    assert.equal(evaluations, 2);
    const voice = await send('transcribe', recording(1));
    assert.equal(voice.statusCode, 200, voice.body);
    assert.equal(voice.json().transcript, 'Em nghe tiếng lách cách.');
    assert.equal((await send('transcribe', recording(31))).json().code, 'RECORDING_TOO_LONG');
    assert.equal((await send('transcribe', recording(30.05))).json().code, 'RECORDING_TOO_LONG');
    assert.equal((await send('transcribe', recording(1, 'webm'))).statusCode, 422);
    assert.equal((await send('transcribe', recording(30, 'm4a'))).statusCode, 422);
    assert.equal(audioCalls, 3);
  } finally { await app.close(); }
});

test('speaks short lines once per text', async () => {
  const app = Fastify();
  let calls = 0;
  let fail = false;
  await app.register(registerHunt, {
    ai: {
      evaluate: async () => { throw new Error('unused'); },
      transcribe: async () => { throw new Error('unused'); },
      speak: async () => {
        calls++;
        if (fail) throw new Error('tts down');
        return { data: Buffer.from('mp3'), ext: 'mp3' as const, durationMs: 1000 };
      },
    },
  });
  const post = (payload: unknown) => app.inject({ method: 'POST', url: '/api/hunt/speak', payload: payload as object });
  try {
    const first = await post({ text: 'Xin chào' });
    assert.equal(first.statusCode, 200);
    assert.deepEqual(first.json(), { audio: Buffer.from('mp3').toString('base64'), mime: 'audio/mpeg' });
    assert.equal(first.headers['cache-control'], 'no-store');
    assert.equal((await post({ text: 'Xin chào' })).statusCode, 200);
    assert.equal(calls, 1);
    assert.equal((await post({ text: 'a'.repeat(301) })).statusCode, 400);
    assert.equal((await post({ text: '   ' })).statusCode, 400);
    assert.equal((await post({})).statusCode, 400);
    fail = true;
    assert.equal((await post({ text: 'Câu mới' })).statusCode, 503);
  } finally { await app.close(); }
});

test('topics in app and server match and every ask has {object}', () => {
  const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  const server = read('./hunt-topics.json');
  assert.deepEqual(server, read('../../app/src/lib/hunt-topics.json'));
  for (const topic of server) assert.match(topic.ask, /\{object\}/);
});
