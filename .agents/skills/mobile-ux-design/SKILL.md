---
name: mobile-ux-design
description: Thiết kế UI/UX và layout cho mobile app (Android + iOS) theo chuẩn product designer, quy trình research → brainstorm → mockup HTML → người dùng duyệt → code. Nghiên cứu cách các app nổi tiếng (Duolingo, TikTok, Instagram, Airbnb, Revolut, Google Maps...) bố trí component, cử chỉ vuốt/trượt, phản hồi và trạng thái, rồi đưa 2–3 phương án có mockup bấm thử được, đúng chất app thật (không "AI slop"), kèm đặc tả cho dev. Dùng skill này mỗi khi người dùng muốn thiết kế mới, làm lại hoặc cải thiện một màn hình, luồng, tính năng, onboarding, điều hướng, cử chỉ, animation hay gamification cho app di động (Expo/React Native, Flutter, SwiftUI, Jetpack Compose), kể cả khi họ chỉ nói "làm màn X đẹp/dễ dùng hơn", "giống Duolingo", "UX màn này chán quá", hoặc đưa một yêu cầu feature có giao diện mà chưa nói gì về thiết kế. Cũng dùng cho yêu cầu tiếng Anh như "design a mobile screen", "improve app UX", "swipe gesture for my app".
---

# Mobile UX Design

Làm việc như một product designer mobile giỏi: hiểu người dùng và bối cảnh, học từ những app hàng trăm triệu người đã quen tay, đưa ra vài hướng thật sự khác nhau, dựng mockup trông như app thật để người dùng *cảm* được, rồi bàn giao đặc tả đủ rõ để dev làm đúng.

Quy trình có **một điểm dừng**: trình bày phương án kèm mockup và chờ người dùng chọn rồi mới viết code UI. Sửa trên mockup rẻ hơn nhiều so với sửa code, và người dùng thường chỉ biết mình muốn gì khi thấy hai cách làm đặt cạnh nhau.

## Tài liệu kèm theo (đọc đúng lúc)

| File | Đọc khi |
|---|---|
| `references/research-playbook.md` | Bước 2: nguồn, truy vấn, danh mục app, bản đồ "bài toán → app giải tốt" |
| `references/mobile-ux-principles.md` | Bước 4: cử chỉ, iOS/Android, trạng thái, accessibility, checklist |
| `references/visual-craft.md` | Bước 5: font, icon, màu, khoảng cách, số đo thành phần, dấu hiệu "AI slop" |
| `assets/lean-examples.html` | Bước 5, trước khi dựng: 4 màn mẫu đạt chuẩn tinh gọn; mở hoặc đọc để cảm được mức gọn cần đạt |
| `assets/mockup-template.html` | Bước 5: khung điện thoại, thành phần, helper tương tác, nút QA |
| `assets/qa-check.js` | Bước 5: kiểm tra layout cho mockup không dựng từ template |

## Điều chỉnh độ sâu theo yêu cầu

- **Màn hình/luồng mới, làm lại cả màn, tương tác phức tạp** → làm đủ 7 bước, 2–3 phương án.
- **Người dùng nêu app tham chiếu** ("giống Duolingo", "kiểu Instagram Stories") → đó là *nguồn cảm hứng*, chưa phải lời giải. Vẫn đưa 2–3 phương án: một phương án bám sát tham chiếu (đã chỉnh cho hợp người dùng của ta) và 1–2 phương án giải cùng mục tiêu bằng cách khác. Nếu tham chiếu không hợp ngữ cảnh, nói thẳng vì sao.
- **Người dùng đã chốt hướng cụ thể** (đặc tả rõ, hoặc nói "cứ làm đúng như X, không cần phương án khác") → một phương án + biến thể nhỏ.
- **Chỉnh nhỏ** (đổi vị trí nút, thêm một trạng thái) → 1–2 app tham chiếu, 1–2 phương án, mockup chỉ khi khó hình dung bằng lời.

## Quy trình

### 1. Hiểu bối cảnh

Đọc repo trước khi hỏi:
- **Stack:** `package.json` có `expo`/`react-native` → Expo/RN; `pubspec.yaml` → Flutter; `Package.swift`/`*.xcodeproj` → SwiftUI; `build.gradle(.kts)` có Compose → Jetpack Compose. Repo trống → mặc định Expo + expo-router.
- **Design system:** theme/tokens, `DESIGN.md`, `AGENTS.md`/`CLAUDE.md`, thư mục components. Đây là ràng buộc: dùng token, font và component có sẵn trước, chỉ đề xuất cái mới khi thật cần.
- **Màn hình hiện tại** (nếu làm lại): đọc code để biết nó đang làm gì, tránh đề xuất làm mất tính năng.

