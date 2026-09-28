import type { Request, Response } from "express";
import {
  getServerUserSession,
  setServerSession,
  NotAuthenticatedError,
} from "../../session";
import { sendJson } from "../../lib/http";

export async function handle(req: Request, res: Response) {
  try {
    const { user, session } = await getServerUserSession(req);

    // Rolling session: refresh the cookie before sending.
    await setServerSession(req, res, {
      id: session.id,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed,
    });

    sendJson(res, { user });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      sendJson(res, { error: "Not authenticated" }, 401);
      return;
    }
    console.error("Session validation error:", error);
    sendJson(res, { error: "Session validation failed" }, 400);
  }
}
