// server/account/index.ts: deleting an account, a Supabase Edge Function.
//
// WHY IT EXISTS. The App Store (guideline 5.1.1(v)) and Google Play both
// require an app that lets people make an account to let them delete it from
// inside the app, and the owner asked for it on 12 October 2026. Until then a
// deletion was a Contact Support request carried out by hand
// (docs/LEGAL-SETUP.md). This does what that checklist did, in the same order,
// for the signed in reader and nobody else.
//
// WHAT IT DELETES, IN THIS ORDER, AND WHY THE ORDER:
//   1. Codex Luminary, at Stripe: every live subscription is cancelled now and
//      the Stripe customer is deleted. This goes FIRST because it is the one
//      step that can keep costing the reader money: if Stripe cannot be
//      reached, nothing else is touched and the reader is told to try again,
//      rather than ending up with no account and a renewal still coming.
//      Stripe keeps the payment records the law makes it keep.
//   2. The rows, child tables before parents, so the order is right whether
//      or not the project's foreign keys cascade: the four tables keyed by
//      profile (memories, throughline_entries, oki_messages, consent_events),
//      then pairs and profiles (keyed by account), oracle_readings,
//      subscriptions, store_subscriptions and cycle_unlocks (keyed by user),
//      then the accounts row itself. Between Stripe and the rows, RevenueCat's record
//      of the reader is deleted too when RevenueCat is set up (see
//      closeRevenueCat below); a subscription bought in an app is the store's
//      to cancel, and the page says so before the reader deletes.
//   3. The auth user, last, because it is what the reader signs in with: if
//      anything above failed they can still sign in and try again, and every
//      step is safe to run twice.
// A support request is not deleted: its user_id is set to null when the auth
// user goes (server/support.sql), and the Privacy Policy keeps it as a record
// for up to two years.
//
// A table this project never created is skipped rather than failed, because a
// table that does not exist holds nothing to delete. Any other error stops the
// run and is reported, because a deletion that quietly skipped a table is a
// deletion that did not happen.
//
// Deployed with JWT verification ON (unlike billing, nothing but the app calls
// this). Secrets: SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
// are provided by Supabase; STRIPE_SECRET_KEY is the one billing already uses,
// and without it the Stripe step is skipped (no Stripe, nothing to cancel).
// REVENUECAT_SECRET_KEY is the one server/store uses, skipped the same way.
// Setup: docs/ACCOUNT-DELETION.md.

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// The same rule as server/billing and server/oracle: an account with a verified
// authenticator is served only on a session that entered the code. Deleting an
// account is the last thing a stolen password should be able to do.
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
const stripe = secretKey ? new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() }) : null;
const url = Deno.env.get("SUPABASE_URL")!;
const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

// PostgREST answers PGRST205 for a table it does not know, and Postgres 42P01.
const missing = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === "PGRST205" || e.code === "42P01" || /does not exist|Could not find the table/i.test(e.message ?? ""));

class StoreError extends Error {}

async function del(table: string, column: string, values: string | string[]): Promise<void> {
  if (Array.isArray(values) && values.length === 0) return;
  const q = db.from(table).delete();
  const { error } = Array.isArray(values) ? await q.in(column, values) : await q.eq(column, values);
  if (error && !missing(error)) throw new StoreError(table + ": " + error.message);
}

const LIVE = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

// A purchase made inside the apps cannot be cancelled from here: Apple allows
// no seller to cancel a subscription, and the page tells the reader to cancel
// it in their Apple or Google account settings before they delete. What can go
// is RevenueCat's record of them, which holds their user id and purchase
// history: its customer is deleted, the same way the Stripe customer is. Not
// found means already gone. Without REVENUECAT_SECRET_KEY there is no
// RevenueCat to ask, and the step is skipped.
const rcKey = Deno.env.get("REVENUECAT_SECRET_KEY") ?? "";
async function closeRevenueCat(userId: string): Promise<void> {
  if (!rcKey) return;
  const res = await fetch("https://api.revenuecat.com/v1/subscribers/" + encodeURIComponent(userId), {
    method: "DELETE",
    headers: { Authorization: "Bearer " + rcKey, Accept: "application/json" },
  });
  if (!res.ok && res.status !== 404) throw new Error("RevenueCat answered " + res.status);
}

async function closeStripe(userId: string): Promise<void> {
  if (!stripe) return;
  const { data, error } = await db.from("subscriptions").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (error && !missing(error)) throw new StoreError("subscriptions: " + error.message);
  const customer = (data as { stripe_customer_id?: string } | null)?.stripe_customer_id;
  if (!customer) return;
  const subs = await stripe.subscriptions.list({ customer, status: "all", limit: 100 });
  for (const s of subs.data) {
    if (LIVE.has(s.status)) await stripe.subscriptions.cancel(s.id, { prorate: false });
  }
  try {
    await stripe.customers.del(customer);
  } catch (e) {
    // Already deleted is the one failure that means the work is done.
    if (!/No such customer|resource_missing/i.test(String((e as Error).message))) throw e;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { code: "METHOD" });

  const asReader = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: who } = await asReader.auth.getUser();
  const user = who?.user;
  if (!user) return reply(401, { code: "SIGNED_OUT" });
  if (owesCode(req, user)) return reply(401, { code: "MFA_REQUIRED" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { code: "BAD_REQUEST" }); }
  // The page sends the word the reader typed; asking for it here too means a
  // stray call with a valid token cannot delete an account on its own.
  if (body.action !== "delete" || String(body.confirm ?? "").trim().toLowerCase() !== "delete") {
    return reply(400, { code: "BAD_REQUEST" });
  }

  const uid = user.id;
  try {
    await closeStripe(uid);
  } catch (e) {
    console.error("account: Stripe could not be closed; nothing was deleted", (e as Error).message);
    return reply(502, { code: "STRIPE" });
  }
  try {
    await closeRevenueCat(uid);
  } catch (e) {
    console.error("account: RevenueCat could not be reached; no row was deleted", (e as Error).message);
    return reply(502, { code: "REVENUECAT" });
  }

  try {
    const { data: profs, error } = await db.from("profiles").select("id").eq("account_id", uid);
    if (error && !missing(error)) throw new StoreError("profiles: " + error.message);
    const ids = ((profs as { id: string }[] | null) ?? []).map((p) => p.id);
    for (const t of ["memories", "throughline_entries", "oki_messages", "consent_events"]) await del(t, "profile_id", ids);
    await del("pairs", "account_id", uid);
    await del("profiles", "account_id", uid);
    await del("oracle_readings", "user_id", uid);
    await del("subscriptions", "user_id", uid);
    await del("store_subscriptions", "user_id", uid);
    await del("cycle_unlocks", "user_id", uid);
    await del("accounts", "id", uid);
  } catch (e) {
    console.error("account: a table could not be cleared", (e as Error).message);
    return reply(500, { code: "STORE" });
  }

  const { error: authErr } = await db.auth.admin.deleteUser(uid);
  if (authErr && !/not found/i.test(authErr.message)) {
    console.error("account: the auth user could not be deleted", authErr.message);
    return reply(500, { code: "AUTH" });
  }
  console.log("account: deleted", uid);
  return reply(200, { deleted: true });
});
