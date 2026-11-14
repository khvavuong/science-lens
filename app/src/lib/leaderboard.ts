import type { ImageSource } from 'expo-image';

export interface LeaderboardEntry {
  readonly rank: number;
  readonly name: string;
  readonly suffix: string;
  readonly points: number;
  readonly avatar: ImageSource | number;
}

// Tên và avatar từ danh mục anon-v1. Mã và điểm cố định dành cho bản mẫu.
export const leaderboardEntries: readonly LeaderboardEntry[] = [
  {
    rank: 1, name: 'Cáo Sao Hỏa', suffix: 'PMFVT2MC', points: 1480,
    avatar: require('../../assets/leaderboard/fox.webp'),
  },
  {
    rank: 2, name: 'Gấu trúc Ngân Hà', suffix: 'W8PZJ37W', points: 1360,
    avatar: require('../../assets/leaderboard/panda.webp'),
  },
  {
    rank: 3, name: 'Robot Mặt Trăng', suffix: '3YP9TAWV', points: 1250,
    avatar: require('../../assets/leaderboard/robot.webp'),
  },
  {
    rank: 4, name: 'Gấu Sao Thủy', suffix: 'EXT7SW0F', points: 1180,
    avatar: require('../../assets/leaderboard/bear.webp'),
  },
  {
    rank: 5, name: 'Ong Mặt Trăng', suffix: '1PKA79X2', points: 1090,
    avatar: require('../../assets/leaderboard/bee.webp'),
  },
  {
    rank: 6, name: 'Bướm Tinh Vân', suffix: 'QV734V79', points: 1030,
    avatar: require('../../assets/leaderboard/butterfly.webp'),
  },
  {
    rank: 7, name: 'Mèo Sao Kim', suffix: 'TJ7J72VB', points: 970,
    avatar: require('../../assets/leaderboard/cat.webp'),
  },
  {
    rank: 8, name: 'Hươu Trái Đất', suffix: 'QMCX8CJZ', points: 930,
    avatar: require('../../assets/leaderboard/deer.webp'),
  },
  {
    rank: 9, name: 'Chó Ngân Hà', suffix: '77YWFXNT', points: 880,
    avatar: require('../../assets/leaderboard/dog.webp'),
  },
  {
    rank: 10, name: 'Cá heo Sao Mộc', suffix: '0MJZ2SPK', points: 830,
    avatar: require('../../assets/leaderboard/dolphin.webp'),
  },
  {
    rank: 11, name: 'Vịt Sao Hải Vương', suffix: 'PHD6MD7Y', points: 790,
    avatar: require('../../assets/leaderboard/duck.webp'),
  },
  {
    rank: 12, name: 'Voi Sao Chổi', suffix: 'T7JKWZSA', points: 760,
    avatar: require('../../assets/leaderboard/elephant.webp'),
  },
  {
    rank: 13, name: 'Hươu cao cổ Sao Hỏa', suffix: '87VXXASW', points: 720,
    avatar: require('../../assets/leaderboard/giraffe.webp'),
  },
  {
    rank: 14, name: 'Hamster Sao Thiên Vương', suffix: 'XDHJGW9Y', points: 680,
    avatar: require('../../assets/leaderboard/hamster.webp'),
  },
  {
    rank: 15, name: 'Nhím Sao Băng', suffix: 'XS7QYBAS', points: 640,
    avatar: require('../../assets/leaderboard/hedgehog.webp'),
  },
  {
    rank: 16, name: 'Ngựa Vũ Trụ', suffix: 'ZZ18B1X1', points: 610,
    avatar: require('../../assets/leaderboard/horse.webp'),
  },
  {
    rank: 17, name: 'Kangaroo Sao Thổ', suffix: 'V7PTXRNB', points: 570,
    avatar: require('../../assets/leaderboard/kangaroo.webp'),
  },
  {
    rank: 18, name: 'Koala Mặt Trời', suffix: 'QH97VMDY', points: 540,
    avatar: require('../../assets/leaderboard/koala.webp'),
  },
  {
    rank: 19, name: 'Sư tử Thiên Hà', suffix: 'YKP3R1CW', points: 510,
    avatar: require('../../assets/leaderboard/lion.webp'),
  },
  {
    rank: 20, name: 'Rái cá Sao Thủy', suffix: 'X2XX9HHW', points: 480,
    avatar: require('../../assets/leaderboard/otter.webp'),
  },
  {
    rank: 21, name: 'Cú mèo Mặt Trăng', suffix: 'FGQ95E14', points: 455,
    avatar: require('../../assets/leaderboard/owl.webp'),
  },
  {
    rank: 22, name: 'Chim cánh cụt Tinh Vân', suffix: '4W0D22XB', points: 420,
    avatar: require('../../assets/leaderboard/penguin.webp'),
  },
  {
    rank: 23, name: 'Thỏ Sao Kim', suffix: 'J29QBT8S', points: 390,
    avatar: require('../../assets/leaderboard/rabbit.webp'),
  },
  {
    rank: 24, name: 'Gấu mèo Trái Đất', suffix: 'VSXVVQ16', points: 360,
    avatar: require('../../assets/leaderboard/raccoon.webp'),
  },
  {
    rank: 25, name: 'Gấu trúc đỏ Ngân Hà', suffix: '0CRBW4SF', points: 335,
    avatar: require('../../assets/leaderboard/red-panda.webp'),
  },
  {
    rank: 26, name: 'Hải cẩu Sao Mộc', suffix: 'JHYW1YTT', points: 305,
    avatar: require('../../assets/leaderboard/seal.webp'),
  },
  {
    rank: 27, name: 'Chim sẻ Sao Hải Vương', suffix: '4JB67SHM', points: 280,
    avatar: require('../../assets/leaderboard/sparrow.webp'),
  },
  {
    rank: 28, name: 'Sóc Sao Chổi', suffix: '8YEBG69C', points: 250,
    avatar: require('../../assets/leaderboard/squirrel.webp'),
  },
  {
    rank: 29, name: 'Hổ Sao Hỏa', suffix: 'TSDPAJED', points: 225,
    avatar: require('../../assets/leaderboard/tiger.webp'),
  },
  {
    rank: 30, name: 'Rùa Sao Thiên Vương', suffix: '9S4TVBQW', points: 200,
    avatar: require('../../assets/leaderboard/turtle.webp'),
  },
];
