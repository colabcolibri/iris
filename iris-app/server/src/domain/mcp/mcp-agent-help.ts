import { MCP_TOOL_CATALOG } from "./mcp-tool-catalog.ts";
import { MCP_DOMAIN_CATALOG } from "./mcp-permission-policy.ts";

export const MCP_HELP_TOPICS = [
  "overview",
  "publish",
  "post_fields",
  "campaign",
  "app_settings",
  "assets",
  "permissions",
  "tools",
] as const;

export type McpHelpTopic = (typeof MCP_HELP_TOPICS)[number];

const PUBLISH_FLOW = [
  "## Publish flow (Instagram via MCP)",
  "",
  "1. Create draft — iris_create_post (caption, optional collaborators, channel=instagram).",
  "2. Edit fields — iris_update_post (caption, briefing, campaign, schedule, silence flags).",
  "3. Upload images (no base64 in MCP):",
  "   - iris_prepare_post_asset_upload (postId, filename, sortOrder 1-based: first slide = 1).",
  "   - Run returned curl_command on the host (replace LOCAL_IMAGE_PATH).",
  "   - Requires IRIS_PUBLIC_BASE_URL + IRIS_PUBLISH_URL_SECRET on the server.",
  "4. Optional asset metadata — iris_update_post_asset (altText, userTags with x/y 0–1).",
  "5. Optional visual summary — iris_generate_post_carousel_summary (vision LLM → carousel_summary only).",
  "6. Schedule — iris_update_post with scheduledAt (ISO) + status=scheduled. Meta must be connected.",
  "7. Publish — the Iris worker publishes scheduled posts to Instagram (not a separate MCP tool).",
  "",
  "Cannot via MCP: approve/send comment replies, OAuth Meta, rotate MCP code, change LLM API keys.",
  "Cancel: iris_cancel_post with user-confirmed confirmPhrase=cancelar.",
  "Permanent delete: only after cancelled + confirmPhrase=deletar via iris_purge_cancelled_post.",
].join("\n");

const POST_FIELDS = [
  "## Post fields (iris_get_post / iris_update_post)",
  "",
  "| Field (API) | MCP arg | Meaning |",
  "|-------------|---------|---------|",
  "| caption | caption | Instagram caption / legenda |",
  "| collaborators | collaborators | Up to 3 IG usernames as collab on publish (not photo tags). [] or null clears |",
  "| carousel_summary | carouselSummary | Visual description of slides for reply context — NOT reply instructions |",
  "| reply_prompt | replyPrompt | Post-specific reply briefing (promo, price, link, tone) |",
  "| silence_soul | silenceSoul | Omit global SOUL block in reply harness for this post |",
  "| silence_page | silencePage | Omit page block |",
  "| silence_knowledge | silenceKnowledge | Omit knowledge block |",
  "| silence_restrictions | silenceRestrictions | Omit global restrictions (hardcoded guardrails remain) |",
  "| reply_mode | replyMode | Public comment reply: inherit, off, auto, draft |",
  "| agent_active_days | agentActiveDays | Campaign TTL days after publish; null = no limit (1–365) |",
  "| private_reply_mode | privateReplyMode | DM after comment: inherit, off, auto, draft |",
  "| scheduled_at | scheduledAt | ISO schedule time |",
  "| status | status | draft, scheduled, published, monitored, failed — not cancelled (use iris_cancel_post) |",
  "",
  "Status lifecycle: draft → scheduled (needs assets + Meta) → worker publishes → published.",
  "Do not mix: visual description → carouselSummary; reply instructions → replyPrompt.",
].join("\n");

const CAMPAIGN = [
  "## Interactive campaigns & private reply (v1.29)",
  "",
  "agent_active_days — Agent stops replying after N days from published_at (fallback created_at).",
  "private_reply_mode — One private DM per comment via Meta API (recipient.comment_id).",
  "Modes: off, auto (send), draft (approve in admin), inherit (global default).",
  "",
  "Global default — iris_get_app_settings / iris_update_app_settings → private_reply_mode (default off).",
  "",
  "Safety gates (no bulk DM to old comments):",
  "- Private reply enqueued only on new comment webhook (created), not on sync/history.",
  "- Meta window: 7 days since comment timestamp.",
  "- One private DM per comment.",
  "- Campaign TTL via agent_active_days.",
  "",
  "Typical promo: agentActiveDays=7, privateReplyMode=auto, replyPrompt for thread + coupon in DM.",
].join("\n");

