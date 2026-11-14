# AGENTS.md — LumosLens

Hướng dẫn cho AI coding agent (và dev mới) làm việc trong repo này.
Nguồn yêu cầu sản phẩm: `LumosLab_UIUX_Design_Specification.docx` (gọi tắt "spec"). Khi code và spec mâu thuẫn, spec thắng, trừ các quyết định đã chốt ở mục "Quyết định đã chốt".

## Sản phẩm

App mobile **portrait-only, light-first** cho **trẻ em 7–12 tuổi**, **chỉ tiếng Việt**:
Scan đồ vật → AI nhận diện → chọn **một** câu chuyện khoa học (4–5 cảnh) → xem cảnh dọc (ảnh, tối đa 2 cảnh có video) + nghe giọng kể + phụ đề → Roadmap → 3 câu quiz → Completion.
MVP hackathon: một đường đi trọn vẹn từ camera đến completion. **Ngoài phạm vi:** mạng xã hội, mini-experiment, bắt đăng nhập.

## Cấu trúc

```
app/        Expo SDK 58 + expo-router (React Native 0.88, React 19.3, TypeScript strict)
  src/app/          route = màn hình: index, scan (quét + nhận diện), prelude, story, quiz, complete, library, badges, _layout
  src/components/   Button/IconButton, ChoiceOption, SceneVisual (ảnh + video), SceneImage, RoadmapSheet, Trail (đường ánh sáng), Illustrations (SVG tạm thay hình 3D)
  src/lib/          api.ts (types + client), store.ts (zustand, polling), useNarration.ts, history.ts, haptics.ts
  src/theme.ts      design tokens — KHÔNG hard-code màu/spacing ở nơi khác
  AGENTS.md         quy tắc riêng của Expo (đọc trước khi đụng API Expo/RN)
server/     Node 22 + Fastify 5 + @google/genai, chạy bằng tsx (không build)
  src/prompts.ts    NGUỒN CHÍNH của mọi prompt + JSON schema
  src/gemini.ts     gọi model: timeout, retry, hedged request, cooldown khi hết quota, TTS→mp3
  src/pipeline.ts   job tạo story, thứ tự ưu tiên asset, cache theo tên đồ vật
  src/index.ts      HTTP API
  data/             story JSON + media sinh ra (gitignored, xóa được)
prompts/    tài liệu giải thích prompt (đồng bộ tay với server/src/prompts.ts)
.env        GEMINI_KEY=..., ELEVEN_LAB_KEY=... (gitignored; mẫu ở .env.example)
```

## Lệnh

```bash
# Cần cài sẵn: Node 22, ffmpeg trong PATH (Windows: winget install Gyan.FFmpeg).
# Thiếu ffmpeg thì TTS lưu WAV (~600KB/cảnh) thay vì MP3 (~90KB).

# Backend (cổng 8787)
cd server && npm install && npm run dev        # watch mode, đọc ../.env
cd server && npx tsc                           # typecheck

# App
cd app && npm install                          # .npmrc có legacy-peer-deps=true (bắt buộc, xung đột peer react-dom)
cd app && npx expo start                       # điện thoại thật qua Expo Go, cùng Wi-Fi
cd app && npx expo start --web --port 8090     # chạy trên máy dev (8081 thường bị chiếm). KHÔNG đặt CI=1: Metro sẽ tắt theo dõi file và phát code cũ
cd app && npx tsc --noEmit && npx expo lint    # PHẢI sạch trước khi báo xong
cd app && npx expo-doctor                      # phải 20/20
cd app && npx expo export --platform android --output-dir <tmp>   # bắt lỗi resolve module mà tsc không thấy
```

Thêm package cho app: **luôn** `npx expo install <pkg>`, không `npm i` (trừ lib JS thuần như zustand).
App tìm backend theo IP của máy chạy `expo start` (`Constants.expoConfig.hostUri`) + cổng 8787; ghi đè bằng `EXPO_PUBLIC_API_URL` trong `app/.env`.

