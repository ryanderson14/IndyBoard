"use client";

import { useEffect, useRef, useState } from "react";
import type { Board } from "@/lib/board";
import type { DataSource } from "@/lib/types";

export interface BoardResponse {
  source: DataSource;
  board: Board;
}

const POLL_MS = 4000;

export function useBoard() {
  const [data, setData] = useState<BoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    async function tick() {
      try {
        const res = await fetch("/api/board", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as BoardResponse;
        if (!active) return;
        setData(json);
        setError(null);
        setConnected(true);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "connection lost");
        setConnected(false);
      } finally {
        if (active) timer.current = setTimeout(tick, POLL_MS);
      }
    }

    tick();
    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { data, error, connected };
}
