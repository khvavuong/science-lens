# Lumo Home Icons Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Tạo và hiển thị năm icon Lumo đã duyệt trên thanh pill Trang chủ.

**Architecture:** Xuất hình phẳng thành năm WebP trong `app/assets/home-icons`. Dùng Expo Image hiển thị các ảnh cục bộ trong `HomeNavigation`.

**Tech Stack:** WebP, Sharp, Expo SDK 58.

**Spec:** `docs/superpowers/specs/2026-11-14-lumo-home-icons-design.md`.

- [x] Xuất kính lúp, đường nối mốc, camera trắng, bia mục tiêu và bục ba bậc. Kiểm tra định dạng, kích thước và nền trong suốt của từng tệp.
- [x] Gắn ảnh vào thanh pill. Giữ nhãn truy cập cho camera và các điểm đến hiện có.
- [x] Kiểm tra icon trên app web ở chiều rộng 320 và 390 px, sau đó chạy typecheck, lint, Expo Doctor và xuất bundle Android.
