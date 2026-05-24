import type { FlagStatus } from "@/lib/types";

/* Visual treatment for each flag state. `cls` is the chip background
   (supports hatched fills); `color` is the chip text color. */
export const FLAG_META: Record<
  FlagStatus,
  { label: string; color: string; cls: string }
> = {
  pre:       { label: "Pre-Race",    color: "#cbd5e1", cls: "bg-rail border border-white/10" },
  green:     { label: "Green",       color: "#022c0d", cls: "bg-[var(--accent-green)]" },
  yellow:    { label: "Caution",     color: "#1a1300", cls: "hatch-amber" },
  red:       { label: "Red Flag",    color: "#fff",    cls: "hatch-red red-strobe" },
  checkered: { label: "Checkered",   color: "#fff",    cls: "checkered" },
};

export function ordinal(n: number): string {
  if (n >= 900) return "—";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function deltaLabel(delta: number): { text: string; cls: string } {
  if (delta > 0) return { text: `▲${delta}`, cls: "text-[var(--accent-green)]" };
  if (delta < 0) return { text: `▼${Math.abs(delta)}`, cls: "text-[var(--accent-down)]" };
  return { text: "—", cls: "text-ink-mute" };
}

/* Position pill color — leader gold, podium silver/bronze, rest neutral. */
export function positionPill(rank: number): { bg: string; ink: string } {
  if (rank === 1) return { bg: "var(--accent-amber)", ink: "#1a1300" };
  if (rank === 2) return { bg: "#c0c8d4",             ink: "#0a0d14" };
  if (rank === 3) return { bg: "#cd7f32",             ink: "#1a0d00" };
  return { bg: "#1a1d27", ink: "#eef0f6" };
}
