import type { McpAction, McpDomain } from "./mcp-permission-policy.ts";

export type McpToolPermissionMeta = {
  domain: McpDomain;
  action: McpAction;
};

export const MCP_TOOL_CATALOG: Record<string, McpToolPermissionMeta> = {
  iris_list_posts: { domain: "posts", action: "read" },
  iris_get_post: { domain: "posts", action: "read" },
  iris_create_post: { domain: "posts", action: "write" },
  iris_update_post: { domain: "posts", action: "write" },
  iris_cancel_post: { domain: "posts", action: "delete" },
  iris_purge_cancelled_post: { domain: "posts", action: "delete" },

  iris_list_post_assets: { domain: "media", action: "read" },
  iris_prepare_post_asset_upload: { domain: "media", action: "write" },
  iris_update_post_asset: { domain: "media", action: "write" },
  iris_delete_post_asset: { domain: "media", action: "delete" },
  iris_generate_post_carousel_summary: { domain: "media", action: "write" },

  iris_list_post_comments: { domain: "comments", action: "read" },
  iris_get_reply_context: { domain: "comments", action: "read" },
  iris_list_webhooks: { domain: "comments", action: "read" },

  iris_list_conversations: { domain: "messages", action: "read" },
  iris_list_conversation_messages: { domain: "messages", action: "read" },
  iris_get_message_reply_context: { domain: "messages", action: "read" },

  iris_list_products: { domain: "products", action: "read" },
  iris_get_product: { domain: "products", action: "read" },
  iris_create_product: { domain: "products", action: "write" },
  iris_update_product: { domain: "products", action: "write" },
  iris_delete_product: { domain: "products", action: "delete" },

  iris_list_store_connections: { domain: "stores", action: "read" },
  iris_create_store_connection: { domain: "stores", action: "write" },
  iris_delete_store_connection: { domain: "stores", action: "delete" },
  iris_test_store_connection: { domain: "stores", action: "read" },
  iris_sync_store_catalog: { domain: "stores", action: "write" },
  iris_get_product_field_policies: { domain: "stores", action: "read" },
  iris_update_product_field_policies: { domain: "stores", action: "write" },

  iris_get_post_insights: { domain: "insights", action: "read" },
  iris_get_post_insights_history: { domain: "insights", action: "read" },
  iris_get_account_insights: { domain: "insights", action: "read" },
  iris_refresh_all_post_insights: { domain: "insights", action: "write" },
  iris_refresh_media_insights_page: { domain: "insights", action: "write" },

  iris_get_app_settings: { domain: "settings", action: "read" },
  iris_update_app_settings: { domain: "settings", action: "write" },
  iris_get_reply_persona: { domain: "settings", action: "read" },
  iris_update_reply_persona: { domain: "settings", action: "write" },
  iris_get_agent_content: { domain: "settings", action: "read" },
  iris_update_agent_content: { domain: "settings", action: "write" },
  iris_get_message_agent_content: { domain: "settings", action: "read" },
  iris_update_message_agent_content: { domain: "settings", action: "write" },

  iris_list_simulator_scenarios: { domain: "simulator", action: "read" },
  iris_create_simulator_scenario: { domain: "simulator", action: "write" },
  iris_simulate_reply: { domain: "simulator", action: "write" },
};

export function getMcpToolPermissionMeta(
  toolName: string,
): McpToolPermissionMeta | null {
  return MCP_TOOL_CATALOG[toolName] ?? null;
}
