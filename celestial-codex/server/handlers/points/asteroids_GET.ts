import type { Request, Response } from "express";
import superjson from "superjson";
import { db } from "../../db";
import { getServerUserSession, NotAuthenticatedError } from "../../session";
import { requirePremium, PremiumRequiredError } from "../../lib/premium";
import { loadBirthProfile } from "../../lib/loadBirthProfile";
import { birthInstant } from "../../lib/birthInstant";
import { horizonsServer, HORIZONS_BODY_COUNT } from "../../lib/horizonsServer";
import { sendJson } from "../../lib/http";
import type { AsteroidPosition } from "../../lib/types";

export async function handle(req: Request, res: Response) {
  try {
    const { user } = await getServerUserSession(req);
    await requirePremium(user);
    const profile = await loadBirthProfile(user.id);
    if (!profile) throw new Error("Add your birth details first.");
    const instant = birthInstant(profile.birthDate, profile.birthTime, profile.timezone);
    const key = instant.toISOString();

    const row = db.data.birthProfiles.find((p) => p.userId === user.id);
    if (
      row &&
      row.extendedPointsKey === key &&
      Array.isArray(row.extendedPoints) &&
      row.extendedPoints.length >= HORIZONS_BODY_COUNT
    ) {
      sendJson(res, { asteroids: row.extendedPoints as unknown as AsteroidPosition[] });
      return;
    }

    const asteroids = await horizonsServer(instant);
    if (asteroids.length === HORIZONS_BODY_COUNT && row) {
      row.extendedPoints = asteroids as unknown as unknown[];
      row.extendedPointsKey = key;
      db.save();
    }
    sendJson(res, { asteroids });
  } catch (error) {
    const code =
      error instanceof NotAuthenticatedError
        ? 401
        : error instanceof PremiumRequiredError
          ? 402
          : 400;
    sendJson(
      res,
      { error: error instanceof Error ? error.message : "Failed" },
      code
    );
  }
}
