import type { DataSource, RaceState } from "../types";
import { kvGet } from "../store";
import { mockProvider } from "./mock";
import { sportradarProvider } from "./sportradar";
import { manualProvider } from "./manual";
import type { RaceProvider } from "./provider";

export const DATA_SOURCE_KEY = "config:dataSource";

const providers: Record<DataSource, RaceProvider> = {
  mock: mockProvider,
  sportradar: sportradarProvider,
  manual: manualProvider,
};

/**
 * Effective source resolution (highest priority first):
 *   1. runtime flag set from /admin (lets you flip to manual mid-race)
 *   2. DATA_SOURCE env var
 *   3. "mock" (safe default for local dev / pre-race)
 */
export async function resolveSource(): Promise<DataSource> {
  const runtime = await kvGet<DataSource>(DATA_SOURCE_KEY);
  if (runtime && runtime in providers) return runtime;
  const env = process.env.DATA_SOURCE as DataSource | undefined;
  if (env && env in providers) return env;
  return "mock";
}

export async function getRaceState(): Promise<{ source: DataSource; race: RaceState }> {
  const source = await resolveSource();
  try {
    return { source, race: await providers[source].getRaceState() };
  } catch (err) {
    // Never let a flaky live feed take the whole board down.
    if (source !== "manual") {
      return { source: "manual", race: await manualProvider.getRaceState() };
    }
    throw err;
  }
}
