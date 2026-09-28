import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ plan: z.enum(["monthly", "annual"]) });
export type InputType = z.infer<typeof schema>;
export type OutputType = { url: string };

export const postCheckout = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`/_api/billing/checkout`, {
    method: "POST",
    body: superjson.stringify(schema.parse(body)),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(superjson.parse<{ error: string }>(await res.text()).error);
  return superjson.parse<OutputType>(await res.text());
};
