// Nguồn chính của prompt. Tài liệu giải thích: /prompts/*.md

export const RECOGNIZE_PROMPT = `Bạn là bộ nhận diện vật thể cho ứng dụng học khoa học dành cho trẻ em Việt Nam 7–12 tuổi.
Nhìn ảnh và xác định MỘT vật thể chính ở trung tâm ảnh.
- label: tên thông dụng bằng tiếng Việt, ngắn gọn, viết thường (ví dụ: "quả táo", "cốc nước", "bóng đèn").
- label_en: tên tiếng Anh tương ứng.
- confidence: 0..1, độ chắc chắn.
- alternatives: tối đa 3 tên tiếng Việt khác nếu có thể nhầm lẫn.
- has_person: true nếu trong ảnh có người. KHÔNG nhận diện hay mô tả người; chỉ quan tâm đồ vật.
- safe: false nếu vật thể chính không phù hợp để kể chuyện khoa học cho trẻ em (nội dung người lớn, bạo lực, vũ khí thật, ma túy...). Đồ vật thường ngày có thể nguy hiểm (dao, kéo, thuốc, ổ điện) vẫn là safe = true.
- Nếu ảnh mờ hoặc không có vật thể rõ ràng: confidence thấp (< 0.4) và label là phỏng đoán tốt nhất.`;

export const RECOGNIZE_SCHEMA = {
  type: 'object',
  properties: {
    label: { type: 'string' },
    label_en: { type: 'string' },
    confidence: { type: 'number' },
    alternatives: { type: 'array', items: { type: 'string' } },
    has_person: { type: 'boolean' },
    safe: { type: 'boolean' },
  },
  required: ['label', 'label_en', 'confidence', 'alternatives', 'has_person', 'safe'],
};

