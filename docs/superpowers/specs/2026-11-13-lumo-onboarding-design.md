# Onboarding LumosLab với Lumo

**Đã duyệt luồng ba bước.**

Onboarding hiện có một màn giới thiệu. Bản mới chia lời giới thiệu thành ba bước để học sinh 7–12 tuổi lần lượt làm quen với Lumo, hiểu cách khám phá và bắt đầu lần quét đầu tiên.

## Phương án

- Một màn có Lumo chào và nút quét đưa học sinh vào hoạt động nhanh nhất. Phương án này vẫn chỉ có một màn giới thiệu.
- **Ba bước do Lumo dẫn dắt** cho mỗi ý một màn và một hành động chính. Đây là phương án đề xuất theo yêu cầu onboarding nhiều bước.
- Một bài thử tương tác ngay trong onboarding cho học sinh trải nghiệm trước khi quét. Phương án này thêm một lượt thao tác và lặp lại hoạt động sẽ có trong luồng chính.

## Nội dung ba bước

| Bước | Lời của Lumo | Minh họa | Nút chính |
| --- | --- | --- | --- |
| 1. Làm quen | **Chào bạn, mình là Lumo!** Cùng mình tìm xem những đồ vật quanh bạn có gì thú vị nhé. | Lumo cyan ló nửa thân trên từ mép phải, nghiêng sang trái và đưa tay chào về phía trong màn hình. | **Tiếp tục** |
| 2. Khám phá | **Một đồ vật, một câu chuyện**. Bạn có thể chụp hoặc chọn ảnh một đồ vật. Mình sẽ kể bạn nghe điều khoa học thú vị về nó. | Tận dụng minh họa quả táo và kính lúp không viền đang có. Một hình camera nhỏ gợi thao tác. | **Tiếp tục** |
| 3. Bắt đầu | **Đến lượt bạn!** Vì sao con quay không đổ ngay khi xoay? Thử quét một đồ vật để khám phá nhé! | Bố cục A đã chọn. Con quay nằm giữa khung quét xanh nhạt, Lumo ở góc dưới bên phải. Tiêu đề và lời mời nằm dưới minh họa. | **Quét vật thể đầu tiên** |

## Bố cục và cách điều hướng

- Nền kem, tiêu đề navy, Be Vietnam Pro và một nút xanh dương ở nửa dưới. Phần minh họa thay đổi theo nội dung từng bước. Các hình và biểu tượng dùng mảng màu mềm, không thêm viền đen quanh nhân vật.
- Dùng ảnh dáng chào đã duyệt ở bước đầu và ảnh `base.webp` của tủ đồ web ở bước cuối. Đóng gói minh họa WebP cùng app để dùng được khi mất mạng.
- Khi ló ra chào, Lumo vẫy tay nhẹ và chớp mắt, sau đó trở về tư thế đã duyệt. Vệt sáng quét cũng chạy một lần khi đến bước tương ứng. Giảm chuyển động hiển thị tư thế chào và vệt sáng ở vị trí tĩnh.
- Thanh tiến độ dẹt gồm ba đoạn nằm ngay trên nút chính. Đoạn hiện tại màu vàng, đoạn đã qua màu xanh, đoạn kế tiếp màu kem đậm. Số bước vẫn có trong nhãn cho trình đọc màn hình.
- Vuốt sang trái hoặc bấm **Tiếp tục** để sang bước sau. Vuốt sang phải hoặc bấm **Quay lại** để về bước trước. Nút **Bỏ qua** ở đầu cả ba màn và đưa về Trang chủ. Từ bước cuối, bấm **Quét vật thể đầu tiên** để mở màn Quét.
- App ghi nhớ khi học sinh bỏ qua hoặc bấm quét. Người đã hoàn thành bản onboarding hiện tại tiếp tục vào Trang chủ. Nếu đóng app giữa chừng, lần sau bắt đầu lại từ lời chào.
- Lumo nói bằng chữ trên màn hình. Luồng dùng tiếng Việt, không yêu cầu tài khoản, mạng hoặc quyền camera cho đến khi học sinh vào màn Quét.

## Kiểm tra khi triển khai

- Với lần mở đầu, kiểm tra vuốt hai chiều, nút đi tiếp và quay lại, bỏ qua từ từng bước và vào Quét từ bước cuối.
- Kiểm tra trạng thái sau khi tải lại app, gồm cả người dùng đã xem bản giới thiệu cũ.
- Kiểm tra màn hình dọc nhỏ, cỡ chữ lớn và Giảm chuyển động. Giữ nút dễ chạm, chữ đọc được, mắt và tay chào của Lumo nằm trong vùng nhìn thấy.
