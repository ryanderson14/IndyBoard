"use client";

import { useCallback, useState } from "react";
import type { DataSource, FlagStatus, RaceState } from "@/lib/types";

const FLAGS: FlagStatus[] = ["pre", "green", "yellow", "red", "checkered"];
const SOURCES: DataSource[] = ["mock", "espn", "sportradar", "manual"];

const FLAG_BG: Record<FlagStatus, string> = {
  pre: "bg-rail",
  green: "bg-[var(--accent-green)] text-black",
  yellow: "hatch-amber",
  red: "hatch-red",
  checkered: "checkered text-black",
};

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
      <main className="relative z-10 mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
        <div className="text-center">
          <span className="hud-tag mx-auto">Race Control</span>
          <h1 className="mt-3 font-display text-4xl font-black italic uppercase">Admin</h1>
        </div>
        <input
          type="password"
          placeholder="Admin password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          className="rounded-[3px] border border-white/15 bg-panel px-3 py-2.5 text-ink outline-none focus:border-[var(--accent-red)]"
        />
        <button
          onClick={load}
          className="rounded-[3px] bg-[var(--accent-red)] py-2.5 font-display text-sm font-black uppercase tracking-[0.18em] text-white hover:bg-[var(--accent-red-hot)]"
        >
          Unlock
        </button>
        {msg && (
          <p className="text-center text-sm text-[var(--accent-amber)]">{msg}</p>
        )}
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto max-w-2xl space-y-5 p-5">
      <header className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div>
          <span className="hud-tag">Race Control</span>
          <h1 className="mt-2 font-display text-3xl font-black italic uppercase">
            Race Control
          </h1>
        </div>
        <div className="text-right text-[10px] font-bold uppercase tracking-[0.18em] text-ink-mute">
          Store · <span className="text-ink">{storeBackend}</span>
        </div>
      </header>

      {msg && (
        <p className="border-l-2 border-[var(--accent-green)] bg-[var(--accent-green)]/10 px-3 py-2 text-sm text-[var(--accent-green)]">
          {msg}
        </p>
      )}

      <section className="pit-panel p-4">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-ink-mute">
          Data Source
        </h2>
        <div className="flex gap-1">
          {SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => setSrc(s)}
              className={`flex-1 rounded-[3px] py-2 font-display text-sm font-black uppercase tracking-[0.18em] transition-colors ${
                source === s
                  ? "bg-[var(--accent-red)] text-white"
                  : "bg-rail text-ink-dim hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-mute">
          Manual overrides{" "}
          {storeBackend === "kv"
            ? "persist (KV)"
            : "are in-memory only — set KV_REST_API_* on Vercel to persist"}
          .
        </p>
      </section>

      <section className="pit-panel p-4">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-ink-mute">
          Manual Race
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-mute">
            Flag
          </label>
          {FLAGS.map((f) => (
            <button
              key={f}
              onClick={() => patch({ flagStatus: f })}
              className={`rounded-[3px] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-colors ${
                race?.flagStatus === f
                  ? `${FLAG_BG[f]} ring-1 ring-white/30`
                  : "bg-rail text-ink-dim hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-mute">
            Lap
          </label>
          <input
            type="number"
            value={race?.lap ?? 0}
            onChange={(e) => patch({ lap: Number(e.target.value) })}
            className="w-20 rounded-[3px] border border-white/10 bg-rail px-2 py-1 font-mono tabular text-ink"
          />
          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-mute">
            of
          </label>
          <input
            type="number"
            value={race?.totalLaps ?? 200}
            onChange={(e) => patch({ totalLaps: Number(e.target.value) })}
            className="w-20 rounded-[3px] border border-white/10 bg-rail px-2 py-1 font-mono tabular text-ink"
          />
          <button
            onClick={reset}
            className="ml-auto rounded-[3px] bg-[var(--accent-red)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-[var(--accent-red-hot)]"
          >
            Reset
          </button>
        </div>

        <ol className="mt-4 max-h-[50vh] space-y-1 overflow-auto pr-1">
          {race?.drivers.map((d, i) => (
            <li
              key={d.id}
              className="flex items-center gap-2 rounded-[3px] bg-rail px-2 py-1.5 text-sm"
            >
              <span className="w-6 text-right font-mono text-xs text-ink-mute tabular">
                {i + 1}
              </span>
              <span
                className="h-3 w-1.5 shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-mono text-xs text-ink-dim">#{d.number}</span>{" "}
                {d.name}
              </span>
              <button
                onClick={() => move(i, -1)}
                className="rounded-[3px] bg-overlay px-2 text-ink-dim hover:text-ink"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                className="rounded-[3px] bg-overlay px-2 text-ink-dim hover:text-ink"
                aria-label="Move down"
              >
                ↓
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-mute">
          Switch source to <b className="text-ink">manual</b> for these positions to
          drive the family boards.
        </p>
      </section>
    </main>
  );
}
