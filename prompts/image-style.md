# LumosLab – Image Style Prompt (v1, chốt)

Prompt ảnh viết bằng **tiếng Anh** (model sinh ảnh hiểu tốt hơn). Lời kể, phụ đề, quiz vẫn là tiếng Việt.

> Nguồn chính: `IMAGE_STYLE_BASE`, `IMAGE_NEGATIVE` trong [server/src/prompts.ts](../server/src/prompts.ts).

Mỗi ảnh scene = `STYLE_BASE` + `CHARACTER_SHEET` (của câu chuyện) + `SCENE_PROMPT` (của scene) + `NEGATIVE`.

---

## 1. STYLE_BASE (cố định cho mọi ảnh)

```
Children's science picture-book illustration, soft 2.5D digital painting,
gentle rounded shapes, clean confident linework, friendly and warm mood.
Bright natural daylight, soft shadows, airy light background with plenty of
white space. Palette: clean whites and pale blue (#F6F9FF, #EAF2FF), accents of
brand blue (#1A53CD) and deep navy (#0F2452), small touches of mint (#10B0A0)
and warm sunlight yellow. Low-to-medium detail, one clear focal subject,
simple uncluttered background. Scientifically accurate depiction of objects
and phenomena, shown in a way a 7–12 year old can understand.
Vertical 9:16 portrait composition. Main subject placed in the central
upper two-thirds; keep the bottom 30% calm and low-detail (subtitle area).
No text anywhere in the image.
```

## 2. CHARACTER_SHEET (do Story Planner sinh ra, 1 lần / câu chuyện)

Planner trả về mô tả ngắn, cố định cho từng nhân vật hoặc vật thể lặp lại, và mô tả này được nối vào **mọi** scene để các cảnh nhất quán. Ví dụ:

```
Recurring characters: Isaac Newton as a young man in his early 20s,
friendly stylized face, shoulder-length wavy brown hair, simple dark
17th-century coat with white collar. Recurring object: a single round
red apple with one green leaf.
```

Quy tắc:
- Nhân vật lịch sử: vẽ cách điệu, thân thiện, trang phục đúng thời kỳ. Không vẽ chân dung tả thực.
- Không bao giờ vẽ lại người có trong ảnh người dùng chụp.
- Nếu câu chuyện không có nhân vật (chuỗi diễn tiến khoa học), chỉ mô tả vật thể hoặc hiện tượng lặp lại.

## 3. SCENE_PROMPT (mỗi scene, do Planner sinh ra)

Mẫu: `[Shot: wide | medium | close-up] of [chủ thể] [hành động/hiện tượng], [bối cảnh], [chi tiết khoa học cần thấy rõ].`

Ví dụ: `Medium shot of young Newton sitting under an apple tree in an English orchard, looking up thoughtfully as an apple falls straight down; a faint dotted arc hints at the pull of gravity toward the ground.`

- Mỗi scene chỉ có **một** ý hình ảnh chính, khớp với `key_fact`.
- Có thể dùng mũi tên, đường chấm, hình phóng to mặt cắt để minh họa hiện tượng, nhưng **không có chữ hay số**.

## 4. NEGATIVE (cố định)

```
No text, letters, numbers, captions, labels, logos, watermarks or signatures.
No photorealism, no real children's faces, no scary, violent, gory or
dark/horror imagery, no weapons, no fire hazards shown as fun, no unsafe
experiments, no neon glow, no heavy gradients, no lens flares, no cluttered
backgrounds, no distorted hands or extra limbs.
```

## 5. Thông số kỹ thuật

| Thông số | Giá trị |
|---|---|
| Tỉ lệ | 9:16 (ví dụ 1080×1920 hoặc 768×1344 tùy model) |
| Định dạng giao cho app | WebP/JPEG, ≤ 400KB sau nén |
| Teaser (Prelude) | Dùng cùng style, góc wide, gợi tò mò, không lộ đáp án Mystery Question |
| Fallback khi lỗi | Nền gradient rất nhẹ #F6F9FF → #EAF2FF + icon minh họa chủ đề (không để khung trống) |
