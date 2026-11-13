import { mkdtemp, writeFile, readFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const ffmpeg: string | null = createRequire(import.meta.url)('ffmpeg-static');
import sharp from 'sharp';

export async function renderRecap(photo: Buffer, clip: Buffer, label: string, fact: string, score: number, total: number) {
  const dir = await mkdtemp(join(tmpdir(), 'lumos-recap-'));
  try {
    await copyFile(fileURLToPath(new URL('../assets/BeVietnamPro.ttf', import.meta.url)), join(dir, 'font.ttf'));
    await sharp(photo, { limitInputPixels: 30_000_000 }).rotate().resize(720, 1280, { fit: 'contain', background: '#0F2452' }).jpeg().toFile(join(dir, 'photo.jpg'));
    await sharp({ create: { width: 720, height: 1280, channels: 3, background: '#0F2452' } }).png().toFile(join(dir, 'end.png'));
    await writeFile(join(dir, 'clip.mp4'), clip);
    const wrap = (s: string) => s.replace(/[\r\n\x00]/g, ' ').slice(0, 180).match(/.{1,26}(?:\s|$)|.{1,26}/g)?.map(x => x.trim()).join('\n') ?? '';
    await writeFile(join(dir, 'intro.txt'), wrap(`Nhìn quen mà lạ!\n${label}`));
    await writeFile(join(dir, 'fact.txt'), wrap(fact));
    await writeFile(join(dir, 'end.txt'), `Mình vừa khám phá!\nQuiz: ${score}/${total}\nBạn thử đoán xem?\nLumosLab`);
    const text = (file: string, y: string) => `drawtext=fontfile=font.ttf:textfile=${file}:expansion=none:fontsize=34:fontcolor=white:line_spacing=12:x=(w-text_w)/2:y=${y}:box=1:boxcolor=0x0F2452@0.85:boxborderw=20`;
    const filter = `[0:v]fps=24,setsar=1,${text('intro.txt', '100')}[a];[1:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x0F2452,fps=24,setsar=1,${text('fact.txt', 'h-text_h-100')}[b];[2:v]fps=24,setsar=1,${text('end.txt', '(h-text_h)/2')}[c];[a][b][c]concat=n=3:v=1:a=0[out]`;
    await new Promise<void>((resolve, reject) => {
      const child = spawn(ffmpeg!, ['-y','-loglevel','error','-loop','1','-t','3','-i','photo.jpg','-t','15','-i','clip.mp4','-loop','1','-t','3','-i','end.png','-filter_complex',filter,'-map','[out]','-an','-c:v','libx264','-preset','veryfast','-b:v','600k','-maxrate','800k','-bufsize','1600k','-pix_fmt','yuv420p','-movflags','+faststart','out.mp4'], { cwd: dir, timeout: 90_000 });
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
