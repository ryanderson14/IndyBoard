import type { DriverState, FlagStatus, RaceState } from "../types";
import { DRIVERS_BY_ID } from "../drivers";
import { memoize } from "../cache";
import type { RaceProvider } from "./provider";

// ESPN unofficial public API — live IndyCar (IRL) race data.
//
// No API key required. Auto-detects today's race; override with
// ESPN_EVENT_ID if you want to pin a specific event (e.g. for testing).
//
// Endpoints used:
//   /scoreboard?dates=YYYYMMDD            — live status + running order
//   /v2/.../events/{id}/competitions/{id}/competitors
//                                          — car numbers, teams, grid (static)
//   /v2/.../competitors/{aid}/statistics  — lapsLed, fastestLap, behindLaps
//
// What ESPN doesn't expose: explicit caution/red flag state. We map state
// "in" → green; race control can flip to yellow/red from /admin if needed.

const SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports/racing/irl";
const CORE_BASE = "https://sports.core.api.espn.com/v2/sports/racing/leagues/irl";

const EVENT_ID_OVERRIDE = process.env.ESPN_EVENT_ID;
const TTL_SCOREBOARD = 4_000;   // hot poll
const TTL_VEHICLES = 300_000;   // static for a whole race
const TTL_STATS = 12_000;       // per-driver fan-out
const TTL_EVENT_LOOKUP = 60 * 60 * 1000; // 1 hour

const ATHLETE_ID_TO_DRIVER: Record<string, string> = {};

/* Log only on cache miss / change so we don't spam once per client poll. */
function log(...parts: unknown[]) {
  console.log("[espn]", ...parts);
}
function warn(...parts: unknown[]) {
  console.warn("[espn]", ...parts);
}

let lastLoggedState: { lap: number; flag: string; leaderId: string } | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ResolvedEvent {
  id: string;
  name: string;
}

interface CompetitorBase {
  espnId: string;
  position: number;
  winner: boolean;
  athleteName: string;
}

interface CompetitorMeta {
  espnId: string;
  number: string;
  team: string;
  manufacturer: string;
  startOrder: number;
  athleteName: string;
}

interface CompetitorStats {
  espnId: string;
  lapsLed: number;
  lapsCompleted: number;
  behindLaps: number;
  behindTime: number;
  fastestLapTime: number;
}

