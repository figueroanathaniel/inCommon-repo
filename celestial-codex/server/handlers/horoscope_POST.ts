import type { Request, Response } from "express";
import superjson from "superjson";
import { db } from "../db";
import { getServerUserSession, NotAuthenticatedError } from "../session";
import { loadBirthProfile } from "../lib/loadBirthProfile";
import { horoscopePeriod } from "../lib/horoscopePeriod";
import { requirePremium, PremiumRequiredError } from "../lib/premium";
import { aiChat, AiOutOfCreditsError, AiRateLimitError } from "../ai";
import { sendJson } from "../lib/http";
import { schema } from "../../src/endpoints/horoscope_POST.schema";
import type { HoroscopeContent, HoroscopeRecord } from "../lib/types";

const str = { type: "string" } as const;
const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "epigraph", "overview", "stars", "design", "numbers", "love", "work", "spirit", "ritual", "mantra", "auspiciousColor", "keyTransits"],
  properties: {
    title: str,
    epigraph: str,
    overview: str,
    stars: str,
    design: str,
    numbers: str,
    love: str,
    work: str,
    spirit: str,
    ritual: str,
    mantra: str,
    auspiciousColor: str,
    keyTransits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["transit", "meaning"],
        properties: { transit: str, meaning: str },
      },
    },
  },
};

const DEEP_JSON_SCHEMA = {
  ...JSON_SCHEMA,
  required: [...JSON_SCHEMA.required, "chapters", "timing", "shadowWork", "journalPrompts"],
  properties: {
    ...JSON_SCHEMA.properties,
    chapters: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["heading", "body"], properties: { heading: str, body: str } },
    },
    timing: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["when", "guidance"], properties: { when: str, guidance: str } },
    },
    shadowWork: str,
    journalPrompts: { type: "array", items: str },
  },
};

const INSTRUCTIONS = `You are the Oracle of the Celestial Codex, a master astrologer, Human Design analyst, and numerologist who writes like a poet with an astronomer's precision.
Write a deeply personalized horoscope in second person that genuinely synthesizes all three systems (tropical astrology transits to the natal chart, Human Design type/strategy/authority and the transiting Sun gate, and numerology personal cycles).
Style: lush, evocative, luminous prose with vivid celestial imagery and metaphor; never generic, never cliché fortune-cookie phrasing. Ground every flourish in a concrete placement, transit, gate, or number from the dossier, naming it explicitly. Offer practical, empowering guidance. Never predict death, illness, or disaster; never give medical, legal, or financial directives.
Field guidance:
- title: a poetic 3-7 word title for this period.
- epigraph: one lyrical sentence, like an inscription on an astrolabe.
- overview: 2 rich paragraphs (separate with a blank line) weaving all three systems.
- stars: 1 paragraph on the astrological weather and the most important transits.
- design: 1 paragraph applying their HD type, strategy, authority and the transiting Sun gate.
- numbers: 1 paragraph on the personal year/month/day numbers in play.
- love, work, spirit: 3-4 sentences each.
- ritual: a small, specific, sensory ritual to perform during this period.
- mantra: one short affirming line.
- auspiciousColor: a single evocative color name.
- keyTransits: 2-4 items, each naming a real transit from the dossier and its meaning in one sentence.`;

const DEEP_INSTRUCTIONS = `${INSTRUCTIONS}

THIS IS AN IN-DEPTH LUMINARY READING. Go far deeper than a standard horoscope, like a private session with a master astrologer.
- Use the ENTIRE chart in the dossier: nodes, Black Moon Lilith, Chiron, Ceres, Pallas, Juno, Vesta, Eris, the Vertex, Part of Fortune, East Point, and minor aspects, alongside the planets, houses, Human Design gates/channels and numerology cycles.
- overview: 3 rich paragraphs.
- chapters: 5-7 chapters, each a distinct theme of the period (for example a key transit, a sensitive point being activated, a relationship theme, a vocational theme, a healing theme), each with an evocative heading and 2 substantial paragraphs (separate with a blank line) naming the exact placements and transits involved.
- timing: 3-6 windows within the period (dates or day ranges, or phases like "the waxing half"), each with specific guidance.
- shadowWork: one paragraph of compassionate shadow work tied to Lilith, Chiron, Pluto, or a challenging aspect in the dossier.
- journalPrompts: 3-5 probing questions.
- keyTransits: 4-8 items.`;

export async function handle(req: Request, res: Response) {
  try {
    const { user } = await getServerUserSession(req);
    const input = schema.parse(superjson.parse(req.body as string));
    const profile = await loadBirthProfile(user.id);
    if (!profile) {
      sendJson(res, { error: "Add your birth details first." }, 400);
      return;
    }
    const info = horoscopePeriod(input.period, input.localDate);
    const text = input.dossier;
    const transits = input.transits;
    const deep = input.depth === "deep";
    if (deep) await requirePremium(user);

    const existing = db.data.horoscopes.find(
      (h) =>
        h.userId === user.id &&
        h.period === input.period &&
        h.periodKey === info.key &&
        h.depth === input.depth
    );

    let content: HoroscopeContent;
    if (existing) {
      content = existing.content as unknown as HoroscopeContent;
    } else {
      const raw = await aiChat({
        // Static instructions go first so they hit the provider's prompt cache (cached input is 10x cheaper).
        reasoning: { effort: deep ? "medium" : "low" },
        instructions: deep ? DEEP_INSTRUCTIONS : INSTRUCTIONS,
        input: `Compose the ${deep ? "IN-DEPTH " : ""}${input.period.toUpperCase()} horoscope for ${info.label}.\n\nDOSSIER:\n${text}`,
        jsonSchema: deep ? DEEP_JSON_SCHEMA : JSON_SCHEMA,
        jsonSchemaName: "horoscope",
      });
      content = JSON.parse(raw) as HoroscopeContent;
      db.data.horoscopes.push({
        id: db.nextId("horoscopes"),
        userId: user.id,
        period: input.period,
        periodKey: info.key,
        depth: input.depth,
        content: content as unknown as Record<string, unknown>,
        createdAt: new Date().toISOString(),
      });
      db.save();
    }

    const horoscope: HoroscopeRecord = { period: input.period, periodKey: info.key, label: info.label, depth: input.depth, content, transits };
    sendJson(res, { horoscope });
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
    const status =
      error instanceof NotAuthenticatedError
        ? 401
        : error instanceof PremiumRequiredError
          ? 402
          : 400;
    console.error("horoscope error", error);
    sendJson(
      res,
      { error: error instanceof Error ? error.message : "Failed" },
      status
    );
  }
}
