import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * JSON file-backed store replacing the Floot Postgres database.
 * Table shapes mirror the kysely schema (helpers/schema.tsx in the Floot
 * project) so handler code ports over with only query-syntax changes:
 * kysely chains become array operations over these rows.
 */

export type HoroscopeDepth = "deep" | "standard";
export type HoroscopePeriod = "daily" | "monthly" | "weekly";
export type SubscriptionPlan = "annual" | "monthly";
export type UserRole = "admin" | "user";

export interface UserRow {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserPasswordRow {
  id: number;
  userId: number;
  passwordHash: string;
  createdAt: string;
}

export interface BirthProfileRow {
  id: number;
  userId: number;
  fullName: string;
  birthDate: string;
  birthTime: string | null;
  birthPlace: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  tzOffsetMinutes: number;
  extendedPoints: unknown[] | null;
  extendedPointsKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HoroscopeRow {
  id: number;
  userId: number;
  period: HoroscopePeriod;
  periodKey: string;
  depth: HoroscopeDepth;
  content: unknown;
  createdAt: string;
}

export interface RelocationReadingRow {
  id: number;
  userId: number;
  placeLabel: string;
  latitude: number;
  longitude: number;
  content: unknown;
  createdAt: string;
}

export interface SessionRow {
  id: string;
  userId: number;
  createdAt: string;
  lastAccessed: string;
  expiresAt: string;
}

export interface LoginAttemptRow {
  id: number;
  email: string;
  success: boolean;
  attemptedAt: string;
}

export interface SubscriptionRow {
  id: number;
  userId: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: string;
  plan: SubscriptionPlan | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OauthAccountRow {
  id: number;
  userId: number;
  provider: string;
  providerUserId: string;
  providerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  users: UserRow[];
  userPasswords: UserPasswordRow[];
  birthProfiles: BirthProfileRow[];
  horoscopes: HoroscopeRow[];
  relocationReadings: RelocationReadingRow[];
  sessions: SessionRow[];
  loginAttempts: LoginAttemptRow[];
  subscriptions: SubscriptionRow[];
  oauthAccounts: OauthAccountRow[];
}

const EMPTY: Database = {
  users: [],
  userPasswords: [],
  birthProfiles: [],
  horoscopes: [],
  relocationReadings: [],
  sessions: [],
  loginAttempts: [],
  subscriptions: [],
  oauthAccounts: [],
};

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

function load(): Database {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

let saveTimer: NodeJS.Timeout | null = null;

class Store {
  data: Database;

  constructor() {
    this.data = load();
  }

  /** Monotonic per-table id, like a Postgres serial primary key. */
  nextId(table: keyof Database): number {
    const rows = this.data[table] as { id: number }[];
    return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  }

  /** Synchronous write-through would be wasteful; debounce coalesces bursts. */
  save(): void {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        const tmp = DATA_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
        fs.renameSync(tmp, DATA_FILE);
      } catch (error) {
        console.error("[codex] db save failed:", error);
      }
    }, 50);
  }

  saveNow(): void {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error("[codex] db save failed:", error);
    }
  }
}

export const db = new Store();
