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
// Two pieces of cache behavior worth knowing about:
//
//   - We set cacheControlMaxAge: 60 on every put. Without this, Vercel Blob
//     edges hold the previous version for up to a month (the default), which
//     causes admin saves to "flap" across regions as some instances serve the
//     new value and others serve the cached old one.
//
//   - A short in-instance read cache (5s) keeps the board poll from making a
//     round trip for every viewer every 4s. Writes invalidate it immediately on
//     the writing instance; other instances converge on the next CDN refresh.
//
// We distinguish "blob doesn't exist" (legit null, cache it) from transient
// errors (don't poison the cache, return the last known good value). That's
// what keeps the boards stable when a region returns a momentary 404 right
// after the first put propagates.

import { put, head, BlobNotFoundError } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const useBlob = Boolean(BLOB_TOKEN);
const useKv = !useBlob && Boolean(KV_URL && KV_TOKEN);

const memory = new Map<string, string>();

type CacheEntry = { value: unknown; expiresAt: number };
const READ_CACHE_TTL_MS = 5000;
const readCache = new Map<string, CacheEntry>();

// Pathname -> public URL. Stable as long as `addRandomSuffix: false` so we
// only need to discover each URL once per instance.
const urlByPath = new Map<string, string>();

function blobPath(key: string): string {
  return `data/${encodeURIComponent(key)}.json`;
}

async function blobRead<T>(pathname: string): Promise<T | null> {
  let url = urlByPath.get(pathname);
  if (!url) {
    try {
      const meta = await head(pathname, { token: BLOB_TOKEN });
      url = meta.url;
      urlByPath.set(pathname, url);
    } catch (err) {
      if (err instanceof BlobNotFoundError) return null;
      throw err;
    }
  }
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) {
    urlByPath.delete(pathname);
    return null;
  }
  if (!res.ok) throw new Error(`Blob fetch ${res.status}`);
  return (await res.json()) as T;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const cached = readCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T | null;
  }

  try {
    let value: T | null = null;
    if (useBlob) {
      value = await blobRead<T>(blobPath(key));
    } else if (useKv) {
      const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`KV ${res.status}`);
      const data = (await res.json()) as { result: string | null };
      value = data.result ? (JSON.parse(data.result) as T) : null;
    } else {
      const raw = memory.get(key);
      value = raw ? (JSON.parse(raw) as T) : null;
    }
    readCache.set(key, { value, expiresAt: Date.now() + READ_CACHE_TTL_MS });
    return value;
  } catch {
    // Transient error: return last known good value (even if expired) and skip
    // poisoning the cache so the next call retries.
    if (cached) return cached.value as T | null;
    return null;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const payload = JSON.stringify(value);
  readCache.delete(key);

  if (useBlob) {
    const result = await put(blobPath(key), payload, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      token: BLOB_TOKEN,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    urlByPath.set(blobPath(key), result.url);
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
