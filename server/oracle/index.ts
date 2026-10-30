// server/oracle/index.ts: the Oracle, a Supabase Edge Function.
//
// WHY THIS FILE IS HERE AND NOT UNDER supabase/functions. The repository is
// connected to Supabase's GitHub integration, and a supabase/ folder is what
// that integration watches: it can open preview branches, which are billed.
// So the function is kept beside the app and pasted into the dashboard (or
// deployed with the CLI by hand), which docs/ORACLE-SETUP.md walks through.
//
// WHAT IT DOES. It is the Celestial Codex's horoscope handler, ported. The app
// builds the Codex's dossier on the device (the first name, the chart, the
// sky at the period's instant, the Human Design and the numbers; no journal,
// no birth date, time or place) and asks for a reading for a period: today,
// this week or this month, standard or in depth. This function names the
// reader from their session, returns the reading it already wrote for that
// period and dossier if there is one, holds everybody to a daily limit because
// every reading costs money, refuses an in-depth reading to anybody who is not
// a Luminary (the Codex's paid tier), and otherwise asks Kimi with the Codex's
// own instructions and schema, and returns the JSON the page renders.
//
// THE CYCLE AUDIT is a fourth period, "cycle" (owner, 18 October 2026): the
// long passages Saturn, Uranus, Neptune and Pluto make across the chart in
// the years ahead, found on the device and sent as dated contacts, each read
// as what it asks the reader to set down (the Tax) and what it builds (the
// Dividend). It is inCommon's own reading, so it has its own instructions and
// schema below rather than the Codex's.
//
// OMNI TAROT is written here too ({ kind: "tarot" }), with no model: the
// composer that was in app/tarot.js moved to tarot-omni.js beside this file
// when the owner made Omni a paid add-on (18 October 2026), so the lock holds.
// It runs against tarot.js, a copy of app/tarot.js that tools/build-bundle.js
// writes here, so the cards and the shared phrases are the same text on both
// sides. A seed, a count and a topic come in; the reading the app's own read()
// would have written for them goes out.
//
// WHO IS LET THROUGH (opened() below). In-depth readings, the Cycle Audit and
// Omni are the add-ons, and since 18 October 2026 one Codex Luminary payment
// of the reader's choosing opens all of them (luminary_unlocks, written by
// server/billing). A Luminary subscription taken out before then opens them
// while it lives, the owner's admin addresses always do, and the apps read
// them free.
//
// WHO WRITES. Kimi, Moonshot AI's model, asked through its own API, which the
// owner chose on 29 September 2026. It is called with fetch rather than a
// client library: the API is one POST, and the one thing a library would add
// is a dependency that can move under a pasted function.
//
// Secrets it reads: MOONSHOT_API_KEY (required). ORACLE_MODEL,
// ORACLE_DEEP_MODEL, ORACLE_DEEP_THINKING, ORACLE_TIME_LIMIT,
// ORACLE_DAILY_LIMIT (failed attempts do not count toward it) and LUMINARY_ADMIN_EMAILS are optional knobs.
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided
// by Supabase itself. The tables it reads and writes are in schema.sql beside
// this file.

import { createClient } from "npm:@supabase/supabase-js@2.117.2";
// Both are plain scripts that set a global, the way the app loads them.
import "./tarot.js";
import "./tarot-omni.js";