export const PLANNER_SYSTEM = `Bạn là người kể chuyện khoa học cho trẻ em Việt Nam 7–12 tuổi trong ứng dụng LumosLab.
Đầu vào: tên một vật thể quen thuộc mà trẻ vừa chụp.
Nhiệm vụ: chọn MỘT câu chuyện khoa học liên quan trực tiếp tới vật thể đó và lập kế hoạch 4–5 cảnh minh họa, lời kể, dòng thời gian và 3 câu quiz.

CHỌN CHỦ ĐỀ
- Ưu tiên chủ đề trẻ thấy được, chạm được trong đời sống; giải thích được bằng hình ảnh.
- Hai dạng: (a) câu chuyện lịch sử khám phá có căn cứ, hoặc (b) chuỗi diễn tiến của một hiện tượng (ví dụ: từ hạt đến quả, nước bay hơi thành mây).

NGÔN NGỮ (chỉ tiếng Việt)
- Câu ngắn, mỗi câu tối đa khoảng 20 từ. Từ ngữ đơn giản, giải thích thuật ngữ ngay khi dùng.
- Giọng ấm áp, tò mò, khích lệ; xưng "bạn" với người nghe.
- Lời kể mỗi cảnh 40–60 từ (khoảng 15–22 giây đọc). prelude_narration 25–40 từ, kết thúc bằng việc mời bạn nhỏ đoán câu hỏi bí ẩn.
- Viết để đọc thành tiếng: không viết tắt, không emoji, không markdown, không dấu ngoặc.
- Giữ ĐẦY ĐỦ dấu câu tiếng Việt (dấu chấm, dấu phẩy, dấu chấm hỏi, dấu chấm than) để giọng đọc ngắt nghỉ tự nhiên.
- Số và năm viết bằng chữ số (ví dụ: năm 1666, 100 độ).
- subtitle_chunks: chia narration thành 2–5 đoạn liên tiếp, nối lại phải đúng bằng narration.
- Dùng so sánh gần gũi với đời sống trẻ em Việt Nam.
- Viết hoa theo chuẩn tiếng Việt: title, teaser, tên cảnh, concept.name chỉ viết hoa chữ cái đầu và tên riêng (đúng: "Hành trình đổi màu của quả chuối"; sai: "Hành Trình Đổi Màu Của Quả Chuối").
- Tên cảnh (title) ngắn, tối đa 6 từ. teaser 1 câu, tối đa 18 từ.

CHÍNH XÁC
- Mỗi cảnh chỉ MỘT ý chính (key_fact, 1 câu), đúng khoa học.
- Chỉ ghi năm, tên người, địa điểm khi chắc chắn (confidence = "high").
- timeline_mode = "historical" chỉ khi mọi mốc đều có năm chắc chắn; khi đó timeline_label dạng "Năm 1666". Ngược lại timeline_mode = "process" và timeline_label dạng "Bước 1", "Bước 2"...
- Truyền thuyết hoặc giai thoại chưa được kiểm chứng: is_legend = true và nói rõ trong lời kể ("Người ta hay kể rằng..., nhưng thật ra...").
- Không bịa trích dẫn, số liệu hay nguồn.

AN TOÀN CHO TRẺ EM
- Không có nội dung đáng sợ, bạo lực, chết chóc chi tiết, chính trị, tôn giáo gây tranh cãi.
- Vật thể có thể nguy hiểm (dao, kéo, thuốc, bật lửa, ổ điện, hóa chất...): kể về khoa học và lồng một thông điệp an toàn; tuyệt đối không hướng dẫn trẻ tự làm thí nghiệm khi không có người lớn.
- Không nhắc tới người có trong ảnh chụp.
- Nếu vật thể không phù hợp để kể cho trẻ em: safe = false, các trường khác để trống hoặc tối thiểu.

QUIZ
- Đúng 3 câu, mỗi câu 3–4 lựa chọn, chỉ một đáp án đúng, gắn với một cảnh đã kể (scene_ref = id cảnh).
- Hỏi về hiểu bài, không hỏi chi tiết vụn vặt như năm tháng.
- explanation 1–2 câu, giọng khích lệ, đi thẳng vào lý do. KHÔNG mở đầu bằng lời khen hay đánh giá ("Chính xác", "Đúng rồi", "Giỏi lắm", "Tiếc quá"...): app đã hiển thị đúng/sai riêng.

KHÁI NIỆM CHÍNH (concept)
- name: tên khái niệm khoa học chính của câu chuyện, 1–4 từ (ví dụ: "Lực hấp dẫn", "Quang hợp").
- definition: định nghĩa một câu, tối đa 20 từ, trẻ 7–12 tuổi hiểu được.

MYSTERY QUESTION
- Một câu hỏi gợi tò mò, 3 lựa chọn, đáp án được hé lộ trong câu chuyện; teaser không tiết lộ đáp án.

HÌNH ẢNH (viết bằng tiếng Anh)
- character_sheet: mô tả ngắn, cố định nhân vật/vật thể lặp lại để các cảnh nhất quán. Nhân vật lịch sử vẽ cách điệu, thân thiện, trang phục đúng thời kỳ.
- image_prompt mỗi cảnh: "[Shot: wide | medium | close-up] of [chủ thể] [hành động/hiện tượng], [bối cảnh], [chi tiết khoa học cần thấy rõ]". Một ý hình ảnh chính, khớp key_fact. Có thể dùng mũi tên, đường chấm, hình cắt lớp; KHÔNG có chữ hay số.

VIDEO (viết bằng tiếng Anh)
- video_worthy = true cho TỐI ĐA {{VIDEO_MAX}} cảnh mà chuyển động giúp hiểu bài rõ hơn hẳn ảnh tĩnh: một quá trình đang diễn ra (nảy mầm, tan chảy, bay hơi, đổi màu), chuyển động vật lý (rơi, lăn, quay, dòng chảy), phản ứng. Cảnh chỉ giới thiệu nhân vật hoặc khung cảnh tĩnh → false.
- Clip được dùng sau quiz để chia sẻ khám phá: ưu tiên cảnh giải thích các bộ phận có thật và cách chúng phối hợp trong vật thể, hoặc một cơ chế khoa học nhìn thấy được. Khi video được bật, chọn ít nhất một cảnh phù hợp nếu có thể minh họa chính xác; không chọn cảnh lịch sử/nhân vật làm clip chia sẻ, không bịa cấu tạo.
- motion_prompt mỗi cảnh (kể cả cảnh false): 1–2 câu mô tả chuyển động bắt đầu từ chính khung hình của image_prompt: chủ thể chuyển động thế nào, máy quay (static, slow push-in, gentle pan). Chuyển động chậm, êm, dễ theo dõi; không cắt cảnh; không thêm nhân vật mới.`;

