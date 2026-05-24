import type { Board } from "@/lib/board";

interface TickerItem {
  label: string;
  text: string;
  /* Color of the tag chip */
  tagBg: string;
  tagInk: string;
}

export function Ticker({ board }: { board: Board }) {
  const { race } = board;
  const items: TickerItem[] = [];

  if (race.leader) {
    items.push({
      label: "LEADER",
      text: `${race.leader.name} #${race.leader.number}`,
      tagBg: "var(--accent-amber)",
      tagInk: "#1a1300",
    });
  }

  const fl =
    board.familyStandings.find((r) => r.driver.fastestLap)?.driver ??
    board.draftLeague.flatMap((t) => t.drivers).find((d) => d.driver.fastestLap)?.driver;
  if (fl) {
    items.push({
      label: "⚡ FAST LAP",
      text: `${fl.name} #${fl.number}`,
      tagBg: "var(--accent-magenta)",
      tagInk: "#1a001a",
    });
  }

  if (race.flagStatus === "yellow") {
    items.push({ label: "CAUTION", text: "YELLOW FLAG OUT", tagBg: "var(--accent-amber)", tagInk: "#1a1300" });
  }
  if (race.flagStatus === "red") {
    items.push({ label: "RED FLAG", text: "RACE STOPPED", tagBg: "var(--accent-red)", tagInk: "#fff" });
  }
  if (race.flagStatus === "checkered") {
    items.push({ label: "CHECKERED", text: "RACE OVER", tagBg: "#fff", tagInk: "#000" });
  }

  const toGo = race.totalLaps - race.lap;
  if (race.flagStatus !== "checkered" && race.flagStatus !== "pre" && toGo > 0) {
    items.push({
      label: "TO GO",
      text: `${toGo} LAPS`,
      tagBg: "#1a1d27",
      tagInk: "#eef0f6",
    });
  }

  const draftLeader = board.draftLeague[0];
  if (draftLeader) {
    items.push({
      label: "DRAFT LEAD",
      text: `${draftLeader.team.name} · ${draftLeader.total} PTS`,
      tagBg: "var(--accent-cyan)",
      tagInk: "#001a22",
    });
  }

  if (!items.length) {
    items.push({
      label: "GRID",
      text: "WAITING FOR GREEN FLAG",
      tagBg: "#1a1d27",
      tagInk: "#9a9eaf",
    });
  }

  const Row = (
    <span className="inline-flex items-center" aria-hidden={false}>
      {items.map((it, i) => (
        <span key={`${i}-${it.label}`} className="inline-flex items-center pr-6">
          <span
            className="mr-2 inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ background: it.tagBg, color: it.tagInk }}
          >
            {it.label}
          </span>
          <span className="text-[12px] font-bold uppercase tracking-wider text-ink">
            {it.text}
          </span>
          <span className="ml-6 inline-block h-1 w-1 rounded-full bg-ink-mute" />
        </span>
      ))}
    </span>
  );

  return (
    <div className="pit-panel flex h-9 items-stretch overflow-hidden p-0">
      {/* Sticky LIVE chip */}
      <div className="flex shrink-0 items-center gap-1.5 bg-[var(--accent-red)] px-3 text-[10px] font-black uppercase tracking-[0.22em] text-white">
        <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
        LIVE
      </div>
      <div className="relative flex flex-1 items-center overflow-hidden bg-black/45">
        <div className="marquee">
          <span className="pl-6">{Row}</span>
          <span className="pl-6">{Row}</span>
        </div>
        {/* Edge fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/80 to-transparent" />
      </div>
    </div>
  );
}