const KIMI = "https://api.moonshot.ai/v1/chat/completions";
// kimi-k2.6 for both depths by default: it is the cheaper of Kimi's two
// general models ($0.95 in, $4 out per million tokens against $3 and $15 for
// kimi-k3) and the faster one on Kimi's own API, which is what fits an
// in-depth reading inside Supabase's time limit on the free plan.
const MODEL = Deno.env.get("ORACLE_MODEL") ?? "kimi-k2.6";
const DEEP_MODEL = Deno.env.get("ORACLE_DEEP_MODEL") ?? MODEL;
// The Codex asked for more thought before an in-depth reading than before a
// standard one. Thinking is paid for as output and takes time, so it is off
// by default and a knob turns it on: "on" for kimi-k2.6, or kimi-k3's own
// levels, "low", "high" and "max". kimi-k3 cannot switch it off, so "off"
// there means its lowest level.
type Thinking = "off" | "on" | "low" | "high" | "max";
const DEEP_THINKING: Thinking = (["off", "on", "low", "high", "max"] as const).find((e) => e === Deno.env.get("ORACLE_DEEP_THINKING")) ?? "off";
// Supabase stops a function after 150 seconds on the free plan and 400 on a
// paid one. The call to Kimi is abandoned a little before that, so the row is
// marked and the reader told, rather than the function killed mid write.
const TIME_LIMIT_MS = Number(Deno.env.get("ORACLE_TIME_LIMIT") ?? "140") * 1000;
const DAILY_LIMIT = Number(Deno.env.get("ORACLE_DAILY_LIMIT") ?? "6");
// The owner's own addresses read in depth without a subscription, which is
// how the Codex's admin role passed its paywall.
const ADMINS = (Deno.env.get("LUMINARY_ADMIN_EMAILS") ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
// An address counts only once it is confirmed. Matching the address alone let
// anybody who reached it first, while Confirm email was off or before the owner
// had signed up with it, read in depth for free.
const isAdmin = (u: { email?: string; email_confirmed_at?: string | null }) =>
  !!u.email_confirmed_at && ADMINS.includes(String(u.email ?? "").toLowerCase());
const ACTIVE = new Set(["active", "trialing"]);
// A profile id as the app makes them (crypto.randomUUID), checked before it
// is used in a query or stored.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type TarotRead = (o: Record<string, unknown>) => { title: string; passages: { tag: string; text: string }[]; summary: string; stats: Record<string, number> } | null;
type TarotModule = { read: TarotRead; DEPTHS: Record<string, { counts: number[] }>; TOPICS: Record<string, unknown> };
const g = globalThis as unknown as { Tarot?: TarotModule; TarotOmni?: (...a: unknown[]) => unknown };

function thinkingFor(model: string, level: Thinking): Record<string, unknown> {
  if (model.startsWith("kimi-k3")) return { reasoning_effort: level === "off" || level === "on" ? "low" : level };
  if (model.startsWith("kimi-k2.6")) return { thinking: { type: level === "off" ? "disabled" : "enabled" } };
  return {};
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// TWO-STEP SIGN IN. A reader who turned it on is served only on a session that
// entered the code: a password alone makes a session at aal1, and the code
// lifts it to aal2. auth.getUser() has just checked this token with the auth
// server, so its claims can be read here without checking it again, and the
// factors come from that same live answer rather than from anything the page
// sent. A token that cannot be read owes the code: the side to fail on is the
// closed one.
function owesCode(req: Request, user: { factors?: { status?: string }[] | null }): boolean {
  if (!(user.factors ?? []).some((f) => f.status === "verified")) return false;
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const p = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(p + "===".slice((p.length + 3) % 4))).aal !== "aal2";
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------------------
// The shape of a reading. The same fields the Codex's Oracle rendered, so the
// page can lay it out the same way; the in-depth reading adds four.

const str = { type: "string" } as const;
const SCHEMA = {
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

const DEEP_SCHEMA = {
  ...SCHEMA,
  required: [...SCHEMA.required, "chapters", "timing", "shadowWork", "journalPrompts"],
  properties: {
    ...SCHEMA.properties,
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

// The Cycle Audit's shape: one entry per passage the dossier names, each with
// its Tax and its Dividend as short lists (the page draws them as a ledger, one
// line to a row), and three questions, each drawn from one of the three
// systems, so the stars, the design and the numbers each ask one. A long view
// runs across them.
const CYCLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "epigraph", "overview", "passages", "longView", "mantra"],
  properties: {
    title: str,
    epigraph: str,
    overview: str,
    passages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["contact", "window", "tax", "dividend", "prompts"],
        properties: {
          contact: str, window: str,
          tax: { type: "array", items: str },
          dividend: { type: "array", items: str },
          prompts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["system", "question"],
              properties: { system: { type: "string", enum: ["stars", "design", "numbers"] }, question: str },
            },
          },
        },
      },
    },
    longView: str,
    mantra: str,
  },
};

