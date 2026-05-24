import { NextRequest, NextResponse } from "next/server";
import type { DataSource, RaceState } from "@/lib/types";
import type { LeagueConfig } from "@/config/league";
import { DATA_SOURCE_KEY, resolveSource } from "@/lib/datasource";
import { MANUAL_RACE_KEY, blankManualRace } from "@/lib/datasource/manual";
import { kvGet, kvSet, STORE_BACKEND } from "@/lib/store";
import { getLeague, saveLeague, resetLeague, LEAGUE_CONFIG_KEY } from "@/lib/league-store";

export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "pitlane";

function authed(req: NextRequest): boolean {
  return req.headers.get("x-admin-secret") === ADMIN_SECRET;
}

async function currentManualRace(): Promise<RaceState> {
  return (await kvGet<RaceState>(MANUAL_RACE_KEY)) ?? blankManualRace();
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [source, race, league, override] = await Promise.all([
    resolveSource(),
    currentManualRace(),
    getLeague(),
    kvGet<LeagueConfig>(LEAGUE_CONFIG_KEY),
  ]);
  return NextResponse.json({
    source,
    storeBackend: STORE_BACKEND,
    race,
    league,
    leagueOverridden: override !== null,
  });
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = body?.action as string;

  switch (action) {
    case "setSource": {
      const source = body.source as DataSource;
      await kvSet(DATA_SOURCE_KEY, source);
      return NextResponse.json({ ok: true, source });
    }

    case "saveRace": {
      const race = body.race as RaceState;
      race.lastUpdated = new Date().toISOString();
      await kvSet(MANUAL_RACE_KEY, race);
      return NextResponse.json({ ok: true });
    }

    case "patch": {
      const race = await currentManualRace();
      if (typeof body.flagStatus === "string") race.flagStatus = body.flagStatus;
      if (typeof body.lap === "number") race.lap = body.lap;
      if (typeof body.totalLaps === "number") race.totalLaps = body.totalLaps;
      race.lastUpdated = new Date().toISOString();
      await kvSet(MANUAL_RACE_KEY, race);
      return NextResponse.json({ ok: true, race });
    }

    case "reorder": {
      const order = body.order as string[];
      const race = await currentManualRace();
      const byId = new Map(race.drivers.map((d) => [d.id, d]));
      const reordered = order
        .map((id) => byId.get(id))
        .filter((d): d is NonNullable<typeof d> => Boolean(d));
      reordered.forEach((d, i) => {
        d.position = i + 1;
        d.gapToLeader = i === 0 ? "Leader" : d.gapToLeader;
      });
      race.drivers = reordered;
      race.lastUpdated = new Date().toISOString();
      await kvSet(MANUAL_RACE_KEY, race);
      return NextResponse.json({ ok: true, race });
    }

    case "reset": {
      await kvSet(MANUAL_RACE_KEY, blankManualRace());
      return NextResponse.json({ ok: true });
    }

    case "saveLeague": {
      const league = body.league as LeagueConfig;
      if (!league || !Array.isArray(league.players) || !Array.isArray(league.teams)) {
        return NextResponse.json({ error: "invalid league" }, { status: 400 });
      }
      await saveLeague(league);
      return NextResponse.json({ ok: true, league });
    }

    case "resetLeague": {
      await resetLeague();
      const league = await getLeague();
      return NextResponse.json({ ok: true, league });
    }

    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
