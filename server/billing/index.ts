// server/billing/index.ts: Codex Luminary, a Supabase Edge Function.
//
// WHAT IT IS. Codex Luminary is inCommon's paid tier, and since 18 October
// 2026 it is bought once, at an amount the reader chooses: the owner's
// decision that every add-on takes the Cycle Audit's form of payment, one time
// and the reader's choice, and that one payment opens all of them. The add-ons
// are the in-depth Oracle readings, Omni tarot and the Cycle Audit, and any
// added later. The floor is $3, which leaves something after Stripe's fee, and
// the box starts at $12. Inside the apps every add-on is free, so nothing here
// is sold there.
//
// THE SUBSCRIPTION IS RETIRED, NOT ERASED. Until 18 October Luminary was the
// Celestial Codex's Stripe subscription ($12.99 a month or $119.99 a year).
// No new subscription can be started, but a reader who holds one keeps it until
// it ends: their row in `subscriptions` is still kept current from Stripe, a
// live one still opens every add-on, and the billing portal still lets them
// cancel it. A purchase made in the apps through RevenueCat, if one was ever
// made, counts the same way and is read from `store_subscriptions`.
//
// ONE FUNCTION, FIVE JOBS. The page posts { action } to it: "status" says
// whether the reader has Luminary, "unlock" opens the one time Checkout,
// "portal" opens Stripe's billing portal for a reader who subscribed before,
// and "support" opens a Checkout for a gift, which is the only action that
// needs no sign in. "checkout", the subscription, answers RETIRED. And Stripe
// itself posts its webhook here, told apart by the stripe-signature header it
// always carries: one function means one thing to deploy, one address to give
// Stripe, and one copy of the code that reads Stripe's answer.
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
// before anybody can pay). LUMINARY_ADMIN_EMAILS is optional. LUMINARY_TAX and
// LUMINARY_SELL_EU_UK are both off unless set to "on": see "THE EU AND THE UK"
// below and docs/LUMINARY-EU-UK.md. SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase. The tables it writes are
// `luminary_unlocks` and `subscriptions`, both in server/oracle/schema.sql. It
// also reads `store_subscriptions` (server/store/schema.sql).

import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

// Codex Luminary, once: a single custom amount price under its own lookup key,
// made on the first unlock on its own product.
const LUMINARY = { lookup: "incommon_luminary_once", min: 300, preset: 1200, max: 50000 } as const;
// A GIFT TO SUPPORT INCOMMON, the owner's donate button for the apps (18
// October 2026). It buys nothing and unlocks nothing, so it needs no account:
// a reader who never signed in can give. It is called a gift rather than a
// donation on every surface, because inCommon is not a charity and a gift to it
// is not tax deductible, and "donate" says otherwise to most people.
const SUPPORT = { lookup: "incommon_support_gift", min: 100, preset: 500, max: 50000 } as const;
// The retired subscription's lookup keys, kept only to name the plan of a
// subscription a reader still holds.
const LOOKUP = { monthly: "incommon_luminary_monthly", annual: "incommon_luminary_annual" } as const;
const ACTIVE = new Set(["active", "trialing"]);
const ADMINS = (Deno.env.get("LUMINARY_ADMIN_EMAILS") ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
// Confirmed addresses only, the same rule as server/oracle: an unconfirmed
// address proves nothing about who holds it.
const isAdmin = (u: { email?: string; email_confirmed_at?: string | null }) =>
  !!u.email_confirmed_at && ADMINS.includes(String(u.email ?? "").toLowerCase());

// THE EU AND THE UK: NOT SOLD YET, AND READY FOR THE DAY THEY ARE.
//
// A seller outside the EU owes EU VAT on a digital service sold to a consumer
// there from the very first sale, and the UK is the same; there is no small
// seller threshold for either. The owner decided on 12 October 2026 not to sell
// in either until volume pays for the registrations.
//
// So, while LUMINARY_SELL_EU_UK is off (the default):
//   * status tells the page the country it guessed is closed, and the gate says
//     Luminary is not available there yet instead of offering it;
//   * an unlock is refused for that country with REGION before Stripe is asked;
//   * and because the page's country is only a guess from the time zone, the
//     webhook looks at what Stripe actually collected, the billing address and
//     the card's country, and refunds a payment where either is in the EU or
//     the UK, opening nothing. That is the line that holds; the other two are
//     courtesy, so nobody is charged to be told no.
//
// With it on, Stripe Tax adds the reader's VAT at checkout, and Checkout asks
// them to agree that the add-ons open at once and the 14 day right to withdraw
// ends with that, which the Terms say and EU law wants as an explicit tick.
// Selling there without Stripe Tax would sell without charging the VAT that is
// owed, so LUMINARY_SELL_EU_UK is refused unless LUMINARY_TAX is on too.
// LUMINARY_TAX on its own turns on Stripe Tax for every unlock; it only charges
// tax where the Stripe account has a registration added.
const EU_UK = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "MC", "GB", "IM",
]);
const TAX = Deno.env.get("LUMINARY_TAX") === "on";
const SELL_EU_UK = Deno.env.get("LUMINARY_SELL_EU_UK") === "on" && TAX;
if (Deno.env.get("LUMINARY_SELL_EU_UK") === "on" && !TAX) {
  console.error("billing: LUMINARY_SELL_EU_UK is on but LUMINARY_TAX is not; the EU and the UK stay closed until both are on");
}
const countryOf = (v: unknown): string | null => /^[A-Z]{2}$/.test(String(v ?? "")) ? String(v) : null;
const closedTo = (country: string | null) => !!country && EU_UK.has(country) && !SELL_EU_UK;
// What the reader ticks at checkout in the EU and the UK. Stripe shows it beside
// the terms of service box; the Terms link itself is set in the Stripe dashboard.
const WITHDRAWAL_WAIVER =
  "I ask for the add-ons to open as soon as I pay, and I understand that I lose my 14 day right to withdraw once they have.";

