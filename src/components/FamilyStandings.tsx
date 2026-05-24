"use client";

import { useEffect, useState } from "react";
import type { FamilyRow } from "@/lib/board";
import { DriverAvatar } from "./DriverAvatar";
import { useMovement } from "./useMovement";
import { deltaLabel, ordinal, positionPill } from "./ui";

interface Props {
  rows: FamilyRow[];
  /** If true, pin the top 3 and rotate the rest through a window of `pageSize`. */
  cycleTail?: boolean;
  pageSize?: number;
  intervalMs?: number;
}

const PIN_COUNT = 3;

export function FamilyStandings({
  rows,
  cycleTail = false,
  pageSize = 5,
  intervalMs = 6000,
}: Props) {
  const moves = useMovement(Object.fromEntries(rows.map((r) => [r.player.id, r.rank])));

  const tail = rows.slice(PIN_COUNT);
  const cycling = cycleTail && tail.length > pageSize;
  const pageCount = cycling ? Math.ceil(tail.length / pageSize) : 1;

  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!cycling) {
      setPage(0);
      return;
    }
    const id = setInterval(() => {
      setPage((p) => (p + 1) % pageCount);
    }, intervalMs);
    return () => clearInterval(id);
  }, [cycling, pageCount, intervalMs]);

  if (!rows.length) {
    return (
      <div className="pit-panel p-6 text-center text-sm text-ink-dim">
        No players configured yet.
      </div>
    );
  }

  const pinned = rows.slice(0, PIN_COUNT);
  const windowStart = cycling ? page * pageSize : 0;
  const visibleTail = cycling
    ? tail.slice(windowStart, windowStart + pageSize)
    : tail;
  const firstRank = (visibleTail[0]?.rank) ?? PIN_COUNT + 1;
  const lastRank = (visibleTail[visibleTail.length - 1]?.rank) ?? rows.length;

  const renderRow = (row: FamilyRow) => {
    const move = moves[row.player.id];
    const delta = deltaLabel(row.positionDelta);
    const pill = positionPill(row.rank);
    const isLeader = row.rank === 1;
    const isPodium = row.rank <= 3;
    const out = row.driver.status === "out";
    const inPit = row.driver.status === "pit";

    return (
      <li
        key={row.player.id}
        className={`pit-panel rail relative grid grid-cols-[36px_1fr_56px] items-center gap-2 py-2 pl-3 pr-2 sm:grid-cols-[52px_1fr_92px] sm:gap-3 sm:py-2.5 sm:pl-5 sm:pr-4 ${
          move === "up" ? "flash-up" : move === "down" ? "flash-down" : ""
        }`}
        style={
          {
            "--rail-color": row.driver.color,
            borderColor: isLeader ? "rgba(255,191,0,0.4)" : undefined,
          } as React.CSSProperties
        }
      >
        {/* Position pill */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[3px] font-display text-lg font-black italic tabular sm:h-12 sm:w-12 sm:text-3xl"
          style={{ background: pill.bg, color: pill.ink }}
          aria-label={`Position ${row.rank}`}
        >
          {row.rank}
        </div>

        {/* Family + driver */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <DriverAvatar
            name={row.player.name}
            avatar={row.player.avatar}
            number={row.driver.number}
            color={row.driver.color}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-display text-base font-extrabold uppercase tracking-tight text-ink sm:text-xl">
                {row.player.name}
              </span>
              {isPodium && !isLeader && (
                <span className="hidden rounded-sm bg-white/10 px-1 text-[9px] font-bold uppercase tracking-wider text-ink-dim sm:inline-block">
                  Podium
                </span>
              )}
            </div>
            <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-dim sm:text-xs">
              <span className="tabular text-ink-mute">#{row.driver.number}</span>{" "}
              <span className="text-ink">{row.driver.name}</span>
              {row.driver.fastestLap && (
                <span className="ml-1.5 inline-flex items-center rounded-sm bg-[var(--accent-magenta)]/15 px-1 text-[10px] font-black uppercase tracking-wider text-[var(--accent-magenta)]">
                  ⚡ FL
                </span>
              )}
              {out && (
                <span className="ml-1.5 inline-flex items-center rounded-sm bg-[var(--accent-down)]/15 px-1 text-[10px] font-black uppercase tracking-wider text-[var(--accent-down)]">
                  OUT
                </span>
              )}
              {inPit && (
                <span className="ml-1.5 inline-flex items-center rounded-sm bg-[var(--accent-amber)]/15 px-1 text-[10px] font-black uppercase tracking-wider text-[var(--accent-amber)]">
                  PIT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Running position + delta */}
        <div className="text-right">
          <div className="font-display text-base font-black italic tabular text-ink sm:text-2xl">
            {row.driver.position >= 900 ? "—" : ordinal(row.driver.position)}
          </div>
          <div
            className={`mt-0.5 text-[10px] font-black uppercase tracking-wider tabular sm:text-[11px] ${delta.cls}`}
            title="Spots gained vs grid"
          >
            {delta.text}
          </div>
        </div>

        {/* Leader gold edge */}
        {isLeader && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[4px] ring-1 ring-[var(--accent-amber)]/40"
            aria-hidden
          />
        )}
      </li>
    );
  };

  return (
    <section aria-label="Family Standings">
      {/* Section header */}
      <div className="mb-2 flex items-end justify-between gap-2">
        <span className="hud-tag">Family Standings</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-mute">
          {rows.length} drivers
        </span>
      </div>

      <ul className="space-y-1">{pinned.map(renderRow)}</ul>

      {tail.length > 0 && (
        <>
          <div className="mb-1 mt-3 flex items-center justify-between gap-2">
            <span
              className="hud-tag"
              style={{ background: "var(--accent-cyan)", color: "#001a22" }}
            >
              {cycling ? `P${firstRank}–P${lastRank}` : `P${PIN_COUNT + 1}–P${rows.length}`}
            </span>
            {cycling && (
              <div
                className="flex items-center gap-1.5"
                aria-label={`Page ${page + 1} of ${pageCount}`}
              >
                {Array.from({ length: pageCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-3 rounded-sm ${
                      i === page ? "bg-[var(--accent-cyan)]" : "bg-white/15"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
            )}
          </div>

          <ul
            key={cycling ? page : "all"}
            className={`space-y-1 ${cycling ? "ticker-page" : ""}`}
          >
            {visibleTail.map(renderRow)}
          </ul>
        </>
      )}
    </section>
  );
}
