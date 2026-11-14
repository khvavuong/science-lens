# Nguyên tắc UX mobile và checklist

Phương án nào cũng phải qua các mục này. Mỗi mục có lý do, để khi cần phá lệ thì biết mình đang đánh đổi cái gì.

## Mục lục
1. Chạm và vùng ngón cái
2. Cử chỉ
3. Phản hồi, motion, haptic
4. Trạng thái: loading, empty, error, offline
5. Điều hướng
6. Khác biệt iOS và Android
7. Vùng an toàn, kích thước màn hình
8. Form và bàn phím
9. Accessibility
10. Theo nhóm người dùng
11. Gamification có đạo đức
12. Checklist cuối

## 1. Chạm và vùng ngón cái

- Vùng chạm tối thiểu **44×44pt** (Apple HIG) và **48×48dp** (Material). Lấy 48 làm chuẩn chung. Biểu tượng có thể nhỏ hơn, nhưng vùng chạm thì không.
- Các vùng chạm cách nhau ít nhất 8dp để không bấm nhầm.
- Phần lớn người dùng cầm máy một tay và bấm bằng ngón cái, nên **CTA chính đặt ở nửa dưới**. Nửa trên dành cho thông tin và hành động ít dùng (cài đặt, đóng).
- **Một CTA chính mỗi màn.** Hai nút cùng nổi bật thì người dùng phải dừng lại suy nghĩ.
- Hành động phá hủy (xóa, thoát giữa chừng) đặt xa CTA chính và trông khác hẳn.

## 2. Cử chỉ

**Cử chỉ hệ thống, đừng tranh chấp:**
- iOS: vuốt từ **mép trái** = quay lại (trong navigation stack); vuốt lên từ đáy = về Home/đa nhiệm; vuốt xuống từ đỉnh = Thông báo/Trung tâm điều khiển.
- Android (điều hướng bằng cử chỉ): vuốt từ **cả mép trái lẫn mép phải** = quay lại; vuốt lên từ đáy = Home. App chỉ được xin loại trừ một đoạn ngắn ở mỗi mép (khoảng 200dp chiều dọc).
- Hệ quả: cử chỉ ngang tùy biến (carousel, vuốt thẻ, slider) phải bắt đầu được **từ giữa màn**, không cần vuốt từ mép; không đặt slider sát mép trái/phải.

**Mọi cử chỉ đều cần nút thay thế hiển thị.** Cử chỉ vô hình với người mới, và người dùng screen reader (VoiceOver/TalkBack) không thực hiện được cử chỉ tùy biến. Cung cấp cả accessibility action tương ứng.

**Quy ước người dùng đã quen:**
| Cử chỉ | Nghĩa quen thuộc |
|---|---|
| Chạm | Hành động chính của phần tử |
| Nhấn giữ | Menu ngữ cảnh, xem trước, bắt đầu kéo. Không bao giờ là cách duy nhất để làm một việc |
| Vuốt ngang trên mục danh sách | Hành động nhanh: lưu trữ/xóa/đánh dấu. Hành động phá hủy cần hoàn tác |
| Vuốt ngang trên nội dung phân trang | Trang trước/sau |
| Kéo xuống ở đầu danh sách | Làm mới |
| Vuốt xuống trên sheet/modal | Đóng |
| Kéo tay nắm của sheet | Đổi nấc chiều cao |
| Chụm hai ngón | Phóng to/thu nhỏ |
| Nhấn giữ rồi kéo | Sắp xếp lại |

**Cảm giác vuốt tốt:**
- Phần tử bám theo ngón tay 1:1, không trễ.
- Xác nhận khi vượt ngưỡng khoảng cách (khoảng 30–40% chiều rộng) **hoặc** khi vuốt đủ nhanh; dưới ngưỡng thì bật về vị trí cũ.
- Báo hiệu trước khi xác nhận: icon/màu xuất hiện dần, haptic nhẹ khi vượt ngưỡng.
- Tránh lồng hai vùng cuộn cùng chiều. Cuộn dọc trong trang ngang thì được; ngang trong ngang thì gây tranh chấp.
- Ưu tiên **hoàn tác** hơn hộp thoại xác nhận cho hành động đảo ngược được, vì hộp thoại xác nhận bị bấm qua theo thói quen.

## 3. Phản hồi, motion, haptic

