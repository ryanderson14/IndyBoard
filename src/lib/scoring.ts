import type { DriverState, RaceState } from "./types";
import type { ScoringConfig } from "@/config/league";

// Pure scoring helpers — unit-tested independently of any data source.

/** Base points for a running position: P1 = fieldSize, last = 1. */
export function basePoints(position: number, fieldSize: number): number {
  return Math.max(0, fieldSize + 1 - position);
}

export interface DriverScore {
  basePoints: number;
  bonusPoints: number;
  bonuses: string[];
  points: number;
}

/**
 * Score a single driver given the whole race state, so we can award
 * field-wide bonuses (fastest lap, most laps led, winner).
 */
export function scoreDriver(
  driver: DriverState,
  race: RaceState,
  scoring: ScoringConfig,
): DriverScore {
  const base = basePoints(driver.position, scoring.fieldSize);
  const bonuses: string[] = [];
  let bonusPoints = 0;

  if (driver.fastestLap && scoring.bonuses.fastestLap) {
    bonuses.push("Fastest Lap");
    bonusPoints += scoring.bonuses.fastestLap;
  }

  const mostLapsLed = Math.max(0, ...race.drivers.map((d) => d.lapsLed));
  if (mostLapsLed > 0 && driver.lapsLed === mostLapsLed && scoring.bonuses.mostLapsLed) {
    bonuses.push("Most Laps Led");
    bonusPoints += scoring.bonuses.mostLapsLed;
  }

  // Winner bonus is only real once the race is over.
  if (race.flagStatus === "checkered" && driver.position === 1 && scoring.bonuses.winner) {
    bonuses.push("Race Winner");
    bonusPoints += scoring.bonuses.winner;
  }

  return { basePoints: base, bonusPoints, bonuses, points: base + bonusPoints };
}
