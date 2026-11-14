import { spawn } from 'node:child_process';
import { ffmpeg } from './ffmpeg.js';

const bytesPerSecond = 32_000;
const maxSeconds = 30;
const audioTypes = new Set([
  'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/mpeg',
  'audio/webm', 'audio/ogg', 'audio/wav', 'audio/wave', 'audio/x-wav',
]);

type Box = { name: string; start: number; end: number; content: number };

function mp4Boxes(data: Buffer, start: number, end: number) {
  const boxes: Box[] = [];
  while (start + 8 <= end) {
    const size = data.readUInt32BE(start);
    const header = size === 1 ? 16 : 8;
    if (start + header > end) throw new Error('Hộp MP4 không hợp lệ');
    const length = size === 0 ? end - start : size === 1 ? Number(data.readBigUInt64BE(start + 8)) : size;
    if (length < header || length > end - start) throw new Error('Kích thước hộp MP4 không hợp lệ');
    boxes.push({ name: data.toString('ascii', start + 4, start + 8), start, end: start + length, content: start + header });
    start += length;
  }
  if (start !== end) throw new Error('Tệp MP4 không đầy đủ');
  return boxes;
}

/** Đưa bảng mẫu M4A lên trước dữ liệu để FFmpeg đọc được qua stdin mà không ghi tệp. */
function streamableAudio(data: Buffer) {
  if (data.toString('ascii', 4, 8) !== 'ftyp') return data;
  const boxes = mp4Boxes(data, 0, data.length);
  const header = boxes.find((box) => box.name === 'moov');
  const media = boxes.find((box) => box.name === 'mdat');
  if (!header || !media || header.start < media.start) return data;
  if (boxes.some((box) => box.name === 'moof')) throw new Error('Cấu trúc bản ghi MP4 không hợp lệ');

  const moved = Buffer.from(data.subarray(header.start, header.end));
  const containerOrder = ['trak', 'mdia', 'minf', 'stbl'];
  const adjust = (start: number, end: number, depth = 0) => {
    for (const box of mp4Boxes(moved, start, end)) {
      if (box.name === containerOrder[depth]) adjust(box.content, box.end, depth + 1);
      if (box.name !== 'stco' && box.name !== 'co64') continue;
      if (box.content + 8 > box.end) throw new Error('Bảng mẫu MP4 không hợp lệ');
      const wide = box.name === 'co64';
      const width = wide ? 8 : 4;
      const count = moved.readUInt32BE(box.content + 4);
      if (count > Math.floor((box.end - box.content - 8) / width)) throw new Error('Bảng mẫu MP4 bị thiếu');
      for (let i = 0; i < count; i++) {
        const position = box.content + 8 + i * width;
        const offset = wide ? Number(moved.readBigUInt64BE(position)) : moved.readUInt32BE(position);
        if (offset < media.start || offset >= data.length || (offset >= header.start && offset < header.end)) {
          throw new Error('Vị trí mẫu MP4 không hợp lệ');
        }
        if (offset >= header.end) continue;
        if (wide) moved.writeBigUInt64BE(BigInt(offset + moved.length), position);
        else moved.writeUInt32BE(offset + moved.length, position);
      }
    }
  };
  adjust(header.content - header.start, moved.length);
  return Buffer.concat([data.subarray(0, media.start), moved, data.subarray(media.start, header.start), data.subarray(header.end)]);
}

export async function decodeHuntAudio(file: { mime: string; data: Buffer }) {
  if (!audioTypes.has(file.mime)) return { status: 'unsupported' } as const;
  let input: Buffer;
  try { input = streamableAudio(file.data); } catch { return { status: 'unsupported' } as const; }
  const binary = ffmpeg;
  if (!binary) throw new Error('Thiếu FFmpeg');
  const maxBytes = bytesPerSecond * maxSeconds;
  const uncompressed = file.mime === 'audio/wav' || file.mime === 'audio/wave' || file.mime === 'audio/x-wav';
  return new Promise<{ status: 'unsupported' | 'too_long' } | { status: 'ready'; pcm: Buffer }>((resolve, reject) => {
    // Đọc thêm 100 ms để phân biệt bản ghi dài hơn giới hạn với phần đệm codec.
    const child = spawn(binary, [
      '-hide_banner', '-loglevel', 'error', '-protocol_whitelist', 'pipe',
      '-format_whitelist', 'mov,mp3,aac,matroska,webm,ogg,wav',
      '-i', 'pipe:0', '-map', '0:a:0', '-t', '30.1', '-ac', '1', '-ar', '16000', '-f', 's16le', 'pipe:1',
    ], { timeout: 8_000, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
    const chunks: Buffer[] = [];
    child.stdin.on('error', () => {});
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (signal) return reject(new Error('Chuyển đổi âm thanh quá thời gian'));
      const bytes = Buffer.concat(chunks);
      if (code !== 0 || !bytes.length) return resolve({ status: 'unsupported' });
      if (uncompressed ? bytes.length > maxBytes : bytes.length >= maxBytes + bytesPerSecond * 0.1 - 4) {
        return resolve({ status: 'too_long' });
      }
      resolve({ status: 'ready', pcm: bytes.subarray(0, maxBytes) });
    });
    child.stdin.end(input);
  });
}