- Mọi lần chạm có phản hồi thị giác trong **dưới 100ms** (trạng thái nhấn).
- Đúng/sai, thành công/lỗi phải có **icon + chữ**, không chỉ màu. Khoảng 8% nam giới có rối loạn sắc giác.
- Thời lượng gợi ý: phản hồi chạm 100–180ms; sheet/modal 200–320ms; chuyển màn 300–500ms; ăn mừng lớn tối đa khoảng 1–2 giây và **bỏ qua được**.
- Easing: vào màn dùng ease-out (nhanh rồi chậm), ra màn dùng ease-in. Chuyển động theo ngón tay dùng spring.
- **Reduce Motion:** thay chuyển động/phóng to bằng fade, tắt parallax và hiệu ứng lặp. Không bỏ hẳn phản hồi.
- Haptic: nhẹ khi chọn, rõ hơn khi thành công/lỗi. Dùng tiết chế, vì rung mọi nơi thì mất ý nghĩa. Máy Android khác nhau nhiều về chất lượng rung.
- Âm thanh là tùy chọn, tôn trọng chế độ im lặng; không bao giờ là kênh thông tin duy nhất.
- Không để animation chặn thao tác: người dùng bấm tiếp được trong lúc animation đang chạy, hoặc animation đủ ngắn.

## 4. Trạng thái: loading, empty, error, offline

- **Loading:** dùng skeleton cho nội dung có cấu trúc biết trước, spinner cho việc ngắn không rõ hình dạng. Không hiện % giả. Hiện phần đã có trước (progressive), không chờ đủ hết.
- **Optimistic update** cho hành động gần như chắc thành công (thích, đánh dấu xong), có cách hoàn tác nếu lỗi.
- **Empty:** giải thích ngắn vì sao trống và một hành động để lấp đầy. Không để màn trắng.
- **Error:** nói chuyện gì xảy ra bằng lời người dùng hiểu, hướng xử lý, nút thử lại. Giữ lại dữ liệu người dùng đã nhập.
- **Offline / mạng chậm:** cho dùng những gì đã có, báo rõ phần nào cần mạng, tự thử lại khi có mạng.
- **Lần đầu dùng:** hướng dẫn trong ngữ cảnh (gợi ý ngay tại chỗ, hoạt ảnh gợi ý cử chỉ một lần) tốt hơn chuỗi màn hướng dẫn dài.

## 5. Điều hướng

- Tab bar dưới 3–5 mục cho các khu vực ngang hàng. Ít hơn 3 thì không cần tab.
- Push (vào sâu, có back) cho phân cấp; modal/sheet cho tác vụ tạm thời tự hoàn chỉnh (tạo mới, chọn, xác nhận).
- Nút back hệ thống của Android phải luôn hoạt động hợp lý: đóng sheet/bàn phím trước, rồi mới lùi màn. Nếu thoát sẽ mất dữ liệu, hỏi lại.
- Luồng dài (quiz, thanh toán, onboarding): thanh tiến độ ở trên, nút thoát rõ ràng, và lưu tiến độ để quay lại.

## 6. Khác biệt iOS và Android

| Khía cạnh | iOS | Android |
|---|---|---|
| Quay lại | Nút back trên trái + vuốt từ mép trái | Cử chỉ/nút back hệ thống (cả hai mép) |
| Tiêu đề thanh trên | Thường căn giữa, có Large Title | Material 3: căn trái hoặc giữa |
| Font hệ thống | SF Pro | Roboto (hoặc font của hãng máy) |
| Icon | SF Symbols | Material Symbols |
| Hộp thoại, action sheet | Alert, action sheet từ đáy | Material dialog, bottom sheet |
| Chọn ngày/giờ | Wheel hoặc lịch inline | Material date/time picker |
| Haptic | Taptic Engine đồng đều | Khác nhau giữa các máy |
| Chia sẻ | Share sheet iOS | Sharesheet Android |

Nguyên tắc: **bố cục và thương hiệu dùng chung, hành vi theo nền tảng** (back, sheet, picker, haptic, cuộn quá đà). Người dùng mỗi nền tảng có phản xạ riêng.

## 7. Vùng an toàn, kích thước màn hình

- Tránh tai thỏ/Dynamic Island, thanh Home (iOS) và thanh điều hướng (Android). Android 15 trở đi (targetSdk 35) mặc định edge-to-edge: app phải tự xử lý insets.
- Thử ở màn nhỏ (khoảng 360×640dp, iPhone SE) và lớn (khoảng 430×932pt). CTA không bị đẩy khỏi màn khi chữ to hoặc khi bàn phím mở.
- Chữ tiếng Việt, tiếng Đức thường dài hơn tiếng Anh: để chỗ cho chữ xuống dòng, không cắt chữ quan trọng.
- Nếu hỗ trợ tablet/xoay ngang thì thiết kế riêng; nếu không thì khóa hướng và nói rõ.

