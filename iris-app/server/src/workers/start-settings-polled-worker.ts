export type SettingsPolledWorkerOptions = {
  resolveIntervalMs: () => number;
  tick: () => Promise<void>;
  intervalMs?: number;
  onTickError?: (error: unknown) => void;
};

export function startSettingsPolledWorker(
  options: SettingsPolledWorkerOptions,
): () => void {
  let stopped = false;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const scheduleNext = () => {
    if (stopped) {
      return;
    }

    const intervalMs = options.intervalMs ?? options.resolveIntervalMs();

    timer = setTimeout(() => {
      void runTick();
    }, intervalMs);

    if (typeof timer.unref === "function") {
      timer.unref();
    }
  };

  const runTick = async () => {
    if (stopped) {
      return;
    }

    if (running) {
      scheduleNext();
      return;
    }

    running = true;

    try {
      await options.tick();
    } catch (error) {
      options.onTickError?.(error);
    } finally {
      running = false;
      scheduleNext();
    }
  };

  void runTick();

  return () => {
    stopped = true;
    clearTimer();
  };
}
