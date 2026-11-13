import { mkdtemp, writeFile, readFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { accessSync, constants } from 'node:fs';
// Đường dẫn tĩnh để Vercel đóng gói binary Linux cùng function.
const cloudBinary = new URL('../node_modules/ffmpeg-static/ffmpeg', import.meta.url);
if (process.env.VERCEL) accessSync(cloudBinary, constants.X_OK);
const ffmpeg: string | null = process.env.VERCEL ? fileURLToPath(cloudBinary) : createRequire(import.meta.url)('ffmpeg-static');
import sharp from 'sharp';

export async function renderRecap(photo: Buffer, clip: Buffer, label: string, fact: string, score: number, total: number, narration: { data: Buffer; durationMs: number }) {
  const dir = await mkdtemp(join(tmpdir(), 'lumos-recap-'));
  try {
    await copyFile(fileURLToPath(new URL('../assets/BeVietnamPro.ttf', import.meta.url)), join(dir, 'font.ttf'));
    await sharp(photo, { limitInputPixels: 30_000_000 }).rotate().resize(720, 1280, { fit: 'contain', background: '#0F2452' }).jpeg().toFile(join(dir, 'photo.jpg'));
    await sharp({ create: { width: 720, height: 1280, channels: 3, background: '#0F2452' } }).png().toFile(join(dir, 'end.png'));
    await writeFile(join(dir, 'clip.mp4'), clip);
    const seconds = Math.max(12, Math.min(40, narration.durationMs / 1000 + 1));
    await writeFile(join(dir, 'voice.wav'), narration.data);
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // ffmpeg-static Linux không có drawtext; raster chữ bằng sharp/Pango rồi overlay PNG.
    const caption = async (name: string, text: string) => {
      const png = await sharp({ text: { text: `<span foreground="#FFC93C">${escape(text)}</span>`, font: 'Be Vietnam Pro Bold 40', fontfile: join(dir, 'font.ttf'), width: 600, align: 'centre', rgba: true, spacing: 10 } }).png().toBuffer();
      const meta = await sharp(png).metadata();
      await sharp({ create: { width: 680, height: meta.height! + 48, channels: 4, background: '#0F2452EE' } }).composite([{ input: png, gravity: 'centre' }]).png().toFile(join(dir, name));
    };
    await caption('intro.png', `Ủa alo?!\n${label} có bí mật này nè!`);
    await caption('fact.png', `Plot twist khoa học!\n${fact.slice(0, 180)}`);
    await caption('outro.png', `Não vừa lên level!\nQuiz: ${score}/${total}\nĐố bạn biết đó! • LumosLab`);
    const filter = `[0:v]fps=24,setsar=1,setpts=PTS-STARTPTS[p];[p][3:v]overlay=(W-w)/2:100[a];[1:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x0F2452,fps=24,setsar=1,setpts=PTS-STARTPTS[q];[q][4:v]overlay=(W-w)/2:H-h-120[b];[2:v]fps=24,setsar=1,setpts=PTS-STARTPTS[r];[r][5:v]overlay=(W-w)/2:(H-h)/2[c];[a][b][c]concat=n=3:v=1:a=0[out];[6:a]apad,atrim=duration=${seconds}[voice]`;
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
