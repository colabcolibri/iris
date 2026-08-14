import type { SimulateThreadMessage } from "@/lib/api";

export type SimulatorThreadRow = SimulateThreadMessage & { id: string };

export function emptySimulatorThreadRow(): SimulatorThreadRow {
  return {
    id: crypto.randomUUID(),
    author: "fan",
    text: "",
    is_brand_reply: false,
  };
}

export function threadRowsFromMessages(rows: SimulateThreadMessage[]): SimulatorThreadRow[] {
  return rows.map((row) => ({
    id: crypto.randomUUID(),
    author: row.author,
    text: row.text,
    is_brand_reply: Boolean(row.is_brand_reply),
  }));
}
