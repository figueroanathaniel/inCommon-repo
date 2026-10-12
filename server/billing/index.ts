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
// before anybody can pay). LUMINARY_ADMIN_EMAILS is optional. LUMINARY_TAX and
// LUMINARY_SELL_EU_UK are both off unless set to "on": see "THE EU AND THE UK"
// below and docs/LUMINARY-EU-UK.md. SUPABASE_URL,
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
// Confirmed addresses only, the same rule as server/oracle: an unconfirmed
// address proves nothing about who holds it.
const isAdmin = (u: { email?: string; email_confirmed_at?: string | null }) =>
  !!u.email_confirmed_at && ADMINS.includes(String(u.email ?? "").toLowerCase());

// THE EU AND THE UK: NOT SOLD YET, AND READY FOR THE DAY THEY ARE.
//
// A seller outside the EU owes EU VAT on a digital service sold to a consumer
// there from the very first sale, and the UK is the same; there is no small
// seller threshold for either. The owner decided on 12 October 2026 not to sell
// Luminary in either until volume pays for the registrations, and to have the
// rest prepared so that turning it on is setting two secrets.
//
// So, while LUMINARY_SELL_EU_UK is off (the default):
//   * status tells the page the country it guessed is closed, and the gate says
//     Luminary is not available there yet instead of offering a plan;
//   * checkout refuses that country with REGION before Stripe is asked;
//   * and because the page's country is only a guess from the time zone, the
//     webhook looks at what Stripe actually collected, the billing address and
//     the card's country, and cancels and refunds a subscription where either
//     is in the EU or the UK. That is the line that holds; the other two are
//     courtesy, so nobody is charged to be told no.
//
// With it on, an EU or UK reader is sold the EUR or GBP price, VAT included
// (consumer law there wants the price shown to be the price paid), Stripe Tax
// works out the VAT, and Checkout asks the reader to agree that the in-depth
// readings start at once and the 14 day right to withdraw ends with that,
// which Terms section 7 already says and EU law wants as an explicit tick.
// Selling there without Stripe Tax would sell without charging the VAT that is
// owed, so LUMINARY_SELL_EU_UK is refused unless LUMINARY_TAX is on too.
//
// LUMINARY_TAX on its own turns on Stripe Tax for every checkout, for the day
// US states (or anywhere else) need it. It only charges tax where the Stripe
// account has a registration added, so switching it on does nothing until one
// is. It needs the US prices' tax behaviour set in Stripe: see the doc.
const EU_UK = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "MC", "GB", "IM",
]);
const UK = new Set(["GB", "IM"]);
const TAX = Deno.env.get("LUMINARY_TAX") === "on";
const SELL_EU_UK = Deno.env.get("LUMINARY_SELL_EU_UK") === "on" && TAX;
if (Deno.env.get("LUMINARY_SELL_EU_UK") === "on" && !TAX) {
  console.error("billing: LUMINARY_SELL_EU_UK is on but LUMINARY_TAX is not; the EU and the UK stay closed until both are on");
}
// The prices there. PLACEHOLDERS until the owner sets them: these are the US
// numbers in the local currency, VAT included. Changing an amount here does not
// change a price Stripe already holds; see the doc for how to re-price.
const LOCAL = {
  eur: { monthly: 1299, annual: 11999 },
  gbp: { monthly: 1199, annual: 10999 },
} as const;
type Cur = "usd" | "eur" | "gbp";
const lookupFor = (cur: Cur, plan: keyof typeof LOOKUP) => cur === "usd" ? LOOKUP[plan] : LOOKUP[plan] + "_" + cur;
const curFor = (country: string | null): Cur =>
  !country || !SELL_EU_UK || !EU_UK.has(country) ? "usd" : UK.has(country) ? "gbp" : "eur";
