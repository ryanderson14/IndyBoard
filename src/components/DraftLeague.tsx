"use client";

import { useState } from "react";
import type { DraftRow } from "@/lib/board";
import { DriverAvatar } from "./DriverAvatar";
import { useMovement } from "./useMovement";
import { ordinal, positionPill } from "./ui";

export function DraftLeague({ rows }: { rows: DraftRow[] }) {
  const moves = useMovement(Object.fromEntries(rows.map((r) => [r.team.id, r.rank])));
  const [open, setOpen] = useState<string | null>(rows[0]?.team.id ?? null);

  if (!rows.length) {
    return (
      <div className="pit-panel p-6 text-center text-sm text-ink-dim">
        No teams configured yet.
      </div>
    );
  }

  const leaderTotal = rows[0]?.total ?? 0;
  const maxBar = Math.max(leaderTotal, 1);

  return (
    <section aria-label="Anderson Draft League">
      <div className="mb-2 flex items-end justify-between gap-2">
        <span
          className="hud-tag"
          style={{ background: "var(--accent-cyan)", color: "#001a22" }}
        >
          Anderson Draft League
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-mute">
          {rows.length} teams
        </span>
      </div>

      <ul className="space-y-1">
        {rows.map((row) => {
          const move = moves[row.team.id];
          const expanded = open === row.team.id;
          const gap = leaderTotal - row.total;
          const pill = positionPill(row.rank);
          const barPct = Math.round((row.total / maxBar) * 100);
          const isLeader = row.rank === 1;

          return (
            <li
              key={row.team.id}
              className={`pit-panel rail overflow-hidden ${
                move === "up" ? "flash-up" : move === "down" ? "flash-down" : ""
              }`}
              style={
                {
                  "--rail-color": isLeader
                    ? "var(--accent-amber)"
                    : "var(--accent-cyan)",
                } as React.CSSProperties
              }
            >
              <button
                onClick={() => setOpen(expanded ? null : row.team.id)}
                className="grid w-full grid-cols-[36px_1fr_auto_20px] items-center gap-2 py-2 pl-3 pr-2 text-left sm:grid-cols-[52px_1fr_auto_28px] sm:gap-3 sm:py-2.5 sm:pl-5 sm:pr-4"
                aria-expanded={expanded}
              >
                {/* Position pill */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[3px] font-display text-lg font-black italic tabular sm:h-12 sm:w-12 sm:text-3xl"
                  style={{ background: pill.bg, color: pill.ink }}
                >
                  {row.rank}
                </div>

                {/* Team name + bar */}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <DriverAvatar
                      name={row.team.name}
                      avatar={row.team.avatar}
                      color={isLeader ? "var(--accent-amber)" : "var(--accent-cyan)"}
                      size={32}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base font-extrabold uppercase tracking-tight text-ink sm:text-xl">
                        {row.team.name}
                      </div>
                      <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-mute sm:text-xs">
                        {row.drivers.length} cars
                        {gap > 0 && (
                          <>
                            <span className="text-ink-mute"> · </span>
                            <span className="text-[var(--accent-down)]">−{gap} pts</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Points bar */}
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-rail">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${barPct}%`,
                        background: isLeader
                          ? "linear-gradient(90deg, var(--accent-amber), #fff7c2)"
                          : "linear-gradient(90deg, var(--accent-cyan), #7ee0ff)",
                      }}
                    />
                  </div>
                </div>

                {/* Points big number */}
                <div className="text-right leading-none">
                  <div
                    className="font-display text-2xl font-black italic tabular sm:text-3xl lg:text-4xl"
                    style={{ color: isLeader ? "var(--accent-amber)" : "var(--ink)" }}
                  >
                    {row.total}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-[0.22em] text-ink-mute">
                    PTS
                  </div>
                </div>

                {/* Chevron */}
                <span
                  className={`flex h-5 w-5 items-center justify-center text-ink-mute transition-transform sm:h-6 sm:w-6 ${
                    expanded ? "rotate-90" : ""
                  }`}
                  aria-hidden
                >
                  ›
                </span>
              </button>

              {/* Expandable driver detail */}
              {expanded && (
                <div className="border-t border-white/[0.05] bg-black/30 px-2.5 py-2 sm:px-4">
                  <div className="grid grid-cols-[10px_36px_1fr_44px_36px] items-center gap-1.5 pb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-ink-mute sm:grid-cols-[16px_48px_1fr_64px_52px] sm:gap-2 sm:tracking-[0.18em]">
                    <span />
                    <span>NO</span>
                    <span>DRIVER</span>
                    <span className="text-right">POS</span>
                    <span className="text-right">PTS</span>
                  </div>
                  {row.drivers.map((d) => (
                    <div
                      key={d.driver.id}
                      className="grid grid-cols-[10px_36px_1fr_44px_36px] items-center gap-1.5 py-1.5 text-xs sm:grid-cols-[16px_48px_1fr_64px_52px] sm:gap-2 sm:text-sm"
                    >
                      <span
                        className="inline-block h-3.5 w-1 shrink-0"
                        style={{ background: d.driver.color }}
                        aria-hidden
                      />
                      <span className="font-mono text-[10px] font-bold text-ink-dim tabular sm:text-xs">
                        #{d.driver.number}
                      </span>
                      <span className="flex min-w-0 items-center gap-1 truncate font-semibold text-ink sm:gap-1.5">
                        <span className="truncate">{d.driver.name}</span>
                        {d.bonuses.map((b) => (
                          <span
                            key={b}
                            className="hidden shrink-0 rounded-sm bg-[var(--accent-magenta)]/15 px-1 text-[9px] font-black uppercase tracking-wider text-[var(--accent-magenta)] sm:inline-block"
                          >
                            {b}
                          </span>
                        ))}
                      </span>
                      <span className="text-right font-mono text-[10px] text-ink-dim tabular sm:text-xs">
                        {d.driver.position >= 900 ? "—" : ordinal(d.driver.position)}
                      </span>
                      <span className="text-right font-display text-sm font-black italic tabular text-ink sm:text-base">
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
    </section>
  );
}
