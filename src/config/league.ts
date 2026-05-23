// LEAGUE CONFIG — edit this before race day. This is where the admin sets who
// picked which driver. No database, no login: change it, commit, redeploy.
//
// `driverId` values must match ids in src/lib/drivers.ts.
// `avatar` is optional: drop a cartoon PNG in /public/avatars and reference it
// as "/avatars/aunt-jen.png". If omitted, a cartoon is auto-generated from the
// name, so the board works even before anyone uploads a picture.

export interface PlayerPick {
  id: string;
  name: string;
  driverId: string;
  avatar?: string;
}

export interface TeamEntry {
  id: string;
  name: string;
  driverIds: string[];
  avatar?: string;
}

export interface ScoringConfig {
  /** Size of the field; base points = fieldSize + 1 - position. */
  fieldSize: number;
  bonuses: {
    winner: number;
    fastestLap: number;
    mostLapsLed: number;
  };
}

export interface LeagueConfig {
  raceTitle: string;
  players: PlayerPick[];
  teams: TeamEntry[];
  scoring: ScoringConfig;
}

export const LEAGUE: LeagueConfig = {
  raceTitle: "Anderson Family Indy 500",

  // BIG FAMILY — one driver each. Only these drivers appear on the
  // Family Standings board. Add/remove freely.
  players: [
    { id: "p-dad", name: "Dad", driverId: "car-12" },
    { id: "p-mom", name: "Mom", driverId: "car-10" },
    { id: "p-grandpa", name: "Grandpa", driverId: "car-9" },
    { id: "p-grandma", name: "Grandma", driverId: "car-2" },
    { id: "p-jen", name: "Aunt Jen", driverId: "car-5" },
    { id: "p-mike", name: "Uncle Mike", driverId: "car-27" },
    { id: "p-sara", name: "Sara", driverId: "car-26" },
    { id: "p-ben", name: "Ben", driverId: "car-7" },
    { id: "p-katie", name: "Katie", driverId: "car-15" },
    { id: "p-tom", name: "Cousin Tom", driverId: "car-3" },
  ],

  // SMALL FAMILY (5 managers) — each drafts a team of drivers. Points come
  // from driver placement (see scoring below). Roster size is flexible; just
  // list however many each manager drafted.
  teams: [
    { id: "t-ryan", name: "Ryan's Racers", driverIds: ["car-10", "car-5", "car-15", "car-21", "car-44"] },
    { id: "t-emily", name: "Emily's Engines", driverIds: ["car-9", "car-27", "car-18", "car-60", "car-24"] },
    { id: "t-josh", name: "Josh's Juggernauts", driverIds: ["car-12", "car-7", "car-26", "car-11", "car-33"] },
    { id: "t-dana", name: "Dana's Drafters", driverIds: ["car-2", "car-3", "car-28", "car-14", "car-90"] },
    { id: "t-chris", name: "Chris's Chargers", driverIds: ["car-8", "car-6", "car-30", "car-66", "car-76"] },
  ],

  scoring: {
    fieldSize: 33,
    bonuses: {
      winner: 10,
      fastestLap: 5,
      mostLapsLed: 5,
    },
  },
};
