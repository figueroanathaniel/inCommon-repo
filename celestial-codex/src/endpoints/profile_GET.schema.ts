import { z } from "zod";
import superjson from "superjson";
import type { BirthProfile } from "../helpers/BirthProfile";

export const schema = z.object({});

export type OutputType = { profile: BirthProfile | null };

export const getProfile = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/profile`, {
    method: "GET",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {
    const err = superjson.parse<{ error: string }>(await result.text());
    throw new Error(err.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
