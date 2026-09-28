import type { Request, Response } from "express";
import superjson from "superjson";

/** Sends a superjson-encoded JSON response (superjson preserves Dates). */
export function sendJson(res: Response, payload: unknown, status = 200): void {
  res.status(status).set("Content-Type", "application/json").send(superjson.stringify(payload));
}

/** Backend-only: best-effort public origin of the calling app (for Stripe return URLs). */
export function requestOrigin(req: Request): string {
  const origin = req.headers.origin;
  if (origin && origin !== "null") return origin;
  const ref = req.headers.referer;
  if (ref) return new URL(ref).origin;
  return `${req.protocol}://${req.get("host")}`;
}
