export type PostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "monitored"
  | "failed"
  | "cancelled";
export type ReplyMode = "off" | "auto" | "draft";
export type PostReplyModeSetting = ReplyMode | "inherit";

export type Post = {
  id: string;
  caption: string;
  collaborators?: string[];
  carousel_summary?: string | null;
  reply_prompt?: string | null;
  silence_soul?: boolean;
  silence_page?: boolean;
  silence_knowledge?: boolean;
  silence_restrictions?: boolean;
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

export type UpdatePostBody = {
  caption?: string;
  collaborators?: string[];
  carousel_summary?: string | null;
  reply_prompt?: string | null;
  silence_soul?: boolean;
  silence_page?: boolean;
  silence_knowledge?: boolean;
  silence_restrictions?: boolean;
  scheduled_at?: string | null;
  status?: PostStatus;
  reply_mode?: PostReplyModeSetting;
  auto_reply_enabled?: boolean;
};

export type AssetUserTag = {
  username: string;
  x: number;
  y: number;
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
  alt_text?: string | null;
  user_tags?: AssetUserTag[];
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
  deleted_at?: string | null;
};

export type IgMediaStatus = "on_feed" | "archived" | "unavailable";

export type CommentActivityKind =
  | "pending_approval"
  | "recent_public"
  | "recent_iris";

export type CommentActivityItem = {
  comment_id: string;
  post_id: string;
  ig_media_id: string | null;
  text_preview: string;
  author_username: string | null;
  occurred_at: string;
  post_caption_preview: string | null;
  post_pending_count: number;
  draft_text_preview?: string | null;
  sent_text_preview?: string | null;
};

export type CommentPostSummary = {
  post_id: string;
  caption: string | null;
  carousel_summary?: string | null;
  published_at: string | null;
  ig_media_id: string;
  status?: string;
  is_external?: boolean;
  reply_mode?: PostReplyModeSetting;
  reply_prompt?: string | null;
  silence_soul?: boolean;
  silence_page?: boolean;
  silence_knowledge?: boolean;
  silence_restrictions?: boolean;
  auto_reply_enabled?: boolean;
  ig_media_status?: IgMediaStatus | null;
  ig_media_status_detail?: string | null;
  ig_media_status_checked_at?: string | null;
  like_count: number | null;
  reported_comments_count?: number | null;
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
  ig_media_status?: IgMediaStatus | null;
  ig_media_status_detail?: string | null;
  fetched_at?: string;
  from_cache?: boolean;
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
  marked_deleted?: number;
  restored?: number;
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
  synced_at: string;
  comments_fetched: number;
  access_limited: boolean;
  warning: string | null;
  marked_deleted: number;
  restored: number;
  comments: Comment[];
};

export type ReconcileCommentsResult = {
  post_id: string;
  brand_username: string | null;
  linked_count: number;
  skipped_brand_count: number;
  linkable_count: number;
  synced_at: string;
  comments_fetched: number;
  access_limited: boolean;
  warning: string | null;
  marked_deleted: number;
  restored: number;
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
  messaging_supported?: boolean;
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

export type MessageAgentContent = {
  dm_soul: string;
  dm_page: string;
  dm_knowledge: string;
  dm_restrictions: string;
  updated_at: string | null;
};

export type ConversationReplyMode = "inherit" | ReplyMode;

export type ConversationSummary = {
  id: string;
  ig_conversation_id: string;
  participant_ig_user_id: string;
  participant_username: string | null;
  last_message_at: string | null;
  reply_mode: ConversationReplyMode;
  reply_prompt: string | null;
  pending_count: number;
  can_reply?: boolean;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  ig_message_id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  text: string | null;
  ig_timestamp: string | null;
  status: "pending" | "replied" | "skipped" | "failed";
  error_message: string | null;
  agent_reply_not_before: string | null;
  created_at: string;
  draft_text?: string | null;
  draft_status?: string | null;
  linked_reply_text?: string | null;
  linked_reply_ig_message_id?: string | null;
};

export type MessageActivityKind = "pending_approval" | "recent";

export type MessageActivityItem = {
  message_id: string;
  conversation_id: string;
  participant_username: string | null;
  text_preview: string;
  occurred_at: string;
  conversation_pending_count: number;
  draft_text_preview: string | null;
  sent_text_preview: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ReplyAuditLlm = {
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
};

export type ReplyAuditStep = {
  stage:
    | "triage"
    | "draft"
    | "verify"
    | "message_triage"
    | "message_draft"
    | "message_verify";
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
    | "approved_simple"
    | string;
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
  models: string[];
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
  post_id: string | null;
  audit: ReplyAudit;
};

export type AppSettings = {
  timezone: string;
  reply_mode: ReplyMode;
  auto_reply_enabled: boolean;
  reply_delay_seconds: number;
  message_reply_mode: ReplyMode;
  message_auto_reply_enabled: boolean;
  message_reply_delay_seconds: number;
  auto_monitor_enabled: boolean;
  auto_monitor_interval_seconds: number;
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

export type WebhookProcessingStatus =
  | "received"
  | "processed"
  | "ignored"
  | "failed";

export type WebhookEvent = {
  id: string;
  received_at: string;
  signature_valid: boolean;
  object: string | null;
  field: string | null;
  webhook_type: string;
  verb: string | null;
  ig_comment_id: string | null;
  ig_media_id: string | null;
  author_username: string | null;
  text_preview: string | null;
  entries_count: number;
  processing_status: WebhookProcessingStatus;
  comment_id: string | null;
  post_id: string | null;
  error_message: string | null;
  payload_json: string;
  payload_truncated: boolean;
};
