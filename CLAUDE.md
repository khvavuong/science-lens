@AGENTS.md
@app/AGENTS.md

## Riêng cho Claude Code

- Nội dung chung của dự án nằm trong AGENTS.md (import ở trên). Sửa quy tắc ở đó, không sửa ở đây.
- Kiểm tra Expo/React Native API bằng file `.d.ts` trong `app/node_modules` hoặc docs đúng phiên bản SDK 58, không dựa vào trí nhớ.
- Chạy server/web dev bằng background task; chờ cổng sẵn sàng bằng vòng lặp `curl`, không `sleep` dài.
- Trước khi gọi API Gemini thật để test, nhớ: mỗi lần tạo truyện tốn khoảng 6 lượt TTS trên quota khoảng 10 lượt/ngày/model.
