import type { Board } from "@/lib/board";

export function Ticker({ board }: { board: Board }) {
  const { race } = board;
  const items: string[] = [];

  if (race.leader) items.push(`🏁 LEADING: ${race.leader.name} (#${race.leader.number})`);

  const fl = board.familyStandings.find((r) => r.driver.fastestLap)?.driver
    ?? board.draftLeague.flatMap((t) => t.drivers).find((d) => d.driver.fastestLap)?.driver;
  if (fl) items.push(`⚡ FASTEST LAP: ${fl.name}`);

  if (race.flagStatus === "yellow") items.push("🟡 CAUTION IS OUT");
  if (race.flagStatus === "red") items.push("🔴 RED FLAG — RACE STOPPED");
  if (race.flagStatus === "checkered") items.push("🏆 CHECKERED FLAG — RACE OVER");

  const toGo = race.totalLaps - race.lap;
  if (race.flagStatus !== "checkered" && race.flagStatus !== "pre" && toGo > 0) {
    items.push(`${toGo} LAPS TO GO`);
  }

  const leader = board.draftLeague[0];
  if (leader) items.push(`👑 DRAFT LEADER: ${leader.team.name} (${leader.total} pts)`);

  if (!items.length) items.push("Waiting for the green flag…");

  const text = items.join("   •   ");

  return (
    <div className="overflow-hidden rounded-full border border-white/10 bg-black/40 py-1.5">
      <div className="marquee text-xs font-semibold tracking-wide text-white/70">
        <span className="px-4">{text}</span>
        <span className="px-4" aria-hidden>{text}</span>
      </div>
    </div>
  );
}
