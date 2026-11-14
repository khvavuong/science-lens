import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.GEMINI_KEY ||= 'test-only';
const { cleanLabel } = await import('./gemini.js');

test('cleanLabel giữ chữ "s", dựng NFC, bỏ ký tự vô hình, gom khoảng trắng', () => {
  assert.equal(cleanLabel('Ly trà sữa'), 'ly trà sữa');
  assert.equal(cleanLabel('Ly trà sữa'.normalize('NFD')), 'ly trà sữa');
  assert.equal(cleanLabel('su\u031B\u0303a'), 'sữa');
  assert.equal(cleanLabel('\uFEFFLy\u200B trà\u00A0s\u200Dữa\n'), 'ly trà sữa');
  assert.equal(cleanLabel(undefined as unknown as string), '');
});
