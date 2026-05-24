"use client";

import { useMemo } from "react";
import { LEAGUE } from "@/config/league";
import { DRIVERS_BY_ID } from "@/lib/drivers";
import { useBoard } from "./useBoard";

const FIELD_SIZE = LEAGUE.scoring.fieldSize;

/**
 * Indy 500 scoring pylon — rendered as its own "tower" widget pinned to the
 * left rail of every page. Top edge is aligned with the page header's top
 * edge; bottom edge hugs the viewport bottom. Font sizes scale with viewport
 * height so the 33 rows always fill the column at any screen size.
 *
 * All numbers white by default; rows whose car was picked in the big family
 * pool are tinted with the driver's livery so a family member can spot
 * themselves in the field at a glance. Positions never reorder in the DOM —
 * only the car number in each slot changes, exactly like the real LED pylon.
 */
export function ScoringPylon() {
  const { data } = useBoard();

  // driverId -> family color (uses the driver's livery as the family identity)
  const familyColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of LEAGUE.players) {
      const drv = DRIVERS_BY_ID[p.driverId];
      if (drv) map.set(p.driverId, drv.color);
    }
    return map;
  }, []);

  // Build position(1..N) -> { car number, driver id } for the current frame
  const field = data?.field ?? [];
  const byPosition = new Map<number, { number: string; id: string }>();
  for (const d of field) {
    if (d.position >= 1 && d.position <= FIELD_SIZE) {
      byPosition.set(d.position, { number: d.number, id: d.id });
    }
  }

  const rows = Array.from({ length: FIELD_SIZE }, (_, i) => i + 1);
  const lap = data?.board.race.lap ?? 0;
  const totalLaps = data?.board.race.totalLaps ?? 0;

  return (
    <aside
      aria-label="Indy 500 Scoring Pylon"
      className="
        hidden md:flex
        fixed z-40
        top-3 sm:top-5 lg:top-8
        left-3 sm:left-5 lg:left-8
        bottom-3 sm:bottom-5 lg:bottom-8
        w-[88px] lg:w-[116px] xl:w-[144px] 2xl:w-[172px]
        flex-col items-stretch
        bg-black
        border border-white/15
        rounded-md overflow-hidden
        shadow-[0_8px_32px_rgba(0,0,0,0.55)]
        select-none
        font-mono
      "
    >
      {/* Brand cap — references the IndyCar red strip at the top of the real pylon */}
      <div
        className="flex items-center justify-center bg-[var(--accent-red)] font-black uppercase tracking-[0.28em] text-white"
        style={{ fontSize: "clamp(9px, 1.1vh, 14px)", padding: "0.45em 0" }}
      >
        INDY
      </div>

      {/* Lap counter — small but visible, mirrors the lap board atop the real pylon */}
      <div
        className="border-b border-white/10 bg-black/80 text-center"
        style={{ padding: "0.35em 0 0.45em" }}
      >
        <div
          className="font-bold uppercase tracking-[0.22em] text-white/55"
          style={{ fontSize: "clamp(8px, 0.9vh, 12px)", lineHeight: 1 }}
        >
          LAP
        </div>
        <div
          className="font-display font-black italic tabular-nums text-white"
          style={{ fontSize: "clamp(14px, 1.9vh, 26px)", lineHeight: 1.05 }}
        >
          {lap}
          <span className="text-white/40">/{totalLaps || "—"}</span>
        </div>
      </div>

      {/* Position rows — CSS grid with equal-height rows fills remaining height.
          Each row is a fixed slot; only the car number changes as cars overtake. */}
      <ol
        className="grid min-h-0 flex-1 leading-none"
        style={{ gridTemplateRows: `repeat(${FIELD_SIZE}, minmax(0, 1fr))` }}
      >
        {rows.map((pos) => {
          const slot = byPosition.get(pos);
          const number = slot?.number ?? "—";
          const familyColor = slot ? familyColors.get(slot.id) : undefined;
          const isFamily = !!familyColor;
          return (
            <li
              key={pos}
              className="grid grid-cols-[1.8em_1fr] items-center tabular-nums transition-colors duration-500"
              style={{
                color: familyColor ?? "#fff",
                backgroundColor: isFamily ? `${familyColor}1f` : "transparent",
                fontSize: "clamp(11px, 1.6vh, 28px)",
                padding: "0 0.45em",
              }}
            >
              <span
                className="text-right font-semibold"
                style={{
                  fontSize: "0.72em",
                  color: isFamily ? familyColor : "rgba(255,255,255,0.5)",
                  paddingRight: "0.35em",
                }}
              >
                {pos}
              </span>
              <span
                className="text-right font-black"
                style={
                  isFamily ? { textShadow: `0 0 8px ${familyColor}99` } : undefined
                }
              >
                {number}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
