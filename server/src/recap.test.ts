import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { renderRecap } from './recap.js';

test('renders a shareable portrait MP4 from photo, video and Vietnamese captions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'recap-test-'));
  const binary: string = createRequire(import.meta.url)('ffmpeg-static');
  try {
    const input = join(dir, 'input.mp4');
    const generated = spawnSync(binary, ['-y','-loglevel','error','-f','lavfi','-i','color=c=blue:s=360x640:d=1','-c:v','libx264',input]);
    assert.equal(generated.status, 0, generated.stderr.toString());
    const photo = await sharp({ create: { width: 400, height: 300, channels: 3, background: 'yellow' } }).jpeg().toBuffer();
    const voicePath = join(dir, 'voice.wav');
    assert.equal(spawnSync(binary, ['-y','-loglevel','error','-f','lavfi','-i','sine=frequency=440:duration=11',voicePath]).status, 0);
    const output = await renderRecap(photo, await readFile(input), 'Bút bi', 'Viên bi lăn đưa mực lên giấy.', 2, 3, { data: await readFile(voicePath), durationMs: 11_000 });
    if (process.env.RECAP_REVIEW_PATH) await writeFile(process.env.RECAP_REVIEW_PATH, output);
    assert.ok(output.length > 1000 && output.length < 4_000_000);
    const path = join(dir, 'out.mp4'); await writeFile(path, output);
    const decoded = spawnSync(binary, ['-i',path,'-f','null','-']);
    assert.equal(decoded.status, 0);
    assert.match(decoded.stderr.toString(), /720x1280/);
    assert.match(decoded.stderr.toString(), /Audio: aac/);
    assert.match(decoded.stderr.toString(), /Duration: 00:00:12/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
