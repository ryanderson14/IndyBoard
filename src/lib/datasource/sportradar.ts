import type { DriverState, FlagStatus, RaceState } from "../types";
import { DRIVERS_BY_ID } from "../drivers";
import { memoize } from "../cache";
import type { RaceProvider } from "./provider";

// Sportradar IndyCar live source.
//
// SETUP: get an IndyCar key at developer.sportradar.com and set env vars:
//   SPORTRADAR_API_KEY   (required)
//   SPORTRADAR_EVENT_ID  (the sport_event id for the 2026 Indy 500)
//   SPORTRADAR_API_BASE  (optional, default trial v2 base below)
//
// VERIFY ON RACE DAY: the exact endpoint path and the response field names
// below are written defensively against Sportradar's racing "summary" shape,
// but confirm them against a real response and adjust `mapSummary` if needed.
// If the live feed is missing or coarse, flip to the manual source from /admin.

const API_KEY = process.env.SPORTRADAR_API_KEY;
const EVENT_ID = process.env.SPORTRADAR_EVENT_ID;
const API_BASE =
  process.env.SPORTRADAR_API_BASE ?? "https://api.sportradar.com/indycar/trial/v2/en";
const TTL_MS = 4000;

function summaryUrl(): string {
  return `${API_BASE}/sport_events/${EVENT_ID}/summary.json?api_key=${API_KEY}`;
}

function mapFlag(raw: unknown): FlagStatus {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("checker") || s.includes("finished") || s.includes("closed")) return "checkered";
  if (s.includes("red")) return "red";
  if (s.includes("yellow") || s.includes("caution")) return "yellow";
  if (s.includes("green") || s.includes("live") || s.includes("inprogress")) return "green";
  return "pre";
}

function mapStatus(raw: unknown): DriverState["status"] {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("out") || s.includes("retired") || s.includes("dnf")) return "out";
  if (s.includes("pit")) return "pit";
  return "running";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapSummary(data: any): RaceState {
  const event = data?.sport_event ?? {};
  const status = data?.sport_event_status ?? {};
  const competitors: any[] = status?.competitors ?? data?.competitors ?? [];

  const drivers: DriverState[] = competitors.map((c, i) => {
    const id = matchDriverId(c);
    const info = id ? DRIVERS_BY_ID[id] : undefined;
    return {
      id: id ?? `sr-${c?.id ?? i}`,
      number: String(c?.car_number ?? c?.number ?? info?.number ?? "?"),
      name: c?.name ?? info?.name ?? "Unknown",
      team: c?.team?.name ?? info?.team ?? "",
      color: info?.color ?? "#888888",
      position: Number(c?.position ?? c?.order ?? i + 1),
      gridPosition: Number(c?.grid ?? c?.start_position ?? 0),
      lapsLed: Number(c?.laps_led ?? 0),
      fastestLap: Boolean(c?.fastest_lap ?? false),
      status: mapStatus(c?.status ?? c?.result_status),
      gapToLeader: c?.gap ?? c?.time_diff ?? (Number(c?.position) === 1 ? "Leader" : "—"),
    };
  });

  drivers.sort((a, b) => a.position - b.position);

  return {
    raceName: event?.description ?? event?.name ?? "Indianapolis 500",
    flagStatus: mapFlag(status?.status ?? status?.race_status ?? status?.flag),
    lap: Number(status?.laps_completed ?? status?.lap ?? 0),
    totalLaps: Number(status?.scheduled_laps ?? status?.laps ?? 200),
    lastUpdated: new Date().toISOString(),
    drivers,
  };
}

// Match a Sportradar competitor to our stable driver id, preferring car number.
function matchDriverId(c: any): string | null {
  const num = String(c?.car_number ?? c?.number ?? "").trim();
  if (num) {
    const byNum = Object.values(DRIVERS_BY_ID).find((d) => d.number === num);
    if (byNum) return byNum.id;
  }
  const name = String(c?.name ?? "").toLowerCase();
  if (name) {
    const byName = Object.values(DRIVERS_BY_ID).find(
      (d) => d.name.toLowerCase() === name,
    );
    if (byName) return byName.id;
  }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const sportradarProvider: RaceProvider = {
  name: "sportradar",
  async getRaceState(): Promise<RaceState> {
    if (!API_KEY || !EVENT_ID) {
      throw new Error("Sportradar not configured: set SPORTRADAR_API_KEY and SPORTRADAR_EVENT_ID");
    }
    return memoize("sportradar:summary", TTL_MS, async () => {
      const res = await fetch(summaryUrl(), { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Sportradar request failed: ${res.status}`);
      }
      return mapSummary(await res.json());
    });
  },
};
