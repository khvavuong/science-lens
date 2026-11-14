# Kế hoạch triển khai Săn đồ vật theo chủ đề

Thực hiện lần lượt theo [bản thiết kế đã duyệt](../specs/2026-11-14-object-hunt-design.md).

**Mục tiêu.** Học sinh tự chọn một trong năm chủ đề và hoàn thành nhiệm vụ khi giải thích đạt cho ba vật khác nhau.

**Kiến trúc.** App giữ bài trên thiết bị, dùng chung bước chuẩn bị ảnh với màn Quét. Fastify cung cấp hai API multipart để chép lời và đánh giá. Cả hai dùng Gemini với thời hạn xử lý hữu hạn.

**Kỹ thuật.** Expo Router, Expo Audio, AsyncStorage, IndexedDB, Fastify, Gemini và FFmpeg.

## Ràng buộc chung

- Năm chủ đề có sẵn, mỗi chủ đề tối đa một vật đang làm dở. Ba vật đạt thì hoàn thành.
- Ghi âm tối đa 30 giây. Ảnh JPEG và âm thanh giới hạn 2 MB mỗi tệp. Phần chữ giới hạn 500 ký tự.
- Lưu ảnh, chữ và phản hồi trên cùng thiết bị. Ảnh và âm thanh chỉ đi qua bộ nhớ máy chủ.
- Bài gửi lại giữ mã vật, tăng phiên bản nội dung khi ảnh hoặc chữ đổi. Bỏ qua phản hồi của phiên bản cũ.

## Các bước

- [x] Định nghĩa danh mục phiên bản 1 trong `server/src/hunt-topics.json`. Tạo bản sao cho app qua `app/scripts/sync-hunt-topics.mjs`. Kiểm tra năm chủ đề, tiêu chí và danh mục đồng nhất.
- [x] Thêm `server/src/hunt.ts` và các hàm Gemini cho chép lời, đánh giá. Đăng ký hai API, xác thực tệp, chủ đề, nội dung và phản hồi. Kiểm tra API với provider giả, bao gồm ảnh sai định dạng, âm thanh quá dài, dữ liệu rỗng và phản hồi AI sai cấu trúc.
- [x] Thêm trạng thái nhiệm vụ và lưu trữ theo nền tảng trong `app/src/lib/hunt*`. Lưu ảnh và lời giải thích trước khi gửi, chỉ tính khi đạt và ghi thành công. Kiểm tra ảnh trùng, gửi lại, phản hồi đến muộn và đủ ba vật.
- [x] Nối tab Thử thách với danh sách, màn nhiệm vụ và hộp lấy ảnh. Bật quyền micro cho Expo Audio, giới hạn thời lượng và đưa bản chép lời về ô sửa. Kiểm tra quay lại sau mất mạng, từ chối quyền và chuyển sang nhập chữ.
- [x] Chạy typecheck, lint app, bộ kiểm thử app và server, Expo Doctor 20/20 và Android export. Chạy luồng web từ chọn ảnh đến hoàn thành với phản hồi API có kiểm soát. Thử dừng ghi sau 30 giây, tải lại bản nháp, gửi lại sau lỗi mạng và lưu lại kết quả sau lỗi IndexedDB.
- [x] Gọi Gemini thật với một bài đạt mỗi chủ đề, một bài âm thanh thiếu ý và một đoạn lời nói tiếng Việt.
- [ ] Kiểm tra camera, quyền micro và bản ghi trên thiết bị Android/iOS thật.