function todayUtcStamp(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

async function fetchJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ESPN ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

/** Pick today's IRL event, else the next upcoming one. Cached for 1h. */
async function resolveEvent(): Promise<ResolvedEvent> {
  if (EVENT_ID_OVERRIDE) {
    log(`event override: ${EVENT_ID_OVERRIDE}`);
    return { id: EVENT_ID_OVERRIDE, name: "Indianapolis 500" };
  }
  return memoize("espn:event", TTL_EVENT_LOOKUP, async () => {
    const today = await fetchJson(`${SITE_BASE}/scoreboard?dates=${todayUtcStamp()}`);
    const todayEvent = today?.events?.[0];
    if (todayEvent) {
      log(`event resolved (today): ${todayEvent.id} "${todayEvent.name}"`);
      return { id: String(todayEvent.id), name: String(todayEvent.name ?? "Race") };
    }
    // Fall back to the next event on the calendar.
    const board = await fetchJson(`${SITE_BASE}/scoreboard`);
    const calendar: any[] = board?.leagues?.[0]?.calendar ?? [];
    const now = Date.now();
    const upcoming = calendar
      .map((c) => ({
        label: c?.label,
        start: c?.startDate ? Date.parse(c.startDate) : NaN,
        ref: String(c?.event?.$ref ?? ""),
      }))
      .filter((c) => Number.isFinite(c.start) && c.start >= now)
      .sort((a, b) => a.start - b.start)[0];
    if (!upcoming || !upcoming.ref) {
      throw new Error("ESPN: no upcoming IndyCar event found");
    }
    const id = upcoming.ref.split("/events/")[1]?.split("?")[0];
    if (!id) throw new Error("ESPN: could not parse event id");
    log(`event resolved (upcoming): ${id} "${upcoming.label}" @ ${new Date(upcoming.start).toISOString()}`);
    return { id, name: upcoming.label ?? "Race" };
  });
}

function mapFlagFromState(state: string | undefined): FlagStatus {
  if (state === "post") return "checkered";
  if (state === "in") return "green";
  return "pre";
}

async function fetchScoreboardEvent(eventId: string): Promise<{
  raceName: string;
  state: FlagStatus;
  lap: number;
  totalLaps: number;
  competitors: CompetitorBase[];
}> {
  return memoize(`espn:scoreboard:${eventId}`, TTL_SCOREBOARD, async () => {
    const board = await fetchJson(`${SITE_BASE}/scoreboard?dates=${todayUtcStamp()}`);
    let event = (board?.events ?? []).find((e: any) => String(e?.id) === eventId);
    if (!event) {
      // Race not on today's board — fall back to direct fetch.
      const direct = await fetchJson(`${SITE_BASE}/scoreboard`);
      event = (direct?.events ?? []).find((e: any) => String(e?.id) === eventId);
    }
    if (!event) throw new Error(`ESPN: event ${eventId} not in scoreboard`);

    const comp = event.competitions?.[0] ?? {};
    const stateRaw = comp?.status?.type?.state ?? event?.status?.type?.state;
    const lap = Number(comp?.status?.period ?? 0);
    const competitors: CompetitorBase[] = (comp.competitors ?? [])
      .map((c: any) => ({
        espnId: String(c?.id ?? ""),
        position: Number(c?.order ?? 0),
        winner: Boolean(c?.winner),
        athleteName: String(c?.athlete?.displayName ?? ""),
      }))
      .filter((c: CompetitorBase) => c.espnId && c.position > 0);

    const result = {
      raceName: String(event.name ?? "Race"),
      state: mapFlagFromState(stateRaw),
      lap,
      // ESPN doesn't surface scheduled total laps in scoreboard. Default to
      // 200 for the Indy 500; mock fallback covers other tracks adequately.
      totalLaps: guessTotalLaps(event.name, lap),
      competitors,
    };
    const leader = competitors.find((c) => c.position === 1);
    log(
      `scoreboard: state=${result.state} lap=${result.lap}/${result.totalLaps}`,
      `competitors=${competitors.length}`,
      `leader=${leader ? `"${leader.athleteName}" (espn:${leader.espnId})` : "none"}`,
    );
    return result;
  });
}

function guessTotalLaps(name: string | undefined, currentLap: number): number {
  if (!name) return Math.max(currentLap, 200);
  const lower = name.toLowerCase();
  if (lower.includes("indianapolis 500")) return 200;
  // Conservative fallback: prefer the lap counter never showing >100%.
  return Math.max(currentLap, 200);
}

async function fetchVehicles(eventId: string): Promise<CompetitorMeta[]> {
  return memoize(`espn:vehicles:${eventId}`, TTL_VEHICLES, async () => {
    const url = `${CORE_BASE}/events/${eventId}/competitions/${eventId}/competitors?limit=40`;
    const data = await fetchJson(url);
    const refs: string[] = (data?.items ?? [])
      .map((it: any) => String(it?.$ref ?? ""))
      .filter(Boolean);

    // The list endpoint embeds vehicle on each item already on most events,
    // but some only return $refs — handle both shapes.
    const items = data?.items ?? [];
    const embeddedHasVehicle = items.length > 0 && items[0]?.vehicle;

    let mapped: CompetitorMeta[];
    if (embeddedHasVehicle) {
      mapped = items
        .map((it: any) => mapCompetitorItem(it))
        .filter((m: CompetitorMeta | null): m is CompetitorMeta => !!m);
    } else {
      const fetched = await Promise.all(
        refs.map((ref) => fetchJson(ref).catch(() => null)),
      );
      mapped = fetched
        .filter((x): x is any => !!x)
        .map((it) => mapCompetitorItem(it))
        .filter((m): m is CompetitorMeta => !!m);
    }
    const sample = mapped[0];
    log(
      `vehicles: ${mapped.length} entries`,
      sample ? `(e.g. #${sample.number} ${sample.athleteName} · ${sample.team})` : "",
    );
    return mapped;
  });
}

function mapCompetitorItem(item: any): CompetitorMeta | null {
  const espnId = String(item?.id ?? item?.athlete?.id ?? "");
  if (!espnId) return null;
  return {
    espnId,
    number: String(item?.vehicle?.number ?? ""),
    team: String(item?.vehicle?.team ?? ""),
    manufacturer: String(item?.vehicle?.manufacturer ?? ""),
    startOrder: Number(item?.startOrder ?? 0),
    athleteName: String(item?.athlete?.displayName ?? item?.athlete?.fullName ?? ""),
  };
}

async function fetchStats(eventId: string, espnId: string): Promise<CompetitorStats> {
  const url = `${CORE_BASE}/events/${eventId}/competitions/${eventId}/competitors/${espnId}/statistics`;
  return memoize(`espn:stats:${eventId}:${espnId}`, TTL_STATS, async () => {
    try {
      const data = await fetchJson(url);
      const cats: any[] = data?.splits?.categories ?? [];
      const lookup: Record<string, number> = {};
      for (const cat of cats) {
        for (const s of cat?.stats ?? []) {
          if (s?.name && typeof s?.value === "number") {
            lookup[s.name] = s.value;
          }
        }
      }
      return {
        espnId,
        lapsLed: lookup.lapsLead ?? 0,
        lapsCompleted: lookup.lapsCompleted ?? 0,
        behindLaps: lookup.behindLaps ?? 0,
        behindTime: lookup.behindTime ?? 0,
        fastestLapTime: lookup.fastestLap ?? 0,
      };
    } catch (err) {
      // One driver's stats failing must not take the whole board down.
      warn(`stats fetch failed for athlete ${espnId}:`, err instanceof Error ? err.message : err);
      return { espnId, lapsLed: 0, lapsCompleted: 0, behindLaps: 0, behindTime: 0, fastestLapTime: 0 };
    }
  });
}

/** Map an ESPN competitor (by car number, then name, then athlete id) to our
 *  stable internal driver id, falling back to a synthetic id so unknown
 *  drivers still render on the board. */
function matchDriverId(
  base: CompetitorBase,
  meta: CompetitorMeta | undefined,
): { id: string; info?: (typeof DRIVERS_BY_ID)[string] } {
  // 1) Try ESPN athlete id -> internal mapping (if seeded in drivers.ts).
  const fromAthlete = ATHLETE_ID_TO_DRIVER[base.espnId];
  if (fromAthlete && DRIVERS_BY_ID[fromAthlete]) {
    return { id: fromAthlete, info: DRIVERS_BY_ID[fromAthlete] };
  }
  // 2) Try the car number.
  const num = meta?.number?.trim();
  if (num) {
    const byNum = Object.values(DRIVERS_BY_ID).find((d) => d.number === num);
    if (byNum) return { id: byNum.id, info: byNum };
  }
  // 3) Try the display name (case-insensitive).
  const name = (meta?.athleteName || base.athleteName || "").toLowerCase().trim();
  if (name) {
    const byName = Object.values(DRIVERS_BY_ID).find(
      (d) => d.name.toLowerCase() === name,
    );
    if (byName) return { id: byName.id, info: byName };
  }
  // 4) Synthetic fallback so the row still renders.
  return { id: `espn-${base.espnId}` };
}

function gapText(p: number, behindLaps: number, behindTime: number): string {
  if (p === 1) return "Leader";
  if (behindLaps > 0) return `${behindLaps} Lap${behindLaps === 1 ? "" : "s"}`;
  if (behindTime > 0) return `+${behindTime.toFixed(3)}`;
  return "—";
}

interface BuildArgs {
  raceName: string;
  flagStatus: FlagStatus;
  lap: number;
  totalLaps: number;
  competitors: CompetitorBase[];
  metaByEspnId: Map<string, CompetitorMeta>;
  statsByEspnId: Map<string, CompetitorStats>;
}

/** Pure mapper — exported for tests. */
export function buildRaceStateFromEspn(args: BuildArgs): RaceState {
  // Determine which driver holds the fastest lap (min non-zero time).
  let fastestEspnId: string | null = null;
  let fastestTime = Infinity;
  for (const s of args.statsByEspnId.values()) {
    if (s.fastestLapTime > 0 && s.fastestLapTime < fastestTime) {
      fastestTime = s.fastestLapTime;
      fastestEspnId = s.espnId;
    }
  }

  const drivers: DriverState[] = args.competitors.map((c) => {
    const meta = args.metaByEspnId.get(c.espnId);
    const stats = args.statsByEspnId.get(c.espnId);
    const matched = matchDriverId(c, meta);
    const info = matched.info;
    const number = meta?.number || info?.number || "?";
    const name = info?.name || c.athleteName || meta?.athleteName || "Unknown";
    const team = meta?.team || info?.team || "";
    const color = info?.color || "#888888";
    const grid = meta?.startOrder ?? 0;
    return {
      id: matched.id,
      number,
      name,
      team,
      color,
      position: c.position,
      gridPosition: grid,
      lapsLed: stats?.lapsLed ?? 0,
      fastestLap: c.espnId === fastestEspnId,
      status: "running",
      gapToLeader: gapText(c.position, stats?.behindLaps ?? 0, stats?.behindTime ?? 0),
    };
  });

  drivers.sort((a, b) => a.position - b.position);

  return {
    raceName: args.raceName,
    flagStatus: args.flagStatus,
    lap: args.lap,
    totalLaps: args.totalLaps,
    lastUpdated: new Date().toISOString(),
    drivers,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const espnProvider: RaceProvider = {
  name: "espn",
  async getRaceState(): Promise<RaceState> {
    const event = await resolveEvent();

    const [scoreboard, vehicles] = await Promise.all([
      fetchScoreboardEvent(event.id),
      fetchVehicles(event.id),
    ]);

    const metaByEspnId = new Map<string, CompetitorMeta>(
      vehicles.map((v) => [v.espnId, v]),
    );

    // Parallel fan-out for per-driver stats. Each call is independently
    // memoized so subsequent polls within TTL_STATS just hit cache.
    const statsList = await Promise.all(
      scoreboard.competitors.map((c) => fetchStats(event.id, c.espnId)),
    );
    const statsByEspnId = new Map<string, CompetitorStats>(
      statsList.map((s) => [s.espnId, s]),
    );

    const race = buildRaceStateFromEspn({
      raceName: scoreboard.raceName || event.name,
      flagStatus: scoreboard.state,
      lap: scoreboard.lap,
      totalLaps: scoreboard.totalLaps,
      competitors: scoreboard.competitors,
      metaByEspnId,
      statsByEspnId,
    });

    // Log a "what we actually returned" line, but only when the race
    // materially changes — keeps the log readable across many polls.
    const leader = race.drivers[0];
    const sig = {
      lap: race.lap,
      flag: race.flagStatus,
      leaderId: leader?.id ?? "",
    };
    if (
      !lastLoggedState ||
      lastLoggedState.lap !== sig.lap ||
      lastLoggedState.flag !== sig.flag ||
      lastLoggedState.leaderId !== sig.leaderId
    ) {
      const top3 = race.drivers
        .slice(0, 3)
        .map((d) => `#${d.number} ${d.name} (${d.gapToLeader})`)
        .join(" | ");
      const fl = race.drivers.find((d) => d.fastestLap);
      log(
        `state served: flag=${race.flagStatus} lap=${race.lap}/${race.totalLaps} ·`,
        `TOP3 → ${top3}`,
        fl ? `· FL #${fl.number} ${fl.name}` : "· FL —",
      );
      lastLoggedState = sig;
    }

    return race;
  },
};
