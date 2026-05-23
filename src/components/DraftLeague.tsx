"use client";

import { useState } from "react";
import type { DraftRow } from "@/lib/board";
import { DriverAvatar } from "./DriverAvatar";
import { useMovement } from "./useMovement";
import { ordinal } from "./ui";

const MEDAL = ["", "🥇", "🥈", "🥉"];

export function DraftLeague({ rows }: { rows: DraftRow[] }) {
  const moves = useMovement(Object.fromEntries(rows.map((r) => [r.team.id, r.rank])));
  const [open, setOpen] = useState<string | null>(rows[0]?.team.id ?? null);

  if (!rows.length) {
    return <p className="p-6 text-center text-white/50">No teams configured yet.</p>;
  }

  const leaderTotal = rows[0]?.total ?? 0;

  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const move = moves[row.team.id];
        const expanded = open === row.team.id;
        const gap = leaderTotal - row.total;
        return (
          <li
            key={row.team.id}
            className={`overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-colors ${
              move === "up" ? "flash-up" : move === "down" ? "flash-down" : ""
            } ${row.rank === 1 ? "ring-1 ring-yellow-400/40" : ""}`}
          >
            <button
              onClick={() => setOpen(expanded ? null : row.team.id)}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <div className="w-8 text-center">
                <div className="text-lg font-black tabular-nums">{row.rank}</div>
                {MEDAL[row.rank] && <div className="-mt-1 text-xs">{MEDAL[row.rank]}</div>}
              </div>
              <DriverAvatar name={row.team.name} avatar={row.team.avatar} color="#e2c044" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{row.team.name}</div>
                <div className="text-xs text-white/50">
                  {row.drivers.length} cars{gap > 0 && ` · ${gap} pts back`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xl font-black text-yellow-300">{row.total}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">pts</div>
              </div>
              <span className={`ml-1 text-white/40 transition-transform ${expanded ? "rotate-90" : ""}`}>
                ›
              </span>
            </button>

            {expanded && (
              <div className="border-t border-white/10 bg-black/20 px-3 py-2">
                {row.drivers.map((d) => (
                  <div
                    key={d.driver.id}
                    className="flex items-center gap-2 py-1.5 text-sm"
                  >
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: d.driver.color }}
                    />
                    <span className="w-9 shrink-0 font-mono text-white/50">
                      #{d.driver.number}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {d.driver.name}
                      {d.bonuses.map((b) => (
                        <span
                          key={b}
                          className="ml-1 rounded bg-fuchsia-500/20 px-1 text-[10px] text-fuchsia-300"
                        >
                          {b}
                        </span>
                      ))}
                    </span>
                    <span className="w-12 shrink-0 text-right text-white/50">
                      {d.driver.position >= 900 ? "—" : ordinal(d.driver.position)}
                    </span>
                    <span className="w-10 shrink-0 text-right font-mono font-bold">
                      {d.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
