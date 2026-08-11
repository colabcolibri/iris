export type PostStatus = "draft" | "scheduled" | "published" | "monitored" | "failed" | "cancelled";
export type ReplyMode = "off" | "auto" | "draft";
export type PostReplyModeSetting = ReplyMode | "inherit";

export type Post = {
  id: string;
  caption: string;
  carousel_summary?: string | null;
  channel: string;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at?: string;
  auto_reply_enabled?: boolean;
  reply_mode?: PostReplyModeSetting;
  assets_count?: number;
  error_message?: string | null;
  ig_media_id?: string | null;
};

export type Asset = {
  id: string;
  post_id: string;
  sort_order: number;
  storage_path: string;
  original_filename?: string;
  mime?: string;
  width?: number | null;
  height?: number | null;
};

export type Comment = {
  id: string;
  ig_comment_id?: string;
  text: string;
  status: string;
  author_username?: string;
  parent_ig_comment_id?: string | null;
  created_at: string;
  ig_timestamp?: string | null;
  error_message?: string | null;
  draft_text?: string | null;
  draft_status?: string | null;
  linked_reply_text?: string | null;
  linked_reply_ig_comment_id?: string | null;
  reply_to_ig_comment_id?: string | null;
};

export type CommentPostSummary = {
  post_id: string;
  caption: string | null;
  carousel_summary?: string | null;
  published_at: string | null;
  ig_media_id: string;
  status?: string;
  is_external?: boolean;
  comments_count: number;
  pending_count: number;
  preview_filename?: string | null;
  preview_mime?: string | null;
  preview_url?: string | null;
};

export type PostInsightMetric = {
  name: string;
  period: string;
  values: Array<{ value: number }>;
};

export type PostMediaSlide =
  | {
      source: "local";
      preview_filename: string;
      preview_mime: string;
    }
  | {
      source: "meta";
      url: string;
      media_type?: string | null;
      thumbnail_url?: string | null;
    };

export type PostInsightsMedia = {
  source: "local" | "meta";
  permalink?: string | null;
  media_type?: string | null;
  items: PostMediaSlide[];
};

export type PostInsightsResult = {
  ok: boolean;
  code?: string;
  message?: string;
  post_id?: string;
  ig_media_id?: string;
  fetched_at?: string;
  insights?: PostInsightMetric[];
  media?: PostInsightsMedia;
};

export type BrowseableMediaItem = {
  ig_media_id: string;
  caption: string | null;
  published_at: string | null;
  permalink: string | null;
  media_type: string | null;
  thumbnail_url: string | null;
  like_count: number | null;
  comments_count: number | null;
  already_managed: boolean;
  managed_post_id: string | null;
};

export type BrowseMediaPage = {
  items: BrowseableMediaItem[];
  next_cursor: string | null;
};

export type ImportMonitoredPostsBatchResult = {
  imported: Post[];
  skipped: Array<{ ig_media_id: string; reason: string }>;
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

export type ReconcileCommentsPreview = {
  post_id: string;
  brand_username: string | null;
  linkable_count: number;
  skipped_brand_count: number;
  links: Array<{
    user_comment_id: string;
    brand_ig_comment_id: string;
    preview_text: string | null;
  }>;
};

export type ReconcileCommentsResult = {
  post_id: string;
  brand_username: string | null;
  linked_count: number;
  skipped_brand_count: number;
  linkable_count: number;
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
  brand_name: string | null;
  signature_instruction: string;
  response_language: string;
  max_chars: number;
  updated_at: string | null;
};

export type AgentContent = {
  soul: string;
  page: string;
  knowledge: string;
  restrictions: string;
  updated_at: string | null;
};

export type ReplyAuditLlm = {
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
};

export type ReplyAuditStep = {
  stage: "triage" | "draft" | "verify";
  verdict: "pass" | "fail" | "skip";
  reason: string | null;
  reasoning: string | null;
  created_at: string;
  structured?: Record<string, unknown> | null;
  llm?: ReplyAuditLlm | null;
};

export type ReplyAudit = {
  agent_run_id: string;
  flow_id: string;
  trigger: string;
  terminal_status:
    | "skipped_triage"
    | "blocked_harmful"
    | "rejected_verify"
    | "approved"
    | "approved_simple";
  reply_tier?: "none" | "simple" | "full" | null;
  output_summary: string | null;
  steps: ReplyAuditStep[];
};

export type AgentRunListItem = {
  id: string;
  flow_id: string;
  trigger: string;
  status: "ok" | "failed" | "skipped";
  output_summary: string | null;
  created_at: string;
  comment_id: string | null;
  post_id: string | null;
  step_count: number;
  reply_tier: string | null;
  terminal_status: string | null;
  duration_ms: number | null;
  total_prompt_tokens: number | null;
  total_completion_tokens: number | null;
  total_tokens: number | null;
};

export type AgentRunDetail = {
  run: {
    id: string;
    flowId: string;
    trigger: string;
    inputSummary: string | null;
    outputSummary: string | null;
    status: "ok" | "failed" | "skipped";
    createdAt: string;
  };
  comment_id: string | null;
  audit: ReplyAudit;
};

export type AppSettings = {
  timezone: string;
  reply_mode: ReplyMode;
  auto_reply_enabled: boolean;
  reply_delay_seconds: number;
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

export type LlmSettings = {
  configured: boolean;
  api_url: string;
  model: string;
  supports_vision: boolean;
  key_hint: string | null;
  source: "database" | "environment" | null;
  env_override: boolean;
  updated_at: string | null;
};

export type WebhookProcessingStatus = "received" | "processed" | "ignored" | "failed";

export type WebhookEvent = {
  id: string;
  received_at: string;
  signature_valid: boolean;
  object: string | null;
  field: string | null;
  processing_status: WebhookProcessingStatus;
  comment_id: string | null;
  post_id: string | null;
  error_message: string | null;
  payload_json: string;
  payload_truncated: boolean;
};
