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
    instagramSetup: {
      id: "instagram-setup",
      title: "Instagram",
      description:
        "Connect account, webhook, and Page for posts, comments, and DMs.",
    },
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
    operatorNotifications: {
      id: "operator-notifications",
      title: "Operator alerts",
      description: "Email when the DM agent escalates a case for human review.",
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
  instagramSetup: {
    title: "Instagram connection",
    description:
      "Set up Meta in one place: OAuth, webhook, and Page for messages.",
    loading: "Loading status…",
    progress: "{ok} of {total} steps ready",
    progressReady: "Instagram setup is complete",
    phases: {
      server: "Server",
      serverHint: "Iris `.env` on whoever hosts the instance",
      account: "Account",
      accountHint: "Instagram login",
      realtime: "Live events",
      realtimeHint: "Webhook and DMs",
    },
    primaryConnectTitle: "Connect your account",
    primaryConnectDescription:
      "One Instagram login — posts, comments, insights, and messaging permission.",
    connectedTitle: "Account connected",
    connectedDescription:
      "Posts, comments, and messages use this account. Reconnect only to switch accounts or refresh permissions.",
    connectPrimary: "Connect Instagram",
    reconnect: "Reconnect or switch account",
    connectPage: "Connect Facebook Page (DMs)",
    connectPageHint:
      "Only if DMs fail after login — links the Page access token.",
    pageConnected: "Page connected: {name}",
    connectEssential: "Posts and comments only (no insights/DMs)",
    developerPanelTitle: "Paste into Meta Dashboard",
    developerPanelDescription:
      "Copy each value below and paste it at developers.facebook.com (once, before the first login).",
    webhookUrlLabel: "Webhook URL",
    webhookUrlHint: "Webhooks → Instagram → Callback URL",
    redirectUriLabel: "Instagram OAuth redirect",
    redirectUriHint: "Business login settings → OAuth redirect URIs",
    pageRedirectUriLabel: "Page OAuth redirect (DMs)",
    pageRedirectUriHint:
      "Facebook Login for Business → redirect URIs (same host)",
    copy: "Copy",
    copySuccess: "Copied.",
    copyFailed: "Could not copy.",
    refresh: "Refresh status",
    handoverHint:
      "For production DMs, set your app as primary receiver on the Page:",
    handoverLink: "Open Page Advanced Messaging settings",
    connectedAs: "Connected as {username}",
    steps: {
      metaApp: "Meta app on server",
      publicUrl: "Public HTTPS URL",
      webhook: "Webhook",
      instagram: "Instagram account",
      comments: "Comments",
      messaging: "Messages (DMs)",
    },
    toasts: {
      loadFailed: "Failed to load Instagram setup.",
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
    workerIntervalHint:
      "How often the agent checks the queue in the database (comments and DMs share the same cycle). Default: 5 minutes.",
    workerIntervalHintShort:
      "How often the comment queue processing cycle runs.",
    replyDebounceLabel: "Debounce window",
    replyDebounceHint:
      "Waits {debounce} after the same author's latest comment on the post before generating a reply. If they comment again within that window, the timer resets and only their newest comment is answered. Actual cadence: debounce + up to {tick} min until the next worker cycle.",
    debounceMinutesLabel: "Debounce minutes ({min}–{max})",
    replyDelayLabel: "Time before replying",
    replyDelayHint:
      "Default: immediate on the next cycle. With a queue, the agent waits before the harness — the queue persists in the database across restarts.",
    replyDelayCadenceDelayed:
      " Actual cadence: reply after {delay} min + up to {tick} min until the next cycle.",
    replyDelayCadenceImmediate:
      " Actual cadence: up to {tick} min until the next cycle.",
    delayImmediate: "Immediate reply",
    delayQueued: "Delayed queue",
    delayMinutesLabel: "Wait minutes ({min}–{max})",
    maxAgeLabel: "Reply window",
    maxAgeHint:
      "Iris only replies to comments from the last X days — on import, webhook, and the automatic queue. Older comments are ignored.",
    maxAgeDaysLabel: "History days ({min}–{max})",
    loading: "Loading…",
    toasts: {
      modeUpdated: "Global agent mode: {mode}.",
      debounceUpdated: "Comment debounce: {debounce}.",
      debounceFailed: "Failed to save debounce.",
      delayQueued: "Queue active: reply after {minutes} min.",
      delayImmediate: "Immediate reply on the next agent cycle.",
      workerInterval: "Worker interval: {minutes} min.",
      saveFailed: "Failed to save.",
      delayFailed: "Failed to save delay.",
      intervalFailed: "Failed to save interval.",
      maxAgeUpdated: "Reply window: {days} days.",
      maxAgeFailed: "Failed to save reply window.",
    },
  },
  messageAgent: {
    title: "Message agent (DM)",
    description:
      "Default mode for conversations following global settings. Conversations with their own mode take precedence.",
    globalModeLabel: "Global mode",
    workerIntervalLabel: "Worker interval",
    workerIntervalHint:
      "Shared with comments — configured on the comment agent card. Current cycle: {minutes} min.",
    replyDebounceLabel: "Debounce window",
    replyDebounceHint:
      "Waits {debounce} after the customer's latest message in the same conversation before generating a reply. If another message arrives within that window, the timer resets and only the newest one is answered. Actual cadence: debounce + up to {tick} min until the next worker cycle.",
    debounceMinutesLabel: "Debounce minutes ({min}–{max})",
    replyDelayLabel: "Time before replying",
    replyDelayHint:
      "Same persistent queue used for comments, with DM-specific settings.",
    replyDelayCadenceDelayed:
      " Actual cadence: reply after {delay} min + up to {tick} min until the next cycle.",
    replyDelayCadenceImmediate:
      " Actual cadence: up to {tick} min until the next cycle.",
    delayImmediate: "Immediate reply",
    delayQueued: "Delayed queue",
    delayMinutesLabel: "Wait minutes ({min}–{max})",
    loading: "Loading…",
    toasts: {
      modeUpdated: "Global DM mode: {mode}.",
      debounceUpdated: "DM debounce: {debounce}.",
      debounceFailed: "Failed to save debounce.",
      delayQueued: "DM queue active: reply after {minutes} min.",
      delayImmediate: "Immediate reply on the next DM agent cycle.",
      saveFailed: "Failed to save.",
      delayFailed: "Failed to save delay.",
    },
  },
  mcp: {
    title: "MCP connection",
    description:
      "Generate a code and copy the fields for Cursor, ChatGPT, or Claude — each client in the format it accepts.",
    loading: "Loading…",
    generate: "Generate code",
    rotate: "Rotate code",
    revoke: "Revoke",
    copyUrl: "Copy URL",
    copyCode: "Copy code",
    codeOneTimeTitle: "Connection code — copy now (shown once)",
    statusLabel: "Status:",
    statusDatabase: "active (generated in UI)",
    statusEnvironment: "active (environment variable)",
    statusDevelopment: "active (development)",
    codeHintPrefix: "Ends with",
    notConfigured: "No code configured. Generate one to enable MCP clients.",
    envOverride:
      "A code is set in {envVar} on the server. It remains valid alongside codes generated here.",
    copyHint: "Copy the fields below now — the code will not be shown again.",
    confirmRotate: {
      title: "Rotate MCP code?",
      description:
        "The current code will stop working. Update Cursor, ChatGPT, or Claude with the new value.",
      confirmLabel: "Rotate",
    },
    confirmRevoke: {
      title: "Revoke MCP code?",
      description:
        "Connected clients will fail to authenticate until you generate a new code in the UI.",
      confirmLabel: "Revoke",
    },
    toasts: {
      loadFailed: "Failed to load MCP.",
      generated:
        "MCP code generated. Copy the fields below now — the code will not be shown again.",
      rotated:
        "Code rotated. Copy the fields below now — the code will not be shown again.",
      generateFailed: "Failed to generate code.",
      revoked: "MCP code revoked.",
      revokeFailed: "Failed to revoke.",
      copied: "{label} copied.",
      copyFailed: "Could not copy.",
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
    title: "AI provider (automatic replies)",
    description:
      "API key, URL, and model used by the comment agent. Server .env values serve as fallback.",
    apiUrlLabel: "API URL",
    apiUrlPlaceholder: "https://api.openai.com/v1/chat/completions",
    apiKeyLabel: "API key",
    keyPlaceholderBlank: "••••{hint} — leave blank to keep",
    keyPlaceholderNew: "sk-…",
    configuredHint: "Configured — ends with {hint}{source}",
    baseUrlLabel: "Base URL",
    modelLabel: "Model",
    modelPlaceholder: "gpt-4o-mini",
    visionLabel: "Model supports vision (analyzes post images)",
    save: "Save AI provider",
    saving: "Saving…",
    loading: "Loading…",
    envOverride:
      "Environment variables {envVars} are set. Database settings take precedence when configured here.",
    toasts: {
      saved: "AI configuration saved.",
      failed: "Failed to save.",
      loadFailed: "Failed to load LLM.",
    },
  },
  autoMonitor: {
    title: "Publication auto-monitoring",
    description:
      "Discovers new media on Instagram (poll) and registers monitored posts. Also registers on the first webhook comment if the media does not exist yet.",
    onLabel: "On",
    offLabel: "Off",
    pollIntervalLabel: "Poll interval",
    pollIntervalHint:
      "Default: 5 minutes. Meta does not notify new posts via webhook — Iris checks the recent list on this interval.",
    secondsLabel: "Seconds ({min}–{max})",
    loading: "Loading…",
    toasts: {
      enabled: "Auto-monitoring enabled — new publications are added automatically.",
      disabled: "Auto-monitoring disabled — manual registration or Iris publish only.",
      intervalSaved: "Poll interval: {minutes} min.",
      intervalFailed: "Failed to save interval.",
      failed: "Failed to save.",
    },
  },
  insights: {
    title: "Batch Instagram insights",
    description:
      "Refresh metrics for published or monitored posts. Optionally filter by publication date (published_at).",
    publishedSince: "Published since",
    publishedUntil: "Published until",
    rangeHintAll:
      "No dates: refreshes all published/monitored posts with IG media.",
    rangeHintWindow: "Publication date window (UTC): {parts}.",
    rangeFrom: "from {date}",
    rangeUntil: "until {date}",
    clearDates: "Clear dates",
    connectInstagram: "Connect Instagram to refresh insights.",
    refresh: "Refresh insights",
    refreshing: "Refreshing…",
    toasts: {
      dateRangeInvalid: "Start date cannot be after end date.",
      completed:
        "Insights: {refreshed}/{requested} updated{failPart}{skipPart}.",
      failPart: " · {count} failed",
      skipPart: " · {count} over limit",
      failed: "Failed to refresh insights.",
    },
  },
  meta: {
    toasts: {
      connectionFailed: "Connection failed.",
      messagingPermission:
        "No permission to send messages. Reconnect Instagram.",
      healthOk: "Meta connection OK (including messaging).",
      testFailed: "Failed to test connection.",
      disconnected: "Instagram disconnected.",
      disconnectFailed: "Could not disconnect Instagram.",
    },
  },
  operatorNotifications: {
    title: "Operator alerts",
    description:
      "When the DM agent calls notify_operator, you receive an email with case context.",
    help:
      "The agent tells the customer the case will be reviewed internally. Enable email to get automatic alerts.",
    emailEnabled: "Send email alerts",
    emailDestination: "Operator email",
    emailPlaceholder: "you@company.com",
    aiLockDays: "Resume AI automatically after (days)",
    aiLockDaysHelp:
      "After escalation, AI stays silent in that thread until you unlock or this period passes (checked on the next inbound message).",
    save: "Save",
    sendTest: "Send test",
    toasts: {
      loadFailed: "Failed to load alerts.",
      saved: "Alerts saved.",
      saveFailed: "Failed to save alerts.",
      testSent: "Test email sent.",
      testFailed: "Failed to send test — check SMTP and destination.",
    },
  },
} satisfies SettingsMessages;
