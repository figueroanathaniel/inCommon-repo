import type { Request, Response } from "express";
import superjson from "superjson";
import { db } from "../db";
import { getServerUserSession, NotAuthenticatedError } from "../session";
import { requirePremium, PremiumRequiredError } from "../lib/premium";
import { aiChat, AiOutOfCreditsError, AiRateLimitError } from "../ai";
import { sendJson } from "../lib/http";
import { schema } from "../../src/endpoints/relocation_POST.schema";
import type { RelocationReading } from "../lib/types";

const str = { type: "string" } as const;
const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "epigraph", "overview", "love", "career", "home", "wellbeing", "growth", "cautions", "bestFor", "verdict"],
  properties: {
    title: str,
    epigraph: str,
    overview: str,
    love: str,
    career: str,
    home: str,
    wellbeing: str,
    growth: str,
    cautions: str,
    bestFor: { type: "array", items: str },
    verdict: str,
  },
};

const INSTRUCTIONS = `You are the Oracle of the Celestial Codex, a master of astrocartography and relocation astrology who writes with lush, luminous, precise prose.
Given the planetary lines (with distances) near a place and the relocated chart angles, write a relocation reading in second person.
Ground every statement in the named lines and angles (a line within ~150 km is strong, 150-500 km moderate, 500-800 km subtle). If no lines are near, read the relocated Ascendant and Midheaven and describe a quieter, self-directed place.
Be balanced and honest about challenging lines (Saturn, Mars, Pluto, Neptune, Uranus, Chiron) while showing how to work with them. Never predict disaster, illness, or death; no medical, legal, or financial directives.
Fields: title (3-7 words), epigraph (one lyrical line), overview (2 paragraphs separated by a blank line), love, career, home, wellbeing, growth (3-4 sentences each), cautions (2-3 sentences), bestFor (3-5 short phrases, e.g. "a creative sabbatical"), verdict (one memorable sentence).`;

export async function handle(req: Request, res: Response) {
  try {
    const { user } = await getServerUserSession(req);
    await requirePremium(user);
    const input = schema.parse(superjson.parse(req.body as string));

    const existing = db.data.relocationReadings.find(
      (r) => r.userId === user.id && r.placeLabel === input.placeLabel
    );
    if (existing) {
      sendJson(res, { reading: existing.content as unknown as RelocationReading });
      return;
    }

    const raw = await aiChat({
      reasoning: { effort: "low" },
      instructions: INSTRUCTIONS,
      input: `PLACE: ${input.placeLabel} (${input.latitude.toFixed(2)}, ${input.longitude.toFixed(2)})\n\n${input.dossier}`,
      jsonSchema: JSON_SCHEMA,
      jsonSchemaName: "relocation",
    });
    const reading = JSON.parse(raw) as RelocationReading;
    db.data.relocationReadings.push({
      id: db.nextId("relocationReadings"),
      userId: user.id,
      placeLabel: input.placeLabel,
      latitude: input.latitude,
      longitude: input.longitude,
      content: reading as unknown as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    });
    db.save();
    sendJson(res, { reading });
  } catch (error) {
    if (error instanceof AiOutOfCreditsError) {
      res
        .status(503)
        .set("Content-Type", "application/json")
        .send(
          JSON.stringify({
            error: "AI features are temporarily unavailable. Please contact the app owner.",
            code: "OUT_OF_CREDITS",
          })
        );
      return;
    }
    if (error instanceof AiRateLimitError) {
      res
        .status(429)
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ error: "The oracle is resting. Try again in a minute.", code: "RATE_LIMITED" }));
      return;
    }
    console.error("relocation error", error);
    const code =
      error instanceof NotAuthenticatedError
        ? 401
        : error instanceof PremiumRequiredError
          ? 402
          : 400;
    sendJson(
      res,
      { error: error instanceof Error ? error.message : "Failed" },
      code
    );
  }
}
