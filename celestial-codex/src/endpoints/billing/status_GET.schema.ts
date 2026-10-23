import { z } from "zod";
import superjson from "superjson";
import type { PremiumStatus } from "../../helpers/PremiumStatus";

export const schema = z.object({ sync: z.boolean().optional() });
export type OutputType = { status: PremiumStatus };

export const getBillingStatus = async (params: { sync?: boolean } = {}, init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`/_api/billing/status${params.sync ? "?sync=1" : ""}`, {
    method: "GET",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(superjson.parse<{ error: string }>(await res.text()).error);
  return superjson.parse<OutputType>(await res.text());
};
