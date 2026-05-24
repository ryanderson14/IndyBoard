import { describe, it, expect } from "vitest";
import { buildRaceStateFromEspn } from "./espn";

/* Tiny in-memory fixtures shaped like the ESPN responses we tested against,
 * exercised through the pure mapper so we can verify scoring-critical fields
 * (lapsLed, fastestLap, gridPosition, gapToLeader) without hitting the network. */

const baseArgs = {
  raceName: "Indianapolis 500",
  flagStatus: "green" as const,
  lap: 142,
  totalLaps: 200,
  competitors: [
    { espnId: "5632", position: 1, winner: false, athleteName: "Álex Palou" },
    { espnId: "5706", position: 2, winner: false, athleteName: "David Malukas" },
    { espnId: "9999", position: 3, winner: false, athleteName: "Unknown Driver" },
  ],
  metaByEspnId: new Map([
    ["5632", { espnId: "5632", number: "10", team: "Chip Ganassi Racing", manufacturer: "Honda", startOrder: 6, athleteName: "Álex Palou" }],
    ["5706", { espnId: "5706", number: "4",  team: "A.J. Foyt Racing",   manufacturer: "Chevrolet", startOrder: 5, athleteName: "David Malukas" }],
  ]),
  statsByEspnId: new Map([
    ["5632", { espnId: "5632", lapsLed: 88, lapsCompleted: 142, behindLaps: 0, behindTime: 0, fastestLapTime: 40.123 }],
    ["5706", { espnId: "5706", lapsLed: 12, lapsCompleted: 142, behindLaps: 0, behindTime: 2.412, fastestLapTime: 40.456 }],
    ["9999", { espnId: "9999", lapsLed: 0, lapsCompleted: 141, behindLaps: 1, behindTime: 0, fastestLapTime: 0 }],
  ]),
};

describe("buildRaceStateFromEspn", () => {
  it("matches drivers by car number and preserves running order", () => {
    const r = buildRaceStateFromEspn(baseArgs);
    expect(r.drivers).toHaveLength(3);
    expect(r.drivers[0].id).toBe("car-10");
    expect(r.drivers[0].name).toBe("Alex Palou");
    expect(r.drivers[0].number).toBe("10");
    expect(r.drivers[0].team).toBe("Chip Ganassi Racing");
    expect(r.drivers[0].gridPosition).toBe(6);
    expect(r.drivers[0].position).toBe(1);
  });

  it("marks the lowest non-zero fastest-lap time as fastest", () => {
    const r = buildRaceStateFromEspn(baseArgs);
    expect(r.drivers.find((d) => d.id === "car-10")?.fastestLap).toBe(true);
    expect(r.drivers.find((d) => d.id === "car-4")?.fastestLap).toBe(false);
  });

  it("computes gap-to-leader from behindTime or behindLaps", () => {
    const r = buildRaceStateFromEspn(baseArgs);
    expect(r.drivers.find((d) => d.position === 1)?.gapToLeader).toBe("Leader");
    expect(r.drivers.find((d) => d.position === 2)?.gapToLeader).toBe("+2.412");
    expect(r.drivers.find((d) => d.position === 3)?.gapToLeader).toBe("1 Lap");
  });

  it("falls back to a synthetic id when nothing matches", () => {
    const r = buildRaceStateFromEspn(baseArgs);
    const ghost = r.drivers.find((d) => d.position === 3);
    expect(ghost?.id).toBe("espn-9999");
    expect(ghost?.name).toBe("Unknown Driver");
  });

  it("carries through race metadata", () => {
    const r = buildRaceStateFromEspn(baseArgs);
    expect(r.raceName).toBe("Indianapolis 500");
    expect(r.flagStatus).toBe("green");
    expect(r.lap).toBe(142);
    expect(r.totalLaps).toBe(200);
  });

  it("survives drivers with no stats (zeroes everywhere)", () => {
    const r = buildRaceStateFromEspn({
      ...baseArgs,
      statsByEspnId: new Map(),
    });
    expect(r.drivers.every((d) => d.lapsLed === 0)).toBe(true);
    expect(r.drivers.every((d) => d.fastestLap === false)).toBe(true);
  });
});