// An in-depth reading is written in two calls, because one call for all of it
// ran past what the function may take. Part a is the standard fields written
// deeper; part b is the four fields only the in-depth reading has. The page asks
// for a, then for b, and b answers with the two joined.
const DEEP_B_SCHEMA = {
  ...DEEP_SCHEMA,
  required: ["chapters", "timing", "shadowWork", "journalPrompts"],
  properties: {
    chapters: DEEP_SCHEMA.properties.chapters,
    timing: DEEP_SCHEMA.properties.timing,
    shadowWork: DEEP_SCHEMA.properties.shadowWork,
    journalPrompts: DEEP_SCHEMA.properties.journalPrompts,
  },
};

// ---------------------------------------------------------------------------
// The voice: the Celestial Codex's instructions, copied from its
// horoscope_POST handler word for word, so the Oracle is asked exactly what the
// Codex asked. inCommon's one rule on top of them, no dash of either kind, is
// applied to what comes back (clean(), below) rather than written in here.

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

// The in-depth reading's two halves. Each is the instructions above cut to the
// fields it writes, so the text the model is held to is the same text.
const DEEP_A_INSTRUCTIONS = `${INSTRUCTIONS}

THIS IS THE FIRST HALF OF AN IN-DEPTH LUMINARY READING. Go far deeper than a standard horoscope, like a private session with a master astrologer.
- Use the ENTIRE chart in the dossier: nodes, Black Moon Lilith, Chiron, Ceres, Pallas, Juno, Vesta, Eris, the Vertex, Part of Fortune, East Point, and minor aspects, alongside the planets, houses, Human Design gates/channels and numerology cycles.
- overview: 3 rich paragraphs.
- keyTransits: 4-8 items.
Write only the fields in the schema. The chapters, timing, shadow work and journal prompts are written in a second pass.`;

const DEEP_B_INSTRUCTIONS = `${INSTRUCTIONS.split("Field guidance:")[0]}Field guidance:
THIS IS THE SECOND HALF OF AN IN-DEPTH LUMINARY READING. The first half (title, overview, the three systems, love, work, spirit, ritual, mantra, colour and key transits) is already written. Go far deeper, like a private session with a master astrologer, and write only the fields below.
- Use the ENTIRE chart in the dossier: nodes, Black Moon Lilith, Chiron, Ceres, Pallas, Juno, Vesta, Eris, the Vertex, Part of Fortune, East Point, and minor aspects, alongside the planets, houses, Human Design gates/channels and numerology cycles.
- chapters: 5-7 chapters, each a distinct theme of the period (for example a key transit, a sensitive point being activated, a relationship theme, a vocational theme, a healing theme), each with an evocative heading and 2 substantial paragraphs (separate with a blank line) naming the exact placements and transits involved.
- timing: 3-6 windows within the period (dates or day ranges, or phases like "the waxing half"), each with specific guidance.
- shadowWork: one paragraph of compassionate shadow work tied to Lilith, Chiron, Pluto, or a challenging aspect in the dossier.
- journalPrompts: 3-5 probing questions.`;

// The Cycle Audit's instructions are inCommon's, written for it on 18 October
// 2026, and they carry the app's rules for interpretive writing: a reading says
// what a contact offers and asks, never what the reader is, and its questions
// are ones only the reader can close.
const CYCLE_INSTRUCTIONS = `You are the Oracle of the Celestial Codex, writing a Cycle Audit: a reading of the long passages the slow astral bodies (Saturn, Uranus, Neptune and Pluto) make across one person's natal chart in the years ahead. Every passage in the dossier is a real contact with real dates. Write about those passages and nothing else.
Write in second person, in luminous, precise prose, grounding every image in a placement, house, aspect or date the dossier names. Call the bodies by name or call them astral bodies; never use the word planet.
Each passage is read in two directions. The Tax is what a passage of this kind traditionally asks a person to set down: habits, defences and certainties the contact presses on. The Dividend is what it builds in their place once that work is done. Write both as what the passage offers and asks, never as a verdict on the person. Do not diagnose. Do not say what the reader is, has been or has done; never write "you are". Do not assume the reader carries the habit being named: offer it as a possibility they may recognise or set aside.
Never call a passage good or bad. A hard aspect is pressure that builds something; an easy one is a gift that asks to be used. Never predict death, illness, accident, separation or disaster, and never give medical, legal or financial directives.
Field guidance:
- title: a poetic 3-7 word title for the whole cycle.
- epigraph: one lyrical sentence.
- overview: 2 paragraphs (separate with a blank line) on the arc the passages make together, in the order they arrive.
- passages: one item for each passage in the dossier, in the dossier's order. contact: the passage's name exactly as the dossier writes it. window: its dates in words, as the dossier gives them. tax: 3 to 5 short lines, each under 15 words and each one thing the passage asks to be set down, ledger entries rather than sentences of a paragraph. dividend: 3 to 5 short lines in the same form, each one thing it builds in that place. prompts: exactly 3 journal questions specific to this passage, one for each system: system "stars" asks through the passage itself, its astral body, aspect, natal point and house; system "design" asks through the reader's Human Design type, strategy and authority as the dossier gives them; system "numbers" asks through the reader's Life Path. Each is a question only the reader can answer, none of them leading toward an answer.
- longView: one paragraph on how the earlier passages prepare the ground for the later ones, naming them and their years.
- mantra: one short line.`;

