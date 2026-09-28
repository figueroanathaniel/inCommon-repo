import type { Request, Response } from "express";
import superjson from "superjson";
import { getServerUserSession, NotAuthenticatedError } from "../../session";
import { stripeServer } from "../../lib/stripeServer";
import { requestOrigin, sendJson } from "../../lib/http";
import { schema } from "../../../src/endpoints/billing/checkout_POST.schema";

export async function handle(req: Request, res: Response) {
  try {
    const { user } = await getServerUserSession(req);
    const { plan } = schema.parse(superjson.parse(req.body as string));
    const current = await stripeServer.getStatus(user.id, true);
    if (current.isPremium) throw new Error("You already have Codex Luminary. Manage it from the billing portal.");
    const url = await stripeServer.createCheckout(user, plan, requestOrigin(req));
    sendJson(res, { url });
  } catch (error) {
    console.error("checkout error", error);
    const code = error instanceof NotAuthenticatedError ? 401 : 400;
    sendJson(
      res,
      { error: error instanceof Error ? error.message : "Checkout failed" },
      code
    );
  }
}
