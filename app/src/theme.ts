// Bảng màu xanh dương và kem vàng đã duyệt trong DESIGN.md.
export const colors = {
  brand: '#1E419D',
  brandPressed: '#17347F',
  brandSoft: '#EBF0FC',
  navy: '#0F2452',
  navySoft: '#22396E', // nền lựa chọn trên khối navy
  bg: '#FCF9F2',
  bgAlt: '#F9F2E5',
  surface: '#F6EBD7',
  lumen: '#FFC93C', // Nền và điểm nhấn, không dùng làm màu chữ trên nền sáng.
  lumenSoft: '#FFF1C9',
  lumenShade: '#E3A91F',
  mint: '#10B0A0',
  mintSoft: '#E3F6F3',
  mintInk: '#0B7A6F', // chữ xanh mint đủ tương phản
  text: '#23334E',
  muted: '#5B6B85',
  divider: '#E7D9C4',
  trail: '#9E8460', // Viền và đường nối của các mốc tiến độ.
  onDarkMuted: '#E9DDC8',
  danger: '#C8463D',
  dangerSoft: '#FBEDEC',
  white: '#FFFFFF',
  black: '#000000',
  cameraShade: '#00000040',
  navyVeil: '#0F245273',
  navyLabel: '#0F24528C',
  mediaShade: {
    clear: '#0A142D00',
    top: '#0A142D8C',
    hint: '#0A142D99',
    mid: '#0A142DC7',
    bottom: '#0A142DE6',
  },
  cameraBand: '#0A142DD1', // dải đáy navy 82% trên camera (Thử thách trực tiếp)
  whiteVeil: '#FFFFFF4D',
  whiteHalf: '#FFFFFF80',
  whiteSubtle: '#FFFFFF24',
  whiteBadge: '#FFFFFF1F',
  pillShadow: '#0F245215',
  lilacSoft: '#EEEAFA', // nền thẻ chủ đề thứ năm của Săn đồ vật, cạnh brandSoft/lumenSoft/surface/dangerSoft
  track: '#0F24521F', // đoạn tiến độ chưa có trên nền thẻ nhạt (navy 12%)
};

export const illustrationColors = {
  apple: '#E5484D',
  stem: '#7A4A2A',
  leaf: '#48A16D',
  ocean: '#4272BF',
  land: '#70B680',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };
export const touch = 48;

export const font = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  black: 'BeVietnamPro_800ExtraBold',
};

export const type = {
  hero: { fontFamily: font.black, fontSize: 30, lineHeight: 37, color: colors.navy, letterSpacing: -0.6 },
  h1: { fontFamily: font.black, fontSize: 26, lineHeight: 32, color: colors.navy, letterSpacing: -0.4 },
  h2: { fontFamily: font.bold, fontSize: 20, lineHeight: 26, color: colors.navy },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 23, color: colors.text },
  bodyStrong: { fontFamily: font.semibold, fontSize: 16, lineHeight: 23, color: colors.text },
  caption: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
} as const;

export const motion = { tap: 150, sheet: 280, scene: 420 };
