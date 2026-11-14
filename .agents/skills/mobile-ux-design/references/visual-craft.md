# Visual craft: để mockup trông như app thật, không như "AI slop"

Người xem đánh giá phương án qua cảm giác đầu tiên. Một mockup dùng font mặc định, emoji làm icon và bóng đổ phát sáng sẽ bị gạt đi dù ý tưởng tương tác tốt. File này là chuẩn thị giác tối thiểu, đọc trước khi dựng mockup.

## Mục lục
1. Dấu hiệu "AI slop" và cách sửa
2. Ngân sách chữ
2b. Tinh gọn: bớt đến khi không bớt được nữa (quan trọng nhất)
3. Font và thang chữ
4. Icon
5. Màu, bề mặt, bóng đổ
6. Khoảng cách, căn lề, bo góc
7. Thành phần theo nền tảng (số đo chuẩn)
8. Chi tiết làm nên cảm giác "thật"
9. Tự phê bình như design lead

## 1. Dấu hiệu "AI slop" và cách sửa

| Dấu hiệu | Vì sao trông rẻ | Làm thế này thay vì |
|---|---|---|
| Font mặc định của trình duyệt (`system-ui`, Arial, Segoe UI trên Windows) | Không giống iPhone hay Android nào; người xem thấy ngay là "web" | Font của dự án; nếu chưa có thì Inter (gần SF Pro) cho iOS và Roboto cho Android. Template đã tự đổi theo nút iOS/Android |
| Emoji làm icon (🍜 💵 📅 🔒) | Mỗi máy vẽ emoji một kiểu, màu sặc sỡ phá bảng màu, nét không đồng đều | Một bộ icon duy nhất (Material Symbols Rounded có sẵn trong template), cùng cỡ 20/24 và cùng độ dày nét |
| Bóng đổ to, mờ, có màu, phát sáng (glow) | Lỗi thời, làm bẩn nền, che nội dung | Phân tầng bằng màu bề mặt (surface tonal) và viền mảnh; bóng chỉ dùng cho lớp nổi thật (sheet, FAB, menu) và rất nhẹ |
| Gradient trang trí, nền nhiều lớp màu | Phân tán sự chú ý, khó đọc | Nền phẳng; màu nhấn chỉ cho hành động chính và trạng thái |
| Chữ giải thích trong UI ("Mẹo: vuốt…", "Chạm vào đây để…") | App thật không dạy người dùng bằng đoạn văn; UI ngập chữ | Thiết kế cho tự hiểu được; cần dạy thì dùng gợi ý một lần (coachmark ngắn, hoạt ảnh hé lộ). Giải thích cho người xem mockup đặt ở ghi chú **ngoài** khung |
| Nút nào cũng có chữ ("Quay lại", "Đóng", "Tìm kiếm" cạnh icon) | Chật, lặp, không giống app thật | Icon-only cho hành động phổ quát (kèm label cho screen reader); chữ dành cho CTA chính và hành động đặc thù |
| Badge/tag khắp nơi ("Gợi ý", "Mới", "Hot") | Mọi thứ đều nổi thì không gì nổi | Tối đa 1 badge mỗi màn, chỉ khi người dùng thật sự cần biết |
| Mọi thứ bo tròn thành pill, card lồng card | Không có cấu trúc, trông như template | Thang bo góc rõ ràng (vd. 8/12/16), card chỉ khi nhóm nội dung cần tách biệt |
| Mọi chữ cùng cỡ/độ đậm, hoặc quá nhiều cỡ | Không có thứ bậc, mắt không biết nhìn đâu | 3–4 cỡ chữ mỗi màn theo thang của nền tảng; độ đậm chỉ 2 mức |
| Empty state = icon to + 2 đoạn văn căn giữa | Sáo rỗng | 1 dòng tiêu đề, 1 dòng phụ (không bắt buộc), 1 nút hành động; minh họa nhỏ nếu có phong cách riêng |
| Thanh trạng thái/bàn phím vẽ bằng ký tự | Phá ảo giác "đây là điện thoại" | Dùng thanh trạng thái SVG và bàn phím có sẵn trong template |
| Nhãn ngắn bị xuống dòng ("Khoản / chi", "0 / đ") | Lỗi cơ bản nhất, người xem thấy ngay | `white-space: nowrap` cho nhãn, nút, số tiền; nếu không đủ chỗ thì đổi bố cục chứ không bẻ dòng |

## 2. Ngân sách chữ

