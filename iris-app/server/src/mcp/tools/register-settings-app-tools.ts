import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import { defaultAppSettings } from "../../domain/settings/app-settings-defaults.ts";
import {
  normalizeAppSettingsBody,
  serializeAppSettingsMcp,
} from "../../domain/settings/app-settings-mutations.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

export function registerSettingsAppTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_get_app_settings",
    "Read operational app settings (timezone, reply mode, auto-monitor)",
    {},
    async () => {
      const settings = ctx.appSettingsStore.get() ?? defaultAppSettings();
      return jsonToolContent(serializeAppSettingsMcp(settings));
    },
  );

  server.tool(
    "iris_update_app_settings",
    "Update operational app settings (partial updates, same validation as PUT /api/settings/app)",
    {
      timezone: z.string().optional(),
      reply_mode: z.enum(["off", "auto", "draft"]).optional(),
      reply_delay_seconds: z.number().optional(),
      agent_reply_tick_interval_seconds: z.number().optional(),
      auto_reply_enabled: z.boolean().optional(),
      auto_monitor_enabled: z.boolean().optional(),
      auto_monitor_interval_seconds: z.number().optional(),
      message_reply_mode: z.enum(["off", "auto", "draft"]).optional(),
      message_reply_delay_seconds: z.number().optional(),
      message_auto_reply_enabled: z.boolean().optional(),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {};
        if (args.timezone !== undefined) body.timezone = args.timezone;
        if (args.reply_mode !== undefined) body.reply_mode = args.reply_mode;
        if (args.reply_delay_seconds !== undefined) {
          body.reply_delay_seconds = args.reply_delay_seconds;
        }
        if (args.agent_reply_tick_interval_seconds !== undefined) {
          body.agent_reply_tick_interval_seconds = args.agent_reply_tick_interval_seconds;
        }
        if (args.auto_reply_enabled !== undefined) {
          body.auto_reply_enabled = args.auto_reply_enabled;
        }
        if (args.auto_monitor_enabled !== undefined) {
          body.auto_monitor_enabled = args.auto_monitor_enabled;
        }
        if (args.auto_monitor_interval_seconds !== undefined) {
          body.auto_monitor_interval_seconds = args.auto_monitor_interval_seconds;
        }
        if (args.message_reply_mode !== undefined) {
          body.message_reply_mode = args.message_reply_mode;
        }
        if (args.message_reply_delay_seconds !== undefined) {
          body.message_reply_delay_seconds = args.message_reply_delay_seconds;
        }
        if (args.message_auto_reply_enabled !== undefined) {
          body.message_auto_reply_enabled = args.message_auto_reply_enabled;
        }

        const current = ctx.appSettingsStore.get() ?? defaultAppSettings();
        const input = normalizeAppSettingsBody(body, current);
        const saved = ctx.appSettingsStore.upsert(input);
        return jsonToolContent(serializeAppSettingsMcp(saved));
      } catch (error) {
        if (error instanceof ValidationError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "update failed");
      }
    },
  );
}
