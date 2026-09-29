// server/billing/index.ts: Codex Luminary, a Supabase Edge Function.
//
// WHAT IT IS. The Celestial Codex's Stripe subscription, ported from its
// server/lib/stripeServer.ts and its four billing handlers. Luminary is the
// paid tier, and in inCommon the one thing it unlocks is the in-depth Oracle
// reading. The prices are the Codex's: $12.99 a month or $119.99 a year.
//
// ONE FUNCTION, FOUR JOBS. The page posts { action } to it: "status" reads a
// reader's subscription, "checkout" opens a Stripe Checkout page, "portal"
// opens Stripe's billing portal. And Stripe itself posts its webhook here,
// which is told apart by the stripe-signature header it always carries. The
// Codex had four handlers because it had a router; here one function means one
// thing to deploy, one address to give Stripe, and one copy of the code that
// reads Stripe's answer, rather than two copies that can drift.
//
// That is why this function is deployed with JWT verification OFF: Stripe
// cannot send a Supabase token. Readers are still named from their token, by
// auth.getUser(), which asks the auth server exactly what the gateway would
// have; a request without one is refused. A webhook is believed only when its
// signature checks against STRIPE_WEBHOOK_SECRET.
//
// WHY IT IS NOT UNDER supabase/functions: see server/oracle/index.ts.
//
// Secrets it reads: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET (both needed
// before anybody can pay). LUMINARY_ADMIN_EMAILS is optional. SUPABASE_URL,
// SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
// The table it writes is `subscriptions`, in server/oracle/schema.sql.

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

// inCommon's own lookup keys, not the Codex's, so pointing this at the Stripe
// account the Codex used cannot pick up or change the Codex's product.
const LOOKUP = { monthly: "incommon_luminary_monthly", annual: "incommon_luminary_annual" } as const;
const PRICES = {
  monthly: { amount: 1299, interval: "month" },
  annual: { amount: 11999, interval: "year" },
} as const;
const ACTIVE = new Set(["active", "trialing"]);
const ADMINS = (Deno.env.get("LUMINARY_ADMIN_EMAILS") ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

type Plan = keyof typeof LOOKUP;
type Row = {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  status: string;
  plan: Plan | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string | null;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
// Deno has no Node http module, so Stripe is asked through fetch, and its
// webhook signature is checked with the Web Crypto API.
const stripe = secretKey ? new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() }) : null;
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const url = Deno.env.get("SUPABASE_URL")!;
const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const subs = () => db.from("subscriptions");

async function rowFor(userId: string): Promise<Row | null> {
  const { data } = await subs().select("*").eq("user_id", userId).maybeSingle();
  return (data as Row | null) ?? null;
}

async function ensurePrices(s: Stripe): Promise<Record<Plan, string>> {
  const existing = await s.prices.list({ lookup_keys: Object.values(LOOKUP), active: true, limit: 10 });
  const byKey = new Map(existing.data.map((p) => [p.lookup_key, p.id]));
  if (byKey.size === 2) return { monthly: byKey.get(LOOKUP.monthly)!, annual: byKey.get(LOOKUP.annual)! };
  const product = await s.products.create({
    name: "Codex Luminary",
    description: "In-depth Oracle readings: long-form daily, weekly and monthly readings from the whole chart, with timing windows, shadow work and journal prompts.",
  });
  const ids = {} as Record<Plan, string>;
  for (const plan of ["monthly", "annual"] as const) {
    const had = byKey.get(LOOKUP[plan]);
    if (had) { ids[plan] = had; continue; }
    const price = await s.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: PRICES[plan].amount,
      recurring: { interval: PRICES[plan].interval },
      lookup_key: LOOKUP[plan],
      transfer_lookup_key: true,
    });
    ids[plan] = price.id;
  }
  return ids;
}

// Newer Stripe API versions moved the period end from the subscription onto
// its items; the Codex read both, and so does this.
function periodEnd(sub: Stripe.Subscription): string | null {
  const x = sub as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };
  const ts = x.current_period_end ?? x.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

async function syncCustomer(s: Stripe, customerId: string): Promise<void> {
  const list = await s.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  const best =
    list.data.find((x) => ACTIVE.has(x.status)) ??
    list.data.find((x) => x.status === "past_due") ??
    [...list.data].sort((a, b) => b.created - a.created)[0] ??
    null;
  const lookup = best?.items.data[0]?.price.lookup_key;
  const { error } = await subs().update({
    stripe_subscription_id: best?.id ?? null,
    status: best?.status ?? "none",
    plan: lookup === LOOKUP.annual ? "annual" : lookup === LOOKUP.monthly ? "monthly" : null,
    current_period_end: best ? periodEnd(best) : null,
    cancel_at_period_end: best?.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  }).eq("stripe_customer_id", customerId);
  if (error) throw error;
}

