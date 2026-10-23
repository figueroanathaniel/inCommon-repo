import Stripe from "stripe";
import { db } from "../db";
import { PREMIUM_PRICES, type PremiumStatus } from "./types";

// Backend-only helper for Stripe subscriptions.

const LOOKUP = { monthly: "codex_luminary_monthly", annual: "codex_luminary_annual" } as const;
const ACTIVE = new Set(["active", "trialing"]);

/** null when STRIPE_SECRET_KEY is not configured — the standalone build runs fine without billing. */
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

function client(): Stripe {
  if (!stripe) throw new Error("Billing is not configured yet (missing STRIPE_SECRET_KEY).");
  return stripe;
}

async function ensurePrices(stripe: Stripe) {
  const existing = await stripe.prices.list({ lookup_keys: Object.values(LOOKUP), active: true, limit: 10 });
  const byKey = new Map(existing.data.map((p) => [p.lookup_key, p.id]));
  if (byKey.size === 2) return { monthly: byKey.get(LOOKUP.monthly)!, annual: byKey.get(LOOKUP.annual)! };
  const product = await stripe.products.create({
    name: "Celestial Codex Luminary",
    description: "Astrocartography, the advanced chart with every point and asteroid, and in-depth horoscopes.",
  });
  const ids: Record<string, string> = {};
  for (const plan of ["monthly", "annual"] as const) {
    if (byKey.has(LOOKUP[plan])) {
      ids[plan] = byKey.get(LOOKUP[plan])!;
      continue;
    }
    const price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: PREMIUM_PRICES[plan].amount,
      recurring: { interval: PREMIUM_PRICES[plan].interval },
      lookup_key: LOOKUP[plan],
      transfer_lookup_key: true,
    });
    ids[plan] = price.id;
  }
  return { monthly: ids.monthly, annual: ids.annual };
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  const s = sub as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };
  const ts = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

function applySubscription(customerId: string, sub: Stripe.Subscription | null): void {
  const priceLookup = sub?.items.data[0]?.price.lookup_key;
  const plan = priceLookup === LOOKUP.annual ? "annual" : priceLookup === LOOKUP.monthly ? "monthly" : null;
  const row = db.data.subscriptions.find((r) => r.stripeCustomerId === customerId);
  if (!row) return;
  row.stripeSubscriptionId = sub?.id ?? null;
  row.status = sub?.status ?? "none";
  row.plan = plan;
  row.currentPeriodEnd = sub ? periodEnd(sub)?.toISOString() ?? null : null;
  row.cancelAtPeriodEnd = sub?.cancel_at_period_end ?? false;
  row.updatedAt = new Date().toISOString();
  db.save();
}

async function syncCustomer(stripe: Stripe, customerId: string): Promise<void> {
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  const best =
    subs.data.find((s) => ACTIVE.has(s.status)) ??
    subs.data.find((s) => s.status === "past_due") ??
    subs.data.sort((a, b) => b.created - a.created)[0] ??
    null;
  applySubscription(customerId, best);
}

export const stripeServer = {
  isConfigured: () => stripe !== null,

  async getOrCreateCustomer(user: { id: number; email: string; displayName: string }): Promise<string> {
    const s = client();
    const existing = db.data.subscriptions.find((r) => r.userId === user.id);
    if (existing) return existing.stripeCustomerId;
    const customer = await s.customers.create({
      email: user.email,
      name: user.displayName,
      metadata: { userId: String(user.id) },
    });
    const now = new Date().toISOString();
    db.data.subscriptions.push({
      id: db.nextId("subscriptions"),
      userId: user.id,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: null,
      status: "none",
      plan: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });
    db.save();
    return customer.id;
  },

  async createCheckout(
    user: { id: number; email: string; displayName: string },
    plan: "monthly" | "annual",
    origin: string
  ): Promise<string> {
    const s = client();
    const customer = await stripeServer.getOrCreateCustomer(user);
    const prices = await ensurePrices(s);
    const session = await s.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price: prices[plan], quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/premium?checkout=success`,
      cancel_url: `${origin}/premium?checkout=cancelled`,
      subscription_data: { metadata: { userId: String(user.id) } },
    });
    return session.url!;
  },

  async createPortal(userId: number, origin: string): Promise<string> {
    const s = client();
    const row = db.data.subscriptions.find((r) => r.userId === userId);
    if (!row) throw new Error("No billing account yet.");
    const session = await s.billingPortal.sessions.create({
      customer: row.stripeCustomerId,
      return_url: `${origin}/premium`,
    });
    return session.url;
  },

  /** Reads premium status; lazily re-syncs with Stripe when stale so it works even without webhooks. */
  async getStatus(userId: number, forceSync = false): Promise<PremiumStatus> {
    const configured = stripeServer.isConfigured();
    let row = db.data.subscriptions.find((r) => r.userId === userId);
    if (row && configured) {
      const stale =
        forceSync ||
        !ACTIVE.has(row.status) ||
        (row.currentPeriodEnd !== null && new Date(row.currentPeriodEnd) < new Date()) ||
        !row.updatedAt ||
        Date.now() - new Date(row.updatedAt).getTime() > 6 * 3600 * 1000;
      if (stale) {
        try {
          await syncCustomer(client(), row.stripeCustomerId);
          row = db.data.subscriptions.find((r) => r.userId === userId);
        } catch (e) {
          console.error("Stripe sync failed", e);
        }
      }
    }
    const isPremium = !!row && ACTIVE.has(row.status);
    return {
      isPremium,
      plan: row?.plan ?? null,
      status: row?.status ?? null,
      currentPeriodEnd: row?.currentPeriodEnd ? new Date(row.currentPeriodEnd) : null,
      cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
      billingConfigured: configured,
    };
  },

  async handleWebhook(payload: string | Buffer, signature: string | null): Promise<string> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    if (!signature) throw new Error("Missing stripe-signature header");
    const s = client();
    const event = await s.webhooks.constructEventAsync(payload, signature, secret);
    const obj = event.data.object as { customer?: string | { id: string } };
    const customerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
    if (
      customerId &&
      (event.type.startsWith("customer.subscription.") ||
        event.type === "checkout.session.completed" ||
        event.type.startsWith("invoice."))
    ) {
      await syncCustomer(s, customerId);
    }
    return event.type;
  },
};
