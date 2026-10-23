import type { Request, Response } from "express";
import superjson from "superjson";
import { db } from "../db";
import { getServerUserSession, NotAuthenticatedError } from "../session";
import { loadBirthProfile } from "../lib/loadBirthProfile";
import { sendJson } from "../lib/http";
import { schema } from "../../src/endpoints/profile_POST.schema";

export async function handle(req: Request, res: Response) {
  try {
    const { user } = await getServerUserSession(req);
    const input = schema.parse(superjson.parse(req.body as string));
    const values = {
      fullName: input.fullName,
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      birthPlace: input.birthPlace,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone,
    };
    const now = new Date().toISOString();
    const existing = db.data.birthProfiles.find((p) => p.userId === user.id);
    if (existing) {
      Object.assign(existing, values, { updatedAt: now });
    } else {
      db.data.birthProfiles.push({
        id: db.nextId("birthProfiles"),
        userId: user.id,
        ...values,
        tzOffsetMinutes: 0,
        extendedPoints: null,
        extendedPointsKey: null,
        createdAt: now,
        updatedAt: now,
      });
    }
    // Birth data changed: previous horoscopes and relocation readings no longer apply.
    db.data.horoscopes = db.data.horoscopes.filter((h) => h.userId !== user.id);
    db.data.relocationReadings = db.data.relocationReadings.filter(
      (r) => r.userId !== user.id
    );
    db.save();

    const profile = await loadBirthProfile(user.id);
    sendJson(res, { profile: profile! });
  } catch (error) {
    const status = error instanceof NotAuthenticatedError ? 401 : 400;
    sendJson(
      res,
      { error: error instanceof Error ? error.message : "Failed" },
      status
    );
  }
}