Viết ra: người dùng là ai và họ dùng trong hoàn cảnh nào (một tay khi đi đường, trẻ em, người lớn tuổi, tay bận…); **việc họ cần làm xong** trên màn này (một hành động chính); thế nào là thành công (chỉ số đo được); các ràng buộc.

Chỉ hỏi khi giả định sai sẽ làm hỏng cả hướng thiết kế. Tối đa 2–3 câu, mỗi câu kèm giả định mặc định. Còn lại tự giả định và ghi vào mục "Giả định".

### 2. Research app tham chiếu

Chọn 4–6 app: 2–3 cùng lĩnh vực và 1–3 khác lĩnh vực nhưng giải cùng bài toán tương tác. App người dùng nêu tên bắt buộc có mặt; ở thị trường Việt Nam, thêm app trong nước liên quan (MoMo, Zalo, Shopee, Grab) vì người dùng đã quen thao tác của chúng.

Với mỗi app ghi: bố cục, cử chỉ và nút thay thế, phản hồi (motion, haptic, âm thanh, màu + icon), cách xử lý trạng thái, **vì sao** hiệu quả, điều **không** nên chép.

Trung thực về nguồn: UI app đổi liên tục và trí nhớ dễ lẫn phiên bản. Dùng WebSearch/WebFetch để kiểm chứng và ghi link + năm; điều chưa kiểm chứng thì đánh dấu *(chưa kiểm chứng)* ngay tại câu đó. Không bịa số liệu. Khoảng 5–10 lượt search/fetch là đủ.

Học pattern, không sao chép thương hiệu: không lấy tên, mascot, minh họa, màu thương hiệu, âm thanh hay câu chữ của app khác.

### 3. Tổng hợp pattern

Bảng **Pattern | App dùng | Vì sao hiệu quả | Có hợp với ta không**. Cột cuối lọc theo người dùng và ràng buộc ở bước 1. Ví dụ streak gây áp lực cho trẻ em, vuốt từ mép màn hình xung đột với cử chỉ back.

### 4. Brainstorm 2–3 phương án

Đọc `references/mobile-ux-principles.md` trước.

Các phương án phải khác nhau về **cách tiếp cận** (cấu trúc màn, cách điều khiển, mức gamification, mật độ thông tin, một bước hay nhiều bước), không chỉ khác màu. Nên có một phương án "quen thuộc/an toàn" để làm mốc.

Mỗi phương án gồm:
- **Ý tưởng** trong một câu và lấy cảm hứng từ đâu.
- **Thứ bậc thông tin:** người dùng thấy gì trước, sau.
- **Bố cục** theo vùng; CTA chính trong vùng ngón cái.
- **Bản đồ cử chỉ:** cử chỉ → hành động → nút thay thế luôn hiển thị → xung đột hệ thống và cách tránh.
- **Luồng và trạng thái:** lần đầu, loading, empty, error, offline. Viết **microcopy thật** cho từng trạng thái: tiêu đề, dòng phụ nếu cần, nhãn nút. Không để ô trống hay "—". Trạng thái không cần UI riêng thì ghi một câu vì sao (vd. "offline: quiz chạy từ dữ liệu đã tải, không cần thông báo").
- **Motion, haptic, âm thanh:** thời lượng, easing; hành vi khi Reduce Motion và chế độ im lặng.
- **iOS và Android:** những chỗ hành vi khác nhau (back, sheet, picker, haptic, edge-to-edge…) và cách xử lý.
- **Accessibility:** screen reader, chữ to 200%, tương phản, không chỉ dựa vào màu.
- **Ưu, nhược, công sức (S/M/L), rủi ro.**

### 5. Mockup HTML: trông như app thật

Đọc `references/visual-craft.md` trước. Người xem đánh giá ý tưởng qua cảm giác đầu tiên: mockup trông rẻ thì ý tưởng tốt cũng bị gạt đi.

Trước khi dựng, xem `assets/lean-examples.html`: đó là mức gọn cần đạt (mỗi màn một việc, chữ đúng cỡ máy thật, phẳng, ít viền). Dựng từ `assets/mockup-template.html` (đọc comment đầu file). Kích thước trong khung viết bằng pt thật (`calc(N * var(--pt))`) và cỡ chữ theo thang 5 cỡ của template, để mockup đúng tỉ lệ máy thật và khớp với đặc tả cho dev. Template có sẵn: font theo nền tảng (Inter/Roboto, hoặc font dự án), icon Material Symbols, thanh trạng thái SVG, thành phần chuẩn (appbar, list row, chip, segmented, sheet, tab bar, toast, bàn phím hệ thống), nút đổi iOS/Android, Màn nhỏ, Chữ to, Tối, Reduce Motion, Vùng ngón cái, và nút **Kiểm tra** để chạy QA.

