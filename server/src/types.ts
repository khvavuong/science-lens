export interface Recognition {
  label: string;
  label_en: string;
  confidence: number;
  alternatives: string[];
  has_person: boolean;
  safe: boolean;
}

export interface Choice {
  question: string;
  options: string[];
  answer_index: number;
}

export interface Scene {
  id: number;
  title: string;
  timeline_label: string;
  narration: string;
  subtitle_chunks: string[];
  key_fact: string;
  confidence: 'high' | 'medium' | 'low';
  is_legend: boolean;
  image_prompt: string;
  /** Cảnh có chuyển động đáng xem → tạo video (tối đa VIDEO_MAX_SCENES cảnh). */
  video_worthy?: boolean;
  /** Mô tả chuyển động (tiếng Anh) cho image-to-video. */
  motion_prompt?: string;
}

export interface QuizItem extends Choice {
  explanation: string;
  scene_ref: number;
}

export interface Plan {
  safe: boolean;
  title: string;
  teaser: string;
  prelude_narration: string;
  mystery_question: Choice;
  timeline_mode: 'historical' | 'process';
  concept?: { name: string; definition: string };
  character_sheet: string;
  scenes: Scene[];
  quiz: QuizItem[];
}

export type AssetStatus = 'pending' | 'ready' | 'error';
export interface Asset {
  status: AssetStatus;
  url?: string;
  durationMs?: number;
  error?: string;
}

export interface Story {
  id: string;
  label: string;
  status: 'planning' | 'ready' | 'unsafe' | 'error';
  error?: string;
  createdAt: number;
  plan?: Plan;
  assets: {
    prelude_audio: Asset;
    /** `video` chỉ có ở cảnh được chọn làm video. */
    scenes: { image: Asset; audio: Asset; video?: Asset }[];
  };
}
