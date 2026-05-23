"use client";

import type { FamilyRow } from "@/lib/board";
import { DriverAvatar } from "./DriverAvatar";
import { useMovement } from "./useMovement";
import { deltaLabel, ordinal } from "./ui";

const MEDAL = ["", "🥇", "🥈", "🥉"];

export function FamilyStandings({ rows }: { rows: FamilyRow[] }) {
  const moves = useMovement(Object.fromEntries(rows.map((r) => [r.player.id, r.rank])));

  if (!rows.length) {
    return <p className="p-6 text-center text-white/50">No players configured yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const move = moves[row.player.id];
        const delta = deltaLabel(row.positionDelta);
        return (
          <li
            key={row.player.id}
            className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors ${
              move === "up" ? "flash-up" : move === "down" ? "flash-down" : ""
            } ${row.rank <= 3 ? "ring-1 ring-yellow-400/30" : ""}`}
          >
            <div className="w-8 text-center">
              <div className="text-lg font-black tabular-nums">{row.rank}</div>
              {MEDAL[row.rank] && <div className="-mt-1 text-xs">{MEDAL[row.rank]}</div>}
            </div>

            <DriverAvatar
              name={row.player.name}
              avatar={row.player.avatar}
              number={row.driver.number}
              color={row.driver.color}
            />

            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{row.player.name}</div>
              <div className="truncate text-xs text-white/50">
                {row.driver.name} · {row.driver.team}
                {row.driver.fastestLap && <span className="ml-1 text-fuchsia-400">⚡FL</span>}
                {row.driver.status === "out" && <span className="ml-1 text-red-400">OUT</span>}
                {row.driver.status === "pit" && <span className="ml-1 text-amber-300">PIT</span>}
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-sm font-bold">
                {row.driver.position >= 900 ? "—" : ordinal(row.driver.position)}
              </div>
              <div className={`text-xs font-semibold ${delta.cls}`}>{delta.text}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