// ---------------------------------------------------------------------------
// The period: the Codex's horoscopePeriod, from the local date the page sends.
// The daily key is the date, the weekly key the Monday that starts the week,
// the monthly key the month. The week's label says "to" where the Codex wrote
// a dash, which is the only change.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function periodOf(period: string, localDate: string) {
  const [y, m, d] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  if (period === "cycle") return { key: "cycle", label: "The Cycle Audit" };
  if (period === "daily") return { key: localDate, label: `${MONTHS[m - 1]} ${d}, ${y}` };
  if (period === "monthly") return { key: `${y}-${String(m).padStart(2, "0")}`, label: `${MONTHS[m - 1]} ${y}` };
  const dow = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date.getTime() - dow * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const fmt = (x: Date) => `${MONTHS[x.getUTCMonth()].slice(0, 3)} ${x.getUTCDate()}`;
  return { key: monday.toISOString().slice(0, 10), label: `Week of ${fmt(monday)} to ${fmt(sunday)}` };
}

// The model is asked for JSON against a schema. What comes back is read
// leniently all the same, because a fence around it is not worth a failed
// reading that was already paid for.
function parseReading(text: string): Record<string, unknown> | null {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try {
    const v = JSON.parse(text.slice(a, b + 1));
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

// A local date anywhere on Earth is within a day and a half of the server's.
function plausibleDate(localDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return false;
  const t = Date.parse(localDate + "T12:00:00Z");
  return Number.isFinite(t) && Math.abs(t - Date.now()) < 1.5 * 864e5;
}

async function shortHash(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// EMPHASIS AND VOICE (owner, 13 October 2026). Two readers with the same chart
// are written for separately, and the owner wants that kept and made sure of:
// two readings of one chart differ in what they lead with and in how they
// sound, never in what they say about the sky. So each reading is handed one
// lens, one register and one well of imagery (240 combinations), chosen from a hash of the reader and the period, and
// a line holding every fact to the dossier. The same reader keeps the same pair
// for a period, so both halves of an in-depth reading match, and the next
// period turns to another. It goes in the user message, after the request
// line: the system message is the Codex's text word for word and stays the
// part Kimi's cache serves.
const EMPHASES = [
  "the transit closest to exact, and what it asks for now",
  "the Human Design authority, and how decisions land this period",
  "the personal year, month and day numbers, and the rhythm they set",
  "the Moon and the emotional tide underneath the period",
  "the houses and angles the sky is touching, and where in life that falls",
  "relationships, and what is given and received between people",
  "vocation, and the work of the hands and the mind",
  "the body, rest and the pace of the days",
];
const VOICES = [
  "intimate and quiet, like a letter written by lamplight",
  "bright and kinetic, sentences that move and turn",
  "measured and scholarly, with an astronomer's calm",
  "warm and conversational, like a trusted friend across a table",
  "mythic, drawing on the old stories behind the bodies named",
  "grounded and spare, letting the sky's own images carry the colour",
];
const IMAGERY = [
  "light, the night sky and the turning of the heavens",
  "water: tides, rivers, rain and the sea",
  "the garden and the seasons: seed, root, harvest and fallow",
  "thresholds and architecture: doors, stairs, rooms and windows",
  "roads and journeys: maps, crossings and the miles between",
];
async function voiceFor(userId: string, period: string, key: string) {
  const h = await shortHash(`${userId}|${period}|${key}`);
  const emphasis = EMPHASES[parseInt(h.slice(0, 4), 16) % EMPHASES.length];
  const voice = VOICES[parseInt(h.slice(4, 8), 16) % VOICES.length];
  const imagery = IMAGERY[parseInt(h.slice(8, 12), 16) % IMAGERY.length];
  return `Lead with ${emphasis}, and let that set the order of the reading. Within the style above, write in a voice that is ${voice}, and draw your images mostly from ${imagery}. ` +
    "This shapes emphasis and voice only: every placement, sign, house, aspect, gate, channel, number and date must be exactly as the dossier states, and nothing may be added that the dossier does not contain.";
}

// No dash of either kind reaches the page, whatever the model writes. Built
// from char codes so this file obeys the rule it enforces.
const EM = String.fromCharCode(8212), EN = String.fromCharCode(8211);
const RANGE = new RegExp(`(\\d)\\s*[${EM}${EN}]\\s*(\\d)`, "g");
const DASH = new RegExp(`\\s*[${EM}${EN}]\\s*`, "g");
function clean(v: unknown): unknown {
  if (typeof v === "string") return v.replace(RANGE, "$1 to $2").replace(DASH, ", ");
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]));
  return v;
}

