# Research playbook

Cách tìm hiểu nhanh và đáng tin xem các app nổi tiếng giải một bài toán UI/UX như thế nào.

## Mục lục
1. Nguồn theo độ tin cậy
2. Truy vấn mẫu
3. Danh mục app theo lĩnh vực
4. Bản đồ "bài toán tương tác → app giải tốt"
5. Mẫu ghi chép cho mỗi app
6. Bẫy thường gặp

## 1. Nguồn theo độ tin cậy

| Mức | Nguồn | Ghi chú |
|---|---|---|
| Cao | Blog chính thức về design/engineering/product của app (vd. blog.duolingo.com), trang App Store/Google Play (ảnh chụp màn hình, mục "What's New") | Đúng với phiên bản gần đây; blog thường giải thích *vì sao* |
| Cao | Apple Human Interface Guidelines (developer.apple.com/design/human-interface-guidelines), Material Design 3 (m3.material.io) | Chuẩn nền tảng: kích thước, cử chỉ, component |
| Khá | Nielsen Norman Group (nngroup.com), Baymard (cho thương mại điện tử) | Nghiên cứu usability có phương pháp |
| Khá | Thư viện ảnh màn hình UI: Mobbin, Page Flows, Refero | Nhiều trang cần đăng nhập, WebFetch có thể thất bại; khi đó dùng tiêu đề và đoạn trích trong kết quả tìm kiếm |
| Trung bình | Case study trên growth.design, uxdesign.cc, Medium, bài teardown | Có ích về *vì sao*, nhưng có thể cũ hoặc suy đoán; kiểm tra ngày viết |
| Thấp | Trí nhớ của model | Dùng để định hướng tìm kiếm, phải đánh dấu *(chưa kiểm chứng)* nếu không xác nhận được |

Ưu tiên nguồn trong khoảng 2–3 năm gần đây. Ghi năm của nguồn khi mô tả UI cụ thể.

## 2. Truy vấn mẫu

- `<app> <tính năng> UX case study`: "Duolingo lesson feedback UX case study"
- `<app> <tính năng> screen flow`: "Cash App send money flow"
- `<pattern> mobile UX best practices`: "swipe to delete mobile UX best practices"
- `<pattern> site:nngroup.com`: "bottom sheet site:nngroup.com"
- `<pattern> site:m3.material.io` / HIG: "bottom sheets human interface guidelines"
- `<app> redesign <năm>`: để biết UI hiện tại khác bản cũ thế nào
- Tên app + "teardown" hoặc "onboarding teardown"

Mỗi lượt WebFetch nên kèm câu hỏi cụ thể: "Mô tả bố cục màn X: cái gì ở trên, giữa, dưới; người dùng tương tác thế nào; phản hồi sau khi bấm là gì."

## 3. Danh mục app theo lĩnh vực

Danh sách khởi đầu, không bắt buộc dùng hết. Chọn app có pattern liên quan đến yêu cầu.

| Lĩnh vực | App tham chiếu |
|---|---|
| Học tập, gamification | Duolingo, Brilliant, Quizlet, Kahoot!, Khan Academy, ELSA Speak, Photomath |
| Trẻ em | Khan Academy Kids, Lingokids, PBS Kids Games, Toca Boca |
| Sức khỏe, thói quen, thiền | Headspace, Calm, Strava, Nike Run Club, Finch, Fabulous |
| Tài chính | Revolut, Monzo, Cash App, MoMo, Money Lover |
| Thương mại, đặt dịch vụ | Shopee, Amazon, Airbnb, Uber Eats, Grab, Booking.com |
| Nội dung, media | TikTok, Instagram (Stories, Reels), YouTube, Spotify, Netflix, Kindle |
| Năng suất | Notion, Todoist, Things 3, Google Calendar, Apple Reminders |
| Nhắn tin | Messenger, Zalo, Telegram, WhatsApp |
| Bản đồ, di chuyển | Google Maps, Apple Maps, Grab, Uber |
| Camera, nhận diện | Google Lens, Seek by iNaturalist, PictureThis, CamScanner, Snapchat |
| Duyệt nhanh dạng thẻ | Tinder, Bumble |

Với thị trường Việt Nam, thêm ít nhất một app phổ biến trong nước (MoMo, Zalo, Shopee, Grab) nếu liên quan, vì người dùng đã quen thao tác của chúng.

