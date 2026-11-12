# LumosLab

Quét một đồ vật → AI chọn câu chuyện khoa học → xem từng cảnh minh họa, nghe giọng kể tiếng Việt → làm 3 câu thử thách.
Dành cho trẻ em 7–12 tuổi. Thiết kế theo `LumosLab_UIUX_Design_Specification.docx`.

```
scan-science/
├── app/       React Native (Expo SDK 58, expo-router) – 7 màn hình
├── server/    Node + Fastify – giữ API key, điều phối pipeline Gemini
├── prompts/   Tài liệu style prompt ảnh & prompt Story Planner
└── .env       GEMINI_KEY=...   (không commit)
```

## Chạy thử

Cần Node 22+, `ffmpeg` (để nén audio sang mp3; không có thì server tự dùng wav), điện thoại có **Expo Go** và **cùng mạng Wi-Fi** với máy tính.

```bash
# 1. Backend (cổng 8787)
cd server && npm install && npm run dev

# 2. App (terminal khác)
cd app && npm install && npx expo start
```

Quét QR bằng Expo Go (Android) hoặc Camera (iOS). App tự tìm backend theo IP máy đang chạy `expo start`, cổng 8787.
Nếu không kết nối được: tạo `app/.env` với `EXPO_PUBLIC_API_URL=http://<IP-máy-tính>:8787`, và mở firewall cho cổng 8787 (`sudo ufw allow 8787` trên Ubuntu).

Nếu bản Expo Go trên máy chưa hỗ trợ SDK 58, chạy development build: `npx expo run:android`.

## Luồng màn hình

| Route | Màn hình | Ghi chú |
|---|---|---|
| `/` | Home | CTA quét, danh sách hành trình đã làm (mở lại từ cache server) |
| `/scan` | Camera | Khung ngắm, chụp, chọn từ thư viện, đổi camera; xin quyền đúng lúc, từ chối vẫn chọn ảnh được |
| `/discovery` | Nhận diện | Ảnh + tên đồ vật, sửa tên/chọn gợi ý khi không chắc; danh sách công việc thật (không % giả). **Bắt đầu lập truyện ngay khi nhận diện xong**, không chờ bấm xác nhận |
| `/prelude` | Mở đầu | Teaser, voice mở đầu, Câu hỏi bí ẩn, roadmap preview. Nút vào truyện mở khi cảnh 1 sẵn sàng (tối đa chờ 25s) |
| `/story` | Story player | Vuốt ngang đổi cảnh, chạm để play/pause, giữ để ẩn chữ, vuốt lên ở tay nắm mở Roadmap. Phụ đề bám theo thời gian audio; hết lời kể tự sang cảnh sau |
| `/quiz` | Thử thách | 1 câu/màn, chọn → Kiểm tra → giải thích; đúng/sai có icon + chữ, không chỉ dùng màu |
| `/complete` | Hoàn thành | Điểm, huy hiệu, đáp án câu hỏi bí ẩn, các ý đã học; khám phá tiếp / xem lại |

## Pipeline AI (server)

```
POST /api/recognize   ảnh base64 → {label, confidence, alternatives, safe}   (ảnh KHÔNG được lưu)
POST /api/stories     {label} → story (cache theo tên đồ vật), chạy nền:
                      plan JSON → voice mở đầu + ảnh/voice cảnh 1 → các cảnh còn lại
GET  /api/stories/:id trạng thái từng asset (app hỏi lại mỗi 1.5s)
POST /api/stories/:id/retry   tạo lại asset lỗi (vd. sau khi bật billing)
GET  /api/health      model đang dùng + model đang tạm khóa vì hết quota
```

| Bước | Model (theo thứ tự dự phòng) | Thời gian đo được |
|---|---|---|
| Nhận diện | gemini-2.5-flash → gemini-3.1-flash-lite | ~2s |
| Lập câu chuyện | gemini-3.5-flash → gemini-2.5-flash → gemini-3.1-flash-lite | ~7–12s |
| Giọng kể | gemini-3.8-flash-tts → … → gemini-2.5-pro-preview-tts | ~4–8s/đoạn |
| Ảnh minh họa | gemini-3.1-flash-image → gemini-2.5-flash-image | (chưa chạy được, xem dưới) |

- Planner và nhận diện dùng **hedged request**: model chính chậm quá 12s (6s với nhận diện) thì gọi thêm model dự phòng song song, lấy kết quả về trước. Độ trễ Gemini dao động mạnh (cùng model lúc 10s, lúc >45s).
- Model hết quota ngày bị tạm bỏ qua 1 giờ thay vì thử lại vô ích.
- Đổi model bằng biến môi trường, xem `.env.example`.

## Giới hạn của key Free Tier hiện tại

1. **Sinh ảnh: quota = 0.** Phải bật billing trong Google AI Studio thì mới có ảnh minh họa. Hiện app dùng phương án dự phòng trong spec: ảnh người dùng chụp + chuyển động Ken Burns. Sau khi bật billing, gọi `POST /api/stories/:id/retry` (hoặc mở lại truyện) để tạo ảnh cho các truyện đã có.
2. **TTS: khoảng 10 request/ngày cho mỗi model**, mà mỗi truyện cần khoảng 6 request. Server xếp 5 model TTS để cộng dồn quota. Khi tất cả hết, app **tự chuyển sang giọng đọc tiếng Việt của điện thoại** (`expo-speech`), phụ đề vẫn chạy theo từng đoạn.
3. Truyện được cache theo tên đồ vật (`server/data/`), nên demo lại cùng một đồ vật không tốn thêm quota.

## Kiểm tra trước khi demo (theo mục 09 của spec)

- [ ] Máy thật Android/iOS: tắt hẳn app, mở lại, chạy từ camera đến completion
- [ ] Ít nhất 3 đồ vật khác nhau (đã thử: quả táo, bóng đèn, chiếc lá, nam châm)
- [ ] Từ chối quyền camera → vẫn chọn ảnh từ thư viện được
- [ ] Máy để chế độ im lặng / bật Reduce Motion → phụ đề và quiz vẫn dùng được
- [ ] Mạng chậm: truyện vẫn xem được khi ảnh chưa xong
- [ ] Màn hình nhỏ: chữ không tràn, CTA không bị home indicator che

```bash
cd app && npx tsc --noEmit && npx expo lint      # typecheck + lint
cd server && npx tsc                             # typecheck server
```
