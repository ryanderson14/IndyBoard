// Module-level memoization with a short TTL. On a warm serverless instance this
// makes "poll once upstream, serve many clients" work without any extra infra.

interface Entry<T> {
  value: T;
  expires: number;
}

const entries = new Map<string, Entry<unknown>>();

export async function memoize<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = entries.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > now) return hit.value;

  const value = await fn();
  entries.set(key, { value, expires: now + ttlMs });
  return value;
}
