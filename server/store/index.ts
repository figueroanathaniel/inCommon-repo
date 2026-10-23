// server/store/index.ts: Codex Luminary bought inside the apps, a Supabase
// Edge Function.
//
// WHAT IT IS. The iPhone and Android apps sell Luminary through Apple's In-App
// Purchase and Google Play Billing, decided by the owner on 12 October 2026,
// with RevenueCat between the apps and the two stores: it checks the receipts
// with Apple and Google and keeps one record of what a reader holds. This
// function brings that record into Supabase, as a row in store_subscriptions
// (server/store/schema.sql), so the billing function can show one status and
// the Oracle function can let an in-depth reading through, exactly as a Stripe
// row does. Stripe stays the website's way to pay and is never shown in the apps.
//
// TWO CALLERS, ONE ANSWER. RevenueCat posts its webhook here whenever a
// purchase, renewal, cancellation or expiry happens; the app posts
// { action: "sync" } right after a purchase or a restore, because a reader who
// has just paid should not wait on a webhook. Both do the same thing: ask
// RevenueCat's REST API what this reader holds now, and write that. Nothing in
// either request is believed about the purchase itself: a webhook body only
// names WHO to look up, and the app's call can only name the reader whose
// token it carries. So a forged webhook can at most make this function look a
// reader up again, and a page cannot make itself a Luminary.
//
// WHO A READER IS TO REVENUECAT. The app configures RevenueCat with the
// reader's Supabase user id as the app user id, so the ids match and no table
// maps one to the other. Anonymous RevenueCat ids ($RCAnonymousID:...) belong to
// nobody signed in here and are skipped.
//
// Deployed with JWT verification OFF, like billing, because RevenueCat cannot
// send a Supabase token. The webhook is believed only when its Authorization
// header is exactly REVENUECAT_WEBHOOK_AUTH, the value set beside the webhook
// in RevenueCat; every other request must carry a reader's token, which
// auth.getUser() checks with the auth server, and owes the two-step code like
// every other function here.
//
// Secrets: REVENUECAT_SECRET_KEY (a secret API key, v1, from RevenueCat's
// project settings; never in the repository or the app) and
// REVENUECAT_WEBHOOK_AUTH. REVENUECAT_ENTITLEMENT is optional and defaults to
// "luminary". SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are
// provided by Supabase. Setup: docs/REVENUECAT-SETUP.md.
//
// WHY IT IS NOT UNDER supabase/functions: see server/oracle/index.ts.

import { createClient } from "npm:@supabase/supabase-js@2";

const API = "https://api.revenuecat.com/v1/subscribers/";
const SECRET = Deno.env.get("REVENUECAT_SECRET_KEY") ?? "";
const HOOK_AUTH = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? "";
const ENTITLEMENT = Deno.env.get("REVENUECAT_ENTITLEMENT") || "luminary";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// The same rule as server/billing, server/oracle and server/account.
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

