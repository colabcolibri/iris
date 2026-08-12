import type { DatabaseSync } from "node:sqlite";
import type { SimulatorScenarioStore } from "../../ports/simulator-scenario-store.ts";
import type {
  SimulatorScenario,
  SimulatorScenarioInput,
} from "../../domain/agent-simulator/simulator-scenario.ts";
import {
  normalizeSimulateThread,
  normalizeScenarioId,
} from "../../domain/agent-simulator/simulator-payload.ts";
import { ValidationError } from "../../api/json.ts";

type SimulatorScenarioRow = {
  id: string;
  label: string;
  description: string;
  caption: string;
  carousel_summary: string;
  thread_json: string;
  target_author: string;
  target_text: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: SimulatorScenarioRow): SimulatorScenario {
  let thread;
  try {
    thread = normalizeSimulateThread(JSON.parse(row.thread_json));
  } catch {
    throw new ValidationError(`stored thread for scenario ${row.id} is invalid`);
  }

  return {
    id: row.id,
    label: row.label,
    description: row.description,
    caption: row.caption,
    carouselSummary: row.carousel_summary,
    thread,
    targetAuthor: row.target_author,
    targetText: row.target_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSqliteSimulatorScenarioStore(
  db: DatabaseSync,
): SimulatorScenarioStore {
  const listStmt = db.prepare(`
    SELECT
      id,
      label,
      description,
      caption,
      carousel_summary,
      thread_json,
      target_author,
      target_text,
      created_at,
      updated_at
    FROM simulator_scenarios
    ORDER BY label COLLATE NOCASE ASC
  `);

  const getStmt = db.prepare(`
    SELECT
      id,
      label,
      description,
      caption,
      carousel_summary,
      thread_json,
      target_author,
      target_text,
      created_at,
      updated_at
    FROM simulator_scenarios
    WHERE id = ?
  `);

  const insertStmt = db.prepare(`
    INSERT INTO simulator_scenarios (
      id,
      label,
      description,
      caption,
      carousel_summary,
      thread_json,
      target_author,
      target_text,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE simulator_scenarios
    SET
      label = ?,
      description = ?,
      caption = ?,
      carousel_summary = ?,
      thread_json = ?,
      target_author = ?,
      target_text = ?,
      updated_at = ?
    WHERE id = ?
  `);

  const deleteStmt = db.prepare(`DELETE FROM simulator_scenarios WHERE id = ?`);

  return {
    list() {
      return (listStmt.all() as SimulatorScenarioRow[]).map(mapRow);
    },

    getById(id: string) {
      const row = getStmt.get(normalizeScenarioId(id)) as SimulatorScenarioRow | undefined;
      return row ? mapRow(row) : null;
    },

    create(input: SimulatorScenarioInput) {
      const id = normalizeScenarioId(input.id);
      const now = new Date().toISOString();
      const threadJson = JSON.stringify(input.thread);

      try {
        insertStmt.run(
          id,
          input.label,
          input.description,
          input.caption,
          input.carouselSummary,
          threadJson,
          input.targetAuthor,
          input.targetText,
          now,
          now,
        );
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          (("errcode" in error && error.errcode === 1555) ||
            ("message" in error &&
              typeof error.message === "string" &&
              error.message.includes("UNIQUE constraint failed")))
        ) {
          throw new ValidationError(`scenario id already exists: ${id}`);
        }
        throw error;
      }

      return mapRow(getStmt.get(id) as SimulatorScenarioRow);
    },

    update(id: string, input: SimulatorScenarioInput) {
      const normalizedId = normalizeScenarioId(id);
      const existing = getStmt.get(normalizedId) as SimulatorScenarioRow | undefined;
      if (!existing) {
        return null;
      }

      const updatedAt = new Date().toISOString();
      const threadJson = JSON.stringify(input.thread);

      updateStmt.run(
        input.label,
        input.description,
        input.caption,
        input.carouselSummary,
        threadJson,
        input.targetAuthor,
        input.targetText,
        updatedAt,
        normalizedId,
      );

      return mapRow(getStmt.get(normalizedId) as SimulatorScenarioRow);
    },

    delete(id: string) {
      const result = deleteStmt.run(normalizeScenarioId(id));
      return result.changes > 0;
    },
  };
}
