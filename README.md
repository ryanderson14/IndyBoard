# IndyBoard

A live, mobile- and TV-friendly Indy 500 dashboard for the family. Everyone
picks a driver and shows up on the leaderboard as a cartoon of themselves
driving that car. Two leaderboards run at once from the same live feed:

- **Family Standings** — the big group: one driver each, ranked by their
  driver's live running position. Only drivers that were picked appear.
- **Draft League** — the 5-person group: each manager drafts a team of drivers;
  team points come from placement (P1 = 33 … P33 = 1) plus bonuses for winning,
  fastest lap, and leading the most laps.

Plus an animated oval track with everyone's avatar-car, a scrolling race ticker,
live position-change flashes, a 📺 TV/cast mode, and a ⚙️ admin "race control".

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000  (runs the simulated race by default)
npm test           # scoring + leaderboard unit tests
```

With no config the app runs a **simulated race** (`DATA_SOURCE=mock`) so you can
see everything working before race day.

## Set the family picks

Edit `src/config/league.ts`:

- `players[]` — the big group (one `driverId` each).
- `teams[]` — the 5 draft managers and their `driverIds`.
- `scoring` — field size and bonus values.

`driverId`s must match `src/lib/drivers.ts` (the field). **Verify the driver
list / car numbers against the official INDYCAR entry list before the race** and
edit `drivers.ts` to match. Avatars: drop a cartoon PNG in `public/avatars/` and
set `avatar: "/avatars/name.png"`, or leave it blank to auto-generate a cartoon.

## Data sources

Set `DATA_SOURCE` (env or flip live from `/admin`):

- `mock` — built-in simulated race (default).
- `sportradar` — live official feed. Set `SPORTRADAR_API_KEY` and
  `SPORTRADAR_EVENT_ID`. Confirm the endpoint/field mapping in
  `src/lib/datasource/sportradar.ts` against a real response on race day.
- `manual` — you set the running order from `/admin` (the bulletproof fallback).

See `.env.example` for all variables. If the live feed ever fails, the app
auto-falls back to the manual board so it never goes blank.

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add env vars (`SPORTRADAR_*`, `ADMIN_SECRET`, and a Vercel KV store so manual
   overrides persist).
3. Deploy and share the URL with the family.

## Race-day checklist

1. Confirm the entry list in `drivers.ts` and picks in `league.ts`; redeploy.
2. Set `SPORTRADAR_*`; open `/admin`, switch source to **sportradar**, confirm
   data looks right.
3. Keep `/admin` open as the manual fallback. Cast `/tv` to the living-room TV.
