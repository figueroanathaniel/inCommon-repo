import type { Request, Response } from "express";
import { getServerUserSession, NotAuthenticatedError } from "../../session";
import { stripeServer } from "../../lib/stripeServer";
import { sendJson } from "../../lib/http";

export async function handle(req: Request, res: Response) {
  try {
    const { user } = await getServerUserSession(req);
    const sync = req.query.sync === "1";
    const status = await stripeServer.getStatus(user.id, sync);
    if (user.role === "admin") status.isPremium = true;
    sendJson(res, { status });
  } catch (error) {
    const code = error instanceof NotAuthenticatedError ? 401 : 400;
    sendJson(
      res,
      { error: error instanceof Error ? error.message : "Failed" },
      code
    );
  }
}