const countryOf = (v: unknown): string | null => /^[A-Z]{2}$/.test(String(v ?? "")) ? String(v) : null;
const closedTo = (country: string | null) => !!country && EU_UK.has(country) && !SELL_EU_UK;
const priceShown = (cur: Cur) => cur === "usd"
  ? { currency: "usd", monthly: PRICES.monthly.amount, annual: PRICES.annual.amount, taxIncluded: false }
  : { currency: cur, monthly: LOCAL[cur].monthly, annual: LOCAL[cur].annual, taxIncluded: true };
// What the reader ticks at checkout in the EU and the UK. Stripe shows it beside
// the terms of service box; the Terms link itself is set in the Stripe dashboard.
const WITHDRAWAL_WAIVER =
  "I ask for the in-depth readings to be available as soon as I subscribe, and I understand that I lose my 14 day right to withdraw once they are.";

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

// The US prices are made exactly as they always were, on the first checkout.
// The EUR and GBP ones are made the same way the first time somebody in the EU
// or the UK checks out with selling there switched on, on the SAME product, so
// Stripe holds one Luminary in three currencies rather than three products.
async function ensurePrices(s: Stripe, cur: Cur = "usd"): Promise<Record<Plan, string>> {
  const keys = { monthly: lookupFor(cur, "monthly"), annual: lookupFor(cur, "annual") };
  const existing = await s.prices.list({ lookup_keys: Object.values(keys), active: true, limit: 10 });
  const byKey = new Map(existing.data.map((p) => [p.lookup_key, p.id]));
  if (byKey.size === 2) return { monthly: byKey.get(keys.monthly)!, annual: byKey.get(keys.annual)! };
  let productId: string | null = null;
  if (cur !== "usd") {
    const usd = await s.prices.list({ lookup_keys: Object.values(LOOKUP), limit: 1 });
    const p = usd.data[0]?.product;
    productId = typeof p === "string" ? p : p?.id ?? null;
  }
  if (!productId) {
    const product = await s.products.create({
      name: "Codex Luminary",
      description: "In-depth Oracle readings: long-form daily, weekly and monthly readings from the whole chart, with timing windows, shadow work and journal prompts.",
    });
    productId = product.id;
  }
  const ids = {} as Record<Plan, string>;
  for (const plan of ["monthly", "annual"] as const) {
    const had = byKey.get(keys[plan]);
    if (had) { ids[plan] = had; continue; }
    const price = await s.prices.create({
      product: productId,
      currency: cur,
      unit_amount: cur === "usd" ? PRICES[plan].amount : LOCAL[cur][plan],
      recurring: { interval: PRICES[plan].interval },
      lookup_key: keys[plan],
      transfer_lookup_key: true,
      // EU and UK prices are shown and charged with VAT in them.
      ...(cur === "usd" ? {} : { tax_behavior: "inclusive" as const }),
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
async function statusFor(user: { id: string; email?: string; email_confirmed_at?: string | null }, force: boolean, country: string | null = null) {
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
  const admin = isAdmin(user);
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
    // Whether Luminary is sold in the country the page guessed, and at what
    // price there. A page that sent no country is quoted the US price.
    regionOpen: !closedTo(country),
    price: priceShown(curFor(country)),
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

// THE BACKSTOP. A completed checkout whose billing address or card is in the EU
// or the UK, while selling there is off, is cancelled at once and its first
// payment refunded in full. The page's country guess and the REGION refusal are
// meant to stop this before it starts; this is for the reader the guess missed
// (a VPN, a traveller, a zone set by hand). Stripe emails the refund receipt.
// Every step tolerates being run twice, because Stripe retries a webhook that
// failed and may deliver one more than once.
async function refuseIfClosed(s: Stripe, session: Stripe.Checkout.Session): Promise<void> {
  if (SELL_EU_UK || session.mode !== "subscription" || !session.subscription) return;
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const sub = await s.subscriptions.retrieve(subId, { expand: ["default_payment_method", "latest_invoice"] });
  const pm = sub.default_payment_method as Stripe.PaymentMethod | string | null;
  const card = pm && typeof pm !== "string" ? pm.card?.country ?? null : null;
  const billing = session.customer_details?.address?.country ?? null;
  if (!closedTo(billing) && !closedTo(card)) return;
  console.error("billing: refusing a Luminary checkout from a country not yet sold to", { subId, billing, card });
  if (sub.status !== "canceled") {
    await s.subscriptions.update(subId, { metadata: { refused: "eu_uk_not_sold_yet" } });
    await s.subscriptions.cancel(subId);
  }
  // The invoice names its payment as payment_intent on the API version this
  // function is pinned to, and as charge on older ones; either can be refunded.
  const inv = sub.latest_invoice as (Stripe.Invoice & { payment_intent?: string | { id: string } | null; charge?: string | { id: string } | null }) | string | null;
  const invoice = inv && typeof inv !== "string" ? inv : null;
  const idOf = (v: string | { id: string } | null | undefined) => typeof v === "string" ? v : v?.id ?? null;
  const pi = idOf(invoice?.payment_intent), ch = idOf(invoice?.charge);
  if (!invoice || (!pi && !ch) || !(invoice.amount_paid > 0)) {
    if (invoice && invoice.amount_paid > 0) console.error("billing: REFUND BY HAND, no payment found on invoice", invoice.id);
    return;
  }
  try {
    await s.refunds.create(
      { ...(pi ? { payment_intent: pi } : { charge: ch! }), reason: "requested_by_customer", metadata: { why: "eu_uk_not_sold_yet", subscription: subId } },
      { idempotencyKey: "eu-uk-refund-" + invoice.id },
    );
  } catch (e) {
    // Already refunded is the one failure that means the work is done.
    if (!/already been refunded|charge_already_refunded/i.test(String((e as Error).message))) throw e;
  }
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
      if (event.type === "checkout.session.completed") await refuseIfClosed(stripe, event.data.object as Stripe.Checkout.Session);
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
  if (owesCode(req, user)) return reply(401, { code: "MFA_REQUIRED" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { code: "BAD_REQUEST" }); }
  const action = String(body.action ?? "");

  const country = countryOf(body.country);
  if (action === "status") return reply(200, { status: await statusFor(user, body.sync === true, country) });

  if (action === "checkout") {
    const plan = String(body.plan ?? "");
    if (plan !== "monthly" && plan !== "annual") return reply(400, { code: "BAD_REQUEST" });
    const back = returnAddress(body.returnTo);
    if (!back) return reply(400, { code: "BAD_REQUEST" });
    if (!stripe) return reply(503, { code: "NOT_CONFIGURED" });
    if (closedTo(country)) return reply(403, { code: "REGION" });
    const current = await statusFor(user, true);
    if (current.isPremium) return reply(409, { code: "ALREADY" });
    try {
      const customer = await customerFor(stripe, user);
      const cur = curFor(country);
      const prices = await ensurePrices(stripe, cur);
      const euUk = cur !== "usd";
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        line_items: [{ price: prices[plan], quantity: 1 }],
        allow_promotion_codes: true,
        success_url: withQuery(back, "luminary", "success"),
        cancel_url: withQuery(back, "luminary", "cancelled"),
        subscription_data: { metadata: { userId: user.id } },
        // Stripe Tax needs an address to place the buyer, and saves the one
        // collected onto the customer so renewals are taxed where they live.
        ...(TAX ? {
          automatic_tax: { enabled: true },
          billing_address_collection: "required" as const,
          customer_update: { address: "auto" as const, name: "auto" as const },
        } : {}),
        // A business buying in the EU or UK may give its VAT number and pay none.
        ...(euUk ? {
          tax_id_collection: { enabled: true },
          consent_collection: { terms_of_service: "required" as const },
          custom_text: { terms_of_service_acceptance: { message: WITHDRAWAL_WAIVER } },
        } : {}),
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