// THE APPS READ THE CYCLE AUDIT FREE, by the owner's decision of 18 October
// 2026, and what tells this function a request came from one is the origin
// Capacitor gives its web view: capacitor://localhost on iOS and
// https://localhost on Android (native/capacitor.config.json). A browser page
// cannot write that header, so the website is held to the payment. A script
// outside a browser can, and that is accepted on purpose: what it would get is
// what installing the app gives anybody for nothing.
const APP_ORIGINS = new Set(["capacitor://localhost", "https://localhost"]);
const fromApp = (req: Request) => APP_ORIGINS.has(req.headers.get("Origin") ?? "");

// Whether the add-ons are open to this reader: an admin, a request from the
// apps, a Codex Luminary payment, or a live subscription from before the one
// time payment replaced it, here or in the apps.
// The client is the service role one the handler made; only three reads are
// asked of it here.
// deno-lint-ignore no-explicit-any
async function opened(db: any, req: Request, user: { id: string; email?: string; email_confirmed_at?: string | null }): Promise<boolean> {
  if (isAdmin(user) || fromApp(req)) return true;
  const once = await db.from("luminary_unlocks").select("user_id").eq("user_id", user.id).maybeSingle();
  if (once.data) return true;
  const live = (row: { status?: string; current_period_end?: string | null } | null, ok: (s: string) => boolean) => {
    const end = row?.current_period_end ? Date.parse(row.current_period_end) : null;
    return !!row && ok(String(row.status)) && (end === null || end > Date.now());
  };
  const sub = await db.from("subscriptions").select("status, current_period_end").eq("user_id", user.id).maybeSingle();
  if (live(sub.data as { status?: string; current_period_end?: string | null } | null, (s) => ACTIVE.has(s))) return true;
  const app = await db.from("store_subscriptions").select("status, current_period_end").eq("user_id", user.id).maybeSingle();
  return live(app.data as { status?: string; current_period_end?: string | null } | null, (s) => s === "active");
}

// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { code: "METHOD" });

  const started = Date.now();
  const apiKey = Deno.env.get("MOONSHOT_API_KEY");

  // Who is asking comes from their session token, never from the body.
  const url = Deno.env.get("SUPABASE_URL")!;
  const asReader = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: who } = await asReader.auth.getUser();
  const user = who?.user;
  if (!user) return reply(401, { code: "SIGNED_OUT" });
  if (owesCode(req, user)) return reply(401, { code: "MFA_REQUIRED" });

  // The table is written only from here. A reader may read their own rows and
  // nothing else, so nobody can add, change or remove the rows the daily limit
  // counts. The service role key is provided to every Edge Function by
  // Supabase and never leaves the server.
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const mine = () => db.from("oracle_readings");

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { code: "BAD_REQUEST" }); }

  // OMNI TAROT. No model and nothing stored: the same seed, count and topic
  // always give the same reading, so there is nothing to keep or to limit.
  if (body.kind === "tarot") {
    const T = g.Tarot, omni = g.TarotOmni;
    if (!T || typeof omni !== "function") { console.error("oracle: tarot.js or tarot-omni.js did not load"); return reply(500, { code: "STORE" }); }
    const seed = Number(body.seed), count = Number(body.count), topic = String(body.topic ?? "general");
    if (!Number.isInteger(seed) || seed < 1 || seed > 2147483647 || T.DEPTHS.omni.counts.indexOf(count) === -1 || !T.TOPICS[topic]) {
      return reply(400, { code: "BAD_REQUEST" });
    }
    if (!(await opened(db, req, user))) return reply(402, { code: "PREMIUM_REQUIRED" });
    const r = T.read({ count, topic, depth: "omni", seed, omni });
    if (!r) return reply(500, { code: "STORE" });
    return reply(200, { reading: { title: r.title, passages: r.passages, summary: r.summary, stats: r.stats, seed, count, topic } });
  }

  if (!apiKey) return reply(404, { code: "NOT_SET_UP" });
  // The Codex's request: a period, a depth, the reader's local date, and the
  // dossier the page built from the chart.
  const period = String(body.period ?? "");
  const depth = String(body.depth ?? "standard");
  const localDate = String(body.localDate ?? "");
  const dossier = String(body.dossier ?? "");
  if (!["daily", "weekly", "monthly", "cycle"].includes(period) || !["standard", "deep"].includes(depth)) return reply(400, { code: "BAD_REQUEST" });
  const cycle = period === "cycle";
  if (cycle && depth !== "standard") return reply(400, { code: "BAD_REQUEST" });
  if (!plausibleDate(localDate) || !dossier || dossier.length > 20000) return reply(400, { code: "BAD_REQUEST" });

  // The profile the dossier was written from (server/migrations/0006). It is
  // stored with the reading so the server can withdraw what was written from
  // a profile that stops being saved to the account or is marked as somebody
  // else's; a reading of such a profile is handed back and not kept, which
  // the table's own trigger decides. An id that is not a profile of this
  // reader's account is not stored. A profile marked as somebody else's is
  // refused before anything is asked or counted: the Oracle writes for the
  // reader (HD-STUDY-MODEL.md section 13, item 3).
  let profileId: string | null = typeof body.profileId === "string" && UUID.test(body.profileId) ? body.profileId : null;
  if (profileId) {
    const p = await db.from("profiles").select("account_id").eq("id", profileId).maybeSingle();
    if (p.error) { console.error("oracle: reading the profile failed", p.error); return reply(500, { code: "STORE" }); }
    if (p.data && p.data.account_id !== user.id) profileId = null;
  }
  if (profileId) {
    const mark = await db.from("consent_events").select("action").eq("profile_id", profileId).eq("scope", "forOther")
      .order("ts", { ascending: false }).limit(1).maybeSingle();
    if (mark.error) { console.error("oracle: reading the ledger failed", mark.error); return reply(500, { code: "STORE" }); }
    if (mark.data?.action === "grant") return reply(403, { code: "FOR_OTHER" });
  }

  const deep = depth === "deep";
  // An in-depth reading is two calls (see DEEP_B_SCHEMA). A caller that names no
  // part gets the first, whose stored rows are the key old full readings sit on.
  const part: "a" | "b" = deep && body.part === "b" ? "b" : "a";

  // In depth is an add-on, and it is asked for before the stored reading is
  // looked up, as the Codex did: a subscription that has lapsed does not keep
  // reading what it paid for on another device.
  if (deep && !(await opened(db, req, user))) return reply(402, { code: "PREMIUM_REQUIRED" });

  // The Cycle Audit is an add-on, asked for before anything else like the
  // in-depth reading above.
  if (cycle && !(await opened(db, req, user))) return reply(402, { code: "PREMIUM_REQUIRED" });

  const { key, label } = periodOf(period, localDate);
  // The Codex keeps one reading per person and deletes them when the birth
  // data changes. inCommon keeps several people on one device and the server
  // never sees a birth, so the dossier's hash does that job.
  const chartKey = await shortHash(dossier);
  // The second half lives under the same hash with a suffix, so the table and
  // its unique index need no change.
  const same = { user_id: user.id, period, period_key: key, depth, chart_key: part === "b" ? chartKey + ".b" : chartKey };

  // The second half is written to follow the first and is returned joined to
  // it, so it can only be asked for once the first is done. A first half that
  // was handed back and not kept ('served', see profileId above) has no
  // content to join; the second comes back alone and the app joins the two.
  let first: Record<string, unknown> | null = null;
  if (part === "b") {
    const a = await mine().select("content").match({ ...same, chart_key: chartKey }).in("status", ["done", "served"]).limit(1).maybeSingle();
    if (!a.data) return reply(400, { code: "BAD_REQUEST" });
    first = (a.data.content as Record<string, unknown> | null) ?? null;
  }

  // Already written for this chart and period: hand it back, free.
  const done = await mine().select("content").match({ ...same, status: "done" }).limit(1).maybeSingle();
  if (done.data?.content) return reply(200, { reading: first ? { ...first, ...done.data.content } : done.data.content, cached: true, periodKey: key, label });

  // A request that died mid write (the function was stopped) would otherwise
  // hold its key forever.
  const stale = new Date(Date.now() - 5 * 60e3).toISOString();
  await mine().update({ status: "failed" }).match({ user_id: user.id, status: "pending" }).lt("created_at", stale);

  // Being written already, by the press before a reload, another tab or
  // another device: say so before the limit is counted. That row is one of
  // the ones counted, and a reader waiting on it has not asked for anything
  // new, so the page's asking again while it waits must never read as LIMIT.
  const writing = await mine().select("id").match({ ...same, status: "pending" }).limit(1).maybeSingle();
  if (writing.data) return reply(409, { code: "PENDING" });

  // The limit counts attempts that wrote or are writing a reading. A failed
  // attempt delivered nothing, so it does not use one up; a timeout must not
  // cost the reader one of their readings. Failures are still bounded, at
  // four times the limit, so a broken request cannot run up Kimi's bill
  // without end. An in-depth reading is one attempt however many calls write
  // it: the second halves (chart_key ending .b) are counted on their own.
  const since = new Date(Date.now() - 864e5).toISOString();
  const recent = await mine().select("status, chart_key").eq("user_id", user.id).gte("created_at", since);
  if (recent.error) { console.error("oracle: counting failed", recent.error); return reply(500, { code: "STORE" }); }
  const mineNow = (recent.data ?? []).filter((r) => String(r.chart_key).endsWith(".b") === (part === "b"));
  const kept = mineNow.filter((r) => r.status !== "failed").length;
  if (kept >= DAILY_LIMIT || mineNow.length >= DAILY_LIMIT * 4) return reply(429, { code: "LIMIT" });

  // Claim the key before paying for it. The partial unique index in schema.sql
  // lets only one pending or finished row exist per key, so a second press, or
  // a second tab, waits rather than paying twice.
  const claim = await mine().insert({ ...same, status: "pending", profile_id: profileId }).select("id").single();
  if (claim.error) {
    if (claim.error.code === "23505") return reply(409, { code: "PENDING" });
    console.error("oracle: claiming the row failed", claim.error);
    return reply(500, { code: "STORE" });
  }
  const rowId = claim.data.id;
  // A request refused before any writing began costs nothing and is released;
  // anything after that counts toward the limit.
  const release = () => mine().delete().eq("id", rowId);
  const fail = () => mine().update({ status: "failed" }).eq("id", rowId);

  const model = deep ? DEEP_MODEL : MODEL;
  const schema = cycle ? CYCLE_SCHEMA : !deep ? SCHEMA : part === "b" ? DEEP_B_SCHEMA : SCHEMA;
  const instructions = cycle ? CYCLE_INSTRUCTIONS : !deep ? INSTRUCTIONS : part === "b" ? DEEP_B_INSTRUCTIONS : DEEP_A_INSTRUCTIONS;
  const ask = cycle ? "Compose the CYCLE AUDIT."
    : `Compose the ${deep ? (part === "b" ? "SECOND HALF OF THE IN-DEPTH " : "FIRST HALF OF THE IN-DEPTH ") : ""}${period.toUpperCase()} horoscope for ${label}.`;
  const voice = await voiceFor(user.id, period, key);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), Math.max(10e3, TIME_LIMIT_MS - (Date.now() - started)));
  let status = 0, raw = "";
  try {
    const res = await fetch(KIMI, {
      method: "POST",
      signal: ctl.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        // The instructions go first and never change, so Kimi's context cache
        // serves them at a sixth of the price after the first reading.
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: `${ask}\n\n${voice}\n\nDOSSIER:\n${dossier}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: cycle ? "cycle_audit" : "horoscope", strict: true, schema } },
        max_completion_tokens: deep ? 10000 : 8000,
        ...thinkingFor(model, deep ? DEEP_THINKING : "off"),
      }),
    });
    status = res.status;
    raw = await res.text();
  } catch (err) {
    if (ctl.signal.aborted) {
      // Kimi was writing, so this was paid for and it counts.
      await fail();
      console.error(`oracle: Kimi had not finished after ${Math.round((Date.now() - started) / 1000)}s; see ORACLE_TIME_LIMIT in docs/ORACLE-SETUP.md`);
      return reply(504, { code: "TIMEOUT" });
    }
    // Kimi could not be reached at all, so nothing was written or paid for.
    await release();
    console.error("oracle: Kimi could not be reached", err);
    return reply(503, { code: "OUT_OF_CREDITS" });
  } finally {
    clearTimeout(timer);
  }

  if (status !== 200) {
    let type = "";
    try { type = String(JSON.parse(raw)?.error?.type ?? ""); } catch { /* not JSON */ }
    console.error(`oracle: Kimi answered ${status} ${type}`, raw.slice(0, 400));
    // The Codex's two codes: a provider rate limit is RATE_LIMITED, and every
    // other refusal or failure of the provider is OUT_OF_CREDITS. A request
    // Kimi turned away before writing cost nothing and is released.
    if (status === 429 && type !== "exceeded_current_quota_error") { await release(); return reply(429, { code: "RATE_LIMITED" }); }
    if (status === 429 || status === 401 || status === 403 || status === 404 || status >= 500) {
      if (status === 429) console.error("oracle: the Kimi balance has run out; top it up at platform.kimi.ai");
      if (status === 401) console.error("oracle: the MOONSHOT_API_KEY secret was refused");
      if (status === 404) console.error(`oracle: Kimi has no model named ${model}; check ORACLE_MODEL and ORACLE_DEEP_MODEL`);
      await release();
      return reply(503, { code: "OUT_OF_CREDITS" });
    }
    if (status === 400 && /content_filter/i.test(type + raw)) { await fail(); return reply(502, { code: "REFUSED" }); }
    await fail();
    return reply(500, { code: "MODEL" });
  }

  let data: { model?: string; choices?: { finish_reason?: string; message?: { content?: string | null } }[] };
  try { data = JSON.parse(raw); } catch { await fail(); return reply(500, { code: "MODEL" }); }
  const choice = data.choices?.[0];
  if (choice?.finish_reason === "content_filter") { await fail(); return reply(502, { code: "REFUSED" }); }
  if (choice?.finish_reason === "length") { await fail(); return reply(500, { code: "TOO_LONG" }); }
  const parsed = parseReading(choice?.message?.content ?? "");
  if (!parsed || !schema.required.every((k) => parsed[k] != null)) {
    await fail();
    console.error("oracle: Kimi's answer was not a whole reading", String(choice?.message?.content ?? "").slice(0, 400));
    return reply(500, { code: "MODEL" });
  }
  const reading = clean(parsed) as Record<string, unknown>;

  await mine().update({ status: "done", content: reading, model: data.model ?? model }).eq("id", rowId);
  return reply(200, { reading: first ? { ...first, ...reading } : reading, cached: false, periodKey: key, label });
});
