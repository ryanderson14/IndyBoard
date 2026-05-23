import type { RaceState } from "../types";

export interface RaceProvider {
  name: string;
  getRaceState(): Promise<RaceState>;
}
