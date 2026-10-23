import { z } from "zod";
import superjson from "superjson";
import type { RelocationReading } from "../helpers/RelocationReading";

export const schema = z.object({
  placeLabel: z.string().min(2).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  // Line proximities + relocated angles, computed client-side
  dossier: z.string().min(20).max(10000),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { reading: RelocationReading };

export const postRelocation = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`/_api/relocation`, {
    method: "POST",
    body: superjson.stringify(schema.parse(body)),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) {
    let parsed: { error: string; code?: string };
    try {
      parsed = superjson.parse(text) ?? JSON.parse(text);
    } catch {
      parsed = JSON.parse(text);
    }
    const err = new Error(parsed.error) as Error & { code?: string };
    err.code = parsed.code;
    throw err;
  }
  return superjson.parse<OutputType>(text);
};