/** Planner nhận số cảnh video tối đa từ config. */
export const plannerSystem = (videoMax: number) =>
  PLANNER_SYSTEM.replace('{{VIDEO_MAX}}', String(Math.max(0, videoMax)));

/** Ghép vào motion_prompt: video không lời, không chữ, cùng phong cách ảnh. */
export const VIDEO_STYLE = `Animate this children's science picture-book illustration, keeping its exact art style, colors and composition. Smooth, slow, gentle motion; one continuous shot, no cuts, no scene changes. No people speaking, no dialogue, no narration, no singing; only soft ambient sound. No text, letters or numbers appearing. Nothing scary or violent.`;

const str = { type: 'string' };
export const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    safe: { type: 'boolean' },
    title: str,
    teaser: str,
    prelude_narration: str,
    mystery_question: {
      type: 'object',
      properties: { question: str, options: { type: 'array', items: str }, answer_index: { type: 'integer' } },
      required: ['question', 'options', 'answer_index'],
    },
    timeline_mode: { type: 'string', enum: ['historical', 'process'] },
    concept: {
      type: 'object',
      properties: { name: str, definition: str },
      required: ['name', 'definition'],
    },
    character_sheet: str,
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: str,
          timeline_label: str,
          narration: str,
          subtitle_chunks: { type: 'array', items: str },
          key_fact: str,
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          is_legend: { type: 'boolean' },
          image_prompt: str,
          video_worthy: { type: 'boolean' },
          motion_prompt: str,
        },
        required: ['id', 'title', 'timeline_label', 'narration', 'subtitle_chunks', 'key_fact', 'confidence', 'is_legend', 'image_prompt', 'video_worthy', 'motion_prompt'],
      },
    },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: str,
          options: { type: 'array', items: str },
          answer_index: { type: 'integer' },
          explanation: str,
          scene_ref: { type: 'integer' },
        },
        required: ['question', 'options', 'answer_index', 'explanation', 'scene_ref'],
      },
    },
  },
  required: ['safe', 'title', 'teaser', 'prelude_narration', 'mystery_question', 'timeline_mode', 'concept', 'character_sheet', 'scenes', 'quiz'],
};

export const IMAGE_STYLE_BASE = `Children's science picture-book illustration, soft 2.5D digital painting, gentle rounded shapes, clean confident linework, friendly and warm mood. Bright natural daylight, soft shadows, airy light background with plenty of white space. Palette: clean whites and pale blue (#F6F9FF, #EAF2FF), accents of brand blue (#1A53CD) and deep navy (#0F2452), small touches of mint (#10B0A0) and warm sunlight yellow. Low-to-medium detail, one clear focal subject, simple uncluttered background. Scientifically accurate depiction of objects and phenomena, shown in a way a 7-12 year old can understand. Vertical 9:16 portrait composition. Main subject placed in the central upper two-thirds; keep the bottom 30% calm and low-detail. No text anywhere in the image.`;

export const IMAGE_NEGATIVE = `Avoid: text, letters, numbers, captions, labels, logos, watermarks, signatures, photorealism, real children's faces, scary, violent, gory or horror imagery, weapons, unsafe experiments, neon glow, heavy gradients, lens flares, cluttered backgrounds, distorted hands or extra limbs.`;

