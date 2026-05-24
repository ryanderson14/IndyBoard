// Runtime league config. Admin edits are stored in KV; the file in
// `src/config/league.ts` is the seed (and the fallback when KV is empty).
//
// The shape stored in KV is identical to `LeagueConfig`. Avatars are stored
// inline as data URLs (the admin UI downscales them on upload, so each one is
// ~20-30 KB JPEG and the full record stays well under the 1 MB KV limit).

import { LEAGUE, type LeagueConfig } from "@/config/league";
import { kvGet, kvSet } from "./store";

export const LEAGUE_CONFIG_KEY = "league:config";

export async function getLeague(): Promise<LeagueConfig> {
  const override = await kvGet<LeagueConfig>(LEAGUE_CONFIG_KEY);
  return override ?? LEAGUE;
}

export async function saveLeague(league: LeagueConfig): Promise<void> {
  await kvSet(LEAGUE_CONFIG_KEY, league);
}

export async function resetLeague(): Promise<void> {
  // Clearing the KV value falls back to the file seed on the next read.
  await kvSet(LEAGUE_CONFIG_KEY, null);
}