- Tiêu đề màn: ≤ 4 từ. Nút: 1–3 từ, bắt đầu bằng động từ ("Lưu", "Thêm khoản chi").
- Chữ phụ (helper): tối đa 1 dòng, chỉ khi thiếu nó người dùng sẽ làm sai.
- Mỗi màn khoảng **≤ 60–80 từ** không kể nội dung chính (câu hỏi, bước công thức, bài đọc). Đếm lại sau khi dựng.
- Không lặp lại thông tin đã hiển thị ở chỗ khác trên cùng màn.
- Microcopy thật, giọng của sản phẩm: "Chưa có khoản chi nào hôm nay", không phải "Danh sách trống. Hãy thêm dữ liệu để bắt đầu sử dụng tính năng này."
- Phần mô tả cho người xem trên trang mockup: mỗi phương án ≤ 2 dòng + tối đa 3 ghi chú đánh số. Phân tích dài để trong `proposal.md`.

## 2b. Tinh gọn: bớt đến khi không bớt được nữa

Mockup "đúng chuẩn" (vùng chạm to, đủ trạng thái, có nhãn) vẫn có thể trông rối và "AI" nếu mọi thứ đều được thêm vào mà không gì bị bỏ đi. Designer giỏi khác ở chỗ họ **bỏ**. Màn tốt thường có ít phần tử hơn bạn nghĩ.

**Quy tắc:**
1. **Mỗi thông tin nói một lần.** Bước hiện tại: chọn MỘT cách (thanh tiến độ mảnh + tiêu đề), không cộng thêm "Bước 3/4" + nhãn từng chặng + tiêu đề nhắc lại. Lựa chọn đã chọn tự hiển thị trạng thái chọn; không thêm thanh "Đã chọn: …" lặp lại.
2. **Ngân sách chrome ≤ 35–40%.** Phần cố định trên + dưới (không kể status bar, home indicator) không được đẩy nội dung chính xuống nửa dưới. Gộp nút Thoát vào nút Quay lại hoặc menu; gộp ngữ cảnh bước trước thành một dòng phụ, hoặc để ở màn xác nhận.
3. **Khoảng trắng trước, nền sau, viền cuối cùng.** Nhóm bằng khoảng cách và căn lề. Tùy chọn chưa chọn để phẳng (nền surface nhạt, không viền); chỉ tùy chọn được chọn mới nổi (nền màu nhấn). Mục tiêu ≤ 8 phần tử có viền mỗi màn.
4. **Không trang trí.** Bỏ icon cạnh tiêu đề mục (☀ "Buổi sáng"), bỏ badge, bỏ đường kẻ thừa, bỏ nền màu cho cả một dải. Icon chỉ giữ khi nó giúp nhận ra nhanh hơn chữ.
5. **≤ 4 cỡ chữ, 2 độ đậm, 1 màu nhấn** mỗi màn (cộng màu trạng thái khi thật cần).
6. **Tiết lộ dần.** Hiện các lựa chọn phổ biến nhất trước (dải ngày cuộn ngang, 6 giờ gần nhất), phần còn lại sau "Xem thêm".
7. **Tinh gọn không có nghĩa là nhỏ.** Với người lớn tuổi, trẻ em: chữ to, vùng chạm to, nhưng ÍT thứ hơn trên mỗi màn.

**Lượt tinh gọn cho từng khung (làm sau khi dựng xong, trước QA):**
1. Liệt kê mọi phần tử trong khung.
2. Với từng cái, hỏi: nó giúp hành động chính thế nào? Bỏ đi thì người dùng có làm sai không? Không → xóa. Trùng thông tin với phần tử khác → gộp.
3. Đếm: số từ, số phần tử có viền, số cỡ chữ, tỉ lệ chrome. Vượt ngân sách → bớt tiếp. `Mock.qa()` đo giúp các con số này (boxy, type-noise, color-noise, chrome-heavy, text-dense).
4. Đặt cạnh app tham chiếu gọn nhất trong research: màn của ta có nhiều phần tử hơn không? Nếu có, vì sao?

**Ví dụ: màn "Chọn ngày giờ khám".** Bản rối có 14 thứ: Quay lại, Thoát, "Bước 3/4", tiêu đề, thanh 4 chặng có 4 nhãn, avatar + "Khám cho Mẹ…", dòng chuyên khoa · bác sĩ, lưới ngày có viền, "Xem thêm ngày", icon + "Buổi sáng", lưới giờ có viền, icon + "Buổi chiều", thanh "Đã chọn: …", nút Tiếp tục. Bản gọn còn 7:
- Quay lại
- Thanh tiến độ mảnh không nhãn
- Tiêu đề "Chọn giờ khám" + một dòng phụ "BS. Nguyễn Văn An · Tim mạch"
- Dải ngày cuộn ngang (phẳng, ngày chọn tô màu)
- Chữ "Sáng" + giờ phẳng
- Chữ "Chiều" + giờ phẳng
- Nút "Tiếp tục" (vô hiệu đến khi chọn giờ)

Người khám, thoát, tóm tắt đều để ở màn xác nhận.

### Những bố cục dễ lộ "AI" dù đã đủ chuẩn

