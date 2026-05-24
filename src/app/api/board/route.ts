import { NextResponse } from "next/server";
import { getRaceState } from "@/lib/datasource";
import { buildBoard } from "@/lib/board";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { source, race } = await getRaceState();
    const board = buildBoard(race);
    return NextResponse.json(
      { source, board, field: race.drivers },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load race" },
      { status: 500 },
    );
  }
}
