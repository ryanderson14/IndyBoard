import type { FlagStatus } from "@/lib/types";

export const FLAG_META: Record<FlagStatus, { label: string; color: string; bg: string }> = {
  pre: { label: "Pre-Race", color: "#cbd5e1", bg: "#334155" },
  green: { label: "Green Flag", color: "#052e16", bg: "#22c55e" },
  yellow: { label: "Caution", color: "#422006", bg: "#facc15" },
  red: { label: "Red Flag", color: "#fff", bg: "#dc2626" },
  checkered: { label: "Finished", color: "#fff", bg: "#111" },
};

export function ordinal(n: number): string {
  if (n >= 900) return "—";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function deltaLabel(delta: number): { text: string; cls: string } {
  if (delta > 0) return { text: `▲ ${delta}`, cls: "text-green-400" };
  if (delta < 0) return { text: `▼ ${Math.abs(delta)}`, cls: "text-red-400" };
  return { text: "—", cls: "text-white/40" };
}
