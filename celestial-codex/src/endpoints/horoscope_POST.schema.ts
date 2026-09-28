import { z } from "zod";
import superjson from "superjson";
import type { HoroscopeRecord } from "../helpers/Horoscope";

export const schema = z.object({
  period: z.enum(["daily", "weekly", "monthly"]),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Chart dossier computed client-side from the user's own birth data (ephemeris runs in the browser)
  dossier: z.string().min(50).max(14000),
  transits: z.array(z.string().max(200)).max(120),
  depth: z.enum(["standard", "deep"]).default("standard"),
});

export type InputType = z.input<typeof schema>;
export type OutputType = { horoscope: HoroscopeRecord };

export const postHoroscope = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(`/_api/horoscope`, {
    method: "POST",
    body: superjson.stringify(validated),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {
    const text = await result.text();
    let parsed: { error: string; code?: string };
    try {
      parsed = superjson.parse(text);
      if (!parsed || typeof parsed !== "object") parsed = JSON.parse(text);
    } catch {
      parsed = JSON.parse(text);
    }
    const err = new Error(parsed.error) as Error & { code?: string };
    err.code = parsed.code;
    throw err;
  }
  return superjson.parse<OutputType>(await result.text());
};
