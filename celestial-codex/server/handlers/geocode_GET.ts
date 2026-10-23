import type { Request, Response } from "express";
import superjson from "superjson";
import { schema, type Place } from "../../src/endpoints/geocode_GET.schema";
import { sendJson } from "../lib/http";

type OpenMeteoResult = {
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  country?: string;
  admin1?: string;
};

export async function handle(req: Request, res: Response) {
  try {
    const { q } = schema.parse({ q: (req.query.q as string) ?? "" });
    const res2 = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`
    );
    if (!res2.ok) throw new Error(`Place lookup failed (${res2.status})`);
    const data = (await res2.json()) as { results?: OpenMeteoResult[] };
    const places: Place[] = (data.results ?? []).map((r) => ({
      label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone ?? "UTC",
    }));
    sendJson(res, { places });
  } catch (error) {
    res
      .status(400)
      .set("Content-Type", "application/json")
      .send(
        superjson.stringify({
          error: error instanceof Error ? error.message : "Lookup failed",
        })
      );
  }
}
