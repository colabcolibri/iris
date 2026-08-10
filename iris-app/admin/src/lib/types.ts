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
  ig_comment_id?: string;
  text: string;
  status: string;
  author_username?: string;
  parent_ig_comment_id?: string | null;
  created_at: string;
  error_message?: string | null;
};

export type CommentPostSummary = {
  post_id: string;
  caption: string | null;
  published_at: string | null;
  ig_media_id: string;
  comments_count: number;
  pending_count: number;
};

export type SyncPostCommentsResult = {
  post_id: string;
  ig_media_id: string;
  synced_at: string;
  reported_comments_count: number;
  comments_fetched: number;
  access_limited: boolean;
  warning: string | null;
  comments: Comment[];
};

export type CommentsInboxMedia = {
  ig_media_id: string;
  post_id: string | null;
  caption: string | null;
  media_timestamp: string;
  reported_comments_count?: number;
  comments: Array<{
    ig_comment_id: string;
    parent_ig_comment_id: string | null;
    author_username: string | null;
    text: string | null;
    timestamp: string;
    iris_comment_id: string | null;
    status: string | null;
  }>;
};

export type CommentsInbox = {
  source?: "local" | "meta";
  synced_at: string;
  days: number;
  summary?: {
    media_scanned: number;
    comments_reported: number;
    comments_fetched: number;
    access_limited: boolean;
    warning: string | null;
  };
  media: CommentsInboxMedia[];
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

export type McpSettings = {
  configured: boolean;
  source: "database" | "environment" | "development_default" | null;
  code_hint: string | null;
  mcp_path: string;
  mcp_url: string;
  updated_at: string | null;
  env_override: boolean;
};

export type McpSettingsGenerateResult = {
  connection_code: string;
  code_hint: string;
  mcp_path: string;
  mcp_url: string;
  updated_at: string;
};

export type ReplyInspectionThreadEntry = {
  author: string | null;
  text: string | null;
  is_brand_reply: boolean;
  at: string;
  depth: number;
};

export type ReplyInspectionComment = {
  id: string;
  author_username: string | null;
  text: string | null;
  status: string;
  created_at: string;
  parent_ig_comment_id?: string | null;
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
