/**
 * Type mirrors of the Floot client helpers (User, BirthProfile, Horoscope,
 * RelocationReading, PremiumStatus, AsteroidPosition). They are re-declared
 * here rather than imported from src/helpers because several of those files
 * exist only in the Floot project or pull in client-only modules.
 */

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "admin" | "user";
}

export type BirthProfile = {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:mm
  birthPlace: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
};

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

export type RelocationReading = {
  title: string;
  epigraph: string;
  overview: string;
  love: string;
  career: string;
  home: string;
  wellbeing: string;
  growth: string;
  cautions: string;
  bestFor: string[];
  verdict: string;
};

export type PremiumStatus = {
  isPremium: boolean;
  plan: "monthly" | "annual" | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  billingConfigured: boolean;
};

export const PREMIUM_PRICES = {
  monthly: { amount: 1299, label: "$12.99", interval: "month" as const },
  annual: { amount: 11999, label: "$119.99", interval: "year" as const },
};

export type AsteroidKey = "chiron" | "ceres" | "pallas" | "juno" | "vesta" | "eris";

export type AsteroidPosition = {
  key: AsteroidKey;
  longitude: number;
  latitude: number;
  retrograde: boolean;
};