| Dấu hiệu | Làm thế này |
|---|---|
| **Chồng thẻ**: mỗi mục danh sách là một thẻ riêng có nền, bo góc, ô icon và mũi tên › | Danh sách nhóm kiểu iOS (một khối, các hàng chia bằng đường kẻ mảnh) hoặc list Material không nền. Thẻ riêng chỉ khi mỗi mục là một đối tượng giàu nội dung (ảnh, nhiều trường) |
| **Icon đoán mò**: bộ icon không có hình đúng nghĩa (chuyên khoa y tế, loại giấy tờ…) nhưng vẫn gắn icon gần đúng | Bỏ icon, để chữ làm việc. Icon chỉ giữ khi người dùng nhận ra nó nhanh hơn đọc chữ |
| **Trộn kiểu chỉ báo** trong một danh sách (tích, số tròn, icon) | Một ngôn ngữ trạng thái duy nhất cho cả danh sách (vd. số bước; xong thì số thành tích) |
| **Mục "gợi ý" trông như mục "đã chọn"** (cùng nền tô màu nhấn) | Gợi ý dùng nhãn phụ nhỏ ("Hay chọn") hoặc đặt lên đầu; tô màu chỉ dành cho trạng thái chọn |
| **Sai pattern nền tảng**: FAB trên iOS, nút "‹ Quay lại" kiểu iOS trên Android | iOS: nút + ở thanh tiêu đề hoặc toolbar; Android: FAB. Dùng `.ios-only` / `.android-only` để vẽ đúng từng nền tảng |
| **Nhiều hàng chip chồng nhau** cùng độ đậm | Tối đa một hàng chip mỗi vùng; thông tin phụ (gợi ý số tiền, ngày) hạ xuống dạng chữ hoặc gộp |

## 3. Font và thang chữ

Ưu tiên font của dự án (đọc theme/DESIGN.md). Nếu chưa có:
- iOS: SF Pro (không nhúng được trên web) → dùng **Inter** làm đại diện.
- Android: **Roboto**.
- Cả hai hỗ trợ tiếng Việt đầy đủ. Template nạp sẵn qua Google Fonts.

Thang chữ tham chiếu (đơn vị pt/sp ≈ px trong khung 390 rộng):

| Vai trò | iOS (HIG) | Android (Material 3) |
|---|---|---|
| Tiêu đề lớn của màn | Large Title 34 bold | Headline Small 24 / Title Large 22 |
| Tiêu đề mục | Title 3 20 semibold / Headline 17 semibold | Title Medium 16 medium |
| Thân bài | Body 17 | Body Large 16 |
| Phụ | Subheadline 15 / Footnote 13 | Body Medium 14 / Body Small 12 |
| Nhãn nút | 17 semibold | Label Large 14 medium |

Số tiền, đồng hồ, điểm số: `font-variant-numeric: tabular-nums` để chữ số không nhảy khi thay đổi.

## 4. Icon

- Một bộ duy nhất cho toàn mockup. Template có **Material Symbols Rounded**: `<span class="ms">restaurant</span>`; tên icon tra ở fonts.google.com/icons.
- Cỡ 20 hoặc 24, cùng độ dày nét; icon trong nút có vùng chạm ≥ 44pt dù icon nhỏ.
- Icon danh mục (ăn uống, đi lại…) dùng icon đơn sắc trên nền tonal nhạt của màu nhấn, không dùng emoji nhiều màu.
- **Icon-only là mặc định cho hành động ai cũng hiểu.** App thật không gắn chữ cho mọi nút; nhãn thừa làm màn chật và trông "AI". Nút chỉ có icon vẫn phải có `aria-label`/`accessibilityLabel` và vùng chạm ≥ 44pt.
  - **Chỉ icon:** quay lại (‹), đóng (✕), tìm kiếm, thêm (+), thêm nữa (⋯), chia sẻ, yêu thích, phát/tạm dừng, xóa ký tự (⌫), sửa (bút) và xóa (thùng rác) trong ngữ cảnh rõ, cài đặt, thông báo, bộ lọc.
  - **Cần chữ:** CTA chính của màn ("Lưu", "Đặt lịch"); hành động phá hủy cần xác nhận; hành động đặc thù của sản phẩm mà icon không nói lên được ("Khám lại", "Nhân bản"); nút trong hộp thoại.
  - **Tab bar:** iOS thường có nhãn ngắn dưới icon. Bỏ nhãn chỉ khi mọi icon đều quá quen (Trang chủ, Tìm kiếm, Hồ sơ) như Instagram.
  - **Theo người dùng:** người lớn tuổi và trẻ nhỏ cần nhãn chữ nhiều hơn, nhưng chỉ cho hành động chính và hành động hiếm gặp. Nút quay lại/đóng vẫn có thể chỉ là icon nếu đủ to.
  - Đừng gắn nhãn kiểu "Quay lại" bên cạnh mũi tên ‹ trên iOS, trừ khi nhãn đó là tên màn trước (đúng chuẩn iOS) hoặc người dùng là người lớn tuổi.
