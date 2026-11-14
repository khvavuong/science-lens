import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Từ thư mục repo, chạy node app/scripts/generate-startup-wordmark.mjs sau khi cài dependencies của server.
const sharp = createRequire(new URL('../../server/package.json', import.meta.url))('sharp');

// Đường đi của bút theo tọa độ ảnh gốc 1024 × 207.
const letters = [
  { left: 0, right: 53, from: 0, to: 108, strokes: [
    { path: 'M26 36 V175', length: 139, width: 50 },
  ] },
  { left: 53, right: 193, from: 108, to: 240, strokes: [
    { path: 'M80 76 V125 C80 164 94 177 123 177 C152 177 167 162 167 125 V76', length: 250, width: 53 },
  ] },
  { left: 193, right: 402, from: 240, to: 404, strokes: [
    { path: 'M219 76 V179', length: 103, width: 53 },
    { path: 'M220 118 C223 61 299 59 299 118 V179', length: 182, width: 58 },
    { path: 'M300 118 C302 61 375 59 375 118 V179', length: 182, width: 58 },
  ] },
  { left: 402, right: 539, from: 404, to: 539, strokes: [
    { path: 'M471 77 C446 77 428 98 428 126 C428 154 446 177 471 177 C496 177 515 155 515 126 C515 98 496 77 471 77', length: 294, width: 55 },
  ] },
  { left: 539, right: 664, from: 539, to: 690, strokes: [
    { path: 'M631 83 C604 66 566 74 568 100 C570 129 629 118 635 147 C642 177 604 189 567 169', length: 211, width: 58 },
  ] },
  { left: 664, right: 714, from: 710, to: 810, strokes: [
    { path: 'M689 35 V176', length: 141, width: 49 },
  ] },
  { left: 714, right: 871, from: 810, to: 979, strokes: [
    { path: 'M786 77 C758 77 740 98 740 126 C740 155 758 177 786 177 C813 177 833 155 833 126 C833 98 813 77 786 77', length: 307, width: 56 },
    { path: 'M842 77 V176', length: 99, width: 55 },
  ] },
  { left: 871, right: 1024, from: 979, to: 1160, strokes: [
    { path: 'M898 27 V178', length: 151, width: 51 },
    { path: 'M947 76 C922 76 900 97 900 126 C900 155 921 177 947 177 C974 177 994 155 994 126 C994 97 974 76 947 76', length: 310, width: 56 },
  ] },
];

const width = 672;
const height = 136;
const fps = 60;
const duration = 1562;
const wordSplit = 664;
const clamp = (value) => Math.max(0, Math.min(1, value));

function inkMask(elapsed) {
  const letter = letters.find(({ to }) => elapsed < to);
  if (!letter) return '';

  const strokeTime = (letter.to - letter.from) / letter.strokes.length;
  const paths = letter.strokes.map(({ path, length, width: strokeWidth }, index) => {
    const progress = clamp((elapsed - letter.from) / strokeTime - index);
    if (progress === 0) return '';
    return `<path d="${path}" stroke-width="${strokeWidth}" stroke-dasharray="${length} ${length}" stroke-dashoffset="${length * (1 - progress)}"/>`;
  }).join('');

  return `<mask id="ink" x="0" y="0" width="1024" height="207" maskUnits="userSpaceOnUse">
    <rect width="${letter.left}" height="207" fill="white"/>
    <clipPath id="letter"><rect x="${letter.left}" width="${letter.right - letter.left}" height="207"/></clipPath>
    <g clip-path="url(#letter)" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
  </mask>`;
}

function bridge(elapsed, shift) {
  const stretch = clamp((elapsed - 775) / 195);
  const release = clamp((elapsed - 970) / 110);
  if (stretch === 0 || release === 1) return '';

  const left = 653;
  const right = 674 + shift;
  const center = (left + right) / 2;
  const edge = 22 * Math.min(stretch * 5, 1) * (1 - release);
  const neck = 12 * (1 - stretch ** 3);
  const leftTip = left + (center - left) * (1 - release) ** 2;
  const rightTip = right - (right - center) * (1 - release) ** 2;
  const liquid = release === 0
    ? `<path d="M${left} ${-edge} Q${left + 12} ${-neck} ${center} ${-neck}
      Q${right - 12} ${-neck} ${right} ${-edge} V${edge} Q${right - 12} ${neck} ${center} ${neck}
      Q${left + 12} ${neck} ${left} ${edge} Z" fill="url(#liquid)"/>`
    : `<g opacity="${1 - release}">
      <path d="M${left} ${-edge} Q${left + 7} 0 ${leftTip} 0 Q${left + 7} 0 ${left} ${edge} Z" fill="#0F2452"/>
      <path d="M${right} ${-edge} Q${right - 7} 0 ${rightTip} 0 Q${right - 7} 0 ${right} ${edge} Z" fill="#00A9DA"/>
    </g>`;
  return `<g transform="translate(0 148)">${liquid}</g>`;
}

function renderFrame(logo, time) {
  const elapsed = time / 1.26;
  const mask = inkMask(elapsed);
  const shift = 32 * clamp((elapsed - 775) / 195) * (1 - clamp((elapsed - 970) / 110)) ** 2;
  const ink = `<use href="#logo"${mask ? ' mask="url(#ink)"' : ''}/>`;
  const art = shift === 0 ? ink : `<g clip-path="url(#lumos)">${ink}</g>
    <g transform="translate(${shift} 0)"><g clip-path="url(#lab)">${ink}</g></g>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1024 207">
    <defs>
      <image id="logo" href="data:image/png;base64,${logo}" width="1024" height="207"/>
      <clipPath id="lumos"><rect width="${wordSplit}" height="207"/></clipPath>
      <clipPath id="lab"><rect x="${wordSplit}" width="${1024 - wordSplit}" height="207"/></clipPath>
      <linearGradient id="liquid"><stop stop-color="#0F2452"/><stop offset="1" stop-color="#00A9DA"/></linearGradient>
      ${mask}
    </defs>
    ${bridge(elapsed, shift)}${art}
  </svg>`;
  return sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
}

const assets = new URL('../assets/', import.meta.url);
const logo = await readFile(new URL('lumoslab-wordmark.png', assets), 'base64');
const frames = [];
const delays = [];
for (let index = 0; ; index++) {
  const time = Math.round(index * 1000 / fps);
  if (time >= duration) break;
  frames.push(await renderFrame(logo, time));
  delays.push(Math.min(duration, Math.round((index + 1) * 1000 / fps)) - time);
}

// Một lượt phát, giữ khung cuối trên màn hình nếu ứng dụng còn đang tải.
await sharp(Buffer.concat(frames), { raw: { width, height: height * frames.length, pageHeight: height, channels: 4 } })
  .webp({ loop: 1, delay: delays, quality: 90, alphaQuality: 100, effort: 4, minSize: true })
  .toFile(fileURLToPath(new URL('lumoslab-wordmark-intro.webp', assets)));
