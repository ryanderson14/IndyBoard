"use client";

import { useCallback, useState } from "react";
import type { DataSource, FlagStatus, RaceState } from "@/lib/types";

const FLAGS: FlagStatus[] = ["pre", "green", "yellow", "red", "checkered"];
const SOURCES: DataSource[] = ["mock", "sportradar", "manual"];

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [source, setSource] = useState<DataSource>("mock");
  const [storeBackend, setStoreBackend] = useState("");
  const [race, setRace] = useState<RaceState | null>(null);
  const [msg, setMsg] = useState("");

  const call = useCallback(
    async (body?: object) => {
      const res = await fetch("/api/admin", {
        method: body ? "POST" : "GET",
        headers: { "x-admin-secret": secret, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
      if (res.status === 401) {
        setMsg("Wrong password");
        setAuthed(false);
        return null;
      }
      return res.json();
    },
    [secret],
  );

  const load = useCallback(async () => {
    const data = await call();
    if (!data) return;
    setAuthed(true);
    setSource(data.source);
    setStoreBackend(data.storeBackend);
    setRace(data.race);
    setMsg(`Loaded (${data.storeBackend} store)`);
  }, [call]);

  const setSrc = async (s: DataSource) => {
    await call({ action: "setSource", source: s });
    setSource(s);
    setMsg(`Source → ${s}`);
  };

  const patch = async (p: object) => {
    const data = await call({ action: "patch", ...p });
    if (data?.race) setRace(data.race);
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!race) return;
    const ids = race.drivers.map((d) => d.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    const data = await call({ action: "reorder", order: ids });
    if (data?.race) setRace(data.race);
  };

  const reset = async () => {
    await call({ action: "reset" });
    load();
    setMsg("Manual board reset to grid order");
  };

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
        <h1 className="text-xl font-black">Admin</h1>
        <input
          type="password"
          placeholder="Admin password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-2"
        />
        <button onClick={load} className="rounded-lg bg-white py-2 font-bold text-black">
          Unlock
        </button>
        {msg && <p className="text-sm text-amber-400">{msg}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-5">
      <h1 className="text-xl font-black">Race Control</h1>
      {msg && <p className="text-sm text-green-400">{msg}</p>}

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-white/60">
          Data Source
        </h2>
        <div className="flex gap-2">
          {SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => setSrc(s)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                source === s ? "bg-white text-black" : "bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/40">
          Manual overrides {storeBackend === "kv" ? "persist (KV)" : "are in-memory only — set KV_REST_API_* on Vercel to persist"}.
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-white/60">
          Manual Race
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">Flag:</label>
          {FLAGS.map((f) => (
            <button
              key={f}
              onClick={() => patch({ flagStatus: f })}
              className={`rounded px-2 py-1 text-xs font-bold ${
                race?.flagStatus === f ? "bg-white text-black" : "bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <label>Lap:</label>
          <input
            type="number"
            value={race?.lap ?? 0}
            onChange={(e) => patch({ lap: Number(e.target.value) })}
            className="w-20 rounded border border-white/20 bg-white/10 px-2 py-1"
          />
          <label>of</label>
          <input
            type="number"
            value={race?.totalLaps ?? 200}
            onChange={(e) => patch({ totalLaps: Number(e.target.value) })}
            className="w-20 rounded border border-white/20 bg-white/10 px-2 py-1"
          />
          <button onClick={reset} className="ml-auto rounded bg-red-500/80 px-3 py-1 text-xs font-bold">
            Reset
          </button>
        </div>

        <ol className="mt-3 max-h-[50vh] space-y-1 overflow-auto">
          {race?.drivers.map((d, i) => (
            <li key={d.id} className="flex items-center gap-2 rounded bg-black/30 px-2 py-1 text-sm">
              <span className="w-6 text-right font-mono text-white/50">{i + 1}</span>
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="flex-1 truncate">
                #{d.number} {d.name}
              </span>
              <button onClick={() => move(i, -1)} className="rounded bg-white/10 px-2">↑</button>
              <button onClick={() => move(i, 1)} className="rounded bg-white/10 px-2">↓</button>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-white/40">
          Switch source to <b>manual</b> for these positions to drive the family boards.
        </p>
      </section>
    </main>
  );
}