## API (server)

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/recognize` | `{imageBase64}` → `{label, label_en, confidence, alternatives[], has_person, safe}`. Ảnh **không** được ghi xuống đĩa |
| POST | `/api/stories` | `{label}` → Story. Cache theo label đã chuẩn hóa; trùng label trả story cũ |
| GET | `/api/stories/:id` | trạng thái plan + từng asset (`pending/ready/error`). App poll mỗi 1.5s |
| POST | `/api/stories/:id/retry` | tạo lại asset lỗi (vd. sau khi bật billing ảnh) |
| GET | `/api/health` | model đang dùng + model đang cooldown |
| POST | `/api/hunt/transcribe` | Multipart với tệp ghi âm tối đa 30 giây, trả bản chép lời tiếng Việt |
| POST | `/api/hunt/evaluate` | Multipart với ảnh, chủ đề và lời giải thích, trả nhận xét cho từng vật |

Types của Story/Plan/Scene/Quiz khai báo **hai nơi**: `server/src/types.ts` và `app/src/lib/api.ts`. Đổi schema → sửa cả hai + `PLAN_SCHEMA` trong `prompts.ts` + `prompts/story-planner.md`.

## Pipeline AI và các bẫy đã gặp

- **Bắt buộc `apiVersion: 'v1beta'`**: SDK `@google/genai` 3.x mặc định v1, mà v1 không nhận JSON mode/`responseJsonSchema` và `speechConfig`.
- **Thinking:** model 3.x dùng `thinkingLevel`, model 2.5 dùng `thinkingBudget` (xem `thinkingFor`). Planner dùng `low`: `medium` mất ~50s thay vì ~10s.
- **Độ trễ dao động mạnh**: cùng model lúc 10s, lúc >45s. Nhận diện và planner dùng `hedged()` (stagger 6s/12s); mọi lệnh gọi phải có timeout. `gemini-3.5-flash` hay treo khi nhận ảnh nên vision dùng `gemini-2.5-flash` trước.
- **Giọng kể:** có `ELEVEN_LAB_KEY` → chỉ dùng ElevenLabs (giọng `ELEVENLABS_VOICE_ID`, mặc định "Saigon Lily"; model `eleven_v4` rồi `eleven_turbo_v2_5`, xuất PCM 24kHz → mp3; `voiceSettings` trong config cho giọng kể sôi nổi: stability 0.35, style 0.45, speed 1.05, chỉnh qua `ELEVENLABS_STABILITY/STYLE/SPEED`). Lỗi thì asset `error` → app đọc bằng expo-speech, **không** quay về Gemini TTS. Không có key → Gemini TTS như dưới.
- **TTS đọc nguyên văn MỌI chữ**: không bao giờ chèn câu chỉ dẫn giọng vào `contents` (đã từng bị đọc thành tiếng). Model TTS không nhận `systemInstruction`. Cách kiểm chứng audio: cho `gemini-2.5-flash` chép lại file.
- **Free tier:** ảnh có quota = 0 (cần billing); mỗi model TTS khoảng 10 request/ngày. `withModels` coi 429 có `limit: 0` hoặc `per day` là hết quota → cooldown model 1 giờ, chuyển ngay model kế tiếp. Đừng xóa danh sách model dự phòng trong `config.ts`.
- Thứ tự tạo asset: voice mở đầu → ảnh/voice cảnh 1 → các cảnh còn lại (audio song song 3, ảnh song song 2).
- **Video** (`gemini-omni-1.2-flash`, gọi qua `ai.interactions.create`, không phải `generateVideos`; Veo 3.1 preview đã ngừng 22/10/2026): planner đánh dấu `video_worthy` cho tối đa `VIDEO_MAX_SCENES` cảnh. Video của một cảnh chỉ chạy khi ảnh (làm khung đầu) và voice (làm độ dài, cộng 1 giây, giới hạn 3–15 giây) của cảnh đó xong; hàng đợi riêng (song song 2), không chặn ảnh/audio. Video có âm thanh gốc nhưng app **luôn tắt tiếng** và dùng `audioMixingMode: 'mixWithOthers'` để không cắt giọng kể. **Không có free tier**: mỗi truyện khoảng $1.5 ở 720p. Tắt bằng `VIDEO_ENABLED=0`.
- Lỗi 402 (hết credit trả trước) được coi như hết quota: cooldown model 1 giờ. Lỗi 404 (model đã ngừng cho key này, vd. `gemini-2.5-flash` với key tạo sau 11/2026) → bỏ qua model 24 giờ.
- Key free tier: nhận diện, planner, TTS chạy được; **ảnh và video đều `limit: 0`** → cần bật billing. Thiếu ảnh thì video của cảnh đó bị bỏ qua (`error: 'skipped'`).
- Giọng văn: vui nhộn, có hook mỗi cảnh, chỉ 2–3 câu trending cả truyện (xem mục FUN, PLAYFUL VOICE trong `prompts.ts`). Nới lỏng câu chữ là model lạm dụng trend và vượt 60 từ/cảnh.
- Prompt planner phải giữ: dấu câu đầy đủ (thiếu thì model bỏ hết dấu phẩy/hỏi), năm viết bằng chữ số, 40–60 từ/cảnh.
- Test thủ công bằng `curl` lên server **tốn quota thật**; lặp lại cùng label để dùng cache.
- **Chép lời ghi âm** (`transcribeHunt`): gửi mp3 32 kbps, không gửi WAV (WAV chậm gấp đôi, chép lời không chính xác hơn). Dùng `hedged()` với `MODEL_TRANSCRIBE` (flash-lite trước). Đo 11/2026: khoảng 2,5–3 giây cho bản ghi 19 giây.

## Quy tắc nội dung (an toàn trẻ em và độ chính xác)

- Mỗi cảnh **một** ý chính có căn cứ. Năm/nhân vật chỉ ghi khi `confidence = high`, còn lại `timeline_mode = "process"` với nhãn "Bước n" (`validatePlan` tự ép). Giai thoại phải `is_legend = true` và nói rõ trong lời kể.
- Không nội dung đáng sợ/bạo lực/chính trị. Đồ vật nguy hiểm (dao, thuốc, ổ điện…) → kể khoa học + thông điệp an toàn, không hướng dẫn trẻ tự thí nghiệm. `safe = false` → app dừng và gợi ý đồ vật khác.
- **Không nhận diện, mô tả hay vẽ người** có trong ảnh. Prompt ảnh tiếng Anh, **không chữ/số trong ảnh**, tỉ lệ 9:16, 30% dưới để trống cho phụ đề, dùng `character_sheet` để các cảnh nhất quán.
- Quiz đúng 3 câu, 3–4 lựa chọn, gắn `scene_ref`, giải thích giọng khích lệ.

## Quy tắc UX (từ spec)

- Một CTA chính mỗi màn, đặt ở nửa dưới (vùng ngón cái); điều hướng thanh dưới chỉ ở Home.
- **Không tự phát tiếng khi người dùng chưa chủ động.** Bấm "Bắt đầu khám phá"/"Vào câu chuyện" được tính là chủ động (`autoplay=1`). Đổi cảnh **luôn ngắt tiếng cũ** trước, không chồng tiếng. Mọi phát/dừng đi qua `useNarration`.
- **Không chặn UI chờ asset:** không hiển thị % giả; Prelude cho vào truyện khi cảnh 1 sẵn sàng hoặc sau 25s.
- Fallback bắt buộc, không được để trống:
  - ảnh lỗi → ảnh người dùng chụp + Ken Burns (`SceneImage`)
  - video chưa xong/lỗi/Reduce Motion → ảnh cảnh + Ken Burns; video về giữa chừng thì chuyển mờ sang và tua khớp lời kể (`SceneVisual`)
  - TTS lỗi → giọng tiếng Việt của máy qua `expo-speech`, phụ đề vẫn chạy
  - camera bị từ chối → chọn ảnh từ thư viện
  - nhận diện sai → sửa tên/chọn gợi ý
- Story: vuốt ngang đổi cảnh (luôn có nút ⏮ ⏭ thay thế), chạm = play/pause, giữ = ẩn overlay, vuốt lên **chỉ từ tay nắm "Hành trình"** để mở Roadmap (tránh xung đột gesture). Roadmap: mốc đã xem phát lại được, mốc kế tiếp mở, mốc xa hơn khóa.
- Đúng/sai trong quiz phải có **icon + chữ**, không chỉ dựa vào màu.
- Accessibility: mọi nút có `accessibilityLabel`; touch target ≥ 48dp; tôn trọng Reduce Motion (`useReducedMotion` → tắt Ken Burns, chỉ fade); `maxFontSizeMultiplier` ≈ 1.3–1.4 cho chữ trên ảnh.
- Motion: tap 120–180ms, sheet 220–320ms, chuyển cảnh 350–500ms (`motion` trong theme).

## Design tokens (`app/src/theme.ts`)

Bảng màu xanh dương và kem vàng đã duyệt trong [DESIGN.md](DESIGN.md): Brand Blue `#1E419D` (logo, CTA, tiến độ) · Deep Navy `#0F2452` (tiêu đề, khối câu hỏi bí ẩn) · nền kem `#FCF9F2`/`#F9F2E5` · nền thẻ `#F6EBD7` · Success Mint `#10B0A0` (dùng tiết chế) · Body `#23334E` · Muted `#5B6B85` · Divider `#E7D9C4`.
**Lumen Yellow `#FFC93C`**: trạng thái "sáng" của đường ánh sáng, đáp án đang chọn trên nền navy, sao/huy hiệu. Vàng kem `#FFF1C9` làm nền minh họa. Dùng chữ navy trên nền vàng.
Font **Be Vietnam Pro** (400–800; tiêu đề dùng 800), lưới 4/8dp, radius card 16–24. Motif xuyên suốt: "Đường ánh sáng" (`components/Trail.tsx`): nút xong = xanh + tích, đang ở = vàng, chưa tới = vòng rỗng, khóa = ổ khóa. Tránh "AI slop": không glow, không gradient dày.
Thiết kế tham chiếu: [DESIGN.md](DESIGN.md) và mockup xanh dương, kem vàng đã duyệt. Bố cục dựa trên canvas Claude Design "LumosLab – Đề xuất giao diện v2".

