// Normalized race state — the UI and scoring never depend on a vendor's shape.
// Every data source (mock, Sportradar, manual) must produce this.

export type FlagStatus = "pre" | "green" | "yellow" | "red" | "checkered";

export type DriverStatus = "running" | "pit" | "out";

export interface DriverState {
  /** Stable id used to link config picks to live data, e.g. "car-12". */
  id: string;
  /** Car number as shown on the car, e.g. "12". */
  number: string;
  name: string;
  team: string;
  /** Hex color for the car/livery accent. */
  color: string;
  /** Current running position, 1-based. */
  position: number;
  /** Starting grid position, 1-based. */
  gridPosition: number;
  lapsLed: number;
  /** True if this driver currently holds the fastest lap of the race. */
  fastestLap: boolean;
  status: DriverStatus;
  /** Human-readable gap to leader, e.g. "+2.431" or "1 Lap". */
  gapToLeader: string;
}

export interface RaceState {
  raceName: string;
  flagStatus: FlagStatus;
  lap: number;
  totalLaps: number;
  /** ISO timestamp of when this snapshot was produced. */
  lastUpdated: string;
  drivers: DriverState[];
}

/** Where the live data is coming from right now. */
export type DataSource = "mock" | "sportradar" | "manual";
