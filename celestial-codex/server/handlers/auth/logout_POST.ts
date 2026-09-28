import type { Request, Response } from "express";
import superjson from "superjson";
import { db } from "../../db";
import {
  getServerSessionOrThrow,
  clearServerSession,
  NotAuthenticatedError,
} from "../../session";
import { sendJson } from "../../lib/http";

export async function handle(req: Request, res: Response) {
  try {
    const session = await getServerSessionOrThrow(req);

    db.data.sessions = db.data.sessions.filter((s) => s.id !== session.id);
    db.save();

    clearServerSession(req, res);
    sendJson(res, { success: true, message: "Logged out successfully" });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      sendJson(res, { error: "Not authenticated" }, 401);
      return;
    }
    console.error("Logout error:", error);
    res
      .status(500)
      .set("Content-Type", "application/json")
      .send(
        superjson.stringify({
          error: "Logout failed",
          message: error instanceof Error ? error.message : "Unknown error",
        })
      );
  }
}
