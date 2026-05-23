import type { DriverState, RaceState } from "./types";
import { DRIVERS_BY_ID } from "./drivers";
import { scoreDriver, type DriverScore } from "./scoring";
import { LEAGUE, type LeagueConfig } from "@/config/league";

export interface FamilyRow {
  rank: number;
  player: { id: string; name: string; avatar?: string };
  driver: DriverState;
  /** Spots gained vs the starting grid (positive = moved up). */
  positionDelta: number;
}

export interface DraftDriverLine extends DriverScore {
  driver: DriverState;
}

export interface DraftRow {
  rank: number;
  team: { id: string; name: string; avatar?: string };
  drivers: DraftDriverLine[];
  total: number;
}

export interface RaceSummary {
  raceName: string;
  flagStatus: RaceState["flagStatus"];
  lap: number;
  totalLaps: number;
  lastUpdated: string;
  leader: DriverState | null;
}

export interface Board {
  race: RaceSummary;
  familyStandings: FamilyRow[];
  draftLeague: DraftRow[];
}

function indexByDriverId(race: RaceState): Map<string, DriverState> {
  return new Map(race.drivers.map((d) => [d.id, d]));
}

/** Build both leaderboards from live race state + the league config. */
export function buildBoard(race: RaceState, league: LeagueConfig = LEAGUE): Board {
  const byId = indexByDriverId(race);

  // Family Standings: one driver per player, ranked by the driver's position.
  // Players whose driver isn't in the feed fall to the back.
  const familyRows = league.players
    .map((player) => {
      const info = DRIVERS_BY_ID[player.driverId];
      const driver: DriverState =
        byId.get(player.driverId) ?? placeholderDriver(player.driverId, info?.name);
      return {
        player: { id: player.id, name: player.name, avatar: player.avatar },
        driver,
        positionDelta: driver.gridPosition
          ? driver.gridPosition - driver.position
          : 0,
      };
    })
    .sort((a, b) => a.driver.position - b.driver.position);

  const familyStandings: FamilyRow[] = familyRows.map((r, i) => ({ ...r, rank: i + 1 }));

  // Draft League: each manager's drafted drivers scored by placement + bonuses.
  const draftRows = league.teams.map((team) => {
    const drivers: DraftDriverLine[] = team.driverIds.map((driverId) => {
      const info = DRIVERS_BY_ID[driverId];
      const driver = byId.get(driverId) ?? placeholderDriver(driverId, info?.name);
      return { driver, ...scoreDriver(driver, race, league.scoring) };
    });
    drivers.sort((a, b) => b.points - a.points);
    const total = drivers.reduce((sum, d) => sum + d.points, 0);
    return {
      team: { id: team.id, name: team.name, avatar: team.avatar },
      drivers,
      total,
    };
  });

  draftRows.sort((a, b) => b.total - a.total);
  const draftLeague: DraftRow[] = draftRows.map((r, i) => ({ ...r, rank: i + 1 }));

  const leader = race.drivers.find((d) => d.position === 1) ?? null;

  return {
    race: {
      raceName: race.raceName,
      flagStatus: race.flagStatus,
      lap: race.lap,
      totalLaps: race.totalLaps,
      lastUpdated: race.lastUpdated,
      leader,
    },
    familyStandings,
    draftLeague,
  };
}

// A driver referenced by config but missing from the feed (e.g. typo or not in
// the field). Parked at the back so the board still renders.
function placeholderDriver(driverId: string, name?: string): DriverState {
  const info = DRIVERS_BY_ID[driverId];
  return {
    id: driverId,
    number: info?.number ?? "?",
    name: name ?? info?.name ?? driverId,
    team: info?.team ?? "Unknown",
    color: info?.color ?? "#888888",
    position: 999,
    gridPosition: 0,
    lapsLed: 0,
    fastestLap: false,
    status: "out",
    gapToLeader: "—",
  };
}
