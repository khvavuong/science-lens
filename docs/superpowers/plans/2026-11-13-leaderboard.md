# Leaderboard Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Tích hợp bảng xếp hạng B vào luồng Bảng thành tích hiện có.

**Architecture:** Giữ route /badges và phần thống kê cá nhân, thêm hai tab và một danh sách cuộn với bục 2–1–3. Ánh xạ trực tiếp từng tên mẫu với avatar WebP đóng gói.

**Tech Stack:** Expo SDK 58, React Native, TypeScript, Expo Image.

**Spec:** `docs/superpowers/specs/2026-11-13-leaderboard-design.md`

## Ràng buộc

Giao diện tiếng Việt, app dọc, dùng token trong theme, vùng chạm tối thiểu 48dp. Dữ liệu chỉ gồm 30 mục mẫu cục bộ. Giữ thống kê và huy hiệu lấy từ lịch sử.

## Thực hiện và kiểm tra

- [x] Đối chiếu 30 tên của bản phác thảo với CSV, sao chép avatar WebP và kiểm tra tên, hậu tố, thứ tự điểm tại `app/src/lib/leaderboard.ts`.
- [x] Dựng bục và danh sách từ hạng 4 tại `app/src/components/Leaderboard.tsx`, kết nối hai tab tại `app/src/app/badges.tsx`.
- [x] Kiểm tra luồng Home → Bảng thành tích → hạng 30 → Huy hiệu → quay lại. Xem ở màn 390px và kiểm tra tràn chữ ở 320px. Ẩn thanh cuộn ở cả hai tab.
- [x] Chạy typecheck app/server, lint app, Expo Doctor, xuất Android và chụp bản chạy thử.
