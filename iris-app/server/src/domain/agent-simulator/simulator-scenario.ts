import {
  normalizeScenarioId,
  normalizeSimulateTargetComment,
  normalizeSimulateThread,
  normalizeSimulatorTextField,
  SIMULATOR_SCENARIO_DESCRIPTION_MAX,
  SIMULATOR_SCENARIO_LABEL_MAX,
  type SimulateTargetComment,
  type SimulateThreadMessage,
} from "./simulator-payload.ts";

export type SimulatorScenario = {
  id: string;
  label: string;
  description: string;
  caption: string;
  carouselSummary: string;
  thread: SimulateThreadMessage[];
  targetAuthor: string;
  targetText: string;
  createdAt: string;
  updatedAt: string;
};

export type SimulatorScenarioInput = {
  id: string;
  label: string;
  description: string;
  caption: string;
  carouselSummary: string;
  thread: SimulateThreadMessage[];
  targetAuthor: string;
  targetText: string;
};

export type SimulatorScenarioUpdateInput = Partial<
  Omit<SimulatorScenarioInput, "id">
> & {
  id?: never;
};

export function normalizeSimulatorScenarioInput(
  body: Record<string, unknown>,
  options?: { requireId?: boolean },
): SimulatorScenarioInput {
  const id = options?.requireId
    ? normalizeScenarioId(body.id)
    : typeof body.id === "string"
      ? normalizeScenarioId(body.id)
      : "";

  const label = normalizeSimulatorTextField(body.label, "label", {
    required: true,
    max: SIMULATOR_SCENARIO_LABEL_MAX,
  });
  const description = normalizeSimulatorTextField(body.description, "description", {
    required: true,
    max: SIMULATOR_SCENARIO_DESCRIPTION_MAX,
  });
  const caption = normalizeSimulatorTextField(body.caption, "caption", { required: true });
  const carouselSummary = normalizeSimulatorTextField(
    body.carousel_summary ?? body.carouselSummary,
    "carousel_summary",
    { required: true },
  );
  const thread = normalizeSimulateThread(body.thread, { required: true });
  const targetAuthor = normalizeSimulatorTextField(
    body.target_author ?? body.targetAuthor,
    "target_author",
    { required: true, max: SIMULATOR_SCENARIO_LABEL_MAX },
  );
  const targetText = normalizeSimulatorTextField(
    body.target_text ?? body.targetText,
    "target_text",
    { required: true },
  );

  const targetComment = normalizeSimulateTargetComment(
    {
      author: targetAuthor,
      text: targetText,
    },
    { requiredText: true },
  );

  return {
    id,
    label,
    description,
    caption,
    carouselSummary,
    thread,
    targetAuthor: targetComment.author,
    targetText: targetComment.text,
  };
}

export function mergeScenarioUpdate(
  current: SimulatorScenario,
  body: Record<string, unknown>,
): SimulatorScenarioInput {
  return normalizeSimulatorScenarioInput({
    label: "label" in body ? body.label : current.label,
    description: "description" in body ? body.description : current.description,
    caption: "caption" in body ? body.caption : current.caption,
    carousel_summary:
      "carousel_summary" in body || "carouselSummary" in body
        ? (body.carousel_summary ?? body.carouselSummary)
        : current.carouselSummary,
    thread: "thread" in body ? body.thread : current.thread,
    target_author:
      "target_author" in body || "targetAuthor" in body
        ? (body.target_author ?? body.targetAuthor)
        : current.targetAuthor,
    target_text:
      "target_text" in body || "targetText" in body
        ? (body.target_text ?? body.targetText)
        : current.targetText,
  });
}

const SIMULATOR_LIST_PREVIEW_MAX = 120;

function truncateSimulatorPreview(value: string, max = SIMULATOR_LIST_PREVIEW_MAX): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

export function serializeSimulatorScenarioListItem(scenario: SimulatorScenario) {
  return {
    id: scenario.id,
    label: scenario.label,
    description: scenario.description,
    caption_preview: truncateSimulatorPreview(scenario.caption),
    carousel_summary_preview: truncateSimulatorPreview(scenario.carouselSummary),
    thread_message_count: scenario.thread.length,
    target_author: scenario.targetAuthor,
  };
}

export function serializeSimulatorScenario(scenario: SimulatorScenario) {
  return {
    id: scenario.id,
    label: scenario.label,
    description: scenario.description,
    caption: scenario.caption,
    carousel_summary: scenario.carouselSummary,
    thread: scenario.thread,
    target_author: scenario.targetAuthor,
    target_text: scenario.targetText,
    created_at: scenario.createdAt,
    updated_at: scenario.updatedAt,
  };
}

export type { SimulateTargetComment, SimulateThreadMessage };
