// server/oracle/index.ts: the Oracle, a Supabase Edge Function.
//
// WHY THIS FILE IS HERE AND NOT UNDER supabase/functions. The repository is
// connected to Supabase's GitHub integration, and a supabase/ folder is what
// that integration watches: it can open preview branches, which are billed.
// So the function is kept beside the app and pasted into the dashboard (or
// deployed with the CLI by hand), which docs/ORACLE-SETUP.md walks through.
//
// WHAT IT DOES. The app composes a dossier of chart facts on the device (no
// name, no journal, no birth date, time or place) and asks for a reading for a
// period: today, this week or this month, standard or in depth. This function
// names the reader from their session, returns the reading it already wrote
// for that period and chart if there is one, holds everybody to a daily limit
// because every reading costs money, and otherwise asks Claude to write one in
// the Celestial Codex's shape, as JSON the page renders.
//
// Secrets it reads: ANTHROPIC_API_KEY (required). ORACLE_MODEL,
// ORACLE_DAILY_LIMIT and ORACLE_EFFORT are optional knobs. SUPABASE_URL,
// SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase
// itself. The table it writes is in schema.sql beside this file.

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("ORACLE_MODEL") ?? "claude-opus-5-5";
const DAILY_LIMIT = Number(Deno.env.get("ORACLE_DAILY_LIMIT") ?? "6");
// Low by default: the dossier already holds every fact the reading may use, so
// the work is writing rather than reasoning, and a lower effort is both cheaper
// and faster. Faster matters here, because Supabase stops a function that runs
// too long and an in-depth reading is the longest thing it does.
type Effort = "low" | "medium" | "high";
const EFFORT: Effort = (["low", "medium", "high"] as const).find((e) => e === Deno.env.get("ORACLE_EFFORT")) ?? "low";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
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

// ---------------------------------------------------------------------------
// The voice. The Celestial Codex's own instructions, with inCommon's rules
// added where the app has them: the dossier is the only source of fact, what
// the chart cannot know is not guessed, and no dash of either kind is written.

const INSTRUCTIONS = `You are the Oracle of the Celestial Codex, a master astrologer, Human Design analyst, and numerologist who writes like a poet with an astronomer's precision.
Write a deeply personalized reading in second person that genuinely synthesizes all three systems (tropical astrology transits to the natal chart, Human Design type, strategy, authority and the transiting Sun gate, and numerology personal cycles).
Style: lush, evocative, luminous prose with vivid celestial imagery and metaphor; never generic, never cliche fortune-cookie phrasing. Ground every flourish in a concrete placement, transit, gate, or number from the dossier, naming it explicitly. Offer practical, empowering guidance.
Rules:
- The dossier is the only source of fact. Never invent a placement, aspect, gate, channel, date or number that is not in it. If the dossier says the birth time is unknown, do not mention houses, the Ascendant or the Midheaven.
- Never predict death, illness, or disaster; never give medical, legal, or financial directives.
- Never use an em dash or an en dash. Use commas, colons, or full stops. Write ranges with "to".
Field guidance:
- title: a poetic 3-7 word title for this period.
- epigraph: one lyrical sentence, like an inscription on an astrolabe.
- overview: 2 rich paragraphs (separate with a blank line) weaving all three systems.
- stars: 1 paragraph on the astrological weather and the most important transits.
- design: 1 paragraph applying their Human Design type, strategy, authority and the transiting Sun gate.
- numbers: 1 paragraph on the personal year, month and day numbers in play.
- love, work, spirit: 3-4 sentences each.
- ritual: a small, specific, sensory ritual to perform during this period.
- mantra: one short affirming line.
- auspiciousColor: a single evocative color name.
- keyTransits: 2-4 items, each naming a real transit from the dossier and its meaning in one sentence.`;

const DEEP_INSTRUCTIONS = `${INSTRUCTIONS}

THIS IS AN IN-DEPTH READING. Go far deeper than a standard reading, like a private session with a master astrologer.
- Use every point the dossier gives: the bodies, the nodes, the houses and angles when they are known, the natal aspects, the Human Design gates and channels, and the numerology cycles.
- chapters: 4-6 sections, each with a short evocative heading and 2-3 paragraphs (separate paragraphs with a blank line).
- timing: 3-6 windows of time taken from the dated transits in the dossier, each with when (the dates as the dossier gives them) and guidance (when to act, when to wait).
- shadowWork: 1-2 paragraphs on what this period asks to be met, framed as an invitation, never as a diagnosis of the reader.
- journalPrompts: 3-5 questions only the reader can answer.`;

// ---------------------------------------------------------------------------
// The period, decided here rather than trusted from the page: the key is what
// the cache and the daily limit hang on, so a page cannot mint new keys to get
// new readings.

function localParts(tz: string, d: Date) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" });
  const p: Record<string, number> = {};
  for (const x of f.formatToParts(d)) if (x.type !== "literal") p[x.type] = Number(x.value);
  return { y: p.year, m: p.month, d: p.day };
}

function isoWeek(y: number, m: number, d: number) {
  const t = new Date(Date.UTC(y, m - 1, d));
  const dow = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dow + 3);
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t.getTime() - firstThursday.getTime()) / 864e5 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return { year: t.getUTCFullYear(), week };
}

