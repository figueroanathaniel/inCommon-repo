import { db } from "../db";
import type { BirthProfile } from "./types";

const toDateString = (d: Date | string) =>
  typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);

export async function loadBirthProfile(userId: number): Promise<BirthProfile | null> {
  const row = db.data.birthProfiles.find((p) => p.userId === userId);
  if (!row) return null;
  return {
    fullName: row.fullName,
    birthDate: toDateString(row.birthDate),
    birthTime: row.birthTime,
    birthPlace: row.birthPlace,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
  };
}