## Tạo và chỉnh sửa hình ảnh

- Khi tạo hoặc chỉnh sửa minh họa 2D của Lumo Pet và phụ kiện đeo, dùng skill [`lumos-asset-style`](.agents/skills/lumos-asset-style/SKILL.md), kể cả khi các asset này xuất hiện trên web. Trước khi tạo ảnh, đối chiếu [ảnh chuẩn Lumo Pet](.agents/skills/lumos-asset-style/references/robot-identity-master.png) và [quy chuẩn tạo hình](.agents/skills/lumos-asset-style/references/style-lock.md). Kiểm tra hình ở kích thước sử dụng thực tế và kiểm tra độ khớp của phụ kiện khi ghép lên Pet.
- Khi tạo hoặc chỉnh sửa các hình ảnh khác cho web, dùng [DESIGN.md](DESIGN.md) và hình ảnh đã duyệt của cùng màn hình để thống nhất bảng màu, ánh sáng và mức độ chi tiết. Với ảnh cảnh truyện, dùng [quy chuẩn minh họa truyện](prompts/image-style.md).

## Quy ước code

- Route chỉ nằm trong `app/src/app/`; code khác để ngoài. Import bằng alias `@/`.
- **React Compiler lint đang bật:** không đọc `ref.current` trong render, không `setState` đồng bộ trong effect, tránh `useMemo`/`useCallback` thủ công lệch dependency. Giá trị Animated/PanResponder tạo bằng `useState(() => …)`. Riêng gán `player.muted` có eslint-disable kèm lý do, giữ nguyên.
- RN 0.88: **`StyleSheet.absoluteFillObject` đã bị xóa**, dùng `StyleSheet.absoluteFill`.
- SDK 58: `fetch` toàn cục trên native là `expo/fetch`, **không nhận phần FormData kiểu `{ uri, name, type }`** (ném lỗi trước khi gửi). Gửi tệp bằng đối tượng có `bytes()` (xem `lib/huntUpload.ts`).
- RN style: `paddingTop` cụ thể ở style gốc **thắng** `padding` viết tắt ở style ghi đè. Ghi đè thì ghi rõ từng cạnh.
- Gesture dùng FlatList `pagingEnabled` + `PanResponder` có sẵn, **không** dùng react-native-gesture-handler (v3 đổi hẳn API) hay @gorhom/bottom-sheet. Giữ app chạy được trên Expo Go: chỉ dùng module có trong Expo Go.
- Comment và chuỗi UI viết tiếng Việt; tên biến tiếng Anh.

