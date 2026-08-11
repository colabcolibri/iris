import type { PostStatus } from "./post.ts";
import { ValidationError } from "../api/json.ts";

export type ScheduleInput = {
  currentStatus: PostStatus;
  nextStatus?: PostStatus;
  scheduledAt?: string | null;
  assetsCount: number;
};

export type ScheduleResult = {
  status: PostStatus;
  scheduledAt: string | null;
};

function parseFutureIsoDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError("scheduled_at must be a valid ISO date");
  }

  if (date.getTime() <= Date.now()) {
    throw new ValidationError("scheduled_at must be in the future");
  }

  return date;
}

export function applyScheduleRules(input: ScheduleInput): ScheduleResult {
  const wantsSchedule =
    input.nextStatus === "scheduled" ||
    (input.scheduledAt !== undefined && input.scheduledAt !== null);

  if (!wantsSchedule) {
    return {
      status: input.nextStatus ?? input.currentStatus,
      scheduledAt: input.scheduledAt ?? null,
    };
  }

  if (input.assetsCount < 1) {
    throw new ValidationError("post must have at least one asset before scheduling");
  }

  const scheduledAt = input.scheduledAt;
  if (!scheduledAt) {
    throw new ValidationError("scheduled_at is required to schedule a post");
  }

  parseFutureIsoDate(scheduledAt);

  return {
    status: "scheduled",
    scheduledAt,
  };
}

export function isDueForPublish(
  post: { status: PostStatus; scheduledAt: string | null },
  nowMs = Date.now(),
): boolean {
  if (post.status !== "scheduled" || !post.scheduledAt) {
    return false;
  }

  const scheduledMs = new Date(post.scheduledAt).getTime();
  return !Number.isNaN(scheduledMs) && scheduledMs <= nowMs;
}
