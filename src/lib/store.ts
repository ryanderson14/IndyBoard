// Tiny key/value store for the manual fallback + runtime data-source flag.
//
// If Upstash / Vercel KV REST env vars are present it uses them (persists across
// serverless invocations). Otherwise it falls back to an in-memory map, which is
// fine for local dev and survives while a serverless instance stays warm.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const useKv = Boolean(KV_URL && KV_TOKEN);

const memory = new Map<string, string>();

export async function kvGet<T>(key: string): Promise<T | null> {
  if (!useKv) {
    const raw = memory.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result: string | null };
  return data.result ? (JSON.parse(data.result) as T) : null;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const payload = JSON.stringify(value);
  if (!useKv) {
    memory.set(key, payload);
    return;
  }
  await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body: payload,
    cache: "no-store",
  });
}

export const STORE_BACKEND = useKv ? "kv" : "memory";
