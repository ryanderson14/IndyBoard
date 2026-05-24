import type { RaceSummary } from "@/lib/board";
import type { DataSource } from "@/lib/types";
import { FLAG_META } from "./ui";

interface Props {
  race: RaceSummary;
  source: DataSource;
  connected: boolean;
}

const SOURCE_LABEL: Record<DataSource, string> = {
  mock: "SIM",
  espn: "ESPN",
  sportradar: "SPORTRADAR",
  manual: "MANUAL",
};

export function RaceHeader({ race, source, connected }: Props) {
  const flag = FLAG_META[race.flagStatus];
  const pct = race.totalLaps ? Math.min(100, (race.lap / race.totalLaps) * 100) : 0;
  const toGo = Math.max(0, race.totalLaps - race.lap);

  return (
    <header className="pit-panel relative overflow-hidden">
      {/* Brand stripe */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--accent-red)] via-[var(--accent-amber)] to-[var(--accent-red)]" />

      <div className="grid grid-cols-1 gap-2.5 px-2.5 py-2.5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:px-6 sm:py-5">
        {/* Title block */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
          <div
            className="checkered h-9 w-9 shrink-0 rounded-[2px] border border-white/20 sm:h-12 sm:w-12"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span
                className={`hud-tag ${connected ? "" : "hud-tag-dark"}`}
                aria-label={connected ? "Live" : "Reconnecting"}
              >
                {connected ? (
                  <>
                    <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
                    LIVE
                  </>
                ) : (
                  "OFFLINE"
                )}
              </span>
              <span className="hud-tag hud-tag-dark">{SOURCE_LABEL[source]}</span>
            </div>
            <h1 className="font-display break-words text-xl font-black italic uppercase leading-[0.95] tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {race.raceName}
            </h1>
            {race.leader && (
              <p className="mt-1 truncate text-[11px] text-ink-dim sm:text-xs">
                <span className="text-ink-mute">LEADER ·</span>{" "}
                <span className="font-semibold text-ink">{race.leader.name}</span>{" "}
                <span className="tabular text-ink-mute">#{race.leader.number}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right-rail: flag + lap counter */}
        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end sm:gap-4">
          <span
            className={`inline-flex h-7 shrink-0 items-center rounded-[2px] px-2 text-[10px] font-black uppercase tracking-[0.1em] sm:h-9 sm:px-3 sm:text-[11px] sm:tracking-[0.2em] ${flag.cls}`}
            style={{ color: flag.color }}
          >
            {flag.label}
          </span>

          <div className="flex shrink-0 items-baseline gap-0.5 leading-none sm:gap-1">
            <span className="font-display text-[34px] font-black italic tabular text-ink sm:text-[64px] lg:text-[80px]">
              {race.lap}
            </span>
            <span className="font-display text-base font-black italic tabular text-ink-mute sm:text-3xl lg:text-4xl">
              /{race.totalLaps}
            </span>
          </div>
        </div>
      </div>

      {/* Progress stripe — chunky broadcast bar */}
      <div className="relative h-2 w-full bg-rail">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-amber)] to-[var(--accent-red)] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
        {/* Tick marks every 25% */}
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            className="absolute top-0 h-full w-px bg-black/60"
            style={{ left: `${p}%` }}
          />
        ))}
        <div
          className="absolute -top-1 h-4 w-[3px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
          style={{ left: `calc(${pct}% - 1.5px)` }}
        />
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.04] bg-black/30 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-mute sm:px-6 sm:tracking-[0.18em]">
        <span>{Math.round(pct)}%</span>
        <span className="tabular">
          {race.flagStatus === "checkered" ? "RACE OVER" : `${toGo} LAPS TO GO`}
        </span>
      </div>
    </header>
  );
}
