import { mkdtemp, writeFile, readFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
import { ffmpeg } from './ffmpeg.js';

export async function renderRecap(photo: Buffer, clip: Buffer, label: string, fact: string, score: number, total: number, narration: { data: Buffer; durationMs: number }) {
  const dir = await mkdtemp(join(tmpdir(), 'lumos-recap-'));
  try {
    await copyFile(fileURLToPath(new URL('../assets/BeVietnamPro.ttf', import.meta.url)), join(dir, 'font.ttf'));
    const framed = await sharp(photo, { limitInputPixels: 30_000_000 }).rotate().resize(528, 590, { fit: 'contain', background: '#FFFFFF' }).extend({ top: 16, bottom: 16, left: 16, right: 16, background: '#FFFFFF' }).png().toBuffer();
    await sharp({ create: { width: 720, height: 1280, channels: 3, background: '#0F2452' } }).composite([{ input: framed, left: 48, top: 420 }]).jpeg().toFile(join(dir, 'photo.jpg'));
    await sharp({ create: { width: 720, height: 1280, channels: 3, background: '#0F2452' } }).png().toFile(join(dir, 'end.png'));
    await writeFile(join(dir, 'clip.mp4'), clip);
    const seconds = Math.max(12, Math.min(40, narration.durationMs / 1000 + 1));
    await writeFile(join(dir, 'voice.wav'), narration.data);
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // ffmpeg-static Linux không có drawtext; raster chữ bằng sharp/Pango rồi overlay PNG.
    const caption = async (name: string, text: string) => {
      const png = await sharp({ text: { text: text.split('\n').map((line, i) => `<span foreground="${i === 0 ? '#FFC93C' : '#FFFFFF'}">${escape(line)}</span>`).join('\n'), font: 'Be Vietnam Pro Bold 42', fontfile: join(dir, 'font.ttf'), width: 510, align: 'centre', rgba: true, spacing: 10 } }).png().toBuffer();
      const meta = await sharp(png).metadata();
      await sharp({ create: { width: 560, height: meta.height! + 48, channels: 4, background: '#0F2452F5' } }).composite([{ input: png, gravity: 'centre' }]).png().toFile(join(dir, name));
    };
    await caption('intro.png', `TƯỞNG QUEN?\nNHÌN KỸ NÈ!`);
    await caption('fact.png', `BÍ MẬT BẬT MÍ\n${fact.slice(0, 180)}`);
    await caption('outro.png', `NÃO VỪA LÊN LEVEL\n${score}/${total} câu đúng\nBạn được mấy điểm?\nLumosLab`);
    const filter = `[0:v]fps=24,setsar=1,setpts=PTS-STARTPTS[p];[p][3:v]overlay=48:180:enable='gte(t,0.15)'[a];[1:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x0F2452,fps=24,setsar=1,setpts=PTS-STARTPTS[q];[q][4:v]overlay=48:H-h-260[b];[2:v]fps=24,setsar=1,setpts=PTS-STARTPTS[r];[r][5:v]overlay=48:(H-h)/2-60[c];[a][b][c]concat=n=3:v=1:a=0[out];[6:a]apad,atrim=duration=${seconds}[voice]`;
    await new Promise<void>((resolve, reject) => {
      const child = spawn(ffmpeg!, ['-y','-loglevel','error','-filter_complex_threads','1','-loop','1','-t','4','-i','photo.jpg','-stream_loop','-1','-t',String(seconds - 8),'-i','clip.mp4','-loop','1','-t','4','-i','end.png','-i','intro.png','-i','fact.png','-i','outro.png','-i','voice.wav','-filter_complex',filter,'-map','[out]','-map','[voice]','-t',String(seconds),'-c:a','aac','-b:a','96k','-c:v','libx264','-threads','2','-preset','veryfast','-b:v','600k','-maxrate','700k','-bufsize','1400k','-pix_fmt','yuv420p','-movflags','+faststart','out.mp4'], { cwd: dir, timeout: 90_000 });
      let error = '';
      child.stderr.on('data', x => { error = (error + x).slice(-1000); });
      child.on('error', reject);
      child.on('close', code => code === 0 ? resolve() : reject(new Error(`Recap encoding failed: ${error}`)));
    });
    const output = await readFile(join(dir, 'out.mp4'));
    if (output.length > 4_000_000) throw new Error('Recap exceeds download limit');
    return output;
  } finally { await rm(dir, { recursive: true, force: true }); }
}
