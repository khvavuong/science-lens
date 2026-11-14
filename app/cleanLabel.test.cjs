// Kiểm tra hàm cleanLabel trong màn Scan (route file nên không import trực tiếp được: lấy đúng dòng khai báo rồi chạy).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const src = fs.readFileSync(path.join(__dirname, 'src/app/scan.tsx'), 'utf8');
const line = src.split('\n').find((l) => l.startsWith('const cleanLabel ='));
assert.ok(line, 'không tìm thấy cleanLabel trong scan.tsx');
const js = ts.transpileModule(`${line}\nexports.cleanLabel = cleanLabel;`, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, { exports: mod.exports });
const { cleanLabel } = mod.exports;

test('giữ nguyên chữ "s" (lỗi cũ: /s+/ thay vì /\\s+/)', () => {
  assert.equal(cleanLabel('Ly trà sữa'), 'Ly trà sữa');
  assert.equal(cleanLabel('Isaac Newton'), 'Isaac Newton');
  assert.equal(cleanLabel('cốc sứ'), 'cốc sứ');
});

test('dựng dấu tổ hợp thành NFC', () => {
  const nfd = 'Ly trà sữa'.normalize('NFD');
  assert.notEqual(nfd, 'Ly trà sữa');
  assert.equal(cleanLabel(nfd), 'Ly trà sữa');
  // u + móc (U+031B) + ngã (U+0303) rời như một số bàn phím gõ ra
  assert.equal(cleanLabel('su\u031B\u0303a'), 'sữa');
});

test('bỏ ký tự vô hình và gom khoảng trắng', () => {
  assert.equal(cleanLabel('\uFEFFLy\u200B trà\u00A0\u00A0s\u200Cữa\n'), 'Ly trà sữa');
  assert.equal(cleanLabel('  C\nh\th  '), 'C h h');
  assert.equal(cleanLabel(''), '');
});
