import type { AgentRun } from "../../ports/agent-run-repository.ts";
import type { AgentRunStep } from "../../ports/agent-run-step-repository.ts";
import type { AgentRunStepRepository } from "../../ports/agent-run-step-repository.ts";
import type { AgentRunRepository } from "../../ports/agent-run-repository.ts";
import type { CommentRepository } from "../../ports/comment-repository.ts";
import type { MessageReplyRepository } from "../../ports/message-repository.ts";

export type ResolvedReplyAudit = {
  run: AgentRun;
  steps: AgentRunStep[];
};

type ResolveReplyAuditDeps = {
  agentRuns: AgentRunRepository;
  agentRunSteps: AgentRunStepRepository;
};

export type ResolveMessageReplyAuditDeps = ResolveReplyAuditDeps & {
  messageReplies: MessageReplyRepository;
};

export type ResolveCommentReplyAuditDeps = ResolveReplyAuditDeps & {
  comments: CommentRepository;
};

function stepsForRun(
  agentRunSteps: AgentRunStepRepository,
  agentRunId: string,
  legacyEntitySteps: AgentRunStep[],
): AgentRunStep[] {
  const byRun = agentRunSteps.listByAgentRunId(agentRunId);
  if (byRun.length > 0) {
    return byRun;
  }
  return legacyEntitySteps;
}

function resolveByAgentRunId(
  agentRunId: string | null | undefined,
  deps: ResolveReplyAuditDeps,
  legacyEntitySteps: AgentRunStep[],
): ResolvedReplyAudit | null {
  if (!agentRunId) {
    return null;
  }

  const run = deps.agentRuns.findById(agentRunId);
  if (!run) {
    return null;
  }

  const steps = stepsForRun(deps.agentRunSteps, agentRunId, legacyEntitySteps);
  if (steps.length === 0) {
    return null;
  }

  return { run, steps };
}

/**
 * Resolve audit for a DM: prefer agent_run_id from message_replies, then latest run on message.
 * Steps are scoped to that run (full harness flow including tool calls).
 */
export function resolveMessageReplyAudit(
  messageId: string,
  deps: ResolveMessageReplyAuditDeps,
): ResolvedReplyAudit | null {
  const legacySteps = deps.agentRunSteps.listByMessageId(messageId);
  const sent = deps.messageReplies.findLatestSentReply(messageId);
  const draft = deps.messageReplies.findLatestDraft(messageId);

  const fromReply =
    resolveByAgentRunId(sent?.agentRunId ?? draft?.agentRunId, deps, legacySteps) ??
    resolveByAgentRunId(
      deps.agentRunSteps.findLatestRunIdByMessageId(messageId),
      deps,
      legacySteps,
    );

  return fromReply;
}

/**
 * Resolve audit for a comment: prefer agent_run_id from comment_replies, then latest run on comment.
 */
export function resolveCommentReplyAudit(
  commentId: string,
  deps: ResolveCommentReplyAuditDeps,
): ResolvedReplyAudit | null {
  const legacySteps = deps.agentRunSteps.listByCommentId(commentId);
  const sent = deps.comments.findLatestSentReply(commentId);
  const draft = deps.comments.findLatestDraft(commentId);

  return (
    resolveByAgentRunId(sent?.agentRunId ?? draft?.agentRunId, deps, legacySteps) ??
    resolveByAgentRunId(
      deps.agentRunSteps.findLatestRunIdByCommentId(commentId),
      deps,
      legacySteps,
    )
  );
}
