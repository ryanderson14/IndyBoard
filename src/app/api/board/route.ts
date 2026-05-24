import { NextResponse } from "next/server";
import { getRaceState } from "@/lib/datasource";
import { buildBoard } from "@/lib/board";
import { getLeague } from "@/lib/league-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ source, race }, league] = await Promise.all([
      getRaceState(),
      getLeague(),
    ]);
    const board = buildBoard(race, league);
    return NextResponse.json(
      { source, board, field: race.drivers, league },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load race" },
      { status: 500 },
    );
  }
}
