import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'lumoslab.onboarding.v1';

export async function hasSeenOnboarding() {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'seen';
  } catch {
    // Nếu bộ nhớ không truy cập được, cho vào Trang chủ.
    return true;
  }
}

export async function markOnboardingSeen() {
  try {
    await AsyncStorage.setItem(KEY, 'seen');
  } catch {
    // Không chặn học sinh nếu thiết bị không lưu được trạng thái.
  }
}
