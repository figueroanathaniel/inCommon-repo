import { z } from "zod";
import superjson from "superjson";
import type { AsteroidPosition } from "../../helpers/advancedChart";

export const schema = z.object({});
export type OutputType = { asteroids: AsteroidPosition[] };

export const getAsteroids = async (init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`/_api/points/asteroids`, {
    method: "GET",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = new Error(superjson.parse<{ error: string; code?: string }>(await res.text()).error) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return superjson.parse<OutputType>(await res.text());
};
