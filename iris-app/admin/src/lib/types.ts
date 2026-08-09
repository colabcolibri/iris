export type PostStatus = "draft" | "scheduled" | "published" | "failed" | "cancelled";

export type Post = {
  id: string;
  caption: string;
  channel: string;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  auto_reply_enabled?: boolean;
  assets_count?: number;
  error_message?: string | null;
  ig_media_id?: string | null;
};

export type Asset = {
  id: string;
  storage_path: string;
  original_filename?: string;
  mime?: string;
};

export type Comment = {
  id: string;
  text: string;
  status: string;
  author_username?: string;
  created_at: string;
  error_message?: string | null;
};

export type MetaStatus = {
  connected: boolean;
  tokenExpired?: boolean;
  igUsername?: string | null;
};

export type ReplyPersona = {
  system_prompt: string;
  tone: string;
  brand_name: string | null;
  max_chars: number;
  updated_at: string;
};

export type AppSettings = {
  timezone: string;
  updated_at: string;
};

export type ReplyInspectionThreadEntry = {
  author: string | null;
  text: string | null;
  is_brand_reply: boolean;
  at: string;
};

export type ReplyInspectionComment = {
  id: string;
  author_username: string | null;
  text: string | null;
  status: string;
  created_at: string;
  thread: ReplyInspectionThreadEntry[];
};

export type ReplyInspection = {
  post_context: {
    caption_truncated: string | null;
    assets: Array<{
      filename: string;
      sort_order: number;
      public_url: string | null;
    }>;
  };
  comments: ReplyInspectionComment[];
  auto_reply_enabled: boolean;
};
