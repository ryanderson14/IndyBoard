"use client";

import { useState } from "react";
import Image from "next/image";
import type {
  LeagueConfig,
  PlayerPick,
  TeamEntry,
} from "@/config/league";
import { DRIVERS } from "@/lib/drivers";

interface Props {
  initialLeague: LeagueConfig;
  overridden: boolean;
  onSave: (league: LeagueConfig) => Promise<void> | void;
  onReset: () => Promise<void> | void;
}

const slug = () => Math.random().toString(36).slice(2, 9);

// Downscale an uploaded image to a square JPEG data URL so the avatar fits
// comfortably in KV (one record holds the whole league, including all avatars).
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = document.createElement("img");
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = blobUrl;
    });
    const SIZE = 256;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unsupported");
    // Cover-crop to a square so portraits don't get squished.
    const min = Math.min(img.width, img.height);
    const sx = (img.width - min) / 2;
    const sy = (img.height - min) / 2;
    ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export function LeagueEditor({ initialLeague, overridden, onSave, onReset }: Props) {
  const [draft, setDraft] = useState<LeagueConfig>(() =>
    structuredClone(initialLeague),
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initialLeague);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      await onSave(draft);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "save failed");
    } finally {
      setSaving(false);
    }
  };

  const updatePlayer = (i: number, patch: Partial<PlayerPick>) => {
    setDraft((d) => ({
      ...d,
      players: d.players.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  };

  const addPlayer = () => {
    setDraft((d) => ({
      ...d,
      players: [
        ...d.players,
        { id: `p-${slug()}`, name: "New Player", driverId: DRIVERS[0]?.id ?? "" },
      ],
    }));
  };

  const removePlayer = (i: number) => {
    setDraft((d) => ({ ...d, players: d.players.filter((_, idx) => idx !== i) }));
  };

  const movePlayer = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.players.length) return;
    setDraft((d) => {
      const next = [...d.players];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...d, players: next };
    });
  };

  const updateTeam = (i: number, patch: Partial<TeamEntry>) => {
    setDraft((d) => ({
      ...d,
      teams: d.teams.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));
  };

  const addTeam = () => {
    setDraft((d) => ({
      ...d,
      teams: [...d.teams, { id: `t-${slug()}`, name: "New Team", driverIds: [] }],
    }));
  };

  const removeTeam = (i: number) => {
    setDraft((d) => ({ ...d, teams: d.teams.filter((_, idx) => idx !== i) }));
  };

  const toggleTeamDriver = (teamIdx: number, driverId: string) => {
    setDraft((d) => {
      const team = d.teams[teamIdx];
      const has = team.driverIds.includes(driverId);
      const driverIds = has
        ? team.driverIds.filter((id) => id !== driverId)
        : [...team.driverIds, driverId];
      return {
        ...d,
        teams: d.teams.map((t, idx) =>
          idx === teamIdx ? { ...t, driverIds } : t,
        ),
      };
    });
  };

  return (
    <section className="pit-panel space-y-5 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-mute">
            League Editor
          </h2>
          <p className="mt-1 text-xs text-ink-mute">
            {overridden
              ? "Editing the live KV override — Reset to fall back to src/config/league.ts."
              : "No KV override yet — saving will create one. The file in src/config/league.ts stays as the seed."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-green)]">
              Saved {savedAt}
            </span>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="rounded-[3px] bg-[var(--accent-green)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-40"
          >
            {saving ? "Saving…" : dirty ? "Save" : "Saved"}
          </button>
          <button
            onClick={onReset}
            className="rounded-[3px] bg-rail px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-ink-dim hover:text-ink"
            title="Drop the KV override and use src/config/league.ts again"
          >
            Reset
          </button>
        </div>
      </header>

      {err && (
        <p className="border-l-2 border-[var(--accent-down)] bg-[var(--accent-down)]/10 px-3 py-2 text-sm text-[var(--accent-down)]">
          {err}
        </p>
      )}

      {/* Race title */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-mute">
          Race title
        </label>
        <input
          value={draft.raceTitle}
          onChange={(e) => setDraft({ ...draft, raceTitle: e.target.value })}
          className="flex-1 min-w-[200px] rounded-[3px] border border-white/10 bg-rail px-2 py-1.5 text-sm text-ink"
        />
      </div>

      {/* Players */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-mute">
            Players ({draft.players.length})
          </h3>
          <button
            onClick={addPlayer}
            className="rounded-[3px] bg-rail px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-ink-dim hover:text-ink"
          >
            + Add player
          </button>
        </div>
        <ul className="space-y-1.5">
          {draft.players.map((p, i) => (
            <PlayerRow
              key={p.id}
              player={p}
              onChange={(patch) => updatePlayer(i, patch)}
              onRemove={() => removePlayer(i)}
              onMoveUp={() => movePlayer(i, -1)}
              onMoveDown={() => movePlayer(i, 1)}
            />
          ))}
        </ul>
      </div>

      {/* Teams */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-mute">
            Draft Teams ({draft.teams.length})
          </h3>
          <button
            onClick={addTeam}
            className="rounded-[3px] bg-rail px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-ink-dim hover:text-ink"
          >
            + Add team
          </button>
        </div>
        <ul className="space-y-2">
          {draft.teams.map((t, i) => (
            <TeamRow
              key={t.id}
              team={t}
              onChange={(patch) => updateTeam(i, patch)}
              onRemove={() => removeTeam(i)}
              onToggleDriver={(driverId) => toggleTeamDriver(i, driverId)}
            />
          ))}
        </ul>
      </div>

      {/* Scoring */}
      <div className="rounded-[3px] bg-black/30 p-3">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-ink-mute">
          Scoring
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <NumField
            label="Field size"
            value={draft.scoring.fieldSize}
            onChange={(v) =>
              setDraft({ ...draft, scoring: { ...draft.scoring, fieldSize: v } })
            }
          />
          <NumField
            label="Winner bonus"
            value={draft.scoring.bonuses.winner}
            onChange={(v) =>
              setDraft({
                ...draft,
                scoring: { ...draft.scoring, bonuses: { ...draft.scoring.bonuses, winner: v } },
              })
            }
          />
          <NumField
            label="Fastest lap"
            value={draft.scoring.bonuses.fastestLap}
            onChange={(v) =>
              setDraft({
                ...draft,
                scoring: { ...draft.scoring, bonuses: { ...draft.scoring.bonuses, fastestLap: v } },
              })
            }
          />
          <NumField
            label="Most laps led"
            value={draft.scoring.bonuses.mostLapsLed}
            onChange={(v) =>
              setDraft({
                ...draft,
                scoring: { ...draft.scoring, bonuses: { ...draft.scoring.bonuses, mostLapsLed: v } },
              })
            }
          />
        </div>
      </div>
    </section>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-mute">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-[3px] border border-white/10 bg-rail px-2 py-1 font-mono tabular text-ink"
      />
    </label>
  );
}

function AvatarPicker({
  name,
  avatar,
  onChange,
}: {
  name: string;
  avatar?: string;
  onChange: (avatar: string | undefined) => void;
}) {
  const [busy, setBusy] = useState(false);
  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      onChange(dataUrl);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex items-center gap-2">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[3px] bg-rail">
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] uppercase text-ink-mute">
            none
          </div>
        )}
      </div>
      <label className="cursor-pointer rounded-[3px] bg-rail px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-ink-dim hover:text-ink">
        {busy ? "…" : avatar ? "Replace" : "Upload"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {avatar && (
        <button
          onClick={() => onChange(undefined)}
          className="text-[10px] font-bold uppercase tracking-wider text-ink-mute hover:text-[var(--accent-down)]"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function PlayerRow({
  player,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  player: PlayerPick;
  onChange: (patch: Partial<PlayerPick>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <li className="rounded-[3px] bg-rail/60 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <AvatarPicker
          name={player.name}
          avatar={player.avatar}
          onChange={(avatar) => onChange({ avatar })}
        />
        <input
          value={player.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Name"
          className="min-w-[100px] flex-1 rounded-[3px] border border-white/10 bg-black/40 px-2 py-1 text-sm text-ink"
        />
        <select
          value={player.driverId}
          onChange={(e) => onChange({ driverId: e.target.value })}
          className="min-w-[140px] rounded-[3px] border border-white/10 bg-black/40 px-2 py-1 text-sm text-ink"
        >
          {DRIVERS.map((d) => (
            <option key={d.id} value={d.id}>
              #{d.number} {d.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            className="rounded-[3px] bg-overlay px-1.5 py-0.5 text-ink-dim hover:text-ink"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            className="rounded-[3px] bg-overlay px-1.5 py-0.5 text-ink-dim hover:text-ink"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="rounded-[3px] bg-overlay px-1.5 py-0.5 text-ink-mute hover:text-[var(--accent-down)]"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}

function TeamRow({
  team,
  onChange,
  onRemove,
  onToggleDriver,
}: {
  team: TeamEntry;
  onChange: (patch: Partial<TeamEntry>) => void;
  onRemove: () => void;
  onToggleDriver: (driverId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedSet = new Set(team.driverIds);
  return (
    <li className="rounded-[3px] bg-rail/60 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <AvatarPicker
          name={team.name}
          avatar={team.avatar}
          onChange={(avatar) => onChange({ avatar })}
        />
        <input
          value={team.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Team name"
          className="min-w-[120px] flex-1 rounded-[3px] border border-white/10 bg-black/40 px-2 py-1 text-sm text-ink"
        />
        <button
          onClick={() => setExpanded((x) => !x)}
          className="rounded-[3px] bg-overlay px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-ink-dim hover:text-ink"
        >
          {team.driverIds.length} cars {expanded ? "▾" : "▸"}
        </button>
        <button
          onClick={onRemove}
          className="rounded-[3px] bg-overlay px-1.5 py-0.5 text-ink-mute hover:text-[var(--accent-down)]"
          aria-label="Remove team"
        >
          ✕
        </button>
      </div>
      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
          {DRIVERS.map((d) => {
            const on = selectedSet.has(d.id);
            return (
              <label
                key={d.id}
                className={`flex cursor-pointer items-center gap-1.5 rounded-[3px] px-1.5 py-1 text-xs ${
                  on ? "bg-[var(--accent-cyan)]/15 text-ink" : "bg-black/30 text-ink-dim hover:text-ink"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggleDriver(d.id)}
                  className="accent-[var(--accent-cyan)]"
                />
                <span className="font-mono text-[10px] tabular text-ink-mute">
                  #{d.number}
                </span>
                <span className="truncate">{d.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </li>
  );
}
