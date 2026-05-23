"use client";

import type { Board } from "@/lib/board";

interface Car {
  id: string;
  position: number;
  color: string;
  number: string;
  label: string;
  avatar?: string;
}

// Place the taken drivers around an oval by running order: leader at the
// start/finish line (top), field trailing clockwise. Cars ease between spots
// as the order changes, so you can watch your family member move up the track.
function takenCars(board: Board): Car[] {
  const map = new Map<string, Car>();

  for (const row of board.familyStandings) {
    map.set(row.driver.id, {
      id: row.driver.id,
      position: row.driver.position,
      color: row.driver.color,
      number: row.driver.number,
      label: row.player.name,
      avatar: row.player.avatar,
    });
  }
  for (const team of board.draftLeague) {
    for (const d of team.drivers) {
      if (!map.has(d.driver.id)) {
        map.set(d.driver.id, {
          id: d.driver.id,
          position: d.driver.position,
          color: d.driver.color,
          number: d.driver.number,
          label: `#${d.driver.number}`,
        });
      }
    }
  }

  return [...map.values()]
    .filter((c) => c.position < 900)
    .sort((a, b) => a.position - b.position);
}

function pointFor(index: number, count: number) {
  const theta = (index / Math.max(count, 1)) * Math.PI * 2;
  return {
    left: 50 + 41 * Math.sin(theta),
    top: 50 - 37 * Math.cos(theta),
  };
}

export function TrackView({ board }: { board: Board }) {
  const cars = takenCars(board);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">On Track</h2>
        <span className="text-xs text-white/40">{cars.length} cars in play</span>
      </div>

      <div className="relative mx-auto aspect-[5/3] w-full max-w-2xl">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <ellipse cx="50" cy="50" rx="44" ry="40" fill="none" stroke="#1f2330" strokeWidth="11" />
          <ellipse cx="50" cy="50" rx="44" ry="40" fill="none" stroke="#2b3040" strokeWidth="11" strokeDasharray="1 3" />
          {/* start/finish line at top */}
          <rect x="49" y="8" width="2" height="4" className="checkered" fill="#fff" />
        </svg>

        {cars.map((car, i) => {
          const { left, top } = pointFor(i, cars.length);
          return (
            <div
              key={car.id}
              className="bob absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
              style={{ left: `${left}%`, top: `${top}%` }}
              title={`P${car.position} · ${car.label}`}
            >
              <div
                className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-[10px] font-black text-black shadow-lg sm:h-9 sm:w-9"
                style={{ backgroundColor: car.color, border: "2px solid rgba(255,255,255,0.85)" }}
              >
                {car.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={car.avatar} alt={car.label} className="h-full w-full object-cover" />
                ) : (
                  car.number
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
