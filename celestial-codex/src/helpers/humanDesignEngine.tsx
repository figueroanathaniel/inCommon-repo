import { geocentricLongitude, PlanetKey } from "./astroEngine";

export type CenterKey =
  | "head"
  | "ajna"
  | "throat"
  | "g"
  | "heart"
  | "sacral"
  | "spleen"
  | "solarPlexus"
  | "root";

export type HDBodyKey = PlanetKey | "earth" | "southNode";

export type Activation = {
  body: HDBodyKey;
  gate: number;
  line: number;
  side: "personality" | "design";
};

export type HDType =
  | "Manifestor"
  | "Generator"
  | "Manifesting Generator"
  | "Projector"
  | "Reflector";

export type HumanDesignChart = {
  designInstant: Date;
  activations: Activation[];
  activeGates: Set<number>;
  personalityGates: Set<number>;
  designGates: Set<number>;
  definedChannels: [number, number][];
  definedCenters: Set<CenterKey>;
  type: HDType;
  authority: string;
  profile: string;
  definition: string;
  cross: { personalitySun: number; personalityEarth: number; designSun: number; designEarth: number };
};

// Rave mandala gate order, beginning at 2° Aquarius (302° tropical)
const GATE_ORDER = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20,
  16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18,
  48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

export const CENTER_GATES: Record<CenterKey, number[]> = {
  head: [64, 61, 63],
  ajna: [47, 24, 4, 17, 43, 11],
  throat: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  g: [1, 13, 25, 46, 2, 15, 10, 7],
  heart: [21, 40, 26, 51],
  sacral: [34, 5, 14, 29, 59, 9, 3, 42, 27],
  spleen: [48, 57, 44, 50, 32, 28, 18],
  solarPlexus: [36, 22, 37, 6, 49, 55, 30],
  root: [53, 60, 52, 19, 39, 41, 58, 38, 54],
};

export const GATE_CENTER: Record<number, CenterKey> = Object.fromEntries(
  (Object.entries(CENTER_GATES) as [CenterKey, number[]][]).flatMap(([c, gs]) =>
    gs.map((g) => [g, c])
  )
) as Record<number, CenterKey>;

export const CHANNELS: [number, number][] = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52], [10, 20],
  [10, 34], [10, 57], [11, 56], [12, 22], [13, 33], [16, 48], [17, 62], [18, 58],
  [19, 49], [20, 34], [20, 57], [21, 45], [23, 43], [24, 61], [25, 51], [26, 44],
  [27, 50], [28, 38], [29, 46], [30, 41], [32, 54], [34, 57], [35, 36], [37, 40],
  [39, 55], [42, 53], [47, 64],
];

const MOTORS: CenterKey[] = ["sacral", "heart", "solarPlexus", "root"];

const norm = (x: number) => ((x % 360) + 360) % 360;

export function gateFromLongitude(lon: number) {
  const rel = norm(lon - 302);
  const idx = Math.floor(rel / 5.625);
  const line = Math.floor((rel % 5.625) / 0.9375) + 1;
  return { gate: GATE_ORDER[idx], line: Math.min(6, line) };
}

function findDesignInstant(birth: Date): Date {
  const target = norm(geocentricLongitude("sun", birth) - 88);
  let t = birth.getTime() - 88 * 86400000 * 1.0146;
  for (let i = 0; i < 8; i++) {
    let diff = norm(geocentricLongitude("sun", new Date(t)) - target);
    if (diff > 180) diff -= 360;
    t -= (diff / 0.9856) * 86400000;
    if (Math.abs(diff) < 1e-6) break;
  }
  return new Date(t);
}

const HD_BODIES: PlanetKey[] = [
  "sun", "moon", "northNode", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto",
];

