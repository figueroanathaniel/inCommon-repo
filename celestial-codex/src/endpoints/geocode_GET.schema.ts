import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ q: z.string().trim().min(2).max(100) });

export type Place = {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type OutputType = { places: Place[] };

export const getGeocode = async (params: z.infer<typeof schema>, init?: RequestInit): Promise<OutputType> => {
  const validated = schema.parse(params);
  const result = await fetch(`/_api/geocode?q=${encodeURIComponent(validated.q)}`, {
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
