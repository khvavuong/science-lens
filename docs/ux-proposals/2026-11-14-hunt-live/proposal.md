# Thử thách trực tiếp: Đề xuất UX

## Tóm tắt
- Vấn đề: màn Thử thách hiện bắt trẻ bấm nhiều bước (chụp, ghi âm, dừng, chuyển chữ, gửi) cho mỗi đồ vật.
- Khuyến nghị: **Phương án C** (quét toàn màn, nhận ra vật thì mở ngăn kéo), vì giữ cảm giác "đang quét" mà chữ phản hồi vẫn nằm trên nền kem dễ đọc.
- Mockup: https://claude.ai/artifact/VLn78gYDiSU4YCMhTwQA2P (bản cục bộ: `mockup.html` cùng thư mục)

## Bối cảnh và giả định
- Người dùng: trẻ 7–12 tuổi, ở nhà hoặc lớp, một tay cầm máy, tay kia cầm đồ vật hoặc nam châm. Vì vậy càng ít bấm càng tốt.
- Việc cần xong: tìm 3 đồ vật hợp chủ đề và nói được vì sao, mỗi vật được AI xác nhận.
- Đã chốt: hướng **A "gần như live"** chạy trên Expo Go. Không truyền micro/camera liên tục; app tự bắt đầu/dừng ghi theo âm lượng và chụp ngầm ảnh nhỏ theo nhịp.
- Ràng buộc kỹ thuật đã kiểm tra trong `node_modules` (SDK 58):
  - `expo-audio` có `isMeteringEnabled` → sóng âm của trẻ vẽ từ mức âm lượng thật.
  - `expo-audio` có `useAudioSampleListener` cho trình phát → sóng âm Lumo thật nếu phát file audio. Nếu Lumo dùng giọng máy (`expo-speech`) thì sóng là giả lập theo trạng thái đang nói.
  - `expo-camera` chỉ chụp ảnh (`takePictureAsync`, có `shutterSound: false`), không lấy khung hình liên tục trên Expo Go.
- Giả định (cần xác nhận): giọng Lumo dùng giọng máy tiếng Việt (`expo-speech`) vì Gemini TTS chỉ khoảng 10 lượt/ngày/model và server chưa có key ElevenLabs.

