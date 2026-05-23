import type { RaceSummary } from "@/lib/board";
import type { DataSource } from "@/lib/types";
import { FLAG_META } from "./ui";

interface Props {
  race: RaceSummary;
  source: DataSource;
  connected: boolean;
}

export function RaceHeader({ race, source, connected }: Props) {
  const flag = FLAG_META[race.flagStatus];
  const pct = race.totalLaps ? Math.min(100, (race.lap / race.totalLaps) * 100) : 0;

  return (
    <header className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="checkered h-9 w-9 rounded-md" aria-hidden />
          <div>
            <h1 className="text-lg font-black tracking-tight sm:text-2xl">{race.raceName}</h1>
            <p className="text-xs text-white/50">
              {connected ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-green-400" />
                  Live · {source}
                </span>
              ) : (
                <span className="text-amber-400">reconnecting…</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{ backgroundColor: flag.bg, color: flag.color }}
          >
            {flag.label}
          </span>
          <div className="text-right">
            <div className="font-mono text-xl font-black sm:text-2xl">
              {race.lap}
              <span className="text-white/40">/{race.totalLaps}</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Laps</div>
          </div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-300 to-red-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {race.leader && (
        <p className="mt-2 text-xs text-white/60">
          Leader: <span className="font-bold text-white">{race.leader.name}</span> · #
          {race.leader.number} · {race.leader.team}
        </p>
      )}
    </header>
  );
}