const APP_SETTINGS = [
  "## App settings (iris_get_app_settings / iris_update_app_settings)",
  "",
  "| Field | Meaning |",
  "|-------|---------|",
  "| timezone | IANA timezone for scheduling UI |",
  "| reply_mode | Global default when post reply_mode=inherit |",
  "| private_reply_mode | Global default when post private_reply_mode=inherit |",
  "| reply_delay_seconds | Debounce before agent replies to a comment |",
  "| reply_max_age_days | Skip comments older than N days (separate from campaign TTL) |",
  "| message_reply_mode | DM inbox auto-reply mode |",
  "| message_reply_delay_seconds | Debounce for DM replies |",
  "| auto_monitor_enabled | Poll Meta for new media |",
  "| agent_reply_tick_interval_seconds | Worker tick for comment/DM agent queue |",
  "",
  "Persona & editorial: iris_get_reply_persona, iris_update_reply_persona,",
  "iris_get_agent_content, iris_update_agent_content, iris_get_message_agent_content,",
  "iris_update_message_agent_content.",
].join("\n");

const ASSETS = [
  "## Post assets",
  "",
  "| Tool | Use |",
  "|------|-----|",
  "| iris_list_post_assets | List assets + short-lived signed url |",
  "| iris_prepare_post_asset_upload | Signed multipart upload URL + curl |",
  "| iris_update_post_asset | altText (a11y), userTags [{username,x,y}] on image |",
  "| iris_delete_post_asset | Remove asset row + file |",
  "| iris_generate_post_carousel_summary | Vision summary → carousel_summary |",
  "",
  "sortOrder: 1-based carousel index (first image = 1, never 0).",
  "userTags ≠ collaborators (tags in photo vs collab invite on publish).",
].join("\n");

const PERMISSIONS = [
  "## MCP permissions",
  "",
  "Tools map to domains (posts, media, settings, …) with actions read, write, delete.",
  "Configured in admin → Settings → MCP permissions (presets: read_only, editor, full, custom).",
  "",
  "| Domain | Campaign-related access |",
  "|--------|-------------------------|",
  "| posts:write | iris_update_post including agentActiveDays, privateReplyMode, replyMode |",
  "| posts:read | iris_get_post returns campaign fields |",
  "| settings:write | iris_update_app_settings including private_reply_mode |",
  "| settings:read | iris_get_app_settings |",
  "",
  "iris_help is always available (no permission gate).",
].join("\n");

const OVERVIEW = [
  "# Iris MCP agent guide",
  "",
  "Use iris_help with optional topic: overview, publish, post_fields, campaign,",
  "app_settings, assets, permissions, tools.",
  "",
  "First steps: iris_list_posts → iris_get_post → iris_update_post.",
  "",
  "Human docs: /docs on the Iris server (Starlight) — usage and Meta setup guides.",
].join("\n");

function buildToolsSection(): string {
  const byDomain = new Map<string, string[]>();
  for (const [name, meta] of Object.entries(MCP_TOOL_CATALOG)) {
    const key = meta.domain;
    const list = byDomain.get(key) ?? [];
    list.push(name);
    byDomain.set(key, list);
  }

  const lines = ["## MCP tools by domain", ""];
  for (const def of MCP_DOMAIN_CATALOG) {
    const tools = byDomain.get(def.id) ?? [];
    lines.push(`### ${def.label} (${def.id})`);
    lines.push(def.description);
    lines.push(tools.join(", ") || "_none_");
    lines.push("");
  }
  lines.push("Meta: iris_help — this guide (always allowed).");
  return lines.join("\n").trim();
}

const SECTIONS: Record<McpHelpTopic, string> = {
  overview: OVERVIEW,
  publish: PUBLISH_FLOW,
  post_fields: POST_FIELDS,
  campaign: CAMPAIGN,
  app_settings: APP_SETTINGS,
  assets: ASSETS,
  permissions: PERMISSIONS,
  tools: buildToolsSection(),
};

export type McpAgentHelpResult = {
  version: string;
  topics: McpHelpTopic[];
  topic?: McpHelpTopic;
  markdown: string;
  sections?: Record<string, string>;
};

export function buildMcpAgentHelp(topic?: string): McpAgentHelpResult {
  const normalized = topic?.trim().toLowerCase();
  if (normalized && !MCP_HELP_TOPICS.includes(normalized as McpHelpTopic)) {
    return {
      version: "1.29",
      topics: [...MCP_HELP_TOPICS],
      markdown: `Unknown topic "${topic}". Available: ${MCP_HELP_TOPICS.join(", ")}.`,
    };
  }

  const selected = normalized as McpHelpTopic | undefined;

  if (selected) {
    return {
      version: "1.29",
      topics: [...MCP_HELP_TOPICS],
      topic: selected,
      markdown: SECTIONS[selected],
    };
  }

  const combined = [
    SECTIONS.overview,
    "",
    SECTIONS.publish,
    "",
    SECTIONS.post_fields,
    "",
    SECTIONS.campaign,
    "",
    SECTIONS.app_settings,
    "",
    SECTIONS.assets,
    "",
    SECTIONS.permissions,
    "",
    SECTIONS.tools,
  ].join("\n");

  return {
    version: "1.29",
    topics: [...MCP_HELP_TOPICS],
    markdown: combined,
    sections: Object.fromEntries(
      MCP_HELP_TOPICS.map((key) => [key, SECTIONS[key]]),
    ),
  };
}