// Reads a reader's status, and asks Stripe again when the row is stale, so it
// comes right even if the webhook was never set up. The Codex's rule: stale
// when not active, when the paid period has ended, or when six hours old.
async function statusFor(user: { id: string; email?: string }, force: boolean) {
  let row = await rowFor(user.id);
  if (row && stripe) {
    const stale = force ||
      !ACTIVE.has(row.status) ||
      (row.current_period_end !== null && Date.parse(row.current_period_end) < Date.now()) ||
      !row.updated_at ||
      Date.now() - Date.parse(row.updated_at) > 6 * 3600e3;
    if (stale) {
      try {
        await syncCustomer(stripe, row.stripe_customer_id);
        row = await rowFor(user.id);
      } catch (e) {
        console.error("billing: the Stripe sync failed", e);
      }
    }
  }
  const admin = ADMINS.includes(String(user.email ?? "").toLowerCase());
  return {
    isPremium: admin || (!!row && ACTIVE.has(row.status)),
    plan: row?.plan ?? null,
    status: row?.status ?? null,
    currentPeriodEnd: row?.current_period_end ?? null,
    cancelAtPeriodEnd: row?.cancel_at_period_end ?? false,
    billingConfigured: !!stripe,
    // An admin passes the paywall without a subscription, so there is nothing
    // of theirs to manage and the page should not offer to.
    hasAccount: !!row,
  };
}

async function customerFor(s: Stripe, user: { id: string; email?: string }): Promise<string> {
  const had = await rowFor(user.id);
  if (had) return had.stripe_customer_id;
  const customer = await s.customers.create({ email: user.email, metadata: { userId: user.id } });
  const ins = await subs().insert({ user_id: user.id, stripe_customer_id: customer.id });
  if (ins.error) {
    // A second tab got there first. Its customer is the one kept; this one is
    // an empty Stripe record and costs nothing.
    const again = await rowFor(user.id);
    if (again) return again.stripe_customer_id;
    throw ins.error;
  }
  return customer.id;
}

// Where Stripe sends the reader back. The page names its own address, so the
// same function serves the deploy preview, the live site and a local copy. It
// has to be a web address; http is accepted only for this machine.
function returnAddress(v: unknown): URL | null {
  try {
    const u = new URL(String(v ?? ""));
    if (u.protocol === "https:") return u;
    if (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return u;
  } catch { /* not an address */ }
  return null;
}
function withQuery(u: URL, key: string, value: string): string {
  const x = new URL(u.toString());
  x.searchParams.set(key, value);
  return x.toString();
}

async function webhook(req: Request): Promise<Response> {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripe || !secret) {
    console.error("billing: a webhook arrived but STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set");
    return reply(503, { code: "NOT_CONFIGURED" });
  }
  // The exact bytes Stripe signed, read once, before anything parses them.
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, req.headers.get("stripe-signature")!, secret, undefined, cryptoProvider);
  } catch (e) {
    console.error("billing: a webhook signature did not check:", (e as Error).message);
    return reply(400, { code: "BAD_SIGNATURE" });
  }
  const obj = event.data.object as { customer?: string | { id: string } | null };
  const customerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
  if (customerId && (event.type.startsWith("customer.subscription.") || event.type === "checkout.session.completed" || event.type.startsWith("invoice."))) {
    try {
      await syncCustomer(stripe, customerId);
    } catch (e) {
      // A 500 makes Stripe send it again later, which is what should happen.
      console.error("billing: the webhook sync failed", e);
      return reply(500, { code: "STORE" });
    }
  }
  return reply(200, { received: true, type: event.type });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { code: "METHOD" });
  if (req.headers.get("stripe-signature")) return webhook(req);

  const asReader = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: who } = await asReader.auth.getUser();
  const user = who?.user;
  if (!user) return reply(401, { code: "SIGNED_OUT" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { code: "BAD_REQUEST" }); }
  const action = String(body.action ?? "");

  if (action === "status") return reply(200, { status: await statusFor(user, body.sync === true) });

  if (action === "checkout") {
    const plan = String(body.plan ?? "");
    if (plan !== "monthly" && plan !== "annual") return reply(400, { code: "BAD_REQUEST" });
    const back = returnAddress(body.returnTo);
    if (!back) return reply(400, { code: "BAD_REQUEST" });
    if (!stripe) return reply(503, { code: "NOT_CONFIGURED" });
    const current = await statusFor(user, true);
    if (current.isPremium) return reply(409, { code: "ALREADY" });
    try {
      const customer = await customerFor(stripe, user);
      const prices = await ensurePrices(stripe);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        line_items: [{ price: prices[plan], quantity: 1 }],
        allow_promotion_codes: true,
        success_url: withQuery(back, "luminary", "success"),
        cancel_url: withQuery(back, "luminary", "cancelled"),
        subscription_data: { metadata: { userId: user.id } },
      });
      return reply(200, { url: session.url });
    } catch (e) {
      console.error("billing: checkout failed", e);
      return reply(502, { code: "STRIPE" });
    }
  }

  if (action === "portal") {
    const back = returnAddress(body.returnTo);
    if (!back) return reply(400, { code: "BAD_REQUEST" });
    if (!stripe) return reply(503, { code: "NOT_CONFIGURED" });
    const row = await rowFor(user.id);
    if (!row) return reply(404, { code: "NO_ACCOUNT" });
    try {
      const session = await stripe.billingPortal.sessions.create({ customer: row.stripe_customer_id, return_url: back.toString() });
      return reply(200, { url: session.url });
    } catch (e) {
      console.error("billing: the portal failed; is it saved in the Stripe dashboard?", e);
      return reply(502, { code: "STRIPE" });
    }
  }

  return reply(400, { code: "BAD_REQUEST" });
});