## 4. Bản đồ "bài toán tương tác → app giải tốt"

Gợi ý để tìm app *khác lĩnh vực* nhưng giải đúng bài toán. Kiểm chứng chi tiết trước khi đưa vào đề xuất.

| Bài toán | Nơi nên xem |
|---|---|
| Phản hồi đúng/sai tức thì, nhịp bài học | Duolingo (thanh phản hồi trượt lên từ đáy kèm nút Tiếp tục), Brilliant, Kahoot! |
| Tiến độ và lộ trình | Duolingo (lộ trình dạng đường đi), Headspace, khóa học trong Khan Academy |
| Ăn mừng hoàn thành | Duolingo (màn tổng kết bài học), Strava (thành tích), Apple Fitness (đóng vòng) |
| Thói quen, chuỗi ngày | Duolingo (streak), Snapchat (Snapstreak), Finch (nhẹ nhàng, ít gây áp lực) |
| Nhập số tiền nhanh | Cash App (bàn phím số chiếm cả màn), Revolut, MoMo |
| Thêm mục nhanh | Todoist (quick add, hiểu ngôn ngữ tự nhiên), Things 3 (nút thêm kéo thả được) |
| Thao tác vuốt trên danh sách | Apple Mail, Gmail (vuốt để lưu trữ/xóa, có hoàn tác) |
| Bottom sheet nhiều nấc | Google Maps, Apple Maps, Uber |
| Duyệt nội dung dọc toàn màn | TikTok, Instagram Reels, YouTube Shorts |
| Câu chuyện theo từng trang | Instagram Stories (chạm trái/phải, giữ để dừng, vuốt xuống để thoát) |
| Quyết định nhanh từng thẻ | Tinder (vuốt trái/phải, có nút thay thế) |
| Camera và nhận diện | Google Lens, Seek by iNaturalist (hướng dẫn trong khung ngắm, kết quả dạng sheet) |
| Onboarding cho dùng thử trước khi đăng ký | Duolingo (học thử trước khi tạo tài khoản), Headspace |
| Tìm kiếm có bộ lọc | Airbnb (thanh tìm kiếm từng bước, bộ lọc dạng sheet), Shopee |
| Đặt lịch, chọn giờ | Booking.com, Airbnb (lịch chọn khoảng), Google Calendar |
| Empty state có hành động | Notion, Todoist, Spotify (thư viện trống) |
| Màn hình cho trẻ chưa đọc thạo | Khan Academy Kids, Lingokids (hướng dẫn bằng giọng nói, nút lớn, ít chữ) |

## 5. Mẫu ghi chép cho mỗi app

```
### <App> (<năm của nguồn>)
- Màn/tính năng: ...
- Bố cục: trên ... / giữa ... / dưới ... ; CTA chính: ...
- Cử chỉ: ... → nút thay thế: ...
- Phản hồi: animation ..., haptic ..., âm thanh ..., màu + icon ...
- Trạng thái: loading ..., lỗi ..., trống ...
- Vì sao hiệu quả: ...
- Không nên chép / không hợp với ta: ...
- Nguồn: <link> (hoặc *chưa kiểm chứng*)
```

## 6. Bẫy thường gặp

- **Mô tả UI cũ như UI hiện tại.** App lớn thiết kế lại thường xuyên. Ghi năm của nguồn.
- **Chép tính năng không hợp ngữ cảnh.** Duolingo dùng "tim" (giới hạn số lần sai) để kiếm tiền, nhưng cơ chế phạt có thể làm trẻ em hoặc người mới nản. Luôn hỏi: pattern này phục vụ mục tiêu kinh doanh của *họ* hay mục tiêu của người dùng *ta*?
- **Chỉ xem ảnh tĩnh.** Phần đáng học nhiều nhất thường là chuyển động và nhịp: phản hồi xuất hiện lúc nào, kéo dài bao lâu, người dùng làm gì tiếp theo. Tìm video walkthrough hoặc mô tả chi tiết.
- **Bỏ qua khác biệt nền tảng.** Cùng một app có thể làm khác nhau trên iOS và Android (nút back, sheet, picker).
- **Dark pattern.** Không học streak gây cảm giác tội lỗi, đếm ngược giả, nút hủy bị giấu, xác nhận gây xấu hổ ("Không, tôi không muốn tiết kiệm").
