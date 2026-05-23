"use client";

import { useState } from "react";
import Link from "next/link";
import { useBoard } from "@/components/useBoard";
import { RaceHeader } from "@/components/RaceHeader";
import { Ticker } from "@/components/Ticker";
import { TrackView } from "@/components/TrackView";
import { FamilyStandings } from "@/components/FamilyStandings";
import { DraftLeague } from "@/components/DraftLeague";

type Tab = "family" | "draft";

export default function Dashboard() {
  const { data, connected } = useBoard();
  const [tab, setTab] = useState<Tab>("family");

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-white/50">
        <div className="text-center">
          <div className="checkered mx-auto mb-3 h-10 w-10 animate-spin rounded-md" />
          Loading the grid…
        </div>
      </main>
    );
  }

  const { board, source } = data;
  const finished = board.race.flagStatus === "checkered";

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-3 sm:p-6">
      <RaceHeader race={board.race} source={source} connected={connected} />
      <Ticker board={board} />

      {finished && board.race.leader && (
        <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-4 text-center">
          <div className="text-2xl">🏆</div>
          <div className="font-black">
            {board.race.leader.name} wins the {board.race.raceName}!
          </div>
          <div className="text-sm text-white/60">
            Draft champion: {board.draftLeague[0]?.team.name} · {board.draftLeague[0]?.total} pts
          </div>
        </div>
      )}

      <TrackView board={board} />

      <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-sm font-bold">
        <button
          onClick={() => setTab("family")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            tab === "family" ? "bg-white text-black" : "text-white/60"
          }`}
        >
          Family Standings
        </button>
        <button
          onClick={() => setTab("draft")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            tab === "draft" ? "bg-white text-black" : "text-white/60"
          }`}
        >
          Draft League
        </button>
      </div>

      {tab === "family" ? (
        <FamilyStandings rows={board.familyStandings} />
      ) : (
        <DraftLeague rows={board.draftLeague} />
      )}

      <footer className="flex justify-center gap-4 pt-2 text-xs text-white/40">
        <Link href="/tv" className="hover:text-white">
          📺 TV mode
        </Link>
        <Link href="/admin" className="hover:text-white">
          ⚙️ Admin
        </Link>
      </footer>
    </main>
  );
}
