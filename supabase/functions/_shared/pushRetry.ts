// Retry only explicit temporary provider failures. A timeout may have delivered,
// so an error without an HTTP response must never trigger a blind resend.
export async function withPushRetry<T>(send: () => Promise<T>, options: {
  sleep?: (ms: number) => Promise<void>; now?: () => number; random?: () => number;
} = {}): Promise<T> {
  const sleep = options.sleep || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const now = options.now || Date.now;
  const random = options.random || Math.random;
  for (let attempt = 0; ; attempt++) {
    try { return await send(); }
    catch (error) {
      const failure = error as {statusCode?: number; headers?: Record<string,string>; retryAfter?: string|null};
      // Quota failures (429) require a longer, durable schedule, not rapid retries.
      if (attempt >= 2 || ![500,503].includes(Number(failure?.statusCode))) throw error;
      const header = failure.retryAfter || failure.headers?.['retry-after'];
      const backoff = 1000 * 2 ** attempt + Math.floor(random()*250);
      let wait = backoff;
      if (header) {
        const seconds = Number(header);
        const delay = Number.isFinite(seconds) ? seconds*1000 : Date.parse(header)-now();
        if (!Number.isFinite(delay)) throw error;
        wait = Math.max(wait, delay);
      }
      // Do not violate Retry-After or occupy an Edge worker for a long outage.
      if (wait > 5000) throw error;
      await sleep(wait);
    }
  }
}
