import type { RaceState } from "../types";
import { DRIVERS } from "../drivers";
import { kvGet } from "../store";
import type { RaceProvider } from "./provider";

export const MANUAL_RACE_KEY = "manual:race";

/** A blank manual race: full field in grid order, not yet started. */
export function blankManualRace(): RaceState {
  return {
    raceName: "Indianapolis 500",
    flagStatus: "pre",
    lap: 0,
    totalLaps: 200,
    lastUpdated: new Date().toISOString(),
    drivers: DRIVERS.map((info, i) => ({
      id: info.id,
      number: info.number,
      name: info.name,
      team: info.team,
      color: info.color,
      position: i + 1,
      gridPosition: i + 1,
      lapsLed: 0,
      fastestLap: false,
      status: "running",
      gapToLeader: i === 0 ? "Leader" : "—",
    })),
  };
}

export const manualProvider: RaceProvider = {
  name: "manual",
  async getRaceState(): Promise<RaceState> {
    const stored = await kvGet<RaceState>(MANUAL_RACE_KEY);
    return stored ?? blankManualRace();
  },
};