## 8. Form và bàn phím

- Đúng loại bàn phím (số, email, điện thoại), bật autofill/autocomplete.
- Ô đang nhập không bị bàn phím che; nút gửi vẫn với tới được khi bàn phím mở.
- Ít trường nhất có thể; giá trị mặc định thông minh; kiểm tra lỗi ngay tại trường khi người dùng rời trường, không phải lúc gõ từng ký tự.
- Nhập số tiền: định dạng hàng nghìn khi gõ, đơn vị tiền rõ ràng.

## 9. Accessibility

- Tương phản chữ thường ≥ **4.5:1**, chữ lớn và thành phần giao diện ≥ **3:1** (WCAG).
- Hỗ trợ cỡ chữ hệ thống (Dynamic Type / font scale) ít nhất đến khoảng 200% mà bố cục không vỡ. Chữ đè lên ảnh có thể giới hạn hệ số phóng to.
- Mọi phần tử tương tác có label, role, state cho screen reader; thứ tự focus hợp lý; nhóm phần tử liên quan.
- Không chỉ dựa vào màu, âm thanh hay cử chỉ để truyền thông tin.
- Media có phụ đề/transcript; video không tự phát có tiếng.
- Tôn trọng Reduce Motion, Reduce Transparency, Bold Text.

## 10. Theo nhóm người dùng

- **Trẻ em (khoảng 4–12 tuổi):** vùng chạm lớn hơn (56–64dp), ít chữ và có hướng dẫn bằng hình/giọng, phản hồi tích cực khi sai ("Gần đúng rồi!"), không quảng cáo hay mua hàng lẫn trong nội dung, khu vực cài đặt/mua hàng có cổng phụ huynh, tránh cơ chế phạt (mất tim, mất chuỗi) gây căng thẳng.
- **Người lớn tuổi:** chữ lớn, tương phản cao, ít cử chỉ ẩn, xác nhận rõ ràng. Nhãn chữ cho CTA chính và hành động không phổ quát; nút phổ quát (quay lại, đóng) có thể chỉ là icon nhưng to hơn (≥ 48pt).
- **Dùng khi di chuyển/một tay:** mọi thứ cần thiết trong vùng ngón cái, vùng chạm lớn, ít phải gõ.
- **Người dùng chuyên sâu, dùng hằng ngày:** tốc độ quan trọng hơn hướng dẫn; cử chỉ tắt và mặc định thông minh có giá trị lớn.

## 11. Gamification có đạo đức

- Phần thưởng gắn với tiến bộ thật (học được điều mới), không chỉ gắn với thời gian dùng app.
- Chuỗi ngày có "đóng băng"/ngày nghỉ, không dùng ngôn ngữ đe dọa hay gây tội lỗi.
- Không đếm ngược giả, không thông báo thúc ép lúc khuya, không giấu nút thoát.
- Ăn mừng ngắn, bỏ qua được, không chặn bước tiếp theo.

## 12. Checklist cuối

- [ ] Một CTA chính, nằm trong vùng ngón cái
- [ ] Vùng chạm ≥ 48dp (trẻ em: 56dp+), cách nhau ≥ 8dp
- [ ] Mọi cử chỉ có nút thay thế hiển thị và accessibility action
- [ ] Không có cử chỉ tùy biến bắt đầu từ mép trái/phải hay đáy màn hình
- [ ] Back Android đóng sheet/bàn phím trước, không mất dữ liệu
- [ ] Đủ trạng thái: lần đầu, loading, empty, error, offline
- [ ] Đúng/sai, thành công/lỗi có icon + chữ
- [ ] Reduce Motion: thay chuyển động bằng fade, vẫn còn phản hồi
- [ ] Tương phản đạt WCAG; chữ to 200% không vỡ bố cục, không che CTA
- [ ] Màn nhỏ (360dp) và màn lớn đều ổn; bàn phím không che ô nhập và nút gửi
- [ ] Hành vi theo nền tảng (back, sheet, picker, haptic) đúng trên cả iOS và Android
- [ ] Dùng token/component của design system, không hard-code màu
- [ ] Không dark pattern
- [ ] Mockup: font dự án hoặc font gần nền tảng, một bộ icon (không emoji), bóng nhẹ, không gradient trang trí (xem `visual-craft.md`)
- [ ] Mockup: không chữ hướng dẫn trong UI, mỗi khung ≤ khoảng 60–80 từ ngoài nội dung chính
- [ ] Mockup: `Mock.qa()` sạch ở iOS, Android, Màn nhỏ, Chữ to (hoặc nói rõ là chưa kiểm tra được bằng trình duyệt)
