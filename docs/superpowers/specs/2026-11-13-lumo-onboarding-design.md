# Onboarding LumosLab với Lumo

**Bản thiết kế chờ duyệt.**

Onboarding hiện có một màn giới thiệu. Bản mới chia lời giới thiệu thành ba bước để học sinh 7–12 tuổi lần lượt làm quen với Lumo, hiểu cách khám phá và bắt đầu lần quét đầu tiên.

## Phương án

- Một màn có Lumo chào và nút quét đưa học sinh vào hoạt động nhanh nhất. Phương án này vẫn chỉ có một màn giới thiệu.
- **Ba bước do Lumo dẫn dắt** cho mỗi ý một màn và một hành động chính. Đây là phương án đề xuất theo yêu cầu onboarding nhiều bước.
- Một bài thử tương tác ngay trong onboarding cho học sinh trải nghiệm trước khi quét. Phương án này thêm một lượt thao tác và lặp lại hoạt động sẽ có trong luồng chính.

## Nội dung ba bước

| Bước | Lời của Lumo | Minh họa | Nút chính |
| --- | --- | --- | --- |
| 1. Làm quen | **Chào bạn, mình là Lumo!** Cùng mình tìm xem những đồ vật quanh bạn có gì thú vị nhé. | Ảnh Lumo cyan toàn thân từ tủ đồ web, trên nền kem. | **Tiếp tục** |
| 2. Khám phá | **Một đồ vật, một câu chuyện**. Bạn có thể chụp hoặc chọn ảnh một đồ vật. Mình sẽ kể bạn nghe điều khoa học thú vị về nó. | Tận dụng minh họa quả táo và kính lúp không viền đang có. Một hình camera nhỏ gợi thao tác. | **Tiếp tục** |
| 3. Bắt đầu | **Đến lượt bạn!** Chọn một đồ vật, nghe câu chuyện của nó rồi thử sức với ba câu hỏi. | Lumo cạnh biểu tượng camera và ba mốc theo kiểu Đường ánh sáng. | **Quét vật thể đầu tiên** |

## Bố cục và cách điều hướng

- Nền kem, tiêu đề navy, Be Vietnam Pro và một nút xanh dương ở nửa dưới. Phần minh họa thay đổi theo nội dung từng bước. Các hình và biểu tượng dùng mảng màu mềm, không thêm viền đen quanh nhân vật.
- Dùng ảnh `base.webp` của tủ đồ web cho Lumo, giữ màu cyan, dáng toàn thân và nền trong suốt. Đóng gói ảnh cùng app để màn chào dùng được khi mất mạng.
- Hiện ba mốc tiến độ theo kiểu Đường ánh sáng. Mốc hiện tại dùng vàng, mốc xong dùng xanh và dấu tích. Trình đọc màn hình đọc được “Bước 1 trên 3” và các bước tương ứng.
- **Tiếp tục** và **Quay lại** đổi bước. **Bỏ qua** có ở cả ba bước và đưa về Trang chủ. **Quét vật thể đầu tiên** mở màn Quét hiện tại để học sinh chọn camera hoặc thư viện.
- App ghi nhớ khi học sinh bỏ qua hoặc bấm quét. Người đã hoàn thành bản onboarding hiện tại tiếp tục vào Trang chủ. Nếu đóng app giữa chừng, lần sau bắt đầu lại từ lời chào.
- Lumo nói bằng chữ trên màn hình. Luồng dùng tiếng Việt, không yêu cầu tài khoản, mạng hoặc quyền camera cho đến khi học sinh vào màn Quét.

## Kiểm tra khi triển khai

- Với lần mở đầu, kiểm tra thứ tự ba bước, nút quay lại, bỏ qua từ từng bước và vào Quét từ bước cuối.
- Kiểm tra trạng thái sau khi tải lại app, gồm cả người dùng đã xem bản giới thiệu cũ.
- Kiểm tra màn hình dọc nhỏ, cỡ chữ lớn và Giảm chuyển động. Giữ nút dễ chạm, chữ đọc được và hình Lumo không bị cắt.
