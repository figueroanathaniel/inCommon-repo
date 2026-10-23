import type { Request, Response } from "express";
import { stripeServer } from "../../lib/stripeServer";
import { sendJson } from "../../lib/http";

export async function handle(req: Request, res: Response) {
  try {
    // express.raw middleware gives us the exact bytes Stripe signed.
    const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
    const type = await stripeServer.handleWebhook(payload, req.headers["stripe-signature"] as string | null);
    res
      .status(200)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ received: true, type }));
  } catch (error) {
    console.error("stripe webhook error", error);
    res
      .status(400)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ error: error instanceof Error ? error.message : "Webhook failed" }));
  }
}
