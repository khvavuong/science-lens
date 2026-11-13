# Home navigation implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Đưa thanh pill đã duyệt vào Trang chủ và cung cấp bản chạy thử.

**Architecture:** Đặt `HomeNavigation` dưới phần cuộn của `HomeScreen`. Dùng các route đã có cho Quét, Kho khám phá và Xếp hạng. Dùng một route thông báo cho Lộ trình và Thử thách.

**Tech stack:** Expo SDK 58, Expo Router, React Native.

**Spec:** `docs/superpowers/specs/2026-11-14-home-navigation-design.md`.

- [x] Thay các ô cũ và nút Quét trên Trang chủ bằng thanh pill. Giữ 48dp cho vùng chạm và chừa vùng an toàn.
- [x] Thêm màn thông báo Sắp ra mắt và đổi tiêu đề màn Bảng xếp hạng. Cập nhật DESIGN.md.
- [x] Kiểm tra năm nút, đường quay lại và bố cục web ở 320px và 390px. Chạy typecheck, lint, Expo Doctor và xuất bundle Android.