function activationsFor(instant: Date, side: Activation["side"]): Activation[] {
  const out: Activation[] = [];
  for (const body of HD_BODIES) {
    const lon = geocentricLongitude(body, instant);
    out.push({ body, side, ...gateFromLongitude(lon) });
    if (body === "sun") out.push({ body: "earth", side, ...gateFromLongitude(lon + 180) });
    if (body === "northNode") out.push({ body: "southNode", side, ...gateFromLongitude(lon + 180) });
  }
  return out;
}

const PROFILE_NAMES = ["", "Investigator", "Hermit", "Martyr", "Opportunist", "Heretic", "Role Model"];

export function humanDesignEngine(birth: Date): HumanDesignChart {
  const designInstant = findDesignInstant(birth);
  const personality = activationsFor(birth, "personality");
  const design = activationsFor(designInstant, "design");
  const activations = [...personality, ...design];
  const personalityGates = new Set(personality.map((a) => a.gate));
  const designGates = new Set(design.map((a) => a.gate));
  const activeGates = new Set(activations.map((a) => a.gate));

  const definedChannels = CHANNELS.filter(([a, b]) => activeGates.has(a) && activeGates.has(b));
  const definedCenters = new Set<CenterKey>();
  const adj = new Map<CenterKey, Set<CenterKey>>();
  for (const [a, b] of definedChannels) {
    const ca = GATE_CENTER[a];
    const cb = GATE_CENTER[b];
    definedCenters.add(ca);
    definedCenters.add(cb);
    if (!adj.has(ca)) adj.set(ca, new Set());
    if (!adj.has(cb)) adj.set(cb, new Set());
    adj.get(ca)!.add(cb);
    adj.get(cb)!.add(ca);
  }

  const reach = (from: CenterKey) => {
    const seen = new Set<CenterKey>([from]);
    const q = [from];
    while (q.length) {
      const c = q.shift()!;
      for (const n of adj.get(c) ?? []) if (!seen.has(n)) (seen.add(n), q.push(n));
    }
    return seen;
  };

  const throatReach = definedCenters.has("throat") ? reach("throat") : new Set<CenterKey>();
  const motorToThroat = MOTORS.some((m) => throatReach.has(m));
  const sacral = definedCenters.has("sacral");

  let type: HDType;
  if (definedCenters.size === 0) type = "Reflector";
  else if (sacral) type = motorToThroat ? "Manifesting Generator" : "Generator";
  else if (motorToThroat) type = "Manifestor";
  else type = "Projector";

  let authority: string;
  if (definedCenters.has("solarPlexus")) authority = "Emotional (Solar Plexus)";
  else if (sacral) authority = "Sacral";
  else if (definedCenters.has("spleen")) authority = "Splenic";
  else if (definedCenters.has("heart")) authority = throatReach.has("heart") ? "Ego Manifested" : "Ego Projected";
  else if (definedCenters.has("g") && throatReach.has("g")) authority = "Self-Projected";
  else if (type === "Reflector") authority = "Lunar";
  else authority = "Mental (Environmental)";

  // count connected components
  const seen = new Set<CenterKey>();
  let components = 0;
  for (const c of definedCenters) {
    if (seen.has(c)) continue;
    components++;
    for (const r of reach(c)) seen.add(r);
  }
  const definition =
    components === 0
      ? "No Definition"
      : ["", "Single Definition", "Split Definition", "Triple Split", "Quadruple Split"][components] ?? "Quadruple Split";

  const pSun = personality.find((a) => a.body === "sun")!;
  const dSun = design.find((a) => a.body === "sun")!;
  const profile = `${pSun.line}/${dSun.line} ${PROFILE_NAMES[pSun.line]} / ${PROFILE_NAMES[dSun.line]}`;

  return {
    designInstant,
    activations,
    activeGates,
    personalityGates,
    designGates,
    definedChannels,
    definedCenters,
    type,
    authority,
    profile,
    definition,
    cross: {
      personalitySun: pSun.gate,
      personalityEarth: personality.find((a) => a.body === "earth")!.gate,
      designSun: dSun.gate,
      designEarth: design.find((a) => a.body === "earth")!.gate,
    },
  };
}
