import { describe, it, expect } from "vitest";
import { buildBoard } from "./board";
import type { DriverState, RaceState } from "./types";
import type { LeagueConfig } from "@/config/league";

function driver(id: string, position: number, over: Partial<DriverState> = {}): DriverState {
  return {
    id, number: id.replace("car-", ""), name: id, team: "T", color: "#fff",
    position, gridPosition: position, lapsLed: 0, fastestLap: false,
    status: "running", gapToLeader: "—", ...over,
  };
}

const league: LeagueConfig = {
  raceTitle: "Test",
  players: [
    { id: "p1", name: "Alice", driverId: "car-9" },
    { id: "p2", name: "Bob", driverId: "car-2" },
  ],
  teams: [
    { id: "t1", name: "Team One", driverIds: ["car-9", "car-2"] },
    { id: "t2", name: "Team Two", driverIds: ["car-3"] },
  ],
  scoring: { fieldSize: 33, bonuses: { winner: 10, fastestLap: 5, mostLapsLed: 5 } },
};

const race: RaceState = {
  raceName: "Test 500", flagStatus: "green", lap: 50, totalLaps: 200, lastUpdated: "now",
  drivers: [driver("car-2", 1), driver("car-3", 2), driver("car-9", 3)],
};

describe("buildBoard", () => {
  it("ranks family players by their driver's position and only shows picked drivers", () => {
    const board = buildBoard(race, league);
    expect(board.familyStandings).toHaveLength(2);
    expect(board.familyStandings[0].player.name).toBe("Bob"); // car-2 is P1
    expect(board.familyStandings[0].rank).toBe(1);
    expect(board.familyStandings[1].player.name).toBe("Alice"); // car-9 is P3
  });

  it("computes position delta vs the grid", () => {
    const moved: RaceState = {
      ...race,
      drivers: [driver("car-9", 1, { gridPosition: 5 }), driver("car-2", 2, { gridPosition: 1 })],
    };
    const board = buildBoard(moved, league);
    const alice = board.familyStandings.find((r) => r.player.name === "Alice")!;
    expect(alice.positionDelta).toBe(4); // gained 4 spots
  });

  it("totals draft teams by placement and ranks them", () => {
    const board = buildBoard(race, league);
    // Team One: car-2 (P1=33) + car-9 (P3=31) = 64; Team Two: car-3 (P2=32) = 32
    const t1 = board.draftLeague.find((r) => r.team.name === "Team One")!;
    expect(t1.total).toBe(64);
    expect(board.draftLeague[0].team.name).toBe("Team One");
    expect(board.draftLeague[0].rank).toBe(1);
  });
});
