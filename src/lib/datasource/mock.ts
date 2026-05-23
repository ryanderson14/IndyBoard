import type { DriverState, FlagStatus, RaceState } from "../types";
import { DRIVERS } from "../drivers";
import type { RaceProvider } from "./provider";

// Simulates a live Indy 500 so the full dashboard can be built and watched
// before the real race. Positions shuffle, laps tick up, cautions fly, a
// fastest lap moves around, and a couple of cars retire — all over real time.

const TOTAL_LAPS = 200;
const MS_PER_LAP = 1500; // ~5 minutes for a full demo race

interface MockState {
  startedAt: number;
  order: string[]; // driver ids, index 0 = P1
  lapsLed: Record<string, number>;
  fastestLapId: string;
  out: Set<string>;
  lastLap: number;
}

let state: MockState | null = null;

function init(): MockState {
  const ids = DRIVERS.map((d) => d.id);
  return {
    startedAt: Date.now(),
    order: [...ids],
    lapsLed: {},
    fastestLapId: ids[0],
    out: new Set(),
    lastLap: 0,
  };
}

function swap(arr: string[], i: number, j: number) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function advance(s: MockState, lap: number) {
  const lapsElapsed = lap - s.lastLap;
  if (lapsElapsed <= 0) return;
  s.lastLap = lap;

  // Credit laps led to the current leader (first non-retired car).
  const leader = s.order.find((id) => !s.out.has(id));
  if (leader) s.lapsLed[leader] = (s.lapsLed[leader] ?? 0) + lapsElapsed;

  // Shuffle a few neighboring positions to simulate on-track battles.
  for (let k = 0; k < 3; k++) {
    const i = Math.floor(Math.random() * (s.order.length - 1));
    if (Math.random() < 0.5) swap(s.order, i, i + 1);
  }

  // Occasionally move the fastest lap around.
  if (Math.random() < 0.3) {
    s.fastestLapId = s.order[Math.floor(Math.random() * Math.min(8, s.order.length))];
  }

  // Rare retirements (only a couple over the whole race).
  if (Math.random() < 0.04 && s.out.size < 3 && lap > 20) {
    const candidate = s.order[s.order.length - 1 - s.out.size];
    if (candidate) s.out.add(candidate);
  }
}

function flagFor(lap: number): FlagStatus {
  if (lap <= 0) return "pre";
  if (lap >= TOTAL_LAPS) return "checkered";
  // Two scripted caution windows.
  if ((lap >= 55 && lap <= 60) || (lap >= 135 && lap <= 142)) return "yellow";
  return "green";
}

export const mockProvider: RaceProvider = {
  name: "mock",
  async getRaceState(): Promise<RaceState> {
    if (!state) state = init();
    const s = state;

    const elapsed = Date.now() - s.startedAt;
    const lap = Math.min(TOTAL_LAPS, Math.floor(elapsed / MS_PER_LAP));
    advance(s, lap);

    const flag = flagFor(lap);

    const drivers: DriverState[] = s.order.map((id, index) => {
      const info = DRIVERS.find((d) => d.id === id)!;
      const isOut = s.out.has(id);
      const position = index + 1;
      return {
        id,
        number: info.number,
        name: info.name,
        team: info.team,
        color: info.color,
        position,
        gridPosition: DRIVERS.findIndex((d) => d.id === id) + 1,
        lapsLed: s.lapsLed[id] ?? 0,
        fastestLap: id === s.fastestLapId,
        status: isOut ? "out" : flag === "yellow" && Math.random() < 0.1 ? "pit" : "running",
        gapToLeader:
          position === 1 ? "Leader" : isOut ? "OUT" : `+${(position * 0.7 + Math.random()).toFixed(3)}`,
      };
    });

    // Retired cars classify at the back.
    drivers.sort((a, b) => {
      if (a.status === "out" && b.status !== "out") return 1;
      if (b.status === "out" && a.status !== "out") return -1;
      return a.position - b.position;
    });
    drivers.forEach((d, i) => (d.position = i + 1));

    return {
      raceName: "Indianapolis 500 (Simulated)",
      flagStatus: flag,
      lap,
      totalLaps: TOTAL_LAPS,
      lastUpdated: new Date().toISOString(),
      drivers,
    };
  },
};

/** Test helper: reset the simulated race. */
export function resetMock() {
  state = null;
}