## Kiểm thử và bảo mật khi chạy thử

- Trước khi báo xong: typecheck + lint (app, server), expo-doctor, và bundle export nếu có thêm import mới.
- Test luồng UI trên web bằng trình duyệt tự động: **trình duyệt dùng webcam thật của dev**. Không chụp màn hình khi màn Scan đang bật camera, không bấm nút chụp; dùng "Chọn ảnh từ thư viện" với ảnh công khai. Đừng dùng ảnh trong thư mục cá nhân của người dùng.
- Không dùng `pkill -f "<pattern>"` để dừng server: lệnh khớp luôn shell đang chạy nó. Dừng theo PID của tiến trình `node`.
- Không commit `.env`, `server/data/`, `.playwright-mcp/`.

Checklist nghiệm thu (spec mục 09): chạy trên máy thật Android/iOS từ đầu đến cuối; ít nhất 3 đồ vật khác nhau (không hard-code một câu chuyện); màn nhỏ/lớn không tràn chữ, không che CTA; mạng chậm vẫn đọc được truyện; tắt tiếng/Reduce Motion vẫn dùng được phụ đề và quiz.

## Quyết định đã chốt

- Độ tuổi 7–12; chỉ tiếng Việt; Thư viện/Thành tích ở Home không ưu tiên.
- Style ảnh: tranh sách khoa học thiếu nhi 2.5D, nền sáng (xem `prompts/image-style.md`).
- Toàn bộ AI dùng một key Gemini; model cấu hình qua env, xem `.env.example`.

