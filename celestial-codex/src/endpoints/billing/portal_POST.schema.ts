import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});
export type OutputType = { url: string };

export const postBillingPortal = async (init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`/_api/billing/portal`, {
    method: "POST",
    body: superjson.stringify({}),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(superjson.parse<{ error: string }>(await res.text()).error);
  return superjson.parse<OutputType>(await res.text());
};
