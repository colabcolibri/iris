import type { AgentMessages } from "./types";

export const agentEn = {
  persona: {
    page: {
      eyebrow: "Auto-replies",
      title: "Brand persona",
      description:
        "Identity, limits, and editorial content for comment and DM agents.",
      loading: "Loading persona…",
      updatedAt: "Updated: {date}",
    },
    sections: {
      identity: {
        title: "Brand identity",
        description: "Language, name, signature, and character limit.",
      },
      commentContent: {
        title: "Content (comments)",
        description: "SOUL, page, knowledge, and public restrictions.",
      },
      dmContent: {
        title: "Content (DM)",
        description: "Editorial blocks for the message harness in the inbox.",
      },
    },
    fields: {
      responseLanguage: "Reply language",
      responseLanguageHint:
        "Required language for all public Instagram replies. Internal harness prompts stay in English; this language is reinforced in triage, draft, and verification.",
      selectLanguage: "Select language",
      brandName: "Brand name",
      brandNameHint:
        "Name shown at the top of draft prompts. Helps the AI refer to the brand correctly.",
      brandPlaceholder: "E.g. Your brand name",
      signatureInstruction: "Signature instruction",
      signatureHint:
        "How the AI should end the reply. On publish, body and signature are separated by a period on its own line.",
      signaturePlaceholder: "E.g. Always sign with the team or agent name.",
      maxChars: "Character limit",
      maxCharsHint:
        "Maximum characters for the final Instagram reply. The verifier rejects drafts that exceed this limit.",
      soul: "SOUL",
      soulHint:
        "Brand voice, personality, and tone. Used in full-tier replies.",
      page: "About the page",
      pageHint:
        "Profile or campaign context: what the account is, audience, and editorial goal.",
      knowledge: "Knowledge base",
      knowledgeHint: "Facts, official links, prices, policies, and sample replies.",
      restrictions: "Restrictions",
      restrictionsHint:
        "What the AI must never do or promise — main brand policy filter.",
      dmSoul: "SOUL (DM)",
      dmSoulHint:
        "Tone and personality in the private inbox — more direct than public comments.",
      dmPage: "About the page (DM)",
      dmKnowledge: "Knowledge base (DM)",
      dmKnowledgeHint:
        "Facts, links, and policies in private replies — includes active products when triage detects purchase intent.",
      dmRestrictions: "Restrictions (DM)",
    },
    actions: {
      savePersona: "Save persona",
      saveCommentContent: "Save agent content",
      saveDmContent: "Save DM content",
    },
    toasts: {
      loadFailed: "Failed to load persona.",
      personaSaved: "Persona saved.",
      saveFailed: "Failed to save.",
      commentContentSaved: "Agent content saved.",
      commentContentFailed: "Failed to save content.",
      dmContentSaved: "DM agent content saved.",
      dmContentFailed: "Failed to save DM content.",
    },
  },
  runs: {
    page: {
      eyebrow: "Operations",
      title: "Agent runs",
      description:
        "Global monitoring of auto-reply runs — each execution and its calls.",
      languageNote: "Persona language:",
      backToAll: "All runs",
      list: "List",
      sheetTitle: "Runs",
      refresh: "Refresh",
      loading: "Loading runs…",
      loadingDetail: "Loading detail…",
      openThread: "open comment thread",
    },
    filters: {
      allStatuses: "all statuses",
      allTiers: "all tiers",
    },
    table: {
      when: "When",
      status: "Status",
      trigger: "Trigger",
      tier: "Tier",
      model: "Model",
      duration: "Duration",
      tokens: "Tokens",
      tools: "Tools",
      callsOne: "1 call",
      callsMany: "{count} calls",
    },
    empty: {
      title: "No runs",
      body: "No runs found with current filters.",
    },
    detail: {
      noAuditTitle: "No audit",
      noAuditBody: "No audit data for this run.",
    },
    terminal: {
      approved: "approved",
      approvedSimple: "approved (simple)",
      skippedTriage: "skipped at triage",
      blockedHarmful: "blocked (harmful)",
      rejectedVerify: "rejected at verification",
      draftFailed: "draft failed",
      budgetExceeded: "budget exceeded",
    },
    toasts: {
      loadFailed: "Failed to load runs.",
      detailFailed: "Failed to load detail.",
    },
  },
  simulator: {
    page: {
      eyebrow: "Lab",
      title: "Comment simulator",
      description:
        "Build the post and comment thread and run the comment harness — without publishing.",
      resultEyebrow: "Lab",
      resultTitle: "Result",
      resultDescription: "Proposed reply and harness stages on stage.",
      personaLink: "Persona",
      tokenEstimateTitle: "Heuristic token estimate",
    },
    fields: {
      channel: "Channel",
      channelComment: "Comment",
      channelDm: "DM (messages)",
      scenario: "Scenario",
      scenarioDefault: "Scenario",
      language: "Language",
      brand: "Brand",
      caption: "Post caption",
      carouselSummary: "Carousel summary",
      carouselPlaceholder: "Text used by the harness instead of images.",
      thread: "Thread",
      addMessage: "Message",
      authorPlaceholder: "author",
      brandCheckbox: "brand",
      targetComment: "Target comment",
      targetAuthorPlaceholder: "@author",
      run: "Simulate reply",
      running: "Simulating…",
    },
    contentStats: {
      soul: "SOUL",
      page: "Page",
      knowledge: "Knowledge",
      restrictions: "Restrictions",
    },
    tokenEstimate: {
      empty: "empty",
      tokensK: "≈ {value}k tokens",
      tokens: "≈ {value} tokens",
    },
    empty: {
      title: "Build the thread and run the harness",
      body: "The stage shows the proposed reply and each call (model, tokens, verdict) after simulation.",
      noApproved: "No approved reply in this simulation.",
    },
    toasts: {
      targetCommentRequired: "Enter the target comment.",
      simulateFailed: "Simulation failed.",
    },
  },
  messageSimulator: {
    page: {
      eyebrow: "Lab",
      title: "Message simulator",
      description:
        "Build the DM thread and run the production agentic harness — with catalog tools and full audit.",
      resultEyebrow: "Lab",
      resultTitle: "Result",
      resultDescription: "Proposed reply, tool calls, and harness stages on stage.",
      personaLink: "DM content",
      tokenEstimateTitle: "Heuristic token estimate (dm_*)",
    },
    fields: {
      scenario: "Scenario",
      scenarioDefault: "Scenario",
      language: "Language",
      brand: "Brand",
      participant: "Participant",
      participantPlaceholder: "@user",
      replyPrompt: "Conversation briefing",
      replyPromptPlaceholder: "Optional — context for the agent in this thread.",
      thread: "Thread",
      addMessage: "Message",
      authorPlaceholder: "author",
      brandCheckbox: "brand",
      targetMessage: "Target message",
      targetAuthorPlaceholder: "@author",
      run: "Simulate reply",
      running: "Simulating…",
    },
    contentStats: {
      dmSoul: "DM soul",
      dmPage: "DM page",
      dmKnowledge: "DM knowledge",
      dmRestrictions: "DM restrictions",
    },
    tokenEstimate: {
      empty: "empty",
      tokensK: "≈ {value}k tokens",
      tokens: "≈ {value} tokens",
    },
    empty: {
      title: "Build the thread and run the harness",
      body: "The stage shows the reply, tool calls, and each step (model, tokens, verdict) after simulation.",
      noApproved: "No approved reply in this simulation.",
    },
    toasts: {
      targetMessageRequired: "Enter the target message.",
      simulateFailed: "Simulation failed.",
    },
  },
} satisfies AgentMessages;
