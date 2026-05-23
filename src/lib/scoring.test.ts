import { describe, it, expect } from "vitest";
import { basePoints, scoreDriver } from "./scoring";
import type { DriverState, RaceState } from "./types";
import type { ScoringConfig } from "@/config/league";

const scoring: ScoringConfig = {
  fieldSize: 33,
  bonuses: { winner: 10, fastestLap: 5, mostLapsLed: 5 },
};

function driver(over: Partial<DriverState>): DriverState {
  return {
    id: "car-1", number: "1", name: "Test", team: "T", color: "#fff",
    position: 1, gridPosition: 1, lapsLed: 0, fastestLap: false,
    status: "running", gapToLeader: "Leader", ...over,
  };
}

function race(drivers: DriverState[], over: Partial<RaceState> = {}): RaceState {
  return {
    raceName: "Test 500", flagStatus: "green", lap: 100, totalLaps: 200,
    lastUpdated: "now", drivers, ...over,
  };
}

describe("basePoints", () => {
  it("rewards P1 with the full field and last place with 1", () => {
    expect(basePoints(1, 33)).toBe(33);
    expect(basePoints(33, 33)).toBe(1);
  });
  it("never goes negative", () => {
    expect(basePoints(999, 33)).toBe(0);
  });
});

describe("scoreDriver", () => {
  it("adds the fastest-lap bonus", () => {
    const d = driver({ position: 5, fastestLap: true });
    const r = race([d]);
    const s = scoreDriver(d, r, scoring);
    expect(s.basePoints).toBe(29);
    expect(s.bonusPoints).toBe(5);
    expect(s.points).toBe(34);
    expect(s.bonuses).toContain("Fastest Lap");
  });

  it("awards most-laps-led only to the leader of laps led", () => {
    const a = driver({ id: "a", position: 2, lapsLed: 120 });
    const b = driver({ id: "b", position: 1, lapsLed: 80 });
    const r = race([a, b]);
    expect(scoreDriver(a, r, scoring).bonuses).toContain("Most Laps Led");
    expect(scoreDriver(b, r, scoring).bonuses).not.toContain("Most Laps Led");
  });

  it("only awards the winner bonus once the checkered flag is out", () => {
    const d = driver({ position: 1 });
    expect(scoreDriver(d, race([d]), scoring).bonuses).not.toContain("Race Winner");
    expect(
      scoreDriver(d, race([d], { flagStatus: "checkered" }), scoring).bonuses,
    ).toContain("Race Winner");
  });
});