Những điều làm mockup trông "AI slop", tránh ngay từ đầu:
- Font mặc định của trình duyệt; emoji làm icon; bóng đổ to hoặc phát sáng; gradient trang trí.
- Chữ giải thích nằm trong UI ("Mẹo: vuốt…", "Chạm vào đây để…"). Hướng dẫn cho người xem đặt ở ghi chú đánh số **ngoài** khung.
- Badge và pill ở khắp nơi; card lồng card; mọi chữ cùng cỡ.
- Nhãn ngắn bị xuống dòng ("Khoản / chi"); số tiền bị bẻ dòng.

Nội dung:
- Mỗi phương án gồm 1–3 khung, mỗi khung là một trạng thái quan trọng. Chọn khung sao cho **nhìn ảnh tĩnh cũng hiểu**:
  - Tương tác cốt lõi hiện sẵn ở trạng thái đã lộ: hàng đang vuốt lộ nút, sheet đang mở, lỗi đang hiện.
  - Không vẽ lại khung giống hệt phương án khác; chỉ vẽ phần khác biệt.
  - Tương tác chính vẫn bấm/vuốt thử được, và mọi cử chỉ có nút thay thế.
- Token màu/font/bo góc của dự án nếu có.
- Dữ liệu thật bằng ngôn ngữ của app, đúng định dạng địa phương. Số tiền/giờ/điểm dùng `.amount` và khoảng trắng không ngắt (`45.000&nbsp;đ`) để không bao giờ bẻ dòng.
- Ngân sách chữ: khoảng ≤ 60–80 từ mỗi khung, không kể nội dung chính. Màn có nhiều thứ thì chia thành nhiều khung trạng thái thay vì nhồi vào một khung.
- Vùng chạm ≥ 44pt cả với chip và icon button nhỏ (template đã đúng chuẩn; đừng ghi đè chiều cao nhỏ hơn).
- Không dùng logo, hình ảnh hay tên của app tham chiếu.

**Lượt tinh gọn (bắt buộc, trước QA).** Skill này dạy thêm nhiều thứ đúng (trạng thái, nhãn, vùng chạm), nên rủi ro lớn nhất là màn bị nhồi. Với từng khung, làm theo mục 2b của `visual-craft.md`:
- mỗi thông tin chỉ nói một lần
- phần cố định trên + dưới ≤ 40%
- ≤ 8 phần tử có viền
- ≤ 4 cỡ chữ
- không icon trang trí hay icon đoán mò
- không chồng thẻ (dùng danh sách nhóm)
- không thanh "Đã chọn" lặp lại
- đúng pattern nền tảng (FAB chỉ trên Android)

Bỏ đến khi bỏ thêm thì người dùng sẽ làm sai.

**QA trước khi trình bày.** Đây là việc một designer làm trước khi đưa ai xem:
1. Nếu có công cụ trình duyệt (Playwright, Chrome DevTools…): mở mockup qua một server tĩnh cục bộ, chờ font tải xong, chạy `Mock.qa()` ở bốn chế độ: iOS, Android, Màn nhỏ, Chữ to. Sửa đến khi hết lỗi, kể cả các cảnh báo độ rối (boxy, type-noise, color-noise, chrome-heavy, text-dense). Lỗi còn lại phải có chủ đích và được ghi chú (vd. sheet đang mở che nội dung). Chụp ảnh từng phương án rồi tự phê bình theo mục 9 của `visual-craft.md`, sửa 3 chỗ trông rẻ nhất.
2. Nếu không có trình duyệt: kiểm tra cú pháp JS (`node --check` trên phần script); tự đếm từ, phần tử có viền và cỡ chữ của từng khung theo ngân sách ở trên; rà lại bảng "AI slop"; và nói rõ với người dùng là mockup chưa được kiểm tra trực quan.

Lưu `mockup.html` và `proposal.md` vào `docs/ux-proposals/<yyyy-mm-dd>-<slug>/` nếu repo có thư mục `docs/`, nếu không thì vào scratchpad. Nếu môi trường có tool Artifact, làm theo hướng dẫn của tool và publish mockup thành trang riêng tư để người dùng mở được cả trên điện thoại.

### 6. Trình bày và dừng lại

Viết `proposal.md` theo template bên dưới, gồm cả **đặc tả sơ bộ** cho phương án khuyến nghị để người dùng thấy độ chín của nó. Trong chat chỉ đưa: bảng so sánh ngắn, khuyến nghị kèm lý do, link mockup, đường dẫn proposal, và các câu hỏi cần quyết định. Sau đó hỏi người dùng chọn phương án nào hoặc kết hợp những phần nào.

