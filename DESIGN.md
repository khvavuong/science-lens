# LumosLab · Hướng dẫn thiết kế

LumosLab giúp học sinh 7–12 tuổi khám phá khoa học từ đồ vật quanh mình. App dùng tiếng Việt, giao diện sáng và bố cục dọc. Mỗi màn hình cần giúp học sinh hiểu mình đang ở đâu, cần làm gì tiếp theo và đã khám phá được gì.

Tài liệu này ghi lại nhận diện v2 và cách áp dụng cho toàn app. Dùng [theme.ts](app/src/theme.ts) làm nguồn giá trị màu, chữ, khoảng cách và chuyển động khi triển khai. Các quy tắc luồng và nội dung nằm trong [AGENTS.md](AGENTS.md).

## Nhận diện thương hiệu

- **Tên hiển thị:** LumosLab. Viết thống nhất trên màn khởi động, Trang chủ và những nơi cần ghi tên app.
- **Dấu hiệu nhận diện:** Ô vuông xanh dương bo góc với chấm vàng ở giữa, đi cùng chữ LumosLab màu navy trên nền sáng. Chừa khoảng trống quanh logo và giữ nguyên tỷ lệ của biểu tượng.
- **Đường ánh sáng:** Dùng một kiểu mốc tiến độ xuyên suốt màn Mở đầu, Hành trình và Quiz. Mốc xong là nút xanh có dấu tích, mốc hiện tại là nút vàng, mốc chưa tới là vòng rỗng, mốc khóa có ổ khóa. Kèm nhãn hoặc tên truy cập để học sinh nhận ra trạng thái qua cả hình và chữ.
- **Giọng điệu:** Tò mò, gần gũi và tôn trọng học sinh. Dùng “bạn”, động từ rõ và câu ngắn. Ví dụ, “Chụp một đồ vật” chỉ dẫn một việc cụ thể. Khi trả lời sai, dùng “Chưa đúng” và giải thích bằng một câu dễ hiểu.

## Bảng màu

| Vai trò | Token | Màu | Cách dùng |
| --- | --- | --- | --- |
| Thương hiệu | `brand` | `#1A53CD` | Nút chính, mốc đã hoàn thành, điều khiển đang hoạt động |
| Nút chính khi nhấn | `brandPressed` | `#1544AA` | Phản hồi nhấn, chữ trắng |
| Xanh navy | `navy` | `#0F2452` | Tiêu đề, chữ trên nền vàng, khối câu hỏi bí ẩn |
| Lựa chọn trên nền tối | `navySoft` | `#22396E` | Nền lựa chọn chưa chọn trong câu hỏi bí ẩn |
| Nền chính và nền phụ | `bg`, `bgAlt` | `#FFFFFF`, `#F6F9FF` | Nền màn hình và vùng nội dung phụ |
| Nền thẻ | `surface` | `#EAF2FF` | Ô biểu tượng, thẻ gợi ý hoặc nhóm nội dung |
| Vàng Lumen | `lumen`, `lumenSoft` | `#FFC93C`, `#FFF4D1` | Nền mốc hiện tại, lựa chọn đang chọn, sao và huy hiệu. Đặt chữ navy trên nền vàng. |
| Thành công | `mint`, `mintSoft`, `mintInk` | `#10B0A0`, `#E3F6F3`, `#0B7A6F` | Điểm nhấn mint, nền phản hồi đúng và chữ mint đậm |
| Văn bản | `text`, `muted` | `#23334E`, `#5B6B85` | Nội dung chính và chú thích |
| Viền và đường nối | `divider`, `trail` | `#DEE8F6`, `#C9D8F2` | Viền thẻ, đường phân cách và đường nối mốc |
| Lỗi và đáp án sai | `danger`, `dangerSoft` | `#C8463D`, `#FBEDEC` | Icon hoặc viền đỏ, nền đỏ nhạt. Dùng chữ nội dung đậm trên nền đỏ nhạt. |

