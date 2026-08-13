import type { SettingsMessages } from "./types";

export const settingsEn = {
  page: {
    eyebrow: "Preferences",
    title: "Settings",
    description:
      "Timezone, monitoring, insights, agents, MCP, and AI provider.",
    loading: "Loading…",
  },
  sections: {
    timezone: {
      id: "timezone",
      title: "Editorial timezone",
      description: "Dates and times in the calendar and schedules.",
      label: "Timezone",
      preview: "Now in selected timezone:",
      save: "Save",
      cancel: "Cancel",
    },
    autoMonitor: {
      id: "auto-monitor",
      title: "Auto-monitoring",
      description: "Poll for new media on Instagram.",
    },
    insights: {
      id: "insights",
      title: "Batch insights",
      description: "Refresh metrics for published posts.",
    },
    commentAgent: {
      id: "comment-agent",
      title: "Comment agent",
      description: "Global mode and public reply queue.",
    },
    messageAgent: {
      id: "message-agent",
      title: "DM agent",
      description: "Global mode and private inbox queue.",
    },
    mcpConnection: {
      id: "mcp",
      title: "MCP connection",
      description: "Cursor, ChatGPT, or Claude.",
    },
    mcpPermissions: {
      id: "mcp-permissions",
      title: "MCP permissions",
      description: "Read, edit, and delete per domain.",
    },
    llm: {
      id: "llm",
      title: "AI provider",
      description: "API key, URL, and model for agents.",
    },
  },
  timezone: {
    toasts: {
      saved: "Timezone saved.",
      failed: "Failed to save.",
    },
  },
  commentAgent: {
    title: "Comment agent",
    description:
      "Default mode for posts following global settings. Posts with their own mode take precedence.",
    globalModeLabel: "Global mode",
    workerIntervalLabel: "Worker interval",
    workerIntervalHint: "How often the comment queue processing cycle runs.",
    replyDelayLabel: "Time before replying",
    replyDelayHint:
      "Waits before enqueueing the automatic reply (simulates human timing).",
    delayImmediate: "Immediate",
    delayQueued: "Delayed queue",
    delayMinutesLabel: "Delay minutes",
    loading: "Loading…",
    toasts: {
      modeUpdated: "Global agent mode: {mode}.",
      delayQueued: "Queue active: reply after {minutes} min.",
      delayImmediate: "Immediate reply on the next agent cycle.",
      workerInterval: "Worker interval: {minutes} min.",
      saveFailed: "Failed to save.",
      delayFailed: "Failed to save delay.",
      intervalFailed: "Failed to save interval.",
    },
  },
  messageAgent: {
    title: "Message agent (DM)",
    description:
      "Default mode for conversations following global settings. Conversations with their own mode take precedence.",
    globalModeLabel: "Global DM mode",
    workerIntervalLabel: "Worker interval",
    workerIntervalHint: "How often the DM queue processing cycle runs.",
    replyDelayLabel: "Time before replying",
    replyDelayHint: "Waits before enqueueing the automatic reply in the conversation.",
    delayImmediate: "Immediate",
    delayQueued: "Delayed queue",
    delayMinutesLabel: "Delay minutes",
    loading: "Loading…",
    toasts: {
      modeUpdated: "Global DM mode: {mode}.",
      delayQueued: "DM queue active: reply after {minutes} min.",
      delayImmediate: "Immediate reply on the next DM agent cycle.",
      saveFailed: "Failed to save.",
      delayFailed: "Failed to save delay.",
    },
  },
  mcp: {
    title: "MCP connection",
    description: "Connect Iris to Cursor, ChatGPT, or Claude via Model Context Protocol.",
    loading: "Loading…",
    generate: "Generate code",
    rotate: "Rotate code",
    copyHint: "Copy the fields below now — the code will not be shown again.",
    confirmRotate: {
      title: "Rotate MCP code?",
      description:
        "The current code will stop working. Update Cursor, ChatGPT, or Claude with the new value.",
      confirmLabel: "Rotate",
    },
    toasts: {
      loadFailed: "Failed to load MCP.",
      generated: "MCP code generated. Copy the fields below now — the code will not be shown again.",
      rotated:
        "Code rotated. Copy the fields below now — the code will not be shown again.",
      generateFailed: "Failed to generate code.",
    },
  },
  mcpPermissions: {
    title: "MCP permissions",
    description:
      "Control what connected clients (Cursor, ChatGPT, Claude) can read, edit, and delete.",
    loading: "Loading…",
    save: "Save permissions",
    presets: {
      readOnly: {
        label: "Read only",
        description: "List and query — no create, edit, or delete.",
      },
      editor: {
        label: "Editor",
        description: "Read and edit — no destructive operations.",
      },
      full: {
        label: "Full",
        description: "Same scope as today — all tools allowed.",
      },
      custom: {
        label: "Custom",
        description: "Fine-tune per domain in the matrix below.",
      },
    },
    matrix: {
      domain: "Domain",
      read: "Read",
      write: "Edit",
      delete: "Delete",
      notApplicable: "—",
    },
    customHint: "Select the {custom} preset to enable the per-domain matrix.",
    customLabel: "Custom",
    toasts: {
      loadFailed: "Failed to load MCP permissions.",
      presetApplied: "MCP preset applied.",
      saved: "MCP permissions saved.",
      saveFailed: "Failed to save.",
    },
  },
  llm: {
    title: "AI provider",
    description: "Configure API key, base URL, and model used by agents.",
    apiKeyLabel: "API key",
    baseUrlLabel: "Base URL",
    modelLabel: "Model",
    save: "Save",
    loading: "Loading…",
    toasts: {
      saved: "AI settings saved.",
      failed: "Failed to save.",
      loadFailed: "Failed to load settings.",
    },
  },
  autoMonitor: {
    title: "Auto-monitoring",
    description: "Detects new media published directly on Instagram.",
    enabledLabel: "Enable automatic monitoring",
    save: "Save",
    toasts: {
      saved: "Auto-monitoring updated.",
      failed: "Failed to save.",
    },
  },
  insights: {
    title: "Batch insights",
    description: "Refresh engagement metrics for published posts.",
    refresh: "Refresh insights",
    refreshing: "Refreshing…",
    lastRun: "Last run:",
    toasts: {
      started: "Insights refresh started.",
      completed: "Insights updated.",
      failed: "Failed to refresh insights.",
    },
  },
} satisfies SettingsMessages;