**Chưa viết code UI ở bước này.** Người dùng có thể biết điều research không thấy: hạn chót, ý sếp, giới hạn kỹ thuật, thương hiệu.

### 7. Triển khai (sau khi được duyệt)

- Hoàn thiện đặc tả cho phương án đã chọn (cập nhật `proposal.md`) rồi mới code.
- Làm theo quy ước của repo. API gesture và animation đổi thường xuyên giữa các phiên bản: tra `.d.ts`/docs đúng phiên bản đang dùng.
- Ưu tiên thư viện đã có trong repo. Thêm thư viện mới, nhất là có native code, thì hỏi trước.
- Làm đủ trạng thái đã thiết kế; mọi cử chỉ có nút thay thế và accessibility action; microcopy đúng như đã duyệt.

| Việc | Expo / React Native | Flutter | SwiftUI | Jetpack Compose |
|---|---|---|---|---|
| Nhấn có phản hồi | `Pressable` + pressed style | `InkWell` | `ButtonStyle` | `clickable` + indication |
| Vuốt/kéo | `PanResponder`, hoặc Gesture Handler nếu repo đã có | `GestureDetector`, `Dismissible` | `DragGesture` | `pointerInput`, `anchoredDraggable` |
| Animation | `Animated`, hoặc Reanimated nếu repo đã có | implicit animations, `AnimatedSwitcher` | `withAnimation` | `animate*AsState`, `AnimatedVisibility` |
| Haptic | `expo-haptics` | `HapticFeedback` | `.sensoryFeedback` | `LocalHapticFeedback` |
| Reduce Motion | `AccessibilityInfo.isReduceMotionEnabled` | `MediaQuery.disableAnimations` | `accessibilityReduceMotion` | `ANIMATOR_DURATION_SCALE` |
| Vùng an toàn | `react-native-safe-area-context` | `SafeArea` | `safeAreaInset` | `WindowInsets` |

- Kiểm tra: typecheck, lint, test của repo; chạy app để so với mockup; rà checklist cuối trong `mobile-ux-principles.md`.

## Template proposal.md

```markdown
# <Tên tính năng>: Đề xuất UX

## Tóm tắt
- Vấn đề: <một câu>
- Khuyến nghị: Phương án <X>, vì <lý do chính>
- Mockup: <link hoặc đường dẫn>

## Bối cảnh và giả định
<người dùng và hoàn cảnh dùng, việc cần làm xong, chỉ số thành công, ràng buộc, stack, design system; liệt kê rõ đâu là giả định>

## Research: app tham chiếu
| App | Họ làm gì | Vì sao hiệu quả | Không nên chép | Nguồn (năm) |
|---|---|---|---|---|

## Pattern rút ra
| Pattern | App dùng | Vì sao hiệu quả | Hợp với ta? |
|---|---|---|---|

## Phương án A: <tên>
<ý tưởng, thứ bậc thông tin, bố cục, bản đồ cử chỉ, luồng và trạng thái kèm microcopy, motion/haptic, iOS/Android, accessibility, ưu/nhược/công sức/rủi ro>

## Phương án B: <tên>
...

## So sánh
| Tiêu chí | A | B | C |
|---|---|---|---|
| Dễ học lần đầu | | | |
| Tốc độ khi đã quen | | | |
| Hợp người dùng mục tiêu | | | |
| Accessibility | | | |
| Công sức triển khai | | | |
| Rủi ro | | | |

## Khuyến nghị
<chọn gì, vì sao, kết hợp phần nào của phương án khác>

## Đặc tả sơ bộ (phương án khuyến nghị)
- Thành phần và trạng thái: <component → default / pressed / selected / disabled / loading / error>
- Kích thước: <chiều cao nút, vùng chạm, lề, khoảng cách, bo góc (pt/dp)>
- Chữ: <vai trò → cỡ/độ đậm theo token>
- Motion: <sự kiện → thời lượng, easing; bản Reduce Motion>
- Haptic và âm thanh: <sự kiện → loại>
- Microcopy: <bảng chuỗi chính: tiêu đề, nút, lỗi, trống, xác nhận>
- Accessibility: <label/role/thông báo cho screen reader của phần tử chính>

## Đo lường và kiểm chứng
- Chỉ số thành công: <vd. thời gian nhập một giao dịch, tỉ lệ hoàn thành quiz>
- Test nhanh với 5 người: <3–5 nhiệm vụ, điều cần quan sát>

## Cần bạn quyết định
<các câu hỏi mở>

## Nguồn
<danh sách link đã dùng>
```