Ưu tiên nền sáng, tiêu đề navy và một điểm nhấn chính trong mỗi vùng nội dung. Tránh hiệu ứng phát sáng và gradient dày. Với chữ thường, kiểm tra độ tương phản tối thiểu **4.5:1**. Chữ trắng trên xanh thương hiệu đạt 6.64:1, chữ navy trên vàng Lumen đạt 9.80:1. Chữ phủ ảnh cần lớp nền tối đủ rõ trên cả cảnh sáng lẫn cảnh tối.

## Font và cỡ chữ

Dùng **Be Vietnam Pro**, font không chân có đầy đủ dấu tiếng Việt. Các giá trị dưới đây là cỡ mặc định ở tỷ lệ chữ hệ thống 100%. Ưu tiên cho chữ xuống dòng và cho nội dung cuộn khi tăng cỡ chữ.

| Vai trò | Cỡ chữ / dòng | Độ đậm | Cách dùng |
| --- | --- | --- | --- |
| Tiêu đề nổi bật | 30 / 37 | 800 | Thông điệp chính trên Trang chủ |
| Tiêu đề màn | 26 / 32 | 800 | Tên truyện, tiêu đề màn và kết quả |
| Tiêu đề mục | 20 / 26 | 700 | Tên nhóm nội dung và đề mục |
| Nội dung | 16 / 23 | 400 | Hướng dẫn, giải thích và nội dung thẻ |
| Nội dung nhấn mạnh | 16 / 23 | 600 | Gợi ý, trạng thái và nội dung cần chú ý |
| Chú thích | 13 / 18 | 500 | Thông tin bổ sung. Nội dung cần để thao tác dùng cỡ nội dung hoặc lớn hơn. |
| Nhãn nút chính | 17 | 700 | Một cụm động từ ngắn |
| Tiêu đề cảnh | 24 / 30 | 800 | Tiêu đề trên ảnh hoặc video cảnh |
| Phụ đề | 19 / 28 | 600 | Một cụm lời kể mỗi lần, trên vùng có độ tương phản ổn định |

Căn trái phần giải thích và câu hỏi để dễ dò dòng. Có thể căn giữa thông điệp ngắn trên màn chào và màn hoàn thành. Với chữ phủ ảnh, dùng giới hạn phóng chữ theo quy ước trong [AGENTS.md](AGENTS.md) và kiểm tra để phụ đề không che nút điều khiển.

## Bố cục và thành phần

- Dùng lưới 4/8 dp, với các khoảng cách mặc định **4, 8, 16, 24, 32 dp**. Dùng 24 dp cho lề ngang chuẩn và 16 dp giữa các nhóm có liên quan.
- Thẻ bo góc **16–24 dp**, vùng chạm tối thiểu **48 × 48 dp**. Dùng icon đi cùng nhãn khi hành động hoặc trạng thái có thể khó đoán. Nút chỉ có icon cần nhãn truy cập bằng tiếng Việt.
- Mỗi màn có một nút chính. Đặt nút ở nửa dưới trong vùng dễ chạm và chừa khoảng an toàn của thiết bị. Nội dung dài được cuộn và không che nút. Thanh điều hướng dưới, nếu có, thuộc Trang chủ.
- Giữ các trạng thái nút nhất quán. Nút chính nền xanh chữ trắng, nút phụ nền sáng chữ xanh hoặc navy. Khi đang xử lý, hiển thị tên công việc thực tế, ví dụ “Đang vẽ cảnh đầu tiên…”.
- Dùng chuyển động ngắn để phản hồi thao tác. Token hiện có là **150 ms** cho nhấn, **280 ms** cho bảng trượt và **420 ms** cho chuyển cảnh. Khi bật Giảm chuyển động, ưu tiên chuyển mờ và tắt hiệu ứng phóng ảnh.

## Minh họa

Phong cách tranh sách khoa học thiếu nhi 2.5D. Ưu tiên đồ vật quen thuộc, đường nét bo tròn, bóng mềm, nền sáng thoáng và một chủ thể chính. Dùng hình để chỉ ra hiện tượng khoa học, ví dụ mặt cắt để thấy hạt bên trong quả táo.

