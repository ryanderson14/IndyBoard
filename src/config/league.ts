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
    { id: "p-mike", name: "Mike", driverId: "car-06", avatar: "/avatars/mike.png"  },
    { id: "p-kesley", name: "Kesley", driverId: "car-75", avatar: "/avatars/kesley.png"  },
    { id: "p-ryan", name: "Ryan", driverId: "car-9", avatar: "/avatars/ryan.png"  },
    { id: "p-adam", name: "Adam", driverId: "car-5", avatar: "/avatars/adam.png"  },
    { id: "p-daisy", name: "Daisy", driverId: "car-20", avatar: "/avatars/daisy.png"  },
    { id: "p-courtney", name: "Courtney", driverId: "car-23" },
    { id: "p-gigi", name: "Gigi", driverId: "car-33", avatar: "/avatars/gigi.png"  },
    { id: "p-jopa", name: "Jopa", driverId: "car-8", avatar: "/avatars/jopa.png" },
    { id: "p-tod", name: "Tod", driverId: "car-10", avatar: "/avatars/tod.png" },
    { id: "p-rebecca", name: "Rebecca", driverId: "car-3", avatar: "/avatars/rebecca.png" },
    { id: "p-delia", name: "Delia", driverId: "car-14", avatar: "/avatars/delia.png" },
    { id: "p-sadie", name: "Sadie", driverId: "car-7", avatar: "/avatars/sadie.png" },
    { id: "p-felicia", name: "Felicia", driverId: "car-60", avatar: "/avatars/felicia.png" },
    { id: "p-joy", name: "Joy", driverId: "car-6", avatar: "/avatars/joy.png" },
    { id: "p-brett", name: "Brett", driverId: "car-12", avatar: "/avatars/brett.png" },
    { id: "p-silas", name: "Silas", driverId: "car-2", avatar: "/avatars/silas.png" },
    { id: "p-katie", name: "Katie", driverId: "car-31"}
  ],

  // SMALL FAMILY (5 managers) — each drafts a team of drivers. Points come
  // from driver placement (see scoring below). Roster size is flexible; just
  // list however many each manager drafted.
  teams: [
    { id: "t-ryan", name: "Ryan's Racers", driverIds: ["car-10", "car-5", "car-15", "car-21"], avatar: "/avatars/ryan.png"  },
    { id: "t-adam", name: "Adam's Racers", driverIds: ["car-9", "car-27", "car-18", "car-60", "car-24"], avatar: "/avatars/adam.png"  },
    { id: "t-daisy", name: "Daisy's Racers", driverIds: ["car-12", "car-7", "car-26", "car-11", "car-33"], avatar: "/avatars/daisy.png"  },
    { id: "t-kesley", name: "Kesley's Racers", driverIds: ["car-2", "car-3", "car-28", "car-14"], avatar: "/avatars/kesley.png"  },
    { id: "t-mike", name: "Mike's Racers", driverIds: ["car-8", "car-6", "car-66", "car-76"], avatar: "/avatars/mike.png"  },
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