## Research: app tham chiếu
| App | Họ làm gì | Vì sao hiệu quả | Không nên chép | Nguồn (năm) |
|---|---|---|---|---|
| Gemini Live (bản thiết kế lại 2026) | Thanh dạng viên thuốc ở đáy chứa sóng âm; chia sẻ camera bên trái, tắt micro bên phải; nút xem bản chép lời ở trên; chạm để ngắt lời | Một chỗ duy nhất cho trạng thái "ai đang nói" | Bản beta, chi tiết còn thay đổi | [9to5Google 04/2026](https://9to5google.com/2026/04/19/gemini-live-app-redesign/), [Android Central](https://www.androidcentral.com/apps-software/ai/i-barely-use-chatbot-after-trying-new-gemini-live) |
| Search Live (Google app) | Khung ngắm ở trên, câu trả lời ở dưới; bản thử nghiệm thu nhỏ camera vì camera toàn màn làm khó thấy câu trả lời | Ưu tiên đọc được câu trả lời | Chỉ thấy trong APK beta | [Android Authority](https://www.androidauthority.com/google-app-search-live-ui-changes-apk-teardown-3719509/), [9to5Google 07/2025](https://9to5google.com/2025/07/28/google-search-live-camera/) |
| Google Lens | Quét ngay khi mở camera; chấm/nhãn neo vào vật; chạm vào vật thì tấm thẻ đáy trồi lên | Nhận diện tức thì, chi tiết để sau | Nhiều chấm cùng lúc gây rối cho trẻ | [9to5Google 2018](https://9to5google.com/2018/05/23/real-time-google-lens-rolling-out/), [MobileSyrup 2018](https://mobilesyrup.com/2018/05/24/real-time-google-lens-redesign-rollout/) |
| Material: phát hiện vật bằng camera | Khung ngắm "thở" khi đang tìm, chuyển thành tiến trình khi khóa vật; sheet kết quả có ảnh nhỏ của vật | Trạng thái rõ không cần chữ | Dùng thanh tiến trình giả | [Material Design](https://m2.material.io/design/machine-learning/object-detection-live-camera.html) |
| Google Translate (chế độ hội thoại) | Tự phát hiện khi người nói dừng; tự đọc bản dịch | Bỏ bấm nút từng lượt; đã nêu rủi ro ngắt quá sớm/quá muộn | Không có | [Google Support](https://support.google.com/translate/answer/6142474?hl=en-GB), [Google Design](https://medium.com/google-design/134deed70268) |

## Pattern rút ra
| Pattern | App dùng | Vì sao hiệu quả | Hợp với ta? |
|---|---|---|---|
| Thanh sóng âm cố định ở đáy, màu theo người nói | Gemini Live | Biết ngay ai đang nói, cả khi tắt tiếng | Có: vàng = Lumo, trắng = em |
| Khung ngắm "thở" rồi khóa vào vật | Lens, Material | Trạng thái quét không cần chữ | Có |
| Tag tên vật neo trên camera | Lens | Xác nhận nhận diện tức thì, sửa được nếu sai | Có (chạm để mở lại ngăn kéo) |
| Sheet kết quả trồi lên, camera vẫn hiện | Lens | Không mất ngữ cảnh | Có: lõi của phương án C |
| Tự phát hiện lúc người nói dừng | Translate | Không phải bấm dừng | Có, kèm nút tạm dừng micro |
| Camera toàn màn suốt buổi | Gemini Live | Đắm chìm | Một phần: chữ trên ảnh khó đọc với trẻ nhỏ |

## Phương án A: Ống kính toàn màn
- Ý tưởng: như Gemini Live có camera. Lời Lumo là phụ đề trên dải tối ở đáy.
- Ưu: đắm chìm, ít chuyển cảnh. Nhược: chữ trắng trên camera khó đọc; không có chỗ cho lịch sử trò chuyện. Công sức S.

## Phương án B: Khung ngắm trên, hội thoại dưới
- Ý tưởng: như bản thử nghiệm mới của Search Live. Camera là khung bo góc 44% chiều cao; dưới là hội thoại.
- Ưu: dễ đọc nhất, có lịch sử. Nhược: camera nhỏ nên cảm giác quét yếu; phần cố định chiếm ~60% màn. Công sức M.

## Phương án C (khuyến nghị): Quét toàn màn, nhận ra vật thì mở ngăn kéo
- Thứ bậc: lúc quét chỉ có camera + khung ngắm; nhận ra vật thì tag "Kẹp giấy" + ngăn kéo chứa câu hỏi của Lumo, thanh sóng, ô nhập.
- Bố cục: thanh trên (quay lại · đường ánh sáng 3 mốc · gợi ý); camera phủ kín; ngăn kéo 44% chiều cao, kéo lên 90% để xem lại cả cuộc trò chuyện.
- Luồng và trạng thái (microcopy):
  1. Vào nhiệm vụ → bấm "Bắt đầu tìm" (tính là chủ động, được phép phát tiếng). Xin quyền camera + micro.
  2. Đang quét: khung ngắm thở, "Đưa đồ vật vào khung". Chụp ngầm ảnh nhỏ, tối đa một yêu cầu nhận diện chạy cùng lúc.
  3. Nhận ra vật: haptic thành công, tag "Kẹp giấy", ngăn kéo trồi lên, Lumo đọc câu hỏi (lấy từ gợi ý của chủ đề, không gọi AI).
  4. Lumo đọc xong → micro tự nghe ("Em"), sóng trắng. Im khoảng 1,2 giây hoặc đủ 30 giây → dừng, chép lời, đưa chữ vào ô.
  5. Gửi đánh giá → "Lumo đang nghĩ…" → Lumo đọc phản hồi.
     - Đạt: "Đạt" + icon, mốc đường ánh sáng chuyển xanh, nút "Tìm vật thứ hai".
     - Cần bổ sung: "Kể thêm một chút", micro tự nghe lại.
     - Cần ảnh rõ hơn / chọn vật khác: ngăn kéo đóng, quay lại quét.
  6. Đủ 3 vật: màn hoàn thành hiện có.
- Lối thay thế: ✕ trên ngăn kéo = "Không phải vật này", quét lại. Gõ vào ô = tắt micro, nút micro đổi thành Gửi. Chạm micro = tạm dừng/nghe tiếp. Chạm tag = mở lại ngăn kéo.
- Lỗi:
  - Camera bị từ chối: "Em có thể chọn ảnh từ thư viện" + nút chọn ảnh.
  - Micro bị từ chối: ô nhập vẫn dùng được, thanh sóng ẩn.
  - Không nghe rõ: "Lumo chưa nghe rõ. Em nói lại nhé", micro nghe lại.
  - Mất mạng: "Chưa kết nối được. Em thử lại nhé" + nút Thử lại; ảnh và chữ vẫn giữ.
- Motion: ngăn kéo 280 ms ease-out; tag pop 320 ms; khung ngắm thở 1,6 s. Reduce Motion: khung ngắm đứng yên, ngăn kéo và tag chỉ mờ dần, sóng âm thay bằng mức âm lượng tĩnh.
- Accessibility: thanh sóng có nhãn "Lumo đang nói" / "Đang nghe em nói" (live region); tag và nút đều có nhãn; đúng/sai có icon + chữ; phụ đề luôn hiện nên tắt tiếng vẫn dùng được.
- iOS/Android: quay lại là chevron (iOS) / mũi tên (Android); nút back Android đóng ngăn kéo trước rồi mới thoát màn.
- Công sức L (vòng lặp quét, phát hiện im lặng, chuyển lượt, ngăn kéo). Rủi ro: chụp ngầm có tiếng màn trập ở một số máy Android; Lumo đọc vào micro gây tự nghe (cần dừng micro khi Lumo nói).

## So sánh
| Tiêu chí | A | B | C |
|---|---|---|---|
| Dễ học lần đầu | Tốt | Tốt | Tốt |
| Cảm giác "đang quét" | Mạnh | Yếu | Mạnh |
| Đọc phản hồi (trẻ 7–8 tuổi) | Kém | Tốt nhất | Tốt |
| Xem lại cuộc trò chuyện | Không | Có | Có (kéo ngăn kéo) |
| Công sức | S | M | L |

## Đặc tả sơ bộ (phương án C)
- Thanh sóng: cao 52, bo 26, nền navy `#0F2452`; 28 vạch rộng 3,5, cao tối đa 32; vàng `#FFC93C` = Lumo, trắng = em.
- Ô nhập 56 cao, bo 28; nút micro tròn 56: nghe = nền trắng/viền vàng, chờ = nền xanh brand, tạm dừng = `mic_off`.
- Tag vật: cao 48, bo tròn, nền trắng, chữ navy 700, icon tích xanh mint.
- Ngăn kéo: bo 24, nấc 0 / 44% / 90%, không làm tối camera.
- Chữ: tiêu đề vật 22/700; câu hỏi 17/600 navy; phụ đề 15; nhãn 13.

## Đo lường và kiểm chứng
- Số lần chạm cho một vật đạt: hiện tại khoảng 6; mục tiêu ≤ 1 (chỉ "Tìm vật tiếp theo").
- Thời gian từ khi nhận ra vật đến khi có phản hồi: mục tiêu < 10 giây.
- Thử với 5 trẻ: tìm 1 vật bằng giọng nói; sửa khi máy nhận sai; tạm dừng micro; dùng ô nhập khi ồn.

## Cần bạn quyết định
1. Chọn phương án (A, B, C hay kết hợp).
2. Giọng Lumo: giọng máy tiếng Việt (miễn phí, tức thì, sóng âm giả lập) hay Gemini TTS (tự nhiên hơn, sóng âm thật, chỉ khoảng 10 lượt/ngày)?
3. Sau khi chép lời: tự gửi ngay cho AI chấm (ít bấm nhất) hay hiện chữ 2 giây để em sửa rồi mới tự gửi?
