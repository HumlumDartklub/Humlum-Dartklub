export type DartThrow =
  | { type: "S" | "D" | "T"; n: number }
  | { type: "SB" } // 25
  | { type: "DB" } // 50
  | { type: "M" }; // Miss (0)

/* [HELP:ARCADE:DART_UTILS] START */
export function throwValue(t: DartThrow): number {
  if (t.type === "M") return 0;
  if (t.type === "SB") return 25;
  if (t.type === "DB") return 50;

  const n = Math.max(1, Math.min(20, Math.floor(t.n)));
  if (t.type === "S") return n;
  if (t.type === "D") return n * 2;
  return n * 3;
}

export function throwLabel(t: DartThrow): string {
  if (t.type === "M") return "0";
  if (t.type === "SB") return "SB";
  if (t.type === "DB") return "BULL";
  const n = Math.max(1, Math.min(20, Math.floor(t.n)));
  return `${t.type}${n}`;
}

export function isValidNum(n: number): boolean {
  return Number.isFinite(n) && n >= 1 && n <= 20;
}

// Keepes til evt. senere spil – men NineDarter bruger sin egen liste
export const QUICK_THROWS: DartThrow[] = [
  { type: "T", n: 20 },
  { type: "T", n: 19 },
  { type: "T", n: 18 },
  { type: "D", n: 20 },
  { type: "D", n: 16 },
  { type: "D", n: 12 },
  { type: "S", n: 20 },
  { type: "S", n: 19 },
  { type: "SB" },
  { type: "DB" },
  { type: "M" },
];
/* [HELP:ARCADE:DART_UTILS] END */
