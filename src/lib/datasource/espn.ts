import type { DriverState, FlagStatus, RaceState } from "../types";
import { DRIVERS_BY_ID } from "../drivers";
import { memoize } from "../cache";
import type { RaceProvider } from "./provider";

// ESPN unofficial IndyCar API — free, no key needed, server-side only (CORS).
//
// Auto-discovers the current/next IndyCar event from the scoreboard, then
// fetches its live competitor standings every few seconds (cached to avoid
// hammering the endpoint across concurrent family viewers).
//
// Optional: set ESPN_EVENT_ID to pin a specific event and skip auto-discovery.
// Find the right id by fetching:
//   https://site.api.espn.com/apis/site/v2/sports/racing/irl/scoreboard
// and looking at the event "id" field for the Indy 500.

const SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/racing/irl/scoreboard";
const TTL_MS = 5000;

function summaryUrl(eventId: string) {
  return `https://site.api.espn.com/apis/site/v2/sports/racing/irl/summary?event=${eventId}`;
}

async function discoverEventId(): Promise<string | null> {
  return memoize("espn:eventId", 60_000, async () => {
    const res = await fetch(SCOREBOARD, { cache: "no-store" });
    if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}`);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const data = (await res.json()) as any;
    const events: any[] = data?.events ?? [];

    // Prefer a live event, then the soonest upcoming one.
    const live = events.find((e) => e?.competitions?.[0]?.status?.type?.state === "in");
    if (live) return live.id as string;

    const upcoming = events.find((e) => e?.competitions?.[0]?.status?.type?.state === "pre");
    if (upcoming) return upcoming.id as string;

    // Fall back to the most recent completed event so the board at least shows
    // final results after the race ends.
    return (events[0]?.id as string) ?? null;
  });
}

function mapFlag(state: string, detail: string): FlagStatus {
  const s = (state + detail).toLowerCase();
  if (s.includes("final") || s.includes("post") || s.includes("complete")) return "checkered";
  if (s.includes("red")) return "red";
  if (s.includes("yellow") || s.includes("caution")) return "yellow";
  if (s.includes("in") || s.includes("live") || s.includes("progress")) return "green";
  return "pre";
}

function mapStatus(raw: string): DriverState["status"] {
  const s = raw.toLowerCase();
  if (s.includes("out") || s.includes("retire") || s.includes("dnf")) return "out";
  if (s.includes("pit")) return "pit";
  return "running";
}

function stat(stats: any[], name: string): string {
  return stats?.find((s) => s?.name === name || s?.abbreviation === name)?.displayValue ?? "";
}

function matchDriver(competitor: any): string | null {
  const displayName: string = competitor?.athlete?.displayName ?? "";
  const shortName: string = competitor?.athlete?.shortName ?? "";
  const num: string = String(competitor?.athlete?.jersey ?? competitor?.vehicle?.number ?? "");

  if (num) {
    const byNum = Object.values(DRIVERS_BY_ID).find((d) => d.number === num);
    if (byNum) return byNum.id;
  }
  const lower = displayName.toLowerCase();
  const byName = Object.values(DRIVERS_BY_ID).find(
    (d) => d.name.toLowerCase() === lower || displayName.toLowerCase().includes(d.name.split(" ").pop()!.toLowerCase()),
  );
  if (byName) return byName.id;

  const shortLower = shortName.toLowerCase();
  const byShort = Object.values(DRIVERS_BY_ID).find((d) =>
    d.name.toLowerCase().includes(shortLower.split(".").pop()?.trim() ?? ""),
  );
  return byShort?.id ?? null;
}

async function fetchRaceState(eventId: string): Promise<RaceState> {
  const res = await fetch(summaryUrl(eventId), { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN summary ${res.status}`);
  const data = (await res.json()) as any;

  const competition = data?.header?.competitions?.[0] ?? data?.competitions?.[0] ?? {};
  const statusType = competition?.status?.type ?? {};
  const state: string = statusType?.state ?? "";
  const detail: string = statusType?.detail ?? statusType?.description ?? "";
  const flag = mapFlag(state, detail);

  // Lap data can live in a few different places depending on the ESPN schema version.
  const lapsCompleted = Number(
    competition?.status?.period ??
    data?.header?.competitions?.[0]?.status?.displayClock ??
    0,
  );
  const totalLaps = 200; // Indy 500 is always 200 laps

  const competitors: any[] = competition?.competitors ?? data?.competitors ?? [];

  const drivers: DriverState[] = competitors.map((c, i) => {
    const id = matchDriver(c);
    const info = id ? DRIVERS_BY_ID[id] : undefined;
    const stats: any[] = c?.statistics ?? [];
    const position = Number(c?.order ?? c?.placement ?? i + 1);
    const lapsLed = Number(stat(stats, "lapsLed") || stat(stats, "LAPSL") || 0);
    const gapRaw = stat(stats, "behind") || stat(stats, "gap") || stat(stats, "difference");

    return {
      id: id ?? `espn-${c?.id ?? i}`,
      number: String(c?.athlete?.jersey ?? c?.vehicle?.number ?? info?.number ?? "?"),
      name: c?.athlete?.displayName ?? info?.name ?? "Unknown",
      team: c?.team?.displayName ?? c?.athlete?.team?.displayName ?? info?.team ?? "",
      color: info?.color ?? "#888888",
      position,
      gridPosition: Number(stat(stats, "startPosition") || stat(stats, "gridPosition") || position),
      lapsLed,
      fastestLap: false, // ESPN doesn't expose fastest lap per competitor reliably
      status: mapStatus(c?.status ?? ""),
      gapToLeader: position === 1 ? "Leader" : gapRaw || "—",
    };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  drivers.sort((a, b) => a.position - b.position);

  return {
    raceName: data?.header?.name ?? data?.header?.shortName ?? "Indianapolis 500",
    flagStatus: flag,
    lap: lapsCompleted,
    totalLaps,
    lastUpdated: new Date().toISOString(),
    drivers,
  };
}

export const espnProvider: RaceProvider = {
  name: "espn",
  async getRaceState(): Promise<RaceState> {
    const eventId = process.env.ESPN_EVENT_ID ?? (await discoverEventId());
    if (!eventId) throw new Error("ESPN: no IndyCar event found on the scoreboard");
    return memoize(`espn:race:${eventId}`, TTL_MS, () => fetchRaceState(eventId));
  },
};