function periodOf(period: string, tz: string) {
  const now = new Date();
  const { y, m, d } = localParts(tz, now);
  const pad = (n: number) => String(n).padStart(2, "0");
  const noon = new Date(Date.UTC(y, m - 1, d, 12));
  const fmt = (o: Intl.DateTimeFormatOptions, at: Date) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(at);
  if (period === "weekly") {
    const w = isoWeek(y, m, d);
    const monday = new Date(noon);
    monday.setUTCDate(noon.getUTCDate() - ((noon.getUTCDay() + 6) % 7));
    return { key: `${w.year}-W${pad(w.week)}`, label: "The week of " + fmt({ month: "long", day: "numeric" }, monday) };
  }
  if (period === "monthly") return { key: `${y}-${pad(m)}`, label: fmt({ month: "long", year: "numeric" }, noon) };
  return { key: `${y}-${pad(m)}-${pad(d)}`, label: fmt({ weekday: "long", month: "long", day: "numeric" }, noon) };
}

async function shortHash(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
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

// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { code: "METHOD" });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return reply(404, { code: "NOT_SET_UP" });

  // Who is asking comes from their session token, never from the body.
  const url = Deno.env.get("SUPABASE_URL")!;
  const asReader = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: who } = await asReader.auth.getUser();
  const user = who?.user;
  if (!user) return reply(401, { code: "SIGNED_OUT" });

  // The table is written only from here. A reader may read their own rows and
  // nothing else, so nobody can add, change or remove the rows the daily limit
  // counts. The service role key is provided to every Edge Function by
  // Supabase and never leaves the server.
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const mine = () => db.from("oracle_readings");

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { code: "BAD_REQUEST" }); }
  const period = String(body.period ?? "");
  const depth = String(body.depth ?? "standard");
  const natal = String(body.natal ?? "");
  const sky = String(body.sky ?? "");
  if (!["daily", "weekly", "monthly"].includes(period) || !["standard", "deep"].includes(depth)) return reply(400, { code: "BAD_REQUEST" });
  if (!natal || natal.length > 12000 || sky.length > 12000) return reply(400, { code: "BAD_REQUEST" });
  let tz = String(body.tz ?? "UTC");
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); } catch { tz = "UTC"; }

  const { key, label } = periodOf(period, tz);
  const chartKey = await shortHash(natal);
  const same = { user_id: user.id, period, period_key: key, depth, chart_key: chartKey };

  // Already written for this chart and period: hand it back, free.
  const done = await mine().select("content").match({ ...same, status: "done" }).limit(1).maybeSingle();
  if (done.data?.content) return reply(200, { reading: done.data.content, cached: true, periodKey: key, label });

  // A request that died mid write (the function was stopped) would otherwise
  // hold its key forever.
  const stale = new Date(Date.now() - 5 * 60e3).toISOString();
  await mine().update({ status: "failed" }).match({ user_id: user.id, status: "pending" }).lt("created_at", stale);

  // Every reading costs money, so the limit counts attempts, not successes.
  const since = new Date(Date.now() - 864e5).toISOString();
  const recent = await mine().select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
  if (recent.error) { console.error("oracle: counting failed", recent.error); return reply(500, { code: "STORE" }); }
  if ((recent.count ?? 0) >= DAILY_LIMIT) return reply(429, { code: "LIMIT" });

  // Claim the key before paying for it. The partial unique index in schema.sql
  // lets only one pending or finished row exist per key, so a second press, or
  // a second tab, waits rather than paying twice.
  const claim = await mine().insert({ ...same, status: "pending" }).select("id").single();
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

  const anthropic = new Anthropic({ apiKey });
  const deep = depth === "deep";
  let message;
  try {
    message = await anthropic.beta.messages.stream({
      model: MODEL,
      max_tokens: deep ? 32000 : 16000,
      // Refused requests are re-run on the model Anthropic recommends for the
      // refusal's category rather than coming back empty.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: EFFORT,
        format: { type: "json_schema", schema: deep ? DEEP_SCHEMA : SCHEMA },
      },
      system: [{ type: "text", text: deep ? DEEP_INSTRUCTIONS : INSTRUCTIONS, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Write the ${deep ? "in-depth" : "standard"} reading for ${label} (${period}).\n\nNATAL CHART\n${natal}\n\nTHE SKY FOR THIS PERIOD\n${sky}`,
      }],
    }).finalMessage();
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) { await release(); return reply(503, { code: "BUSY" }); }
    if (err instanceof Anthropic.AuthenticationError) { await release(); console.error("oracle: the ANTHROPIC_API_KEY secret was refused"); return reply(500, { code: "KEY" }); }
    if (err instanceof Anthropic.APIError && (err.status === 529 || (err.status ?? 0) >= 500)) { await release(); return reply(503, { code: "BUSY" }); }
    await fail();
    console.error("oracle: the model call failed", err);
    return reply(500, { code: "MODEL" });
  }

  if (message.stop_reason === "refusal") { await fail(); return reply(502, { code: "REFUSED" }); }
  if (message.stop_reason === "max_tokens") { await fail(); return reply(500, { code: "TOO_LONG" }); }
  const text = message.content.find((b: { type: string }) => b.type === "text") as { text?: string } | undefined;
  let reading: unknown;
  try { reading = clean(JSON.parse(text?.text ?? "")); } catch { await fail(); return reply(500, { code: "MODEL" }); }

  await mine().update({ status: "done", content: reading, model: message.model }).eq("id", rowId);
  return reply(200, { reading, cached: false, periodKey: key, label });
});
