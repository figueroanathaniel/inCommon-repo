import type { Request, Response } from "express";
import superjson from "superjson";
import { compare } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "../../db";
import { schema } from "../../../src/endpoints/auth/login_with_password_POST.schema";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../session";
import { sendJson } from "../../lib/http";
import type { User } from "../../lib/types";

// Configuration constants
const RATE_LIMIT_CONFIG = {
  maxFailedAttempts: 5,
  lockoutWindowMinutes: 15,
  lockoutDurationMinutes: 15,
  cleanupProbability: 0.1,
} as const;

function createSession(userId: number) {
  const sessionId = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SessionExpirationSeconds * 1000);
  db.data.sessions.push({
    id: sessionId,
    userId,
    createdAt: now.toISOString(),
    lastAccessed: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  db.save();
  return { sessionId, at: now };
}

export async function handle(req: Request, res: Response) {
  try {
    const json = superjson.parse(req.body as string);
    const { email, password } = schema.parse(json);

    // Normalize email to lowercase for consistent handling
    const normalizedEmail = email.toLowerCase();
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - RATE_LIMIT_CONFIG.lockoutWindowMinutes * 60 * 1000
    );

    // Rate limiting: lockout after too many failed attempts in the window.
    const recentFailures = db.data.loginAttempts.filter(
      (a) =>
        a.email === normalizedEmail &&
        !a.success &&
        new Date(a.attemptedAt) >= windowStart
    );
    const lastFailedAt = recentFailures.reduce<Date | null>(
      (max, a) => {
        const d = new Date(a.attemptedAt);
        return !max || d > max ? d : max;
      },
      null
    );

    if (
      recentFailures.length >= RATE_LIMIT_CONFIG.maxFailedAttempts &&
      lastFailedAt
    ) {
      const lockoutEnd = new Date(
        lastFailedAt.getTime() +
          RATE_LIMIT_CONFIG.lockoutDurationMinutes * 60 * 1000
      );
      if (now < lockoutEnd) {
        const remainingMinutes = Math.ceil(
          (lockoutEnd.getTime() - now.getTime()) / (60 * 1000)
        );
        // DO NOT log blocked attempts to prevent extending lockout indefinitely
        sendJson(
          res,
          {
            message: `Too many failed login attempts. Account locked for ${remainingMinutes} more minutes.`,
          },
          429
        );
        return;
      }
    }

    const logAttempt = (success: boolean) => {
      db.data.loginAttempts.push({
        id: db.nextId("loginAttempts"),
        email: normalizedEmail,
        success,
        attemptedAt: now.toISOString(),
      });
      db.save();
    };

    const user = db.data.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    const passwordRow = user
      ? db.data.userPasswords.find((p) => p.userId === user.id)
      : undefined;

    if (!user || !passwordRow) {
      logAttempt(false);
      sendJson(res, { message: "Invalid email or password" }, 401);
      return;
    }

    const passwordValid = await compare(password, passwordRow.passwordHash);
    if (!passwordValid) {
      logAttempt(false);
      sendJson(res, { message: "Invalid email or password" }, 401);
      return;
    }

    logAttempt(true);
    const { sessionId, at } = createSession(user.id);
    // Reset failed attempts counter; preserves the audit trail of successful logins.
    db.data.loginAttempts = db.data.loginAttempts.filter(
      (a) => !(a.email === normalizedEmail && !a.success)
    );
    db.save();

    // Clean up old login attempts periodically.
    if (Math.random() < RATE_LIMIT_CONFIG.cleanupProbability) {
      const cleanupBefore = new Date(
        now.getTime() - RATE_LIMIT_CONFIG.lockoutWindowMinutes * 60 * 1000
      );
      const before = db.data.loginAttempts.length;
      db.data.loginAttempts = db.data.loginAttempts.filter(
        (a) => new Date(a.attemptedAt) >= cleanupBefore
      );
      if (db.data.loginAttempts.length !== before) db.save();
    }

    const userData: User = {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      displayName: user.displayName,
      role: user.role,
    };

    await setServerSession(req, res, {
      id: sessionId,
      createdAt: at.getTime(),
      lastAccessed: at.getTime(),
    });
    sendJson(res, { user: userData });
  } catch (error) {
    console.error("Login error:", error);
    sendJson(res, { message: "Authentication failed" }, 400);
  }
}
