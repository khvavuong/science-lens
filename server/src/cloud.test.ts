import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import type { Story } from './types.js';

test('polling continues for pending video after image and narration finish', async () => {
  process.env.GEMINI_KEY ||= 'test-only';
  const { unfinished, slots } = await import('./cloud.js');
  const s: Story = { id: 'test', label: 'test', createdAt: 0, status: 'ready', assets: {
    prelude_audio: { status: 'ready' }, scenes: [{ image: { status: 'ready' }, audio: { status: 'ready' }, video: { status: 'pending' } }],
  } };
  assert.equal(unfinished(s), true);
  assert.equal(slots(s).length, 4);
  s.assets.scenes[0].video!.status = 'error';
  assert.equal(unfinished(s), false);
});

test('cloud API rejects unauthorized calls and invalid input without calling providers', async () => {
  const port = 18788;
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: process.cwd(), stdio: 'pipe',
    env: { ...process.env, PORT: String(port), GEMINI_KEY: 'test-only', SUPABASE_URL: 'http://127.0.0.1:1', SUPABASE_SECRET_KEY: 'test-only', APP_API_TOKEN: 'test-only' },
  });
  let logs = '';
  child.stderr.on('data', chunk => { logs += chunk; });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { ready = (await fetch(`http://127.0.0.1:${port}/api/health`)).ok; } catch { /* démarrage */ }
      if (ready) break;
      await delay(100);
    }
    assert.ok(ready, logs);
    const request = (path: string, body: unknown, token?: string) => fetch(`http://127.0.0.1:${port}${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
    });
    assert.equal((await request('/api/stories', { label: 'test' })).status, 401);
    assert.equal((await request('/api/stories', { label: 'test' }, 'wrong-key')).status, 401);
    assert.equal((await request('/api/stories', { label: '' }, 'test-only')).status, 400);
    assert.equal((await request('/api/recognize', { imageBase64: 123 }, 'test-only')).status, 400);
    assert.equal((await request('/api/stories/test/recap', { photoBase64: 'invalid', answers: [0, 0, 0] }, 'test-only')).status, 400);
    assert.equal((await fetch(`http://127.0.0.1:${port}/media/invalid`)).status, 404);
  } finally { child.kill(); }
});
