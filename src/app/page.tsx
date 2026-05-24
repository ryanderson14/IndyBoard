"use client";

import { useState } from "react";
import Link from "next/link";
import { useBoard } from "@/components/useBoard";
import { RaceHeader } from "@/components/RaceHeader";
import { Ticker } from "@/components/Ticker";
import { FamilyStandings } from "@/components/FamilyStandings";
import { DraftLeague } from "@/components/DraftLeague";

type Tab = "family" | "draft";

export default function Dashboard() {
  const { data, connected } = useBoard();
  const [tab, setTab] = useState<Tab>("family");

  if (!data) {
    return (
      <main
        className="
          relative z-10 mx-auto flex min-h-screen max-w-3xl items-center justify-center text-ink-dim
          p-6
          md:pl-[124px] lg:pl-[168px] xl:pl-[196px] 2xl:pl-[228px]
        "
      >
        <div className="flex flex-col items-center gap-3">
          <div className="checkered h-12 w-12 animate-spin rounded-sm border border-white/20" />
          <div className="font-display text-sm font-black uppercase tracking-[0.2em]">
            Loading the grid…
          </div>
        </div>
      </main>
    );
  }

  const { board, source } = data;
  const finished = board.race.flagStatus === "checkered";

  return (
    <main
      className="
        relative z-10 mx-auto max-w-3xl space-y-4 lg:max-w-4xl
        p-3 pb-10 sm:p-5 lg:p-8
        md:pl-[124px] lg:pl-[168px] xl:pl-[196px] 2xl:pl-[228px]
      "
    >
      <RaceHeader race={board.race} source={source} connected={connected} />
      <Ticker board={board} />

      {finished && board.race.leader && (
        <div className="pit-panel relative overflow-hidden p-5 text-center">
          <div className="checkered absolute inset-x-0 top-0 h-2" />
          <div className="checkered absolute inset-x-0 bottom-0 h-2" />
          <div className="font-display text-xs font-black uppercase tracking-[0.3em] text-[var(--accent-amber)]">
            🏆 Checkered Flag
          </div>
          <div className="mt-1 font-display text-2xl font-black italic uppercase text-ink sm:text-3xl">
            {board.race.leader.name} wins the {board.race.raceName}
          </div>
          {board.draftLeague[0] && (
            <div className="mt-1 text-xs uppercase tracking-wider text-ink-dim">
              Draft champion ·{" "}
              <span className="font-bold text-ink">
                {board.draftLeague[0].team.name}
              </span>{" "}
              · {board.draftLeague[0].total} pts
            </div>
          )}
        </div>
      )}

      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label="Leaderboards"
        className="pit-panel flex p-1"
      >
        <button
          role="tab"
          aria-selected={tab === "family"}
          onClick={() => setTab("family")}
          className={`relative flex-1 py-2 font-display text-sm font-black uppercase tracking-[0.18em] transition-colors ${
            tab === "family"
              ? "bg-[var(--accent-red)] text-white"
              : "text-ink-dim hover:text-ink"
          }`}
          style={{
            clipPath:
              tab === "family"
                ? "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)"
                : undefined,
          }}
        >
          Family
        </button>
        <button
          role="tab"
          aria-selected={tab === "draft"}
          onClick={() => setTab("draft")}
          className={`relative flex-1 py-2 font-display text-sm font-black uppercase tracking-[0.18em] transition-colors ${
            tab === "draft"
              ? "bg-[var(--accent-cyan)] text-[#001a22]"
              : "text-ink-dim hover:text-ink"
          }`}
          style={{
            clipPath:
              tab === "draft"
                ? "polygon(10px 0, 100% 0, 100% 100%, 0 100%)"
                : undefined,
          }}
        >
          Draft
        </button>
      </div>

      {tab === "family" ? (
        <FamilyStandings rows={board.familyStandings} />
      ) : (
        <DraftLeague rows={board.draftLeague} />
      )}

      <footer className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-ink-mute">
        <span>IndyBoard</span>
        <div className="flex gap-4">
          <Link href="/tv" className="hover:text-ink">
            📺 TV Mode
          </Link>
          <Link href="/admin" className="hover:text-ink">
            ⚙ Race Control
          </Link>
        </div>
      </footer>
    </main>
  );
}
