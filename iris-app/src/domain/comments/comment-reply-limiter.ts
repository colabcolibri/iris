type ReleaseFn = () => void;

export function createConcurrencyLimiter(maxConcurrent: number) {
  const max = Math.max(1, maxConcurrent);
  let running = 0;
  const queue: Array<() => void> = [];

  function acquire(): Promise<ReleaseFn> {
    if (running < max) {
      running += 1;
      return Promise.resolve(() => {
        running -= 1;
        const next = queue.shift();
        if (next) {
          next();
        }
      });
    }

    return new Promise((resolve) => {
      queue.push(() => {
        running += 1;
        resolve(() => {
          running -= 1;
          const next = queue.shift();
          if (next) {
            next();
          }
        });
      });
    });
  }

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    const release = await acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }

  return { run };
}

export const DEFAULT_REPLY_MAX_CONCURRENT = 10;

export const commentReplyLimiter = createConcurrencyLimiter(
  Number(process.env.IRIS_REPLY_MAX_CONCURRENT ?? DEFAULT_REPLY_MAX_CONCURRENT),
);
