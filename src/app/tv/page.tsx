"use client";

import { useBoard } from "@/components/useBoard";
import { RaceHeader } from "@/components/RaceHeader";
import { Ticker } from "@/components/Ticker";
import { FamilyStandings } from "@/components/FamilyStandings";
import { DraftLeague } from "@/components/DraftLeague";

export default function TvMode() {
  const { data, connected } = useBoard();

  if (!data) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center text-ink-dim">
        <div className="flex flex-col items-center gap-4">
          <div className="checkered h-16 w-16 animate-spin rounded-sm border border-white/20" />
          <div className="font-display text-xl font-black uppercase tracking-[0.25em]">
            Loading the grid…
          </div>
        </div>
      </main>
    );
  }

  const { board, source } = data;

  return (
    <main className="relative z-10 mx-auto max-w-[1800px] space-y-5 p-5 lg:p-8">
      <RaceHeader race={board.race} source={source} connected={connected} />
      <Ticker board={board} />

      {/* TV layout: two equal columns; on smaller TVs/laptops stack vertically. */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <FamilyStandings rows={board.familyStandings} />
        <DraftLeague rows={board.draftLeague} />
      </div>
    </main>
  );
}
