import { z } from "zod";
import superjson from "superjson";
import type { BirthProfile } from "../helpers/BirthProfile";

export const schema = z.object({
  fullName: z.string().trim().min(1, "Your name is required").max(120),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  birthPlace: z.string().max(200).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  timezone: z.string().min(1).max(64),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { profile: BirthProfile };

export const postProfile = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(`/_api/profile`, {
    method: "POST",
    body: superjson.stringify(validated),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {
    const err = superjson.parse<{ error: string }>(await result.text());
    throw new Error(err.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
