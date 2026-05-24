// 2026 Indianapolis 500 field — REFERENCE DATA.
//
// Source: https://www.indianapolismotorspeedway.com/events/indy500/event-info/live-grid
// Listed in starting-grid order (P1 → P33). `id` is the stable key your league
// config (src/config/league.ts) points at, so keep ids stable even if a
// number/team changes.

export interface DriverInfo {
  id: string;
  number: string;
  name: string;
  team: string;
  color: string;
}

export const DRIVERS: DriverInfo[] = [
  { id: "car-10", number: "10", name: "Alex Palou", team: "Chip Ganassi Racing", color: "#e2c044" },
  { id: "car-20", number: "20", name: "Alexander Rossi", team: "Ed Carpenter Racing", color: "#f0b429" },
  { id: "car-12", number: "12", name: "David Malukas", team: "Team Penske", color: "#b8001f" },
  { id: "car-60", number: "60", name: "Felix Rosenqvist", team: "Meyer Shank Racing", color: "#39d353" },
  { id: "car-14", number: "14", name: "Santino Ferrucci", team: "A.J. Foyt Enterprises", color: "#f85149" },
  { id: "car-5", number: "5", name: "Pato O'Ward", team: "Arrow McLaren", color: "#ff5400" },
  { id: "car-8", number: "8", name: "Kyffin Simpson", team: "Chip Ganassi Racing", color: "#3aa0ff" },
  { id: "car-23", number: "23", name: "Conor Daly", team: "Dreyer & Reinbold Racing", color: "#06b6d4" },
  { id: "car-3", number: "3", name: "Scott McLaughlin", team: "Team Penske", color: "#e10600" },
  { id: "car-9", number: "9", name: "Scott Dixon", team: "Chip Ganassi Racing", color: "#1f6feb" },
  { id: "car-76", number: "76", name: "Rinus VeeKay", team: "Juncos Hollinger Racing", color: "#ec4899" },
  { id: "car-75", number: "75", name: "Takuma Sato", team: "Rahal Letterman Lanigan Racing", color: "#8a63d2" },
  { id: "car-33", number: "33", name: "Ed Carpenter", team: "Ed Carpenter Racing", color: "#ffd166" },
  { id: "car-06", number: "06", name: "Helio Castroneves", team: "Meyer Shank Racing", color: "#4ec24e" },
  { id: "car-21", number: "21", name: "Christian Rasmussen", team: "Ed Carpenter Racing", color: "#ffce4f" },
  { id: "car-66", number: "66", name: "Marcus Armstrong", team: "Meyer Shank Racing", color: "#7ee787" },
  { id: "car-28", number: "28", name: "Marcus Ericsson", team: "Andretti Global", color: "#0aa39a" },
  { id: "car-7", number: "7", name: "Christian Lundgaard", team: "Arrow McLaren", color: "#ff7a00" },
  { id: "car-26", number: "26", name: "Will Power", team: "Andretti Global", color: "#19c3b8" },
  { id: "car-6", number: "6", name: "Nolan Siegel", team: "Arrow McLaren", color: "#ff9e2c" },
  { id: "car-45", number: "45", name: "Louis Foster", team: "Rahal Letterman Lanigan Racing", color: "#a07be0" },
  { id: "car-31", number: "31", name: "Ryan Hunter-Reay", team: "Arrow McLaren", color: "#ff8a4f" },
  { id: "car-2", number: "2", name: "Josef Newgarden", team: "Team Penske", color: "#d50032" },
  { id: "car-18", number: "18", name: "Romain Grosjean", team: "Dale Coyne Racing", color: "#2ea043" },
  { id: "car-27", number: "27", name: "Kyle Kirkwood", team: "Andretti Global", color: "#00b2a9" },
  { id: "car-11", number: "11", name: "Katherine Legge", team: "HMD Motorsports w/ A.J. Foyt Racing", color: "#ff6b66" },
  { id: "car-47", number: "47", name: "Mick Schumacher", team: "Rahal Letterman Lanigan Racing", color: "#b794f4" },
  { id: "car-15", number: "15", name: "Graham Rahal", team: "Rahal Letterman Lanigan Racing", color: "#6f42c1" },
  { id: "car-19", number: "19", name: "Dennis Hauger", team: "Dale Coyne Racing", color: "#76e3a1" },
  { id: "car-51", number: "51", name: "Jacob Abel", team: "Abel Motorsports", color: "#56d364" },
  { id: "car-77", number: "77", name: "Sting Ray Robb", team: "Juncos Hollinger Racing", color: "#f472b6" },
  { id: "car-4", number: "4", name: "Caio Collet", team: "A.J. Foyt Enterprises", color: "#fa6a6a" },
  { id: "car-24", number: "24", name: "Jack Harvey", team: "Dreyer & Reinbold Racing", color: "#0891b2" },
];

export const DRIVERS_BY_ID: Record<string, DriverInfo> = Object.fromEntries(
  DRIVERS.map((d) => [d.id, d]),
);
