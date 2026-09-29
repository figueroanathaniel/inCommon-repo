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
// every reading costs money, and otherwise asks Claude with the Codex's own
// instructions and schema, and returns the JSON the page renders.
//
// Secrets it reads: ANTHROPIC_API_KEY (required). ORACLE_MODEL,
// ORACLE_DAILY_LIMIT and ORACLE_DEEP_EFFORT are optional knobs. SUPABASE_URL,
// SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase
// itself. The table it writes is in schema.sql beside this file.

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("ORACLE_MODEL") ?? "claude-opus-5-5";
const DAILY_LIMIT = Number(Deno.env.get("ORACLE_DAILY_LIMIT") ?? "6");
// The Codex's own effort levels: low for a standard reading, medium for an
// in-depth one. ORACLE_DEEP_EFFORT can lower the second if in-depth readings
// run into Supabase's time limit (docs/ORACLE-SETUP.md).
type Effort = "low" | "medium" | "high";
const DEEP_EFFORT: Effort = (["low", "medium", "high"] as const).find((e) => e === Deno.env.get("ORACLE_DEEP_EFFORT")) ?? "medium";

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

const DEEP_INSTRUCTIONS = `${INSTRUCTIONS}

THIS IS AN IN-DEPTH LUMINARY READING. Go far deeper than a standard horoscope, like a private session with a master astrologer.
- Use the ENTIRE chart in the dossier: nodes, Black Moon Lilith, Chiron, Ceres, Pallas, Juno, Vesta, Eris, the Vertex, Part of Fortune, East Point, and minor aspects, alongside the planets, houses, Human Design gates/channels and numerology cycles.
- overview: 3 rich paragraphs.
- chapters: 5-7 chapters, each a distinct theme of the period (for example a key transit, a sensitive point being activated, a relationship theme, a vocational theme, a healing theme), each with an evocative heading and 2 substantial paragraphs (separate with a blank line) naming the exact placements and transits involved.
- timing: 3-6 windows within the period (dates or day ranges, or phases like "the waxing half"), each with specific guidance.
- shadowWork: one paragraph of compassionate shadow work tied to Lilith, Chiron, Pluto, or a challenging aspect in the dossier.
- journalPrompts: 3-5 probing questions.
- keyTransits: 4-8 items.`;

// ---------------------------------------------------------------------------
// The period: the Codex's horoscopePeriod, from the local date the page sends.
// The daily key is the date, the weekly key the Monday that starts the week,
// the monthly key the month. The week's label says "to" where the Codex wrote
// a dash, which is the only change.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function periodOf(period: string, localDate: string) {
  const [y, m, d] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  if (period === "daily") return { key: localDate, label: `${MONTHS[m - 1]} ${d}, ${y}` };
  if (period === "monthly") return { key: `${y}-${String(m).padStart(2, "0")}`, label: `${MONTHS[m - 1]} ${y}` };
  const dow = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date.getTime() - dow * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const fmt = (x: Date) => `${MONTHS[x.getUTCMonth()].slice(0, 3)} ${x.getUTCDate()}`;
  return { key: monday.toISOString().slice(0, 10), label: `Week of ${fmt(monday)} to ${fmt(sunday)}` };
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
  // The Codex's request: a period, a depth, the reader's local date, and the
  // dossier the page built from the chart.
  const period = String(body.period ?? "");
  const depth = String(body.depth ?? "standard");
  const localDate = String(body.localDate ?? "");
  const dossier = String(body.dossier ?? "");
  if (!["daily", "weekly", "monthly"].includes(period) || !["standard", "deep"].includes(depth)) return reply(400, { code: "BAD_REQUEST" });
  if (!plausibleDate(localDate) || !dossier || dossier.length > 20000) return reply(400, { code: "BAD_REQUEST" });

  const { key, label } = periodOf(period, localDate);
  // The Codex keeps one reading per person and deletes them when the birth
  // data changes. inCommon keeps several people on one device and the server
  // never sees a birth, so the dossier's hash does that job.
  const chartKey = await shortHash(dossier);
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
  const deep = depth === "deep";

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
        effort: deep ? DEEP_EFFORT : "low",
        format: { type: "json_schema", schema: deep ? DEEP_SCHEMA : SCHEMA },
      },
      system: [{ type: "text", text: deep ? DEEP_INSTRUCTIONS : INSTRUCTIONS, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Compose the ${deep ? "IN-DEPTH " : ""}${period.toUpperCase()} horoscope for ${label}.\n\nDOSSIER:\n${dossier}`,
      }],
    }).finalMessage();
  } catch (err) {
    // The Codex's two codes: a provider rate limit is RATE_LIMITED, and every
    // other refusal or failure of the provider is OUT_OF_CREDITS.
    if (err instanceof Anthropic.RateLimitError) { await release(); return reply(429, { code: "RATE_LIMITED" }); }
    if (err instanceof Anthropic.AuthenticationError) { await release(); console.error("oracle: the ANTHROPIC_API_KEY secret was refused"); return reply(503, { code: "OUT_OF_CREDITS" }); }
    if (err instanceof Anthropic.APIError && (err.status === 529 || (err.status ?? 0) >= 500 || err.status === 402 || err.status === 403)) { await release(); return reply(503, { code: "OUT_OF_CREDITS" }); }
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
