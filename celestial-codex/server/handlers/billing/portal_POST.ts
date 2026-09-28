import type { Request, Response } from "express";
import { getServerUserSession, NotAuthenticatedError } from "../../session";
import { stripeServer } from "../../lib/stripeServer";
import { requestOrigin, sendJson } from "../../lib/http";

export async function handle(req: Request, res: Response) {
  try {
    const { user } = await getServerUserSession(req);
    const url = await stripeServer.createPortal(user.id, requestOrigin(req));
    sendJson(res, { url });
  } catch (error) {
    const code = error instanceof NotAuthenticatedError ? 401 : 400;
    sendJson(
      res,
      { error: error instanceof Error ? error.message : "Failed" },
      code
    );
  }
}
