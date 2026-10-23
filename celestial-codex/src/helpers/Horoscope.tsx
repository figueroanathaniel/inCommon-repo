export type HoroscopePeriodKind = "daily" | "weekly" | "monthly";
export type HoroscopeDepthKind = "standard" | "deep";

export type HoroscopeContent = {
  title: string;
  epigraph: string;
  overview: string;
  stars: string;
  design: string;
  numbers: string;
  love: string;
  work: string;
  spirit: string;
  ritual: string;
  mantra: string;
  auspiciousColor: string;
  keyTransits: { transit: string; meaning: string }[];
  // In-depth (Luminary) readings only
  chapters?: { heading: string; body: string }[];
  timing?: { when: string; guidance: string }[];
  shadowWork?: string;
  journalPrompts?: string[];
};

export type HoroscopeRecord = {
  period: HoroscopePeriodKind;
  periodKey: string;
  label: string;
  depth: HoroscopeDepthKind;
  content: HoroscopeContent;
  transits: string[];
};