// Compared in constant time, so the answer's timing says nothing about how
// much of a guessed header was right.
function sameSecret(a: string, b: string): boolean {
  if (!a || !b) return false;
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const url = Deno.env.get("SUPABASE_URL")!;
const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

type Sub = {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  store?: string;
  unsubscribe_detected_at?: string | null;
  billing_issues_detected_at?: string | null;
  is_sandbox?: boolean;
  refunded_at?: string | null;
};
type Subscriber = {
  entitlements?: Record<string, { expires_date?: string | null; grace_period_expires_date?: string | null; product_identifier?: string }>;
  subscriptions?: Record<string, Sub>;
  management_url?: string | null;
};

class UpstreamError extends Error {}

// Which store sold it, in this table's words. A Stripe purchase made through
// RevenueCat's own Stripe link is not one this app makes, and is left to the
// billing function, which owns Stripe.
const SOURCE: Record<string, "apple" | "google" | "promotional"> = {
  app_store: "apple", mac_app_store: "apple", play_store: "google", promotional: "promotional",
};

// The plan from the product id. The ids are the owner's to choose in App Store
// Connect and Play Console (docs/REVENUECAT-SETUP.md names them), and Google
// writes a subscription as "<subscription>:<base plan>", so this reads the
// words rather than matching one exact string.
export function planOf(product: string | undefined): "monthly" | "annual" | null {
  const p = String(product ?? "").toLowerCase();
  if (/annual|year|yearly|p1y|12m/.test(p)) return "annual";
  if (/month|p1m/.test(p)) return "monthly";
  return null;
}

const later = (a: string | null | undefined, b: string | null | undefined) =>
  !a ? b ?? null : !b ? a : Date.parse(a) >= Date.parse(b) ? a : b;

// What a reader holds, read from RevenueCat's answer: the entitlement decides
// whether they are a Luminary, and the subscription behind it says from where,
// until when, and whether it renews. An entitlement with no end date is
// lifetime, which only a promotional grant can be here.
export function rowFrom(userId: string, s: Subscriber, now = Date.now()) {
  const ent = s.entitlements?.[ENTITLEMENT];
  if (!ent) return null;
  const product = ent.product_identifier ?? "";
  const sub: Sub = s.subscriptions?.[product] ?? {};
  const source = SOURCE[String(sub.store ?? "")];
  if (!source) return null;
  const end = later(ent.expires_date, ent.grace_period_expires_date);
  const active = !sub.refunded_at && (end === null || Date.parse(end) > now);
  return {
    user_id: userId,
    source,
    status: active ? "active" : "expired",
    product_id: product || null,
    plan: planOf(product),
    current_period_end: end,
    will_renew: active && !sub.unsubscribe_detected_at && end !== null,
    billing_issue: !!sub.billing_issues_detected_at,
    sandbox: !!sub.is_sandbox,
    management_url: typeof s.management_url === "string" ? s.management_url : null,
    updated_at: new Date(now).toISOString(),
  };
}

// Asks RevenueCat what this reader holds and writes it. A reader with no
// entitlement from a store has their row removed rather than kept as expired
// forever: the row is a record of an app subscription, and there is none.
async function refresh(userId: string): Promise<ReturnType<typeof rowFrom>> {
  const res = await fetch(API + encodeURIComponent(userId), {
    headers: { Authorization: "Bearer " + SECRET, Accept: "application/json" },
  });
  if (!res.ok) throw new UpstreamError("RevenueCat answered " + res.status);
  const body = await res.json() as { subscriber?: Subscriber };
  const row = rowFrom(userId, body.subscriber ?? {});
  if (row) {
    const { error } = await db.from("store_subscriptions").upsert(row, { onConflict: "user_id" });
    // A reader deleted since they bought: the foreign key refuses the row, and
    // there is nobody left to record it for.
    if (error && !/foreign key|23503/i.test(error.message + " " + (error.code ?? ""))) throw error;
  } else {
    const { error } = await db.from("store_subscriptions").delete().eq("user_id", userId);
    if (error) throw error;
  }
  return row;
}

// The ids a webhook names. A transfer (a restore that moved a purchase from
// one app user to another) names both sides, and both have changed.
export function idsOf(event: Record<string, unknown>): string[] {
  const out = new Set<string>();
  const add = (v: unknown) => { if (typeof v === "string" && UUID.test(v)) out.add(v.toLowerCase()); };
  add(event.app_user_id);
  add(event.original_app_user_id);
  for (const k of ["aliases", "transferred_from", "transferred_to"]) {
    const v = event[k];
    if (Array.isArray(v)) v.forEach(add);
  }
  return [...out];
}

async function webhook(req: Request): Promise<Response> {
  let body: { event?: Record<string, unknown> };
  try { body = await req.json(); } catch { return reply(400, { code: "BAD_REQUEST" }); }
  const event = body.event ?? {};
  // RevenueCat's test button sends this, and it names nobody real.
  if (event.type === "TEST") return reply(200, { ok: true });
  const ids = idsOf(event);
  try {
    for (const id of ids) await refresh(id);
  } catch (e) {
    // A 500 makes RevenueCat retry the webhook later, which is what is wanted
    // when RevenueCat itself or the database could not be reached.
    console.error("store: a webhook could not be applied", (e as Error).message);
    return reply(500, { code: "UPSTREAM" });
  }
  return reply(200, { ok: true, readers: ids.length });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { code: "METHOD" });
  if (!SECRET) return reply(503, { code: "NOT_CONFIGURED" });

  if (sameSecret(req.headers.get("Authorization") ?? "", HOOK_AUTH)) return webhook(req);

  const asReader = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: who } = await asReader.auth.getUser();
  const user = who?.user;
  if (!user) return reply(401, { code: "SIGNED_OUT" });
  if (owesCode(req, user)) return reply(401, { code: "MFA_REQUIRED" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { code: "BAD_REQUEST" }); }
  if (body.action !== "sync") return reply(400, { code: "BAD_REQUEST" });

  try {
    const row = await refresh(user.id);
    return reply(200, {
      active: row?.status === "active",
      source: row?.source ?? null,
      plan: row?.plan ?? null,
      currentPeriodEnd: row?.current_period_end ?? null,
    });
  } catch (e) {
    console.error("store: a sync failed", (e as Error).message);
    return reply(502, { code: "UPSTREAM" });
  }
});