- Emoji chỉ chấp nhận khi chính nó là nội dung (người dùng chọn emoji, phản ứng tin nhắn).

## 5. Màu, bề mặt, bóng đổ

- Tỉ lệ khoảng 60/30/10: nền trung tính / bề mặt và chữ / màu nhấn. Một màu primary; success/warning/error chỉ cho trạng thái.
- Phân tầng bằng **bề mặt tonal** (nền trắng, card xám rất nhạt hoặc ngả màu primary 4–8%) và **viền 1px** màu divider.
- Bóng đổ chỉ cho lớp nổi thật, dùng token có sẵn: `--elev-1` (thẻ được kéo), `--elev-2` (sheet, FAB, menu). Không bóng có màu, không blur > 24px, không glow.
- Tương phản chữ ≥ 4.5:1, chữ trên nền màu nhấn kiểm tra lại (vàng sáng thì chữ tối).
- Dark mode: nếu app hỗ trợ, đổi token chứ không đảo màu tự động; nền tối không đen tuyệt đối thuần, bề mặt sáng dần theo tầng.

## 6. Khoảng cách, căn lề, bo góc

- Lưới 4/8: khoảng cách 4, 8, 12, 16, 24, 32. Lề màn 16 (20 trên máy lớn iOS).
- Một trục căn trái chính cho nội dung; chỉ căn giữa cho trạng thái đơn lẻ (empty, thành công).
- Thang bo góc: nhỏ 8 (chip, input), vừa 12–16 (card, nút), lớn 24–28 (sheet). Không trộn nhiều giá trị lẻ.
- Khoảng cách thể hiện nhóm: phần tử cùng nhóm gần nhau (8), giữa các nhóm xa hơn (24).

## 7. Thành phần theo nền tảng (số đo chuẩn)

| Thành phần | iOS | Android (Material 3) |
|---|---|---|
| Thanh trạng thái | ~54pt (máy có Dynamic Island) | ~24–32dp |
| Thanh tiêu đề | Nav bar 44pt; Large Title thêm ~52pt | Top app bar 64dp |
| Tab/nav dưới | Tab bar 49pt + vùng Home indicator 34pt | Navigation bar 80dp |
| Nút chính | Cao 50pt, bo 12–14 | Filled button cao 40dp (vùng chạm 48), bo full; nút CTA lớn có thể 56 |
| FAB | Không phải pattern iOS chuẩn; dùng nút trong nav bar hoặc nút nổi tiết chế | FAB 56dp, bo 16, bóng nhẹ |
| Segmented | Segmented control cao 32pt | Segmented buttons cao 40dp |
| Sheet | Có grabber, bo góc lớn, nền sau tối nhẹ | Bottom sheet có drag handle, bo 28 |
| Ô nhập | Cao 44–50pt | Text field 56dp |
| Danh sách | Hàng 44pt+, divider lùi lề trái | Hàng 56dp (1 dòng) / 72dp (2 dòng) |

iOS 26 trở đi dùng ngôn ngữ Liquid Glass cho thanh điều hướng/tab (mờ trong suốt). Mockup không cần mô phỏng hiệu ứng kính; chỉ cần giữ đúng vị trí và kích thước. Kiểm chứng với HIG hiện hành khi chi tiết này quan trọng.

## 8. Chi tiết làm nên cảm giác "thật"

- Dữ liệu thật, cụ thể, có độ lệch tự nhiên: "Cơm tấm sườn · 45.000 đ", tên dài ngắn khác nhau, có một dòng bị cắt bằng dấu "…" có chủ đích.
- Định dạng đúng địa phương: `45.000 đ`, `13/11`, `07:50`.
- Trạng thái đang nhấn, đang chọn, vô hiệu hóa đều có hình dạng rõ.
- Ảnh/minh họa: dùng khối màu trung tính có tỉ lệ đúng nếu không có ảnh thật; không chèn ảnh stock lệch phong cách.
- Không để thanh cuộn của trình duyệt hiện trong khung (template đã ẩn).

## 9. Tự phê bình như design lead

Sau lượt tinh gọn (mục 2b) và QA, chụp ảnh nếu có trình duyệt rồi trả lời ngắn cho từng khung:
1. Nhìn 3 giây, mắt rơi vào đâu đầu tiên? Có phải hành động chính không?
2. Có gì bỏ đi mà màn vẫn hiểu được? Bỏ nó.
3. Ba chỗ trông "rẻ" nhất là gì? (đối chiếu bảng ở mục 1) Sửa.
4. Nếu đặt cạnh ảnh chụp app tham chiếu, khung này có lạc tông không?
