import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { HUNT_FILE_LIMIT } from '@/lib/huntTypes';

export async function appendHuntFile(form: FormData, field: 'audio' | 'photo', uri: string) {
  if (Platform.OS === 'web') {
    const file = await (await fetch(uri)).blob();
    if (file.size > HUNT_FILE_LIMIT) throw new Error('Tệp quá lớn. Em chọn tệp nhỏ hơn nhé.');
    const extension = field === 'photo' ? 'jpg' : file.type.startsWith('audio/mp4') ? 'm4a' : 'webm';
    form.append(field, file, `${field}.${extension}`);
    return;
  }
  const file = new File(uri);
  if (!file.exists) throw new Error('Chưa tìm thấy tệp. Em chọn lại nhé.');
  if (file.size > HUNT_FILE_LIMIT) throw new Error('Tệp quá lớn. Em chọn tệp nhỏ hơn nhé.');
  const type = field === 'photo' ? 'image/jpeg' : 'audio/mp4';
  const name = field === 'photo' ? 'photo.jpg' : 'audio.m4a';
  // SDK 58 dùng expo/fetch làm fetch toàn cục: không nhận phần { uri } kiểu React Native
  // (ném lỗi trước khi gửi), chỉ nhận chuỗi, Blob hoặc đối tượng có bytes().
  form.append(field, { name, type, bytes: () => file.bytes() } as unknown as Blob);
}

export function discardHuntAudio(uri: string) {
  try {
    if (Platform.OS === 'web') URL.revokeObjectURL(uri);
    else {
      const file = new File(uri);
      if (file.exists) file.delete();
    }
  } catch { /* Bản ghi nằm trong vùng tệp tạm. */ }
}
