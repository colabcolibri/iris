import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_PIPELINE_DATE_FILTER,
  formatPipelineDateFilterLabel,
  parsePipelineDateFilterJson,
  serializePipelineDateFilter,
  type PipelineDateFilter,
} from "@iris/domain/posts/pipeline-date-filter";

const STORAGE_KEY = "iris.pipeline-date-filter";

function readStoredFilter(): PipelineDateFilter {
  if (typeof window === "undefined") {
    return DEFAULT_PIPELINE_DATE_FILTER;
  }
  return (
    parsePipelineDateFilterJson(window.localStorage.getItem(STORAGE_KEY)) ??
    DEFAULT_PIPELINE_DATE_FILTER
  );
}

export function usePipelineDateFilter(timeZone: string) {
  const [filter, setFilterState] = useState<PipelineDateFilter>(readStoredFilter);

  const setFilter = useCallback((next: PipelineDateFilter) => {
    setFilterState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, serializePipelineDateFilter(next));
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const label = useMemo(
    () => formatPipelineDateFilterLabel(filter, timeZone),
    [filter, timeZone],
  );

  return { filter, setFilter, label };
}
