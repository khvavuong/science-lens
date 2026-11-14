# Thử thách trực tiếp (ống kính toàn màn)

**Đã duyệt hướng:** phương án A trong [đề xuất UX](../../ux-proposals/2026-11-14-hunt-live/proposal.md), cộng aura giọng Lumo rõ như Gemini Live. Bản này thay phần "Luồng học sinh" bước 2–4 của [Săn đồ vật theo chủ đề](2026-11-14-object-hunt-design.md); tiêu chí AI, cách tính tiến độ, lưu trên thiết bị và hợp đồng hai API cũ giữ nguyên.

## Vì sao

Mỗi đồ vật hiện cần khoảng 6 lần bấm (chụp, ghi âm, dừng, chuyển chữ, gửi, đóng phản hồi). Trẻ 7–12 tuổi một tay cầm máy, tay kia cầm đồ vật hoặc nam châm. Mục tiêu: sau một lần bấm "Bắt đầu tìm", cả vòng quét → hỏi → trả lời → chấm chạy bằng giọng nói, không cần bấm thêm.

## Mục tiêu, ngoài phạm vi, điều không được xảy ra

- Mục tiêu: camera luôn bật và tự quét; nhận ra vật thì hiện tag; Lumo hỏi bằng giọng; micro tự nghe và tự dừng khi em im; chép lời, tự gửi chấm; Lumo đọc phản hồi; đạt thì tự quét vật tiếp theo.
- Ngoài phạm vi: truyền âm thanh/hình ảnh liên tục (Gemini Live API), nói chen khi Lumo đang nói, bản build riêng ngoài Expo Go.
- Không được: phát tiếng trước khi em bấm "Bắt đầu tìm"; ghi âm khi Lumo đang nói (tự nghe chính mình); gửi ảnh có người; mất bài đang làm khi lỗi mạng.

## Ràng buộc

- Chạy trên Expo Go SDK 58: `expo-camera` chỉ chụp ảnh (không lấy khung hình liên tục), `expo-audio` chỉ ghi ra tệp nhưng có `metering` (mức âm lượng) và `useAudioSampleListener` cho trình phát.
- Mỗi lần quét là một lời gọi Gemini (`/api/recognize`): chỉ một yêu cầu chạy cùng lúc, dừng quét khi đã khóa vật, khi rời màn, và sau 60 giây không nhận ra gì.
- iOS: bật `allowsRecording` thì tiếng phát ra loa trong (loa nghe gọi). Chỉ bật khi đang ghi, tắt trước khi Lumo nói.
- `AGENTS.md` cấm glow và gradient dày. **Ngoại lệ do người dùng yêu cầu:** aura của Lumo ở đáy màn, chỉ hiện khi Lumo đang nói.

## Phương án đã cân nhắc

- **A. Ống kính toàn màn (đã chọn).** Đắm chìm như Gemini Live. Nhược điểm chữ trên camera khó đọc được giảm bằng dải nền tối đặc ở đáy.
- B. Khung ngắm trên, hội thoại dưới. Dễ đọc nhất nhưng cảm giác quét yếu.
- C. Quét rồi mở ngăn kéo. Cân bằng, nhưng người dùng chọn A.
- Live thật bằng Gemini Live API: loại vì cần bỏ Expo Go và tính phí theo phút.

## Thiết kế

### Màn hình (từ trên xuống)

1. Camera phủ kín màn (`CameraView`, camera sau).
2. Thanh trên trên nền trong: quay lại · đường ánh sáng 3 mốc (xong = mint + tích, đang tìm = vàng, chưa tới = vòng rỗng) · nút gợi ý (bóng đèn).
3. Khung ngắm 4 góc ở khoảng 13% chiều cao: đang quét thì "thở" (scale 0.92↔1, 1,6 giây); khóa vật thì góc chuyển vàng.
4. Dưới khung ngắm: chip trạng thái quét "Đưa đồ vật vào khung", hoặc tag tên vật (nền trắng, chữ navy đậm, tích mint).
5. Dải đáy nền navy 82%:
   - phụ đề: lời Lumo đang nói (trắng, đậm) hoặc câu hỏi cũ (mờ) khi đang nghe; dòng nhận xét có icon + chữ kết quả;
   - thanh sóng (viên thuốc navy, cao 52): Lumo = chấm vàng + "Lumo" + vạch vàng; em = micro + "Em" + vạch trắng; đang quét = "Đang tìm" + vạch tĩnh;
   - ô nhập "Nhập lời giải thích…" (trắng, cao 56, bo 28) + nút tròn 56: micro (chờ), micro có viền vàng (đang nghe, chạm để tạm dừng), `mic_off` (tạm dừng), gửi (khi có chữ).
6. **Aura Lumo:** vùng sáng mềm từ mép dưới màn trồi lên phía sau dải đáy, gồm vàng Lumen ở giữa và xanh brand hai bên. Độ cao và độ sáng theo âm lượng giọng Lumo; tắt dần trong 300 ms khi Lumo im. Reduce Motion: không trôi, chỉ đổi độ sáng.

