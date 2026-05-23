"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "up" | "down";

/**
 * Given a map of id -> current rank, returns id -> "up"|"down" for entries that
 * just changed, auto-clearing after the flash animation so rows light up green
 * (gained) or red (lost) live as the race unfolds.
 */
export function useMovement(ranks: Record<string, number>) {
  const prev = useRef<Record<string, number>>({});
  const [moves, setMoves] = useState<Record<string, Direction>>({});

  useEffect(() => {
    const next: Record<string, Direction> = {};
    for (const [id, rank] of Object.entries(ranks)) {
      const before = prev.current[id];
      if (before != null && before !== rank) {
        next[id] = rank < before ? "up" : "down";
      }
    }
    prev.current = ranks;
    if (Object.keys(next).length) {
      setMoves(next);
      const t = setTimeout(() => setMoves({}), 1300);
      return () => clearTimeout(t);
    }
  }, [ranks]);

  return moves;
}
