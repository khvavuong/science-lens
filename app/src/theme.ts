// Design tokens – spec mục 06 (light-first) + đề xuất v2 "Đường ánh sáng" đã duyệt.
export const colors = {
  brand: '#1A53CD',
  brandPressed: '#1544AA',
  navy: '#0F2452',
  navySoft: '#22396E', // nền lựa chọn trên khối navy
  bg: '#FFFFFF',
  bgAlt: '#F6F9FF',
  surface: '#EAF2FF',
  lumen: '#FFC93C', // trạng thái "sáng": chỉ làm NỀN, không dùng làm màu chữ trên nền trắng
  lumenSoft: '#FFF4D1',
  mint: '#10B0A0',
  mintSoft: '#E3F6F3',
  mintInk: '#0B7A6F', // chữ xanh mint đủ tương phản
  text: '#23334E',
  muted: '#5B6B85',
  divider: '#DEE8F6',
  trail: '#C9D8F2', // vệt chấm của đường ánh sáng
  danger: '#C8463D',
  dangerSoft: '#FBEDEC',
  white: '#FFFFFF',
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
