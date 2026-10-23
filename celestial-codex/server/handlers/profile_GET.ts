import type { Request, Response } from "express";
import { getServerUserSession, NotAuthenticatedError } from "../session";
import { loadBirthProfile } from "../lib/loadBirthProfile";
import { sendJson } from "../lib/http";

export async function handle(req: Request, res: Response) {
  try {
    const { user } = await getServerUserSession(req);
    const profile = await loadBirthProfile(user.id);
    sendJson(res, { profile });
  } catch (error) {
    const status = error instanceof NotAuthenticatedError ? 401 : 400;
    sendJson(
      res,
      { error: error instanceof Error ? error.message : "Failed" },
      status
    );
  }
}
