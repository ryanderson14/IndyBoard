// Tiny key/value store used by the admin overrides + runtime data-source flag.
//
// Resolution order:
//   1. Vercel Blob (if BLOB_READ_WRITE_TOKEN is set) — persists across cold
//      starts on Vercel. Each key is stored as a JSON file under data/.
//   2. Upstash / Vercel KV REST (legacy) — used if KV_REST_API_URL +
//      KV_REST_API_TOKEN are set.
//   3. In-memory map — fine for local dev and survives while a serverless
//      instance stays warm.
//
// A small TTL read-cache keeps the /api/board poll from hammering Blob (and
// blowing through the Hobby bandwidth budget). Writes invalidate immediately
// so admin saves are visible within the cache lifetime.

import { put, head } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const useBlob = Boolean(BLOB_TOKEN);
const useKv = !useBlob && Boolean(KV_URL && KV_TOKEN);

const memory = new Map<string, string>();

type CacheEntry = { value: unknown; expiresAt: number };
const READ_CACHE_TTL_MS = 3000;
const readCache = new Map<string, CacheEntry>();

function blobPath(key: string): string {
  return `data/${encodeURIComponent(key)}.json`;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const cached = readCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T | null;
  }

  let value: T | null = null;

  if (useBlob) {
    try {
      const meta = await head(blobPath(key), { token: BLOB_TOKEN });
      const res = await fetch(meta.url, { cache: "no-store" });
      if (res.ok) value = (await res.json()) as T;
    } catch {
      // 404 / not yet written — treat as null
      value = null;
    }
  } else if (useKv) {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { result: string | null };
      value = data.result ? (JSON.parse(data.result) as T) : null;
    }
  } else {
    const raw = memory.get(key);
    value = raw ? (JSON.parse(raw) as T) : null;
  }

  readCache.set(key, { value, expiresAt: Date.now() + READ_CACHE_TTL_MS });
  return value;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const payload = JSON.stringify(value);
  readCache.delete(key);

  if (useBlob) {
    await put(blobPath(key), payload, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      token: BLOB_TOKEN,
      allowOverwrite: true,
    });
    return;
  }
  if (useKv) {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: payload,
      cache: "no-store",
    });
    return;
  }
  memory.set(key, payload);
}

export const STORE_BACKEND = useBlob ? "blob" : useKv ? "kv" : "memory";