## Còn thiếu so với spec

- Hình minh họa 3D trong mockup (hero trang chủ, huy hiệu): đang dùng SVG tạm trong `Illustrations.tsx`, chờ file PNG gốc.
- Nút "Bản đồ" trên thanh điều hướng mở màn "Sắp ra mắt".

- P1 parallax con quay hồi chuyển: chưa làm. Nút tắt haptic: chưa có.
- Xem truyện offline trên thiết bị: chưa có (cache mới chỉ ở server).
- Video AI: code xong, chưa gọi API thật lần nào (chờ cấp quyền/billing cho key). Cần test trên máy thật: chuyển ảnh → video, đồng bộ với lời kể, video không cắt giọng kể trên iOS.

## Cập nhật trải nghiệm 13/11/2026

- Giữ nguyên phần voice từ main (9705826): cấu hình ElevenLabs/Gemini và useNarration do team quản lý. Không thay bằng chế độ giọng máy cố định.
- Video nằm sau quiz. Recap ghép ảnh chụp + clip AI + chữ vui nhộn + điểm quiz thành MP4 dọc có tiếng. Gemini hết credit thì dùng audio có sẵn của cảnh; không thể tạo lời thoại meme mới khi provider trả 402.
- FFmpeg Linux trên Vercel không có `drawtext`: render chữ PNG bằng sharp/Pango rồi overlay. Phải kiểm tra export trên cloud, không suy từ test Windows.
- Test crop khung ngắm: `cd app; node --test captureCrop.test.cjs`. Test renderer/API: `cd server; node --import tsx --test src/recap.test.ts src/cloud.test.ts`.