type Row = {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  status: string;
  plan: "monthly" | "annual" | null;
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

type StoreRow = {
  source: "apple" | "google" | "promotional";
  status: string;
  plan: "monthly" | "annual" | null;
  current_period_end: string | null;
  will_renew: boolean;
  management_url: string | null;
};

// A live app purchase for this reader, or null. The row is read, never written
// here: server/store owns it. A project that has not run server/store/schema.sql
// has no such table, and that reads as no app purchase rather than an error.
async function storeRowFor(userId: string): Promise<StoreRow | null> {
  const { data } = await db.from("store_subscriptions")
    .select("source, status, plan, current_period_end, will_renew, management_url")
    .eq("user_id", userId).maybeSingle();
  const r = (data as StoreRow | null) ?? null;
  if (!r || r.status !== "active") return null;
  return r.current_period_end && Date.parse(r.current_period_end) <= Date.now() ? null : r;
}

// A price whose amount the reader types at checkout, made once under its
// lookup key on its own product. Stripe shows the box with the preset in it
// and refuses anything outside the floor and the ceiling.
async function ensureCustomPrice(s: Stripe, p: { lookup: string; min: number; preset: number; max: number }, name: string, description: string): Promise<string> {
  const had = await s.prices.list({ lookup_keys: [p.lookup], active: true, limit: 1 });
  if (had.data[0]) return had.data[0].id;
  const product = await s.products.create({ name, description });
  const price = await s.prices.create({
    product: product.id,
    currency: "usd",
    custom_unit_amount: { enabled: true, minimum: p.min, preset: p.preset, maximum: p.max },
    lookup_key: p.lookup,
    transfer_lookup_key: true,
  });
  return price.id;
}

async function unlockedRow(userId: string): Promise<boolean> {
  const { data } = await db.from("luminary_unlocks").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

// Records a paid Luminary checkout, or refunds it when it came from a country
// not sold to yet: the page's country is a guess, and the address and card
// Stripe collected are not. Safe to run twice, because Stripe retries webhooks
// and the status sync may find the same session: the row is keyed by reader and
// the refund carries an idempotency key.
async function recordUnlock(s: Stripe, session: Stripe.Checkout.Session): Promise<boolean> {
  const userId = session.metadata?.userId;
  if (session.metadata?.kind !== "luminary_unlock" || !userId || session.payment_status !== "paid") return false;
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  let card: string | null = null;
  if (pi && !SELL_EU_UK) {
    try {
      const intent = await s.paymentIntents.retrieve(pi, { expand: ["payment_method"] });
      const pm = intent.payment_method as Stripe.PaymentMethod | string | null;
      card = pm && typeof pm !== "string" ? pm.card?.country ?? null : null;
    } catch (e) { console.error("billing: the unlock's card could not be read", (e as Error).message); }
  }
  const billing = session.customer_details?.address?.country ?? null;
  if (closedTo(billing) || closedTo(card)) {
    console.error("billing: refusing a Luminary unlock from a country not yet sold to", { session: session.id, billing, card });
    if (pi) {
      try {
        await s.refunds.create({ payment_intent: pi, reason: "requested_by_customer", metadata: { why: "eu_uk_not_sold_yet", session: session.id } },
          { idempotencyKey: "eu-uk-unlock-refund-" + session.id });
      } catch (e) {
        if (!/already been refunded|charge_already_refunded/i.test(String((e as Error).message))) throw e;
      }
    }
    return false;
  }
  const { error } = await db.from("luminary_unlocks").upsert({
    user_id: userId,
    stripe_session_id: session.id,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
  }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) throw error;
  return true;
}

// The webhook can be missed, so a status asked with a sync looks at this
// reader's recent completed checkouts at Stripe and records an unlock it finds.
async function recoverUnlock(s: Stripe, customerId: string): Promise<boolean> {
  const list = await s.checkout.sessions.list({ customer: customerId, status: "complete", limit: 20 });
  for (const sess of list.data) {
    if (sess.metadata?.kind === "luminary_unlock" && sess.payment_status === "paid" && await recordUnlock(s, sess)) return true;
  }
  return false;
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

// Whether every add-on is open to this reader, and what the page needs to say
// about how. The subscription row is asked of Stripe again when it is stale, as
// it always was, so a subscriber who cancels sees it end on time; an unlock the
// webhook missed is looked for when the page asks with a sync.
async function statusFor(user: { id: string; email?: string; email_confirmed_at?: string | null }, force: boolean, country: string | null = null) {
  let row = await rowFor(user.id);
  if (row && stripe && row.stripe_subscription_id) {
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
  const admin = isAdmin(user);
  let once = await unlockedRow(user.id);
  if (!once && force && row && stripe) {
    try { once = await recoverUnlock(stripe, row.stripe_customer_id); }
    catch (e) { console.error("billing: the unlock sync failed", e); }
  }
  const subscribed = !!row && ACTIVE.has(row.status);
  const app = subscribed ? null : await storeRowFor(user.id);
  return {
    // Every add-on: in-depth readings, Omni and the Cycle Audit.
    isPremium: admin || once || subscribed || !!app,
    // Opened by the one time payment, as against a subscription held from
    // before, so the page can say which.
    once,
    // A subscription from before 18 October, described so the reader can see
    // when it ends and manage it. Null for everybody else.
    plan: app ? app.plan : subscribed ? row!.plan : null,
    status: app ? "active" : subscribed ? row!.status : null,
    currentPeriodEnd: app ? app.current_period_end : subscribed ? row!.current_period_end : null,
    cancelAtPeriodEnd: app ? !app.will_renew : subscribed ? row!.cancel_at_period_end : false,
    source: app ? app.source : subscribed ? "stripe" : null,
    manageUrl: app ? app.management_url : null,
    hasAccount: !!row && !!row.stripe_subscription_id,
    billingConfigured: !!stripe,
    // Whether Luminary is sold in the country the page guessed.
    regionOpen: !closedTo(country),
    // The least a reader may pay, in cents, so the page cannot name another.
    floor: LUMINARY.min,
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
// same function serves the deploy preview, the live site and a local copy.
// The address must be one of ours; any other https origin is refused.
// incommonspace.com became the site's address on 16 October 2026 and
// incommon.netlify.app answers it with a 301, so a checkout opened from the
// live site names incommonspace.com. Until 18 October it was not on this list
// and every checkout from the live site was refused as BAD_REQUEST. The
// --incommon.netlify.app suffix keeps deploy previews working.
const OWN = (u: URL) =>
  u.hostname === "incommonspace.com" ||
  u.hostname === "www.incommonspace.com" ||
  u.hostname === "incommon.netlify.app" ||
  u.hostname.endsWith("--incommon.netlify.app") ||
  u.hostname === "localhost" ||
  u.hostname === "127.0.0.1";
function returnAddress(v: unknown): URL | null {
  try {
    const u = new URL(String(v ?? ""));
    if (u.protocol === "https:" && OWN(u)) return u;
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
      if (event.type === "checkout.session.completed") await recordUnlock(stripe, event.data.object as Stripe.Checkout.Session);
      else await syncCustomer(stripe, customerId);
    } catch (e) {
      // A 500 makes Stripe send it again later, which is what should happen.
      console.error("billing: the webhook failed", e);
      return reply(500, { code: "STORE" });
    }
  }
  return reply(200, { received: true, type: event.type });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { code: "METHOD" });
  if (req.headers.get("stripe-signature")) return webhook(req);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { code: "BAD_REQUEST" }); }
  const action = String(body.action ?? "");

  // A gift needs no account, so it is answered before anybody is named. It is
  // a Checkout page with no customer on it: Stripe takes the email for the
  // receipt, and nothing about the gift is kept here.
  if (action === "support") {
    const back = returnAddress(body.returnTo);
    if (!back) return reply(400, { code: "BAD_REQUEST" });
    if (!stripe) return reply(503, { code: "NOT_CONFIGURED" });
    try {
      const price = await ensureCustomPrice(stripe, SUPPORT, "Support inCommon",
        "A gift toward keeping inCommon running. It buys nothing and unlocks nothing.");
      // Managed Payments off, always: under it Stripe is the seller of record,
      // and inCommon is the seller (the Terms, the EU and UK hold). stripe@17's
      // types predate the field, hence the widened params type.
      const params: Stripe.Checkout.SessionCreateParams & { managed_payments: { enabled: boolean } } = {
        managed_payments: { enabled: false },
        mode: "payment",
        line_items: [{ price, quantity: 1 }],
        submit_type: "pay",
        success_url: withQuery(back, "gift", "thanks"),
        cancel_url: withQuery(back, "gift", "cancelled"),
        metadata: { kind: "support_gift" },
        payment_intent_data: { metadata: { kind: "support_gift" } },
      };
      const session = await stripe.checkout.sessions.create(params);
      return reply(200, { url: session.url });
    } catch (e) {
      console.error("billing: the gift checkout failed", e);
      return reply(502, { code: "STRIPE" });
    }
  }

  const asReader = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: who } = await asReader.auth.getUser();
  const user = who?.user;
  if (!user) return reply(401, { code: "SIGNED_OUT" });
  if (owesCode(req, user)) return reply(401, { code: "MFA_REQUIRED" });

  const country = countryOf(body.country);
  if (action === "status") return reply(200, { status: await statusFor(user, body.sync === true, country) });

  // The subscription was retired on 18 October 2026. A page from before then
  // still sends this; it is told so rather than sold a subscription.
  if (action === "checkout") return reply(410, { code: "RETIRED" });

  if (action === "unlock") {
    const back = returnAddress(body.returnTo);
    if (!back) return reply(400, { code: "BAD_REQUEST" });
    if (!stripe) return reply(503, { code: "NOT_CONFIGURED" });
    if (closedTo(country)) return reply(403, { code: "REGION" });
    if ((await statusFor(user, false)).isPremium) return reply(409, { code: "ALREADY" });
    try {
      const customer = await customerFor(stripe, user);
      const price = await ensureCustomPrice(stripe, LUMINARY, "Codex Luminary",
        "Opens every inCommon add-on for the account: in-depth Oracle readings, Omni tarot and the Cycle Audit. Pay what you want, once.");
      const meta = { userId: user.id, kind: "luminary_unlock" };
      const euUk = !!country && EU_UK.has(country);
      const params: Stripe.Checkout.SessionCreateParams & { managed_payments: { enabled: boolean } } = {
        managed_payments: { enabled: false },
        mode: "payment",
        customer,
        line_items: [{ price, quantity: 1 }],
        submit_type: "pay",
        success_url: withQuery(back, "luminary", "success"),
        cancel_url: withQuery(back, "luminary", "cancelled"),
        metadata: meta,
        payment_intent_data: { metadata: meta },
        // Stripe Tax needs an address to place the buyer.
        ...(TAX ? {
          automatic_tax: { enabled: true },
          billing_address_collection: "required" as const,
          customer_update: { address: "auto" as const, name: "auto" as const },
        } : {}),
        ...(euUk ? {
          consent_collection: { terms_of_service: "required" as const },
          custom_text: { terms_of_service_acceptance: { message: WITHDRAWAL_WAIVER } },
        } : {}),
      };
      const session = await stripe.checkout.sessions.create(params);
      return reply(200, { url: session.url });
    } catch (e) {
      console.error("billing: the unlock checkout failed", e);
      return reply(502, { code: "STRIPE" });
    }
  }

  if (action === "portal") {
    const back = returnAddress(body.returnTo);
    if (!back) return reply(400, { code: "BAD_REQUEST" });
    if (!stripe) return reply(503, { code: "NOT_CONFIGURED" });
    const row = await rowFor(user.id);
    if (!row || !row.stripe_subscription_id) return reply(404, { code: "NO_ACCOUNT" });
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