Ảnh cảnh tỷ lệ **9:16**, chủ thể ở khoảng hai phần ba phía trên, 30% bên dưới ít chi tiết để đặt phụ đề. Phụ đề do giao diện hiển thị. Ảnh minh họa cảnh tránh chữ, số và logo. Xem [quy chuẩn minh họa cảnh](prompts/image-style.md).

## Áp dụng theo màn hình

| Màn hình | Bố cục và điểm nhấn |
| --- | --- |
| Khởi động *(dự kiến)* | Logo và tên LumosLab ở giữa trên nền sáng. Kết thúc khi app sẵn sàng. |
| Onboarding *(dự kiến)* | Minh họa chính, câu ngắn và một nút ở phía dưới. Số bước và điểm đến sau onboarding sẽ được chốt trong thiết kế luồng riêng. |
| Trang chủ | Logo ở trên, tiêu đề giới thiệu, minh họa, nút **Quét vật thể ngay**. Đặt Kho khám phá và Thành tích sau hành động chính. |
| Quét vật thể | Ưu tiên ảnh hoặc khung camera. Đặt điều khiển và thẻ kết quả ở phía dưới. Cho chọn ảnh từ thư viện và sửa tên đồ vật khi cần. |
| Mở đầu (Prelude) | Hiển thị ảnh đồ vật, tiêu đề truyện, câu hỏi bí ẩn trên nền navy và các mốc chuẩn bị. Nút **Vào câu chuyện** mở khi cảnh đầu sẵn sàng hoặc sau mốc chờ 25 giây tính từ khi có nội dung truyện. |
| Câu chuyện và Hành trình | Cảnh dọc toàn màn hình, phụ đề dễ đọc ở dưới. Có nút đổi cảnh bên cạnh thao tác vuốt. Mở Hành trình qua tay nắm có nhãn, dùng Đường ánh sáng để phân biệt mốc đã xem, đang xem và bị khóa. |
| Quiz | Mỗi màn một câu, các đáp án xếp dọc. Phản hồi đúng hoặc sai dùng icon, chữ và màu, kèm lời giải thích. |
| Hoàn thành | Hiện huy hiệu, kết quả và một khái niệm khoa học vừa học. Nút chính mời khám phá đồ vật khác. |
| Kho khám phá và Thành tích | Dùng thẻ sáng, tiêu đề rõ và trạng thái trống có lời hướng dẫn ngắn. Phân biệt nội dung đã có và huy hiệu chưa nhận bằng cả chữ và hình. |

## Kiểm tra trước khi duyệt giao diện

- Kiểm tra trên màn dọc nhỏ và lớn, với chữ tiếng Việt dài và khi tăng cỡ chữ hệ thống. Đảm bảo nội dung và nút chính vẫn đọc và chạm được.
- Kiểm tra nút bằng trình đọc màn hình, trạng thái quiz qua chữ và icon, phụ đề trên cảnh sáng và tối.
- Kiểm tra chế độ tắt tiếng, Giảm chuyển động, camera bị từ chối và ảnh hoặc audio AI chưa sẵn sàng. Ở mỗi trạng thái, học sinh cần thấy app đang làm gì và có thể làm gì tiếp.

## Tham chiếu

- Duolingo tổ chức bài học theo từng mốc. LumosLab áp dụng cách chỉ rõ bước hiện tại và bước kế tiếp trong Đường ánh sáng. [Thiết kế đường học của Duolingo](https://blog.duolingo.com/new-duolingo-home-screen-design/)
- Khan Academy Kids sử dụng minh họa và nhân vật để giới thiệu hoạt động. Với nhóm tuổi 7–12 của LumosLab, ưu tiên đồ vật quen thuộc và hình thể hiện hiện tượng khoa học. [Giới thiệu Khan Academy Kids](https://go.learn.khanacademy.org/khanacademy/blog)