Trước khi bắt đầu: camera đã chạy, dải đáy có câu đề bài và nút chính "Bắt đầu tìm". Bấm là chủ động: xin quyền micro, Lumo đọc đề, bắt đầu quét.

### Vòng lặp

| Pha | Điều xảy ra | Chuyển sang |
|---|---|---|
| Chờ bắt đầu | Camera chạy, chưa quét, chưa phát tiếng | Bấm "Bắt đầu tìm" → Quét |
| Quét | Chụp ngầm (chất lượng 0,5, tắt tiếng màn trập), `preparePhoto`, `/api/recognize`; nghỉ 0,8 giây giữa hai lần | Khóa vật khi `safe` và không có người và `confidence ≥ 0,6` |
| Khóa vật | Haptic thành công, tag tên vật, lưu ảnh bằng `setHuntPhoto` | Lumo hỏi |
| Lumo hỏi | Đọc câu hỏi của chủ đề với tên vật | Đọc xong → Nghe |
| Nghe | Ghi âm có metering; tự dừng khi im 1,2 giây sau khi đã nói, hoặc 30 giây; không nói gì trong 8 giây → dừng, báo, chờ em bấm micro | Có tiếng → Chép lời |
| Chép lời | `/api/hunt/transcribe`, chữ vào ô | Xem lại |
| Xem lại | Đếm ngược 2 giây trên nút gửi; chạm ô để sửa thì hủy đếm | Hết giờ hoặc bấm gửi → Chấm |
| Chấm | `submitHunt` (API cũ) | Lumo nhận xét |
| Lumo nhận xét | Đọc `feedback`. Đạt: mốc chuyển xanh, haptic | Đạt → Quét vật mới (hoặc màn hoàn thành nếu đủ 3); Cần bổ sung → Nghe; Ảnh chưa rõ/Chọn vật khác → Quét |

Các nút thay thế luôn có: chạm micro để nói/tạm dừng; gõ vào ô (tắt micro, nút thành Gửi); chạm tag để quét lại vật khác; nút gợi ý; quay lại.

Quét nhận ra có người: chip "Chỉ để đồ vật trong khung nhé", quét tiếp. `safe = false`: "Thử một vật khác nhé". Quét 60 giây không khóa được vật: dừng quét, chip "Chạm để quét tiếp".

### Lỗi và dự phòng

- Camera bị từ chối: dải đáy hiện "Em có thể chọn ảnh từ thư viện" + nút chọn ảnh; chọn xong đi tiếp từ pha Khóa vật (nhận diện bằng `/api/recognize`).
- Micro bị từ chối: thanh sóng ẩn, ô nhập dùng bình thường.
- Không nghe rõ (422): Lumo nói "Lumo chưa nghe rõ. Em nói lại nhé" rồi nghe lại.
- Lỗi mạng khi chấm: giữ ảnh và chữ, hiện lỗi + nút gửi lại (đã có trong store).
- Giọng Lumo lỗi: đọc bằng `expo-speech`, aura chạy theo nhịp giả lập; phụ đề luôn hiện.

### Giọng Lumo (quyết định của người làm, sửa được)

Server thêm `POST /api/hunt/speak` `{ text }` → `{ audio: base64 mp3 }` dùng `synthesize()` sẵn có (ElevenLabs khi có key, không thì Gemini TTS). Chữ ≤ 300 ký tự, rate limit 20/phút, cache trong bộ nhớ theo chữ (câu hỏi lặp lại không tốn thêm credit). App ghi tệp tạm rồi phát bằng `expo-audio`; âm lượng lấy từ `useAudioSampleListener`. Lỗi → `expo-speech`.

Câu hỏi theo chủ đề nằm trong `hunt-topics.json` (trường mới `ask`, có `{object}`), giữ hai bản app/server khớp nhau.

### Hai quyết định đã tự chốt

- Giọng Lumo dùng TTS server (ElevenLabs) thay vì giọng máy, để aura theo giọng thật.
- Chép lời xong tự gửi sau 2 giây, chạm ô để sửa thì hủy.

### Để người làm tự quyết

- Ngưỡng phát hiện tiếng nói (theo nền ồn đo trong 300 ms đầu), số vạch sóng, kích thước aura chính xác.
- Tách hook/thành phần theo cấu trúc repo.

## Nghiệm thu

1. Bấm "Bắt đầu tìm" một lần, đưa kẹp giấy vào khung: tag hiện, Lumo hỏi, em trả lời bằng giọng, Lumo nhận xét, mốc chuyển xanh, quét vật tiếp theo, không cần bấm thêm.
2. Aura hiện rõ và dao động theo giọng Lumo; vạch trắng dao động theo giọng em.
3. Không phát tiếng trước khi bấm "Bắt đầu tìm"; không ghi âm khi Lumo đang nói; rời màn thì camera, micro, tiếng đều dừng.
4. Từ chối camera, từ chối micro, mất mạng, không nói gì: đều có đường đi tiếp.
5. `tsc`, lint, test app/server sạch; `expo-doctor` 20/20; bundle export Android chạy được.
6. Thử trên máy thật Android/iOS qua Expo Go (người dùng làm).
