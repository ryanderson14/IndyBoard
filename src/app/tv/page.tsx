"use client";

import { useBoard } from "@/components/useBoard";
import { RaceHeader } from "@/components/RaceHeader";
import { Ticker } from "@/components/Ticker";
import { TrackView } from "@/components/TrackView";
import { FamilyStandings } from "@/components/FamilyStandings";
import { DraftLeague } from "@/components/DraftLeague";

export default function TvMode() {
  const { data, connected } = useBoard();

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center text-2xl text-white/50">
        <div className="checkered mr-3 h-10 w-10 animate-spin rounded-md" />
        Loading the grid…
      </main>
    );
  }

  const { board, source } = data;

  return (
    <main className="mx-auto max-w-[1600px] space-y-4 p-5 text-base lg:text-lg">
      <RaceHeader race={board.race} source={source} connected={connected} />
      <Ticker board={board} />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
        <div className="lg:order-2">
          <TrackView board={board} />
        </div>
        <section className="lg:order-1">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-white/60">
            Family Standings
          </h2>
          <FamilyStandings rows={board.familyStandings} />
        </section>
        <section className="lg:order-3">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-white/60">
            Draft League
          </h2>
          <DraftLeague rows={board.draftLeague} />
        </section>
      </div>
    </main>
  );
}
